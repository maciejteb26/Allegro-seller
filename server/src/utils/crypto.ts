import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from './env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(env.ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(env.ENCRYPTION_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString();
}
