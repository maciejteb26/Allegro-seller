import { Platform } from '@prisma/client';
import { PublishResult } from './base.platform.service';

export async function mockPublish(platform: Platform, baseUrl: string): Promise<PublishResult> {
  // MOCK MODE — wymaga X_MOCK=false i prawdziwego tokenu
  await delay(800 + Math.random() * 1200);
  const timestamp = Date.now();
  return {
    externalId: `MOCK-${platform}-${timestamp}`,
    externalUrl: `${baseUrl}/mock-${timestamp}`,
    status: 'ACTIVE',
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
