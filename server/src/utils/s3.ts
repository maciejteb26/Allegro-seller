import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';
import { resolveS3Endpoint } from './supabase-storage';

let instance: S3Client | null = null;

export function getS3(): S3Client {
  if (!instance) {
    const endpoint = resolveS3Endpoint();
    instance = new S3Client({
      region: env.S3_REGION,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
  }
  return instance;
}
