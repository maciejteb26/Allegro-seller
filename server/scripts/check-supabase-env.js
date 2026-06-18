/**
 * Sprawdza konfigurację Supabase / Postgres przed deployem.
 * Użycie: node scripts/check-supabase-env.js  (z katalogu server/)
 */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const required = ['DATABASE_URL', 'DIRECT_URL', 'CLIENT_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];
const storage = ['S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_REGION'];

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
}
function fail(msg) {
  console.error(`  ✗ ${msg}`);
  process.exitCode = 1;
}

async function main() {
  console.log('Sprawdzanie konfiguracji Supabase / env…\n');

  for (const key of required) {
    if (process.env[key]) ok(key);
    else fail(`Brak ${key}`);
  }

  const hasExplicitEndpoint = Boolean(process.env.S3_ENDPOINT);
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_REF);
  for (const key of storage) {
    if (process.env[key]) ok(key);
    else fail(`Brak ${key}`);
  }
  if (!hasExplicitEndpoint && !hasSupabaseUrl) {
    warn('Brak S3_ENDPOINT i SUPABASE_URL — Storage wymaga jednego z nich (lub MinIO lokalnie)');
  } else if (hasSupabaseUrl && !hasExplicitEndpoint) {
    ok('S3_ENDPOINT zostanie wyliczony z SUPABASE_URL');
  }

  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!dbUrl) return;

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok('Połączenie z Postgres (DIRECT_URL) działa');
  } catch (e) {
    fail(`Postgres: ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }

  if (process.env.DATABASE_URL?.includes('6543') && !process.env.DATABASE_URL.includes('pgbouncer=true')) {
    warn('DATABASE_URL używa portu 6543 bez ?pgbouncer=true — dodaj dla Supabase Transaction pooler');
  }

  console.log(process.exitCode ? '\nPopraw błędy przed deployem.' : '\nKonfiguracja OK.');
}

main();
