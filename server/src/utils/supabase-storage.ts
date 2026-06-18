import { env } from './env';

/** Wyciąga project ref z SUPABASE_URL lub SUPABASE_PROJECT_REF. */
export function resolveSupabaseProjectRef(): string | null {
  if (env.SUPABASE_PROJECT_REF) return env.SUPABASE_PROJECT_REF;
  if (!env.SUPABASE_URL) return null;
  const match = env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

/**
 * Endpoint S3-compatible dla Supabase Storage.
 * Priorytet: jawny S3_ENDPOINT → auto z SUPABASE_* → pusty (natywny AWS S3).
 */
export function resolveS3Endpoint(): string {
  if (env.S3_ENDPOINT) return env.S3_ENDPOINT;
  const ref = resolveSupabaseProjectRef();
  if (ref) return `https://${ref}.storage.supabase.co/storage/v1/s3`;
  return '';
}

export function isSupabaseStorage(): boolean {
  return resolveS3Endpoint().includes('supabase');
}
