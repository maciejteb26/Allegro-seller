import { test, expect } from '@playwright/test';

test('landing/login page renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Hasło')).toBeVisible();

  expect(errors).toEqual([]);
});
