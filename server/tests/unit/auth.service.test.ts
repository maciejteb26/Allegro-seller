import { encrypt, decrypt } from '../../src/utils/crypto';

// Ustaw wymaganą zmienną przed importem env
process.env.ENCRYPTION_KEY = 'test-key-exactly-32-characters!!';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters!!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters!';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_REGION = 'us-east-1';
process.env.S3_ACCESS_KEY = 'minioadmin';
process.env.S3_SECRET_KEY = 'minioadmin';

describe('crypto utils', () => {
  it('encrypts and decrypts a string correctly', () => {
    const original = 'my-secret-token-12345';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const text = 'same-input';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });
});
