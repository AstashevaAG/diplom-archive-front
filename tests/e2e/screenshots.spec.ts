import { expect, test } from '@playwright/test';
import { authenticateAs, captureScreenshot, users } from './fixtures';

test.describe('Скриншотные проверки', () => {
  test('сохраняет светлый скрин отчёта с тенью и ключевые экраны', async ({ page }, testInfo) => {
    await authenticateAs(page, users.student);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
    await page.addStyleTag({
      content: `
        body { background: #f8fafc !important; }
        main { filter: drop-shadow(0 24px 48px rgba(15, 23, 42, 0.16)); }
      `,
    });
    await captureScreenshot(page, testInfo, 'light-shadow-dashboard');

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
    await captureScreenshot(page, testInfo, 'authenticated-register-redirect');
  });
});
