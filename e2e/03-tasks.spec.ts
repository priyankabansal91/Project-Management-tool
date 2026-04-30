import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

let testProjectId = '';
let testTaskId = '';

test.describe('Tasks CRUD', () => {
  test.beforeAll(async ({ request }) => {
    const ts = Date.now();
    const resp = await request.post('http://localhost:4000/v1/projects', {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { name: `Task E2E ${ts}`, key: `TE${ts % 9999}`, visibility: 'private', color: '#8B5CF6' },
    });
    const body = await resp.json();
    if (!body.success) throw new Error(`Project creation failed: ${JSON.stringify(body)}`);
    testProjectId = body.data.id;
  });

  test.afterAll(async ({ request }) => {
    if (testProjectId) {
      await request.delete(`http://localhost:4000/v1/projects/${testProjectId}`, {
        headers: { 'x-dev-user-id': 'dev-org_admin-id' },
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    await injectDevAuth(page);
  });

  // ── API-level tests ─────────────────────────────────────

  test('API: create task returns valid task object', async ({ request }) => {
    const resp = await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'API Test Task', priority: 'high', tags: ['e2e'] },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('API Test Task');
    expect(body.data.priority).toBe('high');
    expect(body.data.id).toBeTruthy();
    testTaskId = body.data.id;
  });

  test('API: get task by ID returns task', async ({ request }) => {
    const resp = await request.get(`http://localhost:4000/v1/tasks/${testTaskId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(testTaskId);
  });

  test('API: update task title and priority', async ({ request }) => {
    const resp = await request.patch(`http://localhost:4000/v1/tasks/${testTaskId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'Updated E2E Task', priority: 'critical' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.title).toBe('Updated E2E Task');
    expect(body.data.priority).toBe('critical');
  });

  test('API: move task changes status', async ({ request }) => {
    const resp = await request.post(`http://localhost:4000/v1/tasks/${testTaskId}/move`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { status_id: 'in-progress', status_name: 'In Progress', position: 10 },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.status_id).toBe('in-progress');
  });

  test('API: create task with estimated_hours=0 succeeds', async ({ request }) => {
    const resp = await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'Zero Hour Task', priority: 'low', estimated_hours: 0, tags: [] },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('API: create task with assignee_id uses real user', async ({ request }) => {
    const resp = await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: {
        title: 'Assigned Task',
        priority: 'medium',
        assignee_id: 'dev-member-id',
        tags: [],
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.assignee).not.toBeNull();
    expect(body.data.assignee.id).toBe('dev-member-id');
  });

  test('API: list tasks for project returns array', async ({ request }) => {
    const resp = await request.get(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  test('API: kanban view returns columns', async ({ request }) => {
    const resp = await request.get(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
      params: { view: 'kanban', page_size: '50' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.columns)).toBe(true);
  });

  test('API: my tasks returns paginated list', async ({ request }) => {
    const resp = await request.get('http://localhost:4000/v1/tasks/my', {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  test('API: delete task soft-deletes successfully', async ({ request }) => {
    // Create a throwaway task
    const c = await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'Delete Me Task', tags: [] },
    });
    const cBody = await c.json();
    const tid = cBody.data.id;

    const d = await request.delete(`http://localhost:4000/v1/tasks/${tid}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(d.status()).toBe(204);

    // Verify task is not retrievable
    const g = await request.get(`http://localhost:4000/v1/tasks/${tid}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(g.status()).toBe(404);
  });

  test('API: bulk status update works', async ({ request }) => {
    // Create two tasks
    const t1 = await (await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'Bulk Task 1', tags: [] },
    })).json();
    const t2 = await (await request.post(`http://localhost:4000/v1/tasks/project/${testProjectId}`, {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { title: 'Bulk Task 2', tags: [] },
    })).json();

    const resp = await request.patch('http://localhost:4000/v1/tasks/bulk', {
      headers: { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' },
      data: { taskIds: [t1.data.id, t2.data.id], operation: 'priority', value: 'high' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.updated).toBe(2);
  });

  // ── UI tests ───────────────────────────────────────────

  test('UI: Kanban board loads without crash', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/board`);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).not.toContainText('TypeError');
    await expect(body).not.toContainText('Cannot read properties');
  });

  test('UI: create task via Kanban board modal', async ({ page }) => {
    await page.goto(`/projects/${testProjectId}/board`);
    // Use domcontentloaded — networkidle can hang on boards with polling
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Click "Add Task" button
    const addBtn = page.getByRole('button', { name: /add task/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Modal should open — use "title" only so we don't match "Filter tasks..." search box
    const titleInput = page.locator('input[placeholder*="title" i]').first();
    await expect(titleInput).toBeVisible({ timeout: 8000 });
    await titleInput.fill('UI Created Task');

    // Submit
    const saveBtn = page.getByRole('button', { name: /save|create|submit/i }).last();
    await saveBtn.click();

    // Wait for modal to close or short pause — avoid networkidle which hangs on live boards
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('UI: task detail page loads for real task', async ({ page }) => {
    await page.goto(`/tasks/${testTaskId}`);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).not.toContainText('Error loading task');
    await expect(body).not.toContainText('404');
  });

  test('UI: My Tasks page loads without error', async ({ page }) => {
    await page.goto('/my-tasks');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('TypeError');
  });
});
