import { expect, test } from '@playwright/test';

test.describe('production-ready auth shell', () => {
  test('loads the auth page and toggles the persisted theme', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: /switch to light mode/i })).toBeVisible();

    await page.getByRole('button', { name: /switch to light mode/i }).click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.evaluate(() => window.localStorage.getItem('back-office-theme'))).resolves.toBe('light');
  });
});
