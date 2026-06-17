import { expect, test } from '@playwright/test';
import { authenticateAs, expectPageReady, mockApi, users } from './fixtures';

test.describe('Аутентификация и роли', () => {
  test('гость при открытии защищённого маршрута попадает на форму входа', async ({ page }) => {
    await mockApi(page);

    await page.goto('/catalog');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Вход в систему' })).toBeVisible();
  });

  test('пользователь входит в систему и попадает в личный кабинет', async ({ page }) => {
    await mockApi(page, { currentUser: users.student });

    await page.goto('/login');
    await page.getByLabel('Email').fill(users.student.email);
    await page.getByLabel('Пароль').fill('correct-password');
    await page.getByRole('main').getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
    await expect(page.getByText(users.student.fullName).first()).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Каталог' }).first()).toBeVisible();
  });

  test('преподаватель не попадает в студенческий раздел и видит свои разделы', async ({ page }) => {
    await authenticateAs(page, users.supervisor);

    await page.goto('/supervisors');
    await expectPageReady(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Кабинет преподавателя' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Аналитика' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Преподаватели' })).toHaveCount(0);
  });
});
