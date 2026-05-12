/**
 * playwright.config.ts — Q-Flow Automation Scripts
 *
 * Dedicated Playwright configuration for the automation test suite in
 * testing/e2e_testing/automation_scripts/.
 *
 * Usage (run from the project root):
 *   npx playwright test --config testing/e2e_testing/automation_scripts/playwright.config.ts
 *
 * Or run a single file:
 *   npx playwright test testing/e2e_testing/automation_scripts/01-auth-otp.spec.ts \
 *     --config testing/e2e_testing/automation_scripts/playwright.config.ts
 *
 * Prerequisites:
 *   - Frontend:  cd frontend && npm run dev   (http://localhost:5173)
 *   - Backend:   cd backend  && npm run dev   (http://localhost:4000)
 *   - Database:  PostgreSQL on :5432, db=project_mgmt, user=postgres, pw=123456
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  // All 5 spec files live in this same directory
  testDir: path.join(__dirname),

  // Run spec files sequentially to avoid database state conflicts
  fullyParallel: false,
  workers: 1,

  // Retry flaky tests once in CI; set to 0 for local development
  retries: process.env.CI ? 1 : 0,

  // Per-test timeout (30 s standard; test.slow() triples this to 90 s)
  timeout: 30_000,

  // Per-assertion timeout
  expect: { timeout: 10_000 },

  // Reporter: list in terminal + HTML report written to automation_scripts/playwright-report/
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: path.join(__dirname, 'playwright-results.json') }],
  ],

  use: {
    // Frontend dev server
    baseURL: 'http://localhost:5173',

    // Run headless by default; set PWHEADLESS=0 to watch
    headless: process.env.PWHEADLESS !== '0',

    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Capture trace on first retry so failures are inspectable
    trace: 'on-first-retry',

    // Screenshot only on failure
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
