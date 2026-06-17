import { expect, test } from '@playwright/test';
import { authenticateAs, mockApi, users, works } from './fixtures';

test.describe('Личный кабинет: критические действия', () => {
  test('студент видит свои работы и статус заявки на тему', async ({ page }) => {
    await authenticateAs(page, users.student);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Мои работы' })).toBeVisible();
    await expect(page.getByText(works.draft.title)).toBeVisible();

    await page.getByRole('button', { name: 'Заявки' }).click();
    await expect(page.getByRole('heading', { name: 'Мои заявки на тему' })).toBeVisible();
    await expect(page.getByText('Психология учебной мотивации')).toBeVisible();
    await expect(page.getByText('Одобрена')).toBeVisible();
  });

  test('студент создаёт работу из формы', async ({ page }) => {
    let submittedPayload: unknown;
    await page.addInitScript(() => {
      window.localStorage.setItem('accessToken', 'test-access-token');
      window.localStorage.setItem('refreshToken', 'test-refresh-token');
    });
    await mockApi(page, {
      currentUser: users.student,
      onCreateWork: (payload) => {
        submittedPayload = payload;
      },
    });

    await page.goto('/dashboard/works/new');
    await page.getByLabel(/Название/).fill('Новая исследовательская работа');
    await page.getByLabel('Описание (тема, цели)').fill('Проверка пользовательского сценария создания ВКР');
    await page.getByLabel('Аннотация').fill('Краткая аннотация для каталога');
    await page.getByLabel('Категория').fill('Психология образования');
    await page.getByPlaceholder('Введите тег и нажмите Enter').fill('мотивация');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Создать работу' }).click();

    await expect(page).toHaveURL(/\/catalog\/work-new$/);
    expect(submittedPayload).toMatchObject({
      title: 'Новая исследовательская работа',
      description: 'Проверка пользовательского сценария создания ВКР',
      annotation: 'Краткая аннотация для каталога',
      category: 'Психология образования',
      tags: ['мотивация'],
    });
  });

  test('преподаватель одобряет входящую заявку студента', async ({ page }) => {
    await authenticateAs(page, users.supervisor);

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Входящие' }).click();

    await expect(page.getByText('Диагностика профессионального выгорания')).toBeVisible();
    await page.getByRole('button', { name: 'Одобрить' }).click();

    await expect(page.getByText('Одобрена')).toBeVisible();
  });
});
