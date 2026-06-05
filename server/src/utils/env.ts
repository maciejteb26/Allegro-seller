import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function requireEnv32Chars(key: string): string {
  const value = requireEnv(key);
  if (value.length !== 32) throw new Error(`${key} must be exactly 32 characters (got ${value.length})`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3001', 10),
  CLIENT_URL: requireEnv('CLIENT_URL'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  ENCRYPTION_KEY: requireEnv32Chars('ENCRYPTION_KEY'),
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? '',
  S3_BUCKET: process.env.S3_BUCKET ?? '',
  S3_REGION: process.env.S3_REGION ?? 'us-east-1',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? '',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
  AI_MOCK: !process.env.ANTHROPIC_API_KEY && process.env.AI_MOCK !== 'false',
  ALLEGRO_SANDBOX: process.env.ALLEGRO_SANDBOX !== 'false',
  ALLEGRO_USER_AGENT:
    process.env.ALLEGRO_USER_AGENT ?? 'AllegroSeller/0.1.0 (+https://example.com/allegro-seller)',
  ALLEGRO_CLIENT_ID: process.env.ALLEGRO_CLIENT_ID ?? '',
  ALLEGRO_CLIENT_SECRET: process.env.ALLEGRO_CLIENT_SECRET ?? '',
  ALLEGRO_REDIRECT_URI: process.env.ALLEGRO_REDIRECT_URI ?? '',
  ALLEGRO_MOCK: process.env.ALLEGRO_MOCK !== 'false',
  SERPAPI_KEY: process.env.SERPAPI_KEY ?? '',
  GOOGLE_CSE_API_KEY: process.env.GOOGLE_CSE_API_KEY ?? '',
  GOOGLE_CSE_CX: process.env.GOOGLE_CSE_CX ?? '',
  EXTERNAL_SEARCH_MOCK:
    process.env.EXTERNAL_SEARCH_MOCK !== 'false' &&
    !process.env.SERPAPI_KEY &&
    !process.env.GOOGLE_CSE_API_KEY,
};