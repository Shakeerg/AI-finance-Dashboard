// Browser tests that need NO backend: every API call is answered by a fake.
// They check the whole UI flow (login, every dashboard page, forms, theme, guards).
import { test, expect } from '@playwright/test';

const HOURS = 3600e3;
const mk = (id, merchant, category, type, amount, hoursAgo, extra = {}) => ({
  _id: `id${id}`, merchant, category, type, amount, currency: 'INR', bank: 'HDFC',
  confidenceScore: 0.95, possibleDuplicate: false, source: 'notification', sourceApp: 'GPay',
  rawText: `Rs.${amount}`, createdAt: new Date(Date.now() - hoursAgo * HOURS).toISOString(), ...extra,
});

const seed = () => [
  mk(1, 'Swiggy', 'Food & Dining', 'debit', 840, 1),
  mk(2, 'Swiggy', 'Food & Dining', 'debit', 840, 1.02, { possibleDuplicate: true, sourceApp: 'PhonePe' }),
  mk(3, 'Uber', 'Transportation', 'debit', 250, 2),
  mk(4, 'Ramesh K', 'Uncategorized', 'debit', 3200, 20, { confidenceScore: 0.58 }),
  mk(5, 'ACME Salary', 'Other', 'credit', 45000, 30),
  mk(6, 'Amazon', 'Shopping', 'debit', 1299, 50),
];

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function mockBackend(page) {
  let db = seed();
  // Live updates are not part of these tests
  await page.route('**/socket.io/**', (r) => r.abort());
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^.*\/api\/v1/, '');
    const method = req.method();
    if (path === '/auth/login') {
      return req.postDataJSON().password === 'wrong-password'
        ? json(route, { message: 'Invalid email or password.' }, 401)
        : json(route, { token: 'test-token', user: { id: 'u1', name: 'Shakeer' } });
    }
    if (path === '/auth/device-key') return json(route, { hasKey: false });
    if (path === '/transactions' && method === 'GET') return json(route, { transactions: db, pages: 1, total: db.length });
    if (path === '/transactions/ingest') return json(route, { jobId: 'job-1' }, 202);
    if (path === '/transactions/manual') {
      const d = req.postDataJSON();
      const tx = mk(900, d.merchant, d.category, d.type, d.amount, 0, { source: 'manual' });
      db = [tx, ...db];
      return json(route, { transaction: tx });
    }
    const confirm = path.match(/^\/transactions\/([^/]+)\/confirm$/);
    if (confirm) {
      db = db.map((t) => (t._id === confirm[1] ? { ...t, confidenceScore: 1, possibleDuplicate: false } : t));
      return json(route, { transaction: db.find((t) => t._id === confirm[1]) });
    }
    return json(route, {});
  });
}

async function signIn(page) {
  await page.addInitScript(() => {
    localStorage.setItem('fina_token', 'test-token');
    localStorage.setItem('fina_user', JSON.stringify({ id: 'u1', name: 'Shakeer' }));
  });
}

test.beforeEach(async ({ page }) => {
  // Fonts are cosmetic; blocking them keeps the tests fast and offline-safe
  await page.route('**/fonts.g*/**', (r) => r.abort());
  await mockBackend(page);
});

test('landing page renders and has no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/autopilot/i);
  await expect(page).toHaveTitle(/FINA/);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test('login: wrong password shows an error, right password opens the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('me@example.com');
  await page.locator('#password').fill('wrong-password');
  await page.locator('button.auth-submit').click();
  await expect(page.locator('.auth-error')).toContainText('Invalid email or password');

  await page.locator('#password').fill('correct-password');
  await page.locator('button.auth-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.fa-pagehead h1')).toHaveText('Overview');
});

test('dashboard: overview shows totals, review alert and an interactive chart', async ({ page, isMobile }) => {
  await signIn(page);
  await page.goto('/dashboard');
  await expect(page.locator('.fa-root')).toHaveAttribute('data-theme', 'dark'); // dark is the default
  await expect(page.locator('.fa-kpi .value').first()).toContainText('₹45,000');
  await expect(page.locator('.fa-alert')).toContainText('2 transactions');

  if (!isMobile) { // hover tooltips are a desktop interaction
    const chart = page.locator('.fa-area');
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + 120);
    await expect(page.locator('.fa-tip')).toBeVisible();
  }

  await page.getByRole('button', { name: '30d' }).click();
  await expect(page.locator('.fa-metrics')).toContainText('last 30 days');
});

test('dashboard: every page opens', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The sidebar becomes a scrolling strip on phones; covered by the screenshot test');
  await signIn(page);
  await page.goto('/dashboard');
  const pages = [
    ['Transactions', 'Merchant'],
    ['Review inbox', 'Low confidence'],
    ['Analytics', 'Income vs spending'],
    ['Budgets', 'Add budget'],
    ['Phone & sources', 'Phone app connection'],
  ];
  for (const [link, text] of pages) {
    await page.locator('.fa-nav').getByText(link, { exact: true }).click();
    await expect(page.locator('.fa-content')).toContainText(text);
  }
});

test('review inbox: confirming an item shows a toast', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard/review');
  await page.getByRole('button', { name: 'Looks right' }).first().click();
  await expect(page.locator('.fa-toast')).toBeVisible();
});

test('add a manual transaction, then close the modal with Escape', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard/transactions');
  await page.getByRole('button', { name: 'Add transaction' }).click();
  await page.locator('input[name=merchant]').fill('Test chai');
  await page.locator('input[name=amount]').fill('40');
  await page.getByRole('button', { name: 'Create Record' }).click();
  await expect(page.locator('.fa-content')).toContainText('Test chai');

  await page.getByRole('button', { name: 'Add transaction' }).click();
  await expect(page.locator('input[name=merchant]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('input[name=merchant]')).toHaveCount(0);
});

test('light mode switches, persists across a reload', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('.fa-root')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('.fa-root')).toHaveAttribute('data-theme', 'light');
});

test('route guard and unknown URLs', async ({ page }) => {
  await page.goto('/dashboard'); // not signed in
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/definitely-not-a-page');
  await expect(page).toHaveURL(/\/$/);
});

test('sign out returns to the public site', async ({ page }) => {
  await signIn(page);
  await page.goto('/dashboard');
  await page.getByText('Sign out').click();
  // (signIn re-seeds on every navigation, so assert right after the click)
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test('no horizontal scroll on the landing page or the dashboard', async ({ page }) => {
  for (const path of ['/', '/login']) {
    await page.goto(path);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await signIn(page);
  await page.goto('/dashboard');
  await expect(page.locator('.fa-kpi .value').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});