import { test, expect } from '@playwright/test';
import { injectDevAuth, BASE_API, DEV_HEADER } from './helpers';

const TS = Date.now();
let divisionId: string;

test.describe('Divisions API', () => {
  test('POST /divisions — create', async ({ request }) => {
    const resp = await request.post(`${BASE_API}/divisions`, {
      headers: DEV_HEADER,
      data: { name: `E2E Div ${TS}`, code: `ED${TS % 9999}`, description: 'E2E test' },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toContain('E2E Div');
    divisionId = body.data.id;
  });

  test('GET /divisions — list', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/divisions`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /divisions/:id — retrieve', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/divisions/${divisionId}`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(divisionId);
  });

  test('PATCH /divisions/:id — update name', async ({ request }) => {
    const resp = await request.patch(`${BASE_API}/divisions/${divisionId}`, {
      headers: DEV_HEADER,
      data: { name: `E2E Div Updated ${TS}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.name).toContain('Updated');
  });

  test('GET /divisions/hierarchy — returns tree structure', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/divisions/hierarchy`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('GET /divisions/:id/readiness — returns checklist', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/divisions/${divisionId}/readiness`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('POST /divisions — validation: missing name → 400', async ({ request }) => {
    const resp = await request.post(`${BASE_API}/divisions`, {
      headers: DEV_HEADER,
      data: { code: 'NONAME' },
    });
    expect(resp.status()).toBe(400);
  });

  test('POST /divisions — validation: missing code → 400', async ({ request }) => {
    const resp = await request.post(`${BASE_API}/divisions`, {
      headers: DEV_HEADER,
      data: { name: 'No Code Division' },
    });
    expect(resp.status()).toBe(400);
  });

  test('DELETE /divisions/:id — delete', async ({ request }) => {
    const resp = await request.delete(`${BASE_API}/divisions/${divisionId}`, { headers: DEV_HEADER });
    expect([200, 204]).toContain(resp.status());
  });
});

test.describe('Divisions UI', () => {
  test('Admin Divisions page loads without errors', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/divisions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
    // Check no error state rendered
    const crashText = await page.locator('text=Error, text=Something went wrong').count();
    expect(crashText).toBe(0);
  });
});
