const { execSync } = require('child_process');

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/szybkiewystawianie_test';
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

function run(cmd) {
  execSync(cmd, { env: process.env, stdio: 'inherit' });
}

// Projekt nie ma jeszcze historii migracji (prisma/migrations zawiera tylko .gitkeep —
// schemat był dotąd zarządzany przez `prisma db push`). `db push` na testowej bazie
// odtwarza schemat bezpośrednio ze schema.prisma; `--accept-data-loss` jest bezpieczne,
// bo baza testowa jest zawsze tworzona od zera.
run('npx prisma db push --skip-generate --accept-data-loss');
run('npx jest --config jest.integration.config.js');
