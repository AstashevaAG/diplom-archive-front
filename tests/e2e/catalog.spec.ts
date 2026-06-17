import { expect, test } from '@playwright/test';
import { authenticateAs, users, works } from './fixtures';

test.describe('Каталог и поиск работ', () => {
  test('студент просматривает опубликованные работы и запускает поиск с подсветкой результата', async ({ page }) => {
    await authenticateAs(page, users.student);

    await page.goto('/catalog');

    await expect(page.getByRole('heading', { name: 'Каталог работ' })).toBeVisible();
    await expect(page.getByText(works.published.title)).toBeVisible();
    await expect(page.getByText('88%')).toBeVisible();

    await page.getByPlaceholder(/Поиск по темам/).fill('ecgt');

    await expect(page.getByRole('heading', { name: 'Результаты поиска' })).toBeVisible();
    await expect(page.getByText('Найдено: 1')).toBeVisible();
    await expect(page.getByText('Поиск также выполнен по варианту: «успеваемость»')).toBeVisible();
    await expect(page.locator('mark', { hasText: 'успеваемость' }).first()).toBeVisible();
  });
});
