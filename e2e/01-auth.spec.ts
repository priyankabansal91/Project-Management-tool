import { test, expect } from '@playwright/test';
import { injectDevAuth } from './helpers';

/**
 * NOTE: In Vite dev mode (DEV=true), the auth store auto-sets accessToken='dev-token'.
 * This means all users are pre-authenticated. Tests that require an unauthenticated
 * state must use a production build to test. Here we test what IS testable in dev mode:
 * authenticated access and basic page routing.
 */

test.describe('Auth & Route Guards (dev mode)', () => {
  test('authenticated user can access /dashboard', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('/ redirects to /dashboard when authenticated', async ({ page }) => {
    await injectDevAuth(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dev mode auto-auth: /dashboard loads without login form', async ({ page }) => {
    // In dev mode, Zustand initializes with devToken so routes open directly
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('API: POST /auth/login with valid creds returns access_token', async ({ request }) => {
    const resp = await request.post('http://localhost:4000/v1/auth/login', {
      data: { email: 'admin@example.local', password: 'password123' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBeTruthy();
  });

  test('API: POST /auth/login with wrong password returns 401', async ({ request }) => {
    const resp = await request.post('http://localhost:4000/v1/auth/login', {
      data: { email: 'admin@example.local', password: 'wrong' },
    });
    expect(resp.status()).toBe(401);
    const body = await resp.json();
    expect(body.success).toBe(false);
  });

  test('API: dev mode defaults to admin when no auth header', async ({ request }) => {
    // In NODE_ENV=development the backend falls back to the default dev user
    // so requests without auth get 200, not 401 — this is intentional dev-mode behaviour
    const resp = await request.get('http://localhost:4000/v1/projects', {
      // No auth headers — dev mode auto-authenticates as org_admin
    });
    expect(resp.status()).toBe(200);
  });

  test('API: /auth/me returns current user', async ({ request }) => {
    const resp = await request.get('http://localhost:4000/v1/auth/me', {
      headers: { 'x-dev-user-id': 'dev-org_admin-id' },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.data.email).toBe('admin@example.local');
  });
});
