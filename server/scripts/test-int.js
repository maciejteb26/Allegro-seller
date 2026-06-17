const { execSync } = require('child_process');

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/allegro_seller_test';

function run(cmd) {
  execSync(cmd, { env: process.env, stdio: 'inherit' });
}

run('npx prisma migrate deploy');
run('npx jest --config jest.integration.config.js');
