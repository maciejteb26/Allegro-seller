import { test, expect } from '@playwright/test';

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('register -> create listing -> publish -> visible as active in UI', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Imię i nazwisko').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło').fill('password123');
  await page.getByRole('button', { name: 'Zarejestruj się' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const api = page.context().request;

  const categoryTree = await (await api.get('/api/categories')).json();
  const categoryId = categoryTree[0].children[0].id as string;

  await api.post('/api/platforms/ALLEGRO/connect');

  const createRes = await api.post('/api/listings', {
    data: {
      title: 'E2E Test - Alternator',
      description: 'Ogłoszenie testowe utworzone przez e2e happy-path.',
      basePrice: 199.99,
      condition: 'USED',
      identMethod: 'MANUAL',
      vehicleType: 'CAR',
      categoryId,
    },
  });
  expect(createRes.ok()).toBeTruthy();
  const listing = await createRes.json();

  const uploadRes = await api.post(`/api/listings/${listing.id}/images`, {
    multipart: { images: { name: 'test.png', mimeType: 'image/png', buffer: TINY_PNG } },
  });
  expect(uploadRes.ok()).toBeTruthy();

  const publishRes = await api.post(`/api/listings/${listing.id}/publish`, {
    data: { platforms: ['ALLEGRO'] },
  });
  expect(publishRes.ok()).toBeTruthy();
  const publishBody = await publishRes.json();
  expect(publishBody.results.ALLEGRO).toBe('ACTIVE');

  await page.goto('/listings');
  const row = page.getByRole('row', { name: /E2E Test - Alternator/ });
  await expect(row).toBeVisible();
  await expect(row.getByText('Aktywne')).toBeVisible();
});
