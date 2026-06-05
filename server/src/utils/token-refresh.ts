import axios from 'axios';
import { Platform } from '@prisma/client';
import { prisma } from './prisma';
import { decrypt, encrypt } from './crypto';

// Buffer — odśwież token jeśli wygasa w ciągu 5 minut
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

export async function getStoredPlatform(userId: string, platform: Platform) {
  const record = await prisma.userPlatform.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!record?.accessToken) {
    throw new Error(`${platform} access token missing. Connect the platform first.`);
  }
  return record;
}

export function tryDecrypt(value: string | null): string | null {
  if (!value) return null;
  try {
    return value.includes(':') ? decrypt(value) : value;
  } catch {
    return value;
  }
}

export function isExpiringSoon(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return false;
  return tokenExpiry.getTime() - Date.now() < EXPIRY_BUFFER_MS;
}

export async function storeTokens(
  userId: string,
  platform: Platform,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number,
): Promise<void> {
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  await prisma.userPlatform.update({
    where: { userId_platform: { userId, platform } },
    data: {
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : null,
      tokenExpiry,
      isActive: true,
    },
  });
}

export async function refreshWithBasicAuth(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  extraParams?: Record<string, string>;
}): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const auth = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: params.refreshToken,
    ...params.extraParams,
  });

  const response = await axios.post(params.tokenUrl, body, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}
