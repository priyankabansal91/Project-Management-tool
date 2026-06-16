import { test, expect } from '@playwright/test';

const H = { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' };
const BASE = 'http://localhost:4000/v1';

let taskId = '';
let projectId = '';
let sprintId = '';

test.describe('Comments & Sprints API', () => {
  test.beforeAll(async ({ request }) => {
    // Create project
    const proj = await (await request.post(`${BASE}/projects`, {
      headers: H,
      data: { name: 'Sprint E2E Project', visibility: 'private', color: '#10B981' },
    })).json();
    projectId = proj.data.id;

    // Create task
    const task = await (await request.post(`${BASE}/tasks/project/${projectId}`, {
      headers: H,
      data: { title: 'Sprint Task', tags: [] },
    })).json();
    taskId = task.data.id;
  });

  test.afterAll(async ({ request }) => {
    if (projectId) {
      await request.delete(`${BASE}/projects/${projectId}`, { headers: H });
    }
  });

  // Comments
  test('API: add comment to task', async ({ request }) => {
    const resp = await request.post(`${BASE}/comments/task/${taskId}`, {
      headers: H,
      data: { body: 'E2E test comment' },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.body).toBe('E2E test comment');
  });

  test('API: list comments for task', async ({ request }) => {
    const resp = await request.get(`${BASE}/comments/task/${taskId}`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.items ?? body.data)).toBe(true);
  });

  // Sprints — project_id is a query param, field names are snake_case
  test('API: create sprint', async ({ request }) => {
    const resp = await request.post(`${BASE}/sprints?project_id=${projectId}`, {
      headers: H,
      data: {
        name: 'Sprint 1',
        goal: 'Complete E2E tests',
        start_date: '2026-05-01',
        end_date: '2026-05-14',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    sprintId = body.data.id;
  });

  test('API: list sprints for project', async ({ request }) => {
    const resp = await request.get(`${BASE}/sprints?project_id=${projectId}`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body.data.items ?? body.data)).toBe(true);
  });

  test('API: add task to sprint', async ({ request }) => {
    if (!sprintId) return;
    const resp = await request.post(`${BASE}/sprints/${sprintId}/tasks`, {
      headers: H,
      data: { task_id: taskId },
    });
    expect(resp.status()).toBeLessThan(300);
  });
});

test.describe('Workflows API', () => {
  test('API: list workflows', async ({ request }) => {
    const resp = await request.get(`${BASE}/workflows`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('API: get first workflow by id', async ({ request }) => {
    const listResp = await request.get(`${BASE}/workflows`, { headers: H });
    expect(listResp.status()).toBe(200);
    const listBody = await listResp.json();
    expect(Array.isArray(listBody.data)).toBe(true);
    expect(listBody.data.length).toBeGreaterThan(0);

    const firstId = listBody.data[0].id;
    const resp = await request.get(`${BASE}/workflows/${firstId}`, { headers: H });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(firstId);
    expect(Array.isArray(body.data.statuses)).toBe(true);
  });
});
