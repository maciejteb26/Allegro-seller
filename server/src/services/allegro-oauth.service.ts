import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Platform } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { encrypt } from '../utils/crypto';
import { env } from '../utils/env';
import { prisma } from '../utils/prisma';
import { tryDecrypt, isExpiringSoon, storeTokens, refreshWithBasicAuth } from '../utils/token-refresh';

interface OAuthStatePayload {
  userId: string;
  platform: 'ALLEGRO';
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

const OAUTH_BASE = env.ALLEGRO_SANDBOX ? 'https://allegro.pl.allegrosandbox.pl' : 'https://allegro.pl';
const TOKEN_URL = `${OAUTH_BASE}/auth/oauth/token`;

export function buildAuthorizationUrl(userId: string): string {
  validateOAuthEnv();
  const state = jwt.sign(
    { userId, platform: 'ALLEGRO' satisfies OAuthStatePayload['platform'] },
    env.JWT_SECRET,
    { expiresIn: '10m' },
  );
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.ALLEGRO_CLIENT_ID,
    redirect_uri: env.ALLEGRO_REDIRECT_URI,
    state,
    scope: 'allegro:api:sale:offers:write allegro:api:sale:offers:read allegro:api:profile:read',
  });
  return `${OAUTH_BASE}/auth/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeAndStoreConnection(code: string, state: string): Promise<void> {
  validateOAuthEnv();
  const payload = verifyState(state);
  const tokenResponse = await requestTokens(code);
  const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

  await prisma.userPlatform.upsert({
    where: { userId_platform: { userId: payload.userId, platform: Platform.ALLEGRO } },
    create: {
      userId: payload.userId,
      platform: Platform.ALLEGRO,
      isActive: true,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
      tokenExpiry,
      connectedAt: new Date(),
    },
    update: {
      isActive: true,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
      tokenExpiry,
      connectedAt: new Date(),
    },
  });
}

// Zwraca ważny access token — automatycznie odświeża jeśli wygasa
export async function getValidAccessToken(userId: string): Promise<string> {
  const record = await prisma.userPlatform.findUnique({
    where: { userId_platform: { userId, platform: Platform.ALLEGRO } },
  });

  if (!record?.accessToken) {
    throw new AppError(400, 'Allegro access token missing. Connect Allegro first.');
  }

  if (isExpiringSoon(record.tokenExpiry) && record.refreshToken) {
    const refreshed = await refreshWithBasicAuth({
      tokenUrl: TOKEN_URL,
      clientId: env.ALLEGRO_CLIENT_ID,
      clientSecret: env.ALLEGRO_CLIENT_SECRET,
      refreshToken: tryDecrypt(record.refreshToken)!,
    });
    await storeTokens(
      userId,
      Platform.ALLEGRO,
      refreshed.access_token,
      refreshed.refresh_token ?? null,
      refreshed.expires_in,
    );
    return refreshed.access_token;
  }

  return tryDecrypt(record.accessToken)!;
}

function verifyState(state: string): OAuthStatePayload {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as OAuthStatePayload;
    if (!payload.userId || payload.platform !== 'ALLEGRO') throw new Error();
    return payload;
  } catch {
    throw new AppError(400, 'Invalid or expired OAuth state');
  }
}

async function requestTokens(code: string): Promise<TokenResponse> {
  const auth = Buffer.from(`${env.ALLEGRO_CLIENT_ID}:${env.ALLEGRO_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post<TokenResponse>(
    TOKEN_URL,
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: env.ALLEGRO_REDIRECT_URI }),
    { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return response.data;
}

function validateOAuthEnv(): void {
  if (!env.ALLEGRO_CLIENT_ID || !env.ALLEGRO_CLIENT_SECRET || !env.ALLEGRO_REDIRECT_URI) {
    throw new AppError(400, 'Allegro OAuth not configured. Missing: ALLEGRO_CLIENT_ID, ALLEGRO_CLIENT_SECRET, ALLEGRO_REDIRECT_URI');
  }
}
