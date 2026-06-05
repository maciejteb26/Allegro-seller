import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

let instance: S3Client | null = null;

export function getS3(): S3Client {
  if (!instance) {
    instance = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
      forcePathStyle: true, // required for MinIO
    });
  }
  return instance;
}
