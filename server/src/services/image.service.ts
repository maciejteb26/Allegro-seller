import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { getS3 } from '../utils/s3';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const PRESIGNED_URL_TTL = 3600;

export async function uploadImage(
  fileBuffer: Buffer,
  listingId: string,
  order: number,
  isMain: boolean,
): Promise<{ s3Key: string; width: number; height: number }> {
  const image = sharp(fileBuffer);
  const metadata = await image.metadata();

  const optimized = await image
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const s3Key = `listings/${listingId}/${Date.now()}-${randomUUID()}.webp`;

  await getS3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: s3Key,
      Body: optimized.data,
      ContentType: 'image/webp',
    }),
  );

  await prisma.listingImage.create({
    data: {
      listingId,
      s3Key,
      s3Bucket: env.S3_BUCKET,
      order,
      isMain,
      width: optimized.info.width,
      height: optimized.info.height,
    },
  });

  return { s3Key, width: optimized.info.width, height: optimized.info.height };
}

export async function getPresignedUrl(s3Key: string): Promise<string> {
  return getSignedUrl(
    getS3(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: s3Key }),
    { expiresIn: PRESIGNED_URL_TTL },
  );
}

export async function deleteImage(imageId: string, userId: string): Promise<void> {
  const image = await prisma.listingImage.findFirst({
    where: { id: imageId, listing: { userId } },
  });
  if (!image) return;

  await getS3().send(new DeleteObjectCommand({ Bucket: image.s3Bucket, Key: image.s3Key }));
  await prisma.listingImage.delete({ where: { id: imageId } });
}

export async function enrichImagesWithUrls<T extends { s3Key: string }>(
  images: T[],
): Promise<(T & { url: string })[]> {
  return Promise.all(
    images.map(async (img) => ({ ...img, url: await getPresignedUrl(img.s3Key) })),
  );
}
