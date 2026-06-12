import { test, expect } from '@playwright/test';
import { injectDevAuth, BASE_API, DEV_HEADER } from './helpers';

const TS = Date.now();
let templateId: string;

test.describe('Stage Templates API', () => {
  test('POST /stage-templates — create', async ({ request }) => {
    const resp = await request.post(`${BASE_API}/stage-templates`, {
      headers: DEV_HEADER,
      data: {
        name: `E2E Template ${TS}`,
        description: 'E2E test template',
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toContain('E2E Template');
    templateId = body.data.id;
  });

  test('GET /stage-templates — list', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/stage-templates`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /stage-templates/:id — retrieve', async ({ request }) => {
    const resp = await request.get(`${BASE_API}/stage-templates/${templateId}`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.id).toBe(templateId);
  });

  test('PUT /stage-templates/:id/substages — bulk replace substages', async ({ request }) => {
    const resp = await request.put(`${BASE_API}/stage-templates/${templateId}/substages`, {
      headers: DEV_HEADER,
      data: { names: ['Planning', 'Execution', 'Review', 'Closure'] },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.substages?.length).toBe(4);
  });

  test('PUT /stage-templates/:id — update name', async ({ request }) => {
    const resp = await request.put(`${BASE_API}/stage-templates/${templateId}`, {
      headers: DEV_HEADER,
      data: { name: `E2E Template Updated ${TS}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.name).toContain('Updated');
  });

  test('PUT /stage-templates/:id/substages — validation: non-array names → 400', async ({ request }) => {
    const resp = await request.put(`${BASE_API}/stage-templates/${templateId}/substages`, {
      headers: DEV_HEADER,
      data: { names: 'not an array' },
    });
    expect(resp.status()).toBe(400);
  });

  test('DELETE /stage-templates/:id — delete', async ({ request }) => {
    const resp = await request.delete(`${BASE_API}/stage-templates/${templateId}`, { headers: DEV_HEADER });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
  });

  test('Stage Templates UI page loads without errors', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/admin/stage-templates');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible({ timeout: 15000 });
    const crashText = await page.locator('text=Something went wrong').count();
    expect(crashText).toBe(0);
  });
});
