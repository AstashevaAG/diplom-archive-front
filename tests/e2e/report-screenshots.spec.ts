import { expect, test, type Page, type Route, type TestInfo } from '@playwright/test';
import { authenticateAs, captureScreenshot, mockApi, users, works } from './fixtures';

const reviewCriteria = [
  { id: 'relevance', name: 'Актуальность темы', description: 'Соответствие темы современным задачам практической психологии и запросам профессионального сообщества.', weight: 1.5, maxScore: 10, orderIndex: 0, isActive: true },
  { id: 'novelty', name: 'Научная новизна', description: 'Наличие самостоятельной исследовательской позиции, новых выводов или оригинального применения методик.', weight: 2, maxScore: 10, orderIndex: 1, isActive: true },
  { id: 'theory', name: 'Глубина теоретического анализа', description: 'Качество обзора источников, логика теоретической главы и связь теории с исследовательскими задачами.', weight: 1.5, maxScore: 10, orderIndex: 2, isActive: true },
  { id: 'methodology', name: 'Корректность методологии', description: 'Обоснованность выборки, методов сбора данных, диагностического инструментария и процедуры исследования.', weight: 2, maxScore: 10, orderIndex: 3, isActive: true },
  { id: 'trainingPresentation', name: 'Тренинговое выступление и контакт с аудиторией', description: 'Умение вести себя в формате тренинга на защите: удерживать внимание аудитории, выстраивать уверенное повествование, использовать голос и интонацию, отвечать на вопросы и поддерживать контакт со слушателями.', weight: 1.5, maxScore: 10, orderIndex: 4, isActive: true },
  { id: 'structure', name: 'Логика и структура изложения', description: 'Последовательность глав, связность аргументации, качество выводов и соответствие цели исследования.', weight: 1, maxScore: 10, orderIndex: 5, isActive: true },
  { id: 'formatting', name: 'Качество оформления', description: 'Соответствие требованиям оформления, грамотность, корректность ссылок, таблиц, рисунков и приложений.', weight: 0.5, maxScore: 10, orderIndex: 6, isActive: true },
  { id: 'independence', name: 'Самостоятельность работы', description: 'Авторская позиция студента, самостоятельность анализа и отсутствие признаков формального компилирования.', weight: 1.5, maxScore: 10, orderIndex: 7, isActive: true },
  { id: 'practicalValue', name: 'Практическая значимость', description: 'Применимость результатов в консультировании, образовании, HR, семейной или клинической практике.', weight: 1, maxScore: 10, orderIndex: 8, isActive: true },
  { id: 'defense', name: 'Качество защиты', description: 'Структура доклада, качество презентации, ответы на вопросы и способность аргументировать решения.', weight: 1.5, maxScore: 10, orderIndex: 9, isActive: true },
];

async function installReportMocks(page: Page): Promise<void> {
  await page.route('**/api/review-criteria', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reviewCriteria),
    }),
  );

  await page.route('**/api/works/work-2', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...works.draft, status: 'DEFENSE' }),
    }),
  );
}

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForLoadState('networkidle');
  await captureScreenshot(page, testInfo, name);
}

test.describe('Скриншоты для отчёта ВКР', () => {
  test('публичные страницы', async ({ page }, testInfo) => {
    await mockApi(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Архив/ })).toBeVisible();
    await capture(page, testInfo, 'report-main-page');

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
    await capture(page, testInfo, 'report-sign-up');

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вход в систему' })).toBeVisible();
    await capture(page, testInfo, 'report-log-in');
  });

  test('страницы студента', async ({ page }, testInfo) => {
    await authenticateAs(page, users.student);
    await installReportMocks(page);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
    await capture(page, testInfo, 'report-personal-account');

    await page.goto('/dashboard/works/new');
    await expect(page.getByRole('heading', { name: 'Новая работа' })).toBeVisible();
    await capture(page, testInfo, 'report-create-work');

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Заявки' }).click();
    await expect(page.getByText('Психология учебной мотивации')).toBeVisible();
    await capture(page, testInfo, 'report-topic-request');

    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: 'Каталог работ' })).toBeVisible();
    await capture(page, testInfo, 'report-catalog');

    await page.goto(`/catalog/${works.published.id}`);
    await expect(page.getByRole('heading', { name: works.published.title })).toBeVisible();
    await capture(page, testInfo, 'report-work-info');

    await page.goto('/supervisors');
    await expect(page.getByRole('heading', { name: 'Преподаватели' })).toBeVisible();
    await capture(page, testInfo, 'report-supervisors');

    await page.goto(`/supervisors/${users.supervisor.id}`);
    await expect(page.getByRole('heading', { name: users.supervisor.fullName })).toBeVisible();
    await capture(page, testInfo, 'report-supervisor-detail');

    await page.goto('/topics');
    await expect(page.getByRole('heading', { name: 'Темы дипломных работ' })).toBeVisible();
    await capture(page, testInfo, 'report-topics');

    await page.goto('/info');
    await expect(page.getByRole('heading', { name: 'Информационный центр' })).toBeVisible();
    await capture(page, testInfo, 'report-info');
  });

  test('страницы преподавателя и администратора', async ({ page }, testInfo) => {
    await authenticateAs(page, users.supervisor);
    await installReportMocks(page);

    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: 'Аналитика' })).toBeVisible();
    await capture(page, testInfo, 'report-supervisor-analytics');

    await page.goto('/colleagues');
    await expect(page.getByRole('heading', { name: 'Коллеги' })).toBeVisible();
    await capture(page, testInfo, 'report-colleagues');

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Кабинет преподавателя' })).toBeVisible();
    await page.getByRole('button', { name: 'Мои темы' }).click();
    await capture(page, testInfo, 'report-supervisor-dashboard');

    await page.goto('/dashboard/works/work-2/workspace');
    await expect(page.getByText(works.draft.title)).toBeVisible();
    await capture(page, testInfo, 'report-supervisor-workspace');

    await page.getByRole('button', { name: 'Выставить оценку' }).click();
    await expect(page.getByRole('dialog', { name: 'Оценка преподавателя' })).toBeVisible();
    await capture(page, testInfo, 'report-review-form');

    await authenticateAs(page, users.admin);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible();
    await capture(page, testInfo, 'report-admin-panel');
  });
});
