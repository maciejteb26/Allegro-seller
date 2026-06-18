import request from 'supertest';
import { app } from '../../../src/app';
import { prisma } from '../../../src/utils/prisma';

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

export function cookieHeader(res: request.Response): string {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  if (!raw) return '';
  return raw.map((c) => c.split(';')[0]).join('; ');
}

export async function registerUser(email: string, password = 'password123', name = 'Test User') {
  const res = await request(app).post('/api/auth/register').send({ email, password, name });
  return { res, cookie: cookieHeader(res) };
}

export async function createCategoryWithAllegroMapping() {
  const category = await prisma.internalCategory.create({
    data: { name: 'Test category', slug: `test-category-${Date.now()}` },
  });
  await prisma.platformCategoryMapping.create({
    data: {
      internalCategoryId: category.id,
      platform: 'ALLEGRO',
      externalCategoryId: '12345',
      externalCategoryName: 'Test Allegro category',
    },
  });
  return category;
}
