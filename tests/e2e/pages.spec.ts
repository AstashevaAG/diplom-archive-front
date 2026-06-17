import { expect, test } from '@playwright/test';
import { authenticateAs, captureScreenshot, users, works } from './fixtures';

test.describe('Основные страницы приложения', () => {
  test('студент открывает каталог, карточку работы, преподавателей, темы и информационный центр', async ({ page }, testInfo) => {
    await authenticateAs(page, users.student);

    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'Каталог работ' })).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-catalog');

    await page.goto(`/catalog/${works.published.id}`);
    await expect(page.getByRole('heading', { name: works.published.title })).toBeVisible();
    await expect(page.getByText('Комментарии')).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-work-detail');

    await page.goto('/supervisors');
    await expect(page.getByRole('heading', { name: 'Преподаватели' })).toBeVisible();
    await expect(page.getByText(users.supervisor.fullName)).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-supervisors');

    await page.goto(`/supervisors/${users.supervisor.id}`);
    await expect(page.getByRole('heading', { name: users.supervisor.fullName })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Подать заявку' })).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-supervisor-detail');

    await page.goto('/topics');
    await expect(page.getByRole('heading', { name: 'Темы дипломных работ' })).toBeVisible();
    await expect(page.getByText('Когнитивные стратегии обучения')).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-topics');

    await page.goto('/info');
    await expect(page.getByRole('heading', { name: 'Информационный центр' })).toBeVisible();
    await expect(page.getByText('Сроки загрузки ВКР')).toBeVisible();
    await captureScreenshot(page, testInfo, 'student-info');
  });

  test('преподаватель открывает аналитику, коллег, рабочее пространство и кабинет', async ({ page }, testInfo) => {
    await authenticateAs(page, users.supervisor);

    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: 'Аналитика' })).toBeVisible();
    await expect(page.getByText('Всего работ')).toBeVisible();
    await captureScreenshot(page, testInfo, 'supervisor-analytics');

    await page.goto('/colleagues');
    await expect(page.getByRole('heading', { name: 'Коллеги' })).toBeVisible();
    await captureScreenshot(page, testInfo, 'supervisor-colleagues');

    await page.goto('/dashboard/works/work-2/workspace');
    await expect(page.getByText(works.draft.title)).toBeVisible();
    await captureScreenshot(page, testInfo, 'supervisor-workspace');

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Кабинет преподавателя' })).toBeVisible();
    await page.getByRole('button', { name: 'Мои темы' }).click();
    await expect(page.getByRole('heading', { name: 'Мои предложенные темы' })).toBeVisible();
    await captureScreenshot(page, testInfo, 'supervisor-dashboard-topics');
  });

  test('администратор открывает панель управления и видит пользователей', async ({ page }, testInfo) => {
    await authenticateAs(page, users.admin);

    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible();
    await expect(page.getByText(users.student.email)).toBeVisible();
    await captureScreenshot(page, testInfo, 'admin-panel');
  });
});
