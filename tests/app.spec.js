import { test, expect } from '@playwright/test';

test('demoStartOffersGuidedAndFreeModes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guided walkthrough' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore freely' })).toBeVisible();
});
