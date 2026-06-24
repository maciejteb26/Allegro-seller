import { Request, Response, NextFunction } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../utils/prisma';
import { getS3 } from '../utils/s3';
import { verifyImageAccessToken } from '../utils/image-public-token';
import { AppError } from '../middleware/error.middleware';

export async function servePublicImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params;
    const access = String(req.query.access ?? '');
    if (!verifyImageAccessToken(imageId, access)) {
      throw new AppError(403, 'Invalid or expired image token');
    }

    const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
    if (!image) throw new AppError(404, 'Image not found');

    const object = await getS3().send(
      new GetObjectCommand({ Bucket: image.s3Bucket, Key: image.s3Key }),
    );

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'private, max-age=300');

    const body = object.Body;
    if (!body || typeof (body as NodeJS.ReadableStream).pipe !== 'function') {
      throw new AppError(500, 'Cannot read image from storage');
    }

    (body as NodeJS.ReadableStream).pipe(res);
  } catch (err) {
    next(err);
  }
}
