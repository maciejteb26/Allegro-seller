import { createHmac, timingSafeEqual } from 'crypto';
import { env } from './env';

const TTL_MS = 20 * 60 * 1000;

function signPayload(payload: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(payload).digest('hex');
}

export function createImageAccessToken(imageId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${imageId}.${exp}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyImageAccessToken(imageId: string, token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [id, expStr, sig] = parts;
  if (id !== imageId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const payload = `${id}.${expStr}`;
  const expected = signPayload(payload);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function buildPublicImageUrl(imageId: string): string {
  const token = createImageAccessToken(imageId);
  return `${env.API_PUBLIC_URL}/api/public/images/${imageId}?access=${encodeURIComponent(token)}`;
}
