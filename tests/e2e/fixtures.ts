import { expect, type Page, type Route, type TestInfo } from '@playwright/test';
import path from 'node:path';

type Role = 'STUDENT' | 'SUPERVISOR' | 'ADMIN' | 'GUEST';

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  group: string | null;
  specialization: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isApproved: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

const now = '2026-05-29T09:00:00.000Z';

export const users = {
  student: user({
    id: 'student-1',
    email: 'student@example.com',
    fullName: 'Мария Иванова',
    role: 'STUDENT',
    group: '221-322',
  }),
  supervisor: user({
    id: 'supervisor-1',
    email: 'supervisor@example.com',
    fullName: 'Анна Петрова',
    role: 'SUPERVISOR',
    specialization: 'Клиническая психология',
  }),
  admin: user({
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Администратор',
    role: 'ADMIN',
  }),
};

export const works = {
  published: work({
    id: 'work-1',
    title: 'Влияние сна на академическую успеваемость',
    author: { id: users.student.id, fullName: users.student.fullName, email: users.student.email },
    supervisor: { id: users.supervisor.id, fullName: users.supervisor.fullName, email: users.supervisor.email },
    status: 'PUBLISHED',
    isPublic: true,
    year: 2026,
    commissionReviewScore: 88,
  }),
  draft: work({
    id: 'work-2',
    title: 'КПТ для снижения тревожности студентов',
    author: { id: users.student.id, fullName: users.student.fullName, email: users.student.email },
    supervisor: { id: users.supervisor.id, fullName: users.supervisor.fullName, email: users.supervisor.email },
    status: 'IN_PROGRESS',
    isPublic: false,
    year: 2026,
    commissionReviewScore: null,
  }),
};

export const screenshotDir = path.resolve(process.cwd(), 'screenshots');

export async function authenticateAs(page: Page, currentUser: ApiUser): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'test-access-token');
    window.localStorage.setItem('refreshToken', 'test-refresh-token');
  });
  await mockApi(page, { currentUser });
}

export async function mockApi(
  page: Page,
  options: {
    currentUser?: ApiUser;
    onCreateWork?: (payload: unknown) => void;
  } = {},
): Promise<void> {
  const currentUser = options.currentUser ?? users.student;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (method === 'POST' && path === '/auth/login') {
      return json(route, {
        user: {
          id: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.fullName,
          role: currentUser.role,
        },
        tokens: { accessToken: 'test-access-token', refreshToken: 'test-refresh-token' },
      });
    }

    if (method === 'POST' && path === '/auth/register') {
      return json(route, {
        requiresApproval: true,
        message: 'Заявка на регистрацию отправлена администратору.',
      });
    }

    if (method === 'POST' && path === '/auth/logout') {
      return json(route, { message: 'ok' });
    }

    if (method === 'GET' && path === '/users/me') return json(route, currentUser);
    if (method === 'PATCH' && path === '/users/me') return json(route, currentUser);
    if (method === 'GET' && path === '/users/supervisors') return json(route, [users.supervisor]);
    if (method === 'GET' && path === '/users') return json(route, [users.admin, users.supervisor, users.student]);
    if (method === 'GET' && path === `/users/${users.supervisor.id}`) return json(route, users.supervisor);
    if (method === 'GET' && path === `/users/${users.student.id}/portfolio`) return json(route, []);
    if (method === 'GET' && path === `/users/${users.supervisor.id}/works`) return json(route, [works.published]);
    if (method === 'PATCH' && path.endsWith('/approve')) return json(route, { ...users.student, isApproved: true });
    if (method === 'PATCH' && path.endsWith('/block')) return json(route, { ...users.student, isBlocked: true });

    if (method === 'GET' && path === '/notifications/unread-count') return json(route, { count: 0 });
    if (method === 'GET' && path === '/notifications') return json(route, []);

    if (method === 'GET' && path === '/works/my') return json(route, [works.draft]);
    if (method === 'GET' && path === '/works/supervised') return json(route, [works.draft]);
    if (method === 'PATCH' && path === `/works/${works.draft.id}/status`) return json(route, { ...works.draft, status: 'REVIEW' });
    if (method === 'GET' && path === '/works') {
      return json(route, {
        data: [works.published],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    }
    if (method === 'GET' && path === '/works/work-new') return json(route, work({ id: 'work-new', title: 'Новая исследовательская работа' }));
    if (method === 'GET' && path === `/works/${works.published.id}`) return json(route, works.published);
    if (method === 'GET' && path === `/works/${works.draft.id}`) return json(route, works.draft);
    if (method === 'GET' && path.endsWith('/stages')) return json(route, [
      { id: 'stage-1', name: 'Выбор темы', workId: works.draft.id, isCompleted: true, completedAt: now, createdAt: now, updatedAt: now },
      { id: 'stage-2', name: 'Черновик', workId: works.draft.id, isCompleted: false, completedAt: null, createdAt: now, updatedAt: now },
    ]);
    if (method === 'GET' && path.endsWith('/messages')) return json(route, []);
    if (method === 'GET' && path.endsWith('/comments')) return json(route, []);
    if (method === 'GET' && path.endsWith('/reviews')) return json(route, []);
    if (method === 'GET' && path === '/review-criteria') return json(route, []);
    if (method === 'POST' && path === '/works') {
      const payload = request.postDataJSON();
      options.onCreateWork?.(payload);
      return json(route, work({ id: 'work-new', title: payload.title }));
    }

    if (method === 'GET' && path === '/search/suggest') {
      return json(route, [{ id: works.published.id, title: works.published.title, similarity: 0.96 }]);
    }
    if (method === 'GET' && path === '/search') {
      return json(route, {
        data: [{
          id: works.published.id,
          title: works.published.title,
          description: works.published.description,
          annotation: works.published.annotation,
          category: works.published.category,
          tags: works.published.tags,
          year: works.published.year,
          commissionReviewScore: works.published.commissionReviewScore,
          authorName: works.published.author.fullName,
          supervisorName: works.published.supervisor?.fullName ?? null,
          rank: 3.8,
          headline: '...академическую <mark>успеваемость</mark>...',
        }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
        convertedQuery: 'успеваемость',
      });
    }

    if (method === 'GET' && path === '/topic-requests/my') {
      return json(route, [{
        id: 'request-1',
        proposedTopic: 'Психология учебной мотивации',
        justification: 'Хочу исследовать факторы мотивации',
        status: 'APPROVED',
        rejectReason: null,
        studentId: users.student.id,
        supervisorId: users.supervisor.id,
        supervisor: users.supervisor,
        createdAt: now,
        updatedAt: now,
      }]);
    }
    if (method === 'GET' && path === '/topic-requests/inbox') {
      return json(route, [{
        id: 'request-2',
        proposedTopic: 'Диагностика профессионального выгорания',
        justification: 'Есть выборка и методики',
        status: 'PENDING',
        rejectReason: null,
        studentId: users.student.id,
        supervisorId: users.supervisor.id,
        student: users.student,
        createdAt: now,
        updatedAt: now,
      }]);
    }
    if (method === 'PATCH' && path === '/topic-requests/request-2/approve') {
      return json(route, { id: 'request-2', status: 'APPROVED' });
    }
    if (method === 'GET' && path === '/supervisor-topics/my') return json(route, []);
    if (method === 'GET' && path === '/supervisor-topics/my-responses') return json(route, []);
    if (method === 'GET' && path === '/supervisor-topics') {
      return json(route, [{
        id: 'topic-1',
        title: 'Когнитивные стратегии обучения',
        description: 'Исследование учебных стратегий студентов',
        area: 'Психология образования',
        isActive: true,
        supervisorId: users.supervisor.id,
        createdAt: now,
        updatedAt: now,
        supervisor: users.supervisor,
        _count: { responses: 2 },
      }]);
    }
    if (method === 'POST' && path === '/supervisor-topics/topic-1/respond') {
      return json(route, {
        id: 'response-1',
        message: 'Интересуюсь этой темой',
        status: 'PENDING',
        studentId: users.student.id,
        topicId: 'topic-1',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (method === 'GET' && path === '/analytics/dashboard') {
      return json(route, { totalWorks: 18, totalUsers: 42, totalSupervisors: 6, avgQualityScore: 87, recentWorks: 4 });
    }
    if (method === 'GET' && path === '/analytics/trends') {
      return json(route, [
        { year: 2025, category: 'Клиническая психология', count: 5 },
        { year: 2026, category: 'Психология образования', count: 8 },
      ]);
    }
    if (method === 'GET' && path === '/analytics/supervisors') {
      return json(route, [{ supervisorId: users.supervisor.id, supervisorName: users.supervisor.fullName, totalWorks: 7, avgScore: 91 }]);
    }
    if (method === 'GET' && path === '/analytics/scores') {
      return json(route, [{ range: '81-100', count: 9 }, { range: '61-80', count: 4 }]);
    }

    if (method === 'GET' && path === '/info') {
      return json(route, [{
        id: 'info-1',
        title: 'Сроки загрузки ВКР',
        content: 'Загрузите финальную версию работы до даты защиты.',
        tags: ['сроки', 'ВКР'],
        isPinned: true,
        authorId: users.supervisor.id,
        author: users.supervisor,
        createdAt: now,
        updatedAt: now,
      }]);
    }

    return json(route, {});
  });
}

export async function captureScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const filePath = path.join(screenshotDir, `${safeName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  await testInfo.attach(name, {
    path: filePath,
    contentType: 'image/png',
  });
}

export async function expectPageReady(page: Page): Promise<void> {
  await expect(page.locator('main')).toBeVisible();
}

function user(data: Partial<ApiUser> & Pick<ApiUser, 'id' | 'email' | 'fullName' | 'role'>): ApiUser {
  return {
    group: null,
    specialization: null,
    bio: null,
    avatarUrl: null,
    isApproved: true,
    isBlocked: false,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
}

function work(data: Record<string, unknown>) {
  return {
    id: 'work-id',
    title: 'Тестовая работа',
    description: 'Описание исследования',
    annotation: 'Аннотация для каталога',
    category: 'Психология образования',
    tags: ['мотивация', 'обучение'],
    status: 'DRAFT',
    year: 2026,
    commissionReviewScore: null,
    externalReviewScore: null,
    viewCount: 0,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    authorId: users.student.id,
    supervisorId: users.supervisor.id,
    author: { id: users.student.id, fullName: users.student.fullName, email: users.student.email },
    supervisor: { id: users.supervisor.id, fullName: users.supervisor.fullName, email: users.supervisor.email },
    files: [],
    _count: { reviews: 0, comments: 0 },
    ...data,
  };
}

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}
