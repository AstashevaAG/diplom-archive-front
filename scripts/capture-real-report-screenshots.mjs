import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost:5173';
const API_URL = process.env.API_URL ?? 'http://localhost:3000/api';
const OUT_DIR = path.resolve(
  process.cwd(),
  '../archive/proizvodstvenaya-praktika/images',
);
const PASSWORD = process.env.REPORT_PASSWORD ?? 'Test12345!';

const accounts = {
  student: 'alexandra.astasheva@diplom.local',
  supervisor: 'irina.petrova@diplom.local',
  admin: 'admin@diplom.local',
};

const imageNames = {
  main: 'image 01_main_page.png',
  register: 'image 02_sign_up.png',
  login: 'image 03_log_in.png',
  studentDashboard: 'image 04_personal_account.png',
  createWork: 'image 05_create_work.png',
  topicRequest: 'image 06_topic_request.png',
  catalog: 'image 07_catalog.png',
  workInfo: 'image 08_work_info.png',
  reviewForm: 'image 09_review_form.png',
  supervisors: 'image 10_supervisors.png',
  supervisorDetail: 'image 11_supervisor_detail.png',
  topics: 'image 12_topics.png',
  info: 'image 13_info_center.png',
  analytics: 'image 14_supervisor_analytics.png',
  colleagues: 'image 15_colleagues.png',
  supervisorDashboard: 'image 16_supervisor_dashboard.png',
  workspace: 'image 17_supervisor_workspace.png',
  admin: 'image 18_admin_panel.png',
};

async function api(pathname, token) {
  const response = await fetch(`${API_URL}${pathname}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`${pathname}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function login(email) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function createPage(browser, auth) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'ru-RU',
  });
  const page = await context.newPage();

  if (auth) {
    await page.addInitScript(({ accessToken, refreshToken }) => {
      window.localStorage.setItem('accessToken', accessToken);
      window.localStorage.setItem('refreshToken', refreshToken);
    }, auth.tokens);
  }

  return { context, page };
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(700);
}

async function capture(page, key) {
  await settle(page);
  await page.screenshot({
    path: path.join(OUT_DIR, imageNames[key]),
    fullPage: false,
  });
  console.log(`saved ${imageNames[key]}`);
}

async function goto(page, pathname) {
  await page.goto(`${FRONT_URL}${pathname}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const [studentAuth, supervisorAuth, adminAuth] = await Promise.all([
    login(accounts.student),
    login(accounts.supervisor),
    login(accounts.admin),
  ]);

  const worksPage = await api('/works?limit=50', studentAuth.tokens.accessToken);
  const publishedWork = worksPage.data.find((work) => work.status === 'PUBLISHED') ?? worksPage.data[0];
  if (!publishedWork) throw new Error('No work found for screenshots');

  const supervisors = await api('/users/supervisors', studentAuth.tokens.accessToken);
  const supervisorDetail = supervisors.find((user) => user.email === 'irina.petrova@diplom.local') ?? supervisors[0];
  if (!supervisorDetail) throw new Error('No supervisor found for screenshots');

  const supervisedWorks = await api('/works/supervised', supervisorAuth.tokens.accessToken);
  const defenseWork = supervisedWorks.find((work) => work.status === 'DEFENSE') ?? supervisedWorks[0];
  if (!defenseWork) throw new Error('No supervised work found for screenshots');

  const browser = await chromium.launch({ headless: true });
  try {
    {
      const { context, page } = await createPage(browser);
      await goto(page, '/');
      await capture(page, 'main');
      await goto(page, '/register');
      await capture(page, 'register');
      await goto(page, '/login');
      await capture(page, 'login');
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, studentAuth);
      await goto(page, '/dashboard');
      await capture(page, 'studentDashboard');
      await goto(page, '/dashboard/works/new');
      await capture(page, 'createWork');
      await goto(page, '/dashboard');
      await page.getByRole('button', { name: 'Заявки' }).click().catch(() => {});
      await capture(page, 'topicRequest');
      await goto(page, '/catalog');
      await capture(page, 'catalog');
      await goto(page, `/catalog/${publishedWork.id}`);
      await capture(page, 'workInfo');
      await goto(page, '/supervisors');
      await capture(page, 'supervisors');
      await goto(page, `/supervisors/${supervisorDetail.id}`);
      await capture(page, 'supervisorDetail');
      await goto(page, '/topics');
      await capture(page, 'topics');
      await goto(page, '/info');
      await capture(page, 'info');
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, supervisorAuth);
      await goto(page, '/analytics');
      await capture(page, 'analytics');
      await goto(page, '/colleagues');
      await capture(page, 'colleagues');
      await goto(page, '/dashboard');
      await page.getByRole('button', { name: 'Мои темы' }).click().catch(() => {});
      await capture(page, 'supervisorDashboard');
      await goto(page, `/dashboard/works/${defenseWork.id}/workspace`);
      await capture(page, 'workspace');
      await page.getByRole('button', { name: /Выставить оценку|Редактировать оценку/ }).click();
      await settle(page);
      await capture(page, 'reviewForm');
      await context.close();
    }

    {
      const { context, page } = await createPage(browser, adminAuth);
      await goto(page, '/admin');
      await capture(page, 'admin');
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
