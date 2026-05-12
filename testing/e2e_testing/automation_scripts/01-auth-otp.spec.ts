/**
 * 01-auth-otp.spec.ts
 *
 * Playwright test suite covering the full authentication surface of Q-Flow:
 *   - Login happy / sad paths
 *   - Registration form validation (password strength, mismatch)
 *   - OTP / verify-email page (digit input, backspace nav, paste, resend, wrong code)
 *   - Forgot password flow
 *   - Reset password page (strength meter, mismatch inline error)
 *   - Invite accept page (show/hide password, invalid-token guard)
 *
 * NOTE: The dev server (NODE_ENV=development) auto-authenticates all requests via the
 * Zustand devToken bypass, so tests that need an *unauthenticated* state navigate to
 * public auth routes directly and mock any network calls with page.route() so no actual
 * API round-trip is required.
 *
 * Run individually:
 *   npx playwright test testing/e2e_testing/automation_scripts/01-auth-otp.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clear localStorage so the dev-auth bypass is inactive for public-page tests. */
async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('pm-auth');
  });
}

/** Stub the OTP send endpoint so we never rely on real email delivery. */
async function stubOtpSend(page: Page, statusCode = 200) {
  await page.route('**/v1/auth/otp/send', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'OTP sent' } }),
    });
  });
}

/** Stub the OTP verify endpoint. Pass success=false to simulate a wrong code. */
async function stubOtpVerify(page: Page, success = true) {
  await page.route('**/v1/auth/otp/verify', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { verified: true } }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Invalid or expired code. Try again.' },
        }),
      });
    }
  });
}

// ---------------------------------------------------------------------------
// LOGIN TESTS
// ---------------------------------------------------------------------------

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Remove any existing auth so we land on the real login form
    await clearAuth(page);
    // Stub the login endpoint for happy/sad path tests
    await page.route('**/v1/auth/login', async (route) => {
      const body = route.request().postDataJSON();
      if (body?.email === 'alice.admin@acme.com' && body?.password === 'Password123!') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              access_token: 'mock-token',
              user: { id: 'u1', email: 'alice.admin@acme.com', first_name: 'Alice', last_name: 'Admin', avatar_url: null },
              organizations: [{ role: 'org_admin' }],
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { message: 'Invalid email or password' } }),
        });
      }
    });
  });

  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login page shows Q-Flow branding and "Welcome back" heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Sign in to your Q-Flow account')).toBeVisible();
  });

  test('demo account quick-fill buttons populate the form fields', async ({ page }) => {
    await page.goto('/login');
    // Click the "Admin" demo-fill button
    await page.getByRole('button', { name: /alice\.admin@acme\.com/i }).click();
    // Email input should now contain the demo address
    await expect(page.getByPlaceholder('you@example.com')).toHaveValue('alice.admin@acme.com');
    // Password should be pre-filled too
    await expect(page.getByPlaceholder('Enter your password')).toHaveValue('Password123!');
  });

  test('happy path: valid credentials redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('alice.admin@acme.com');
    await page.getByPlaceholder('Enter your password').fill('Password123!');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    // After successful login the app should navigate away from /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('wrong password shows inline error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('alice.admin@acme.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    // The error div should appear with a relevant message
    await expect(page.locator('.text-destructive').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.text-destructive').first()).toContainText(/invalid|password|failed/i);
  });

  test('sign-in button shows loading state while request is in-flight', async ({ page }) => {
    // Delay the stub so we can capture the loading state
    await page.route('**/v1/auth/login', async (route) => {
      await page.waitForTimeout(500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            access_token: 'mock-token',
            user: { id: 'u1', email: 'alice.admin@acme.com', first_name: 'Alice', last_name: 'Admin', avatar_url: null },
            organizations: [{ role: 'org_admin' }],
          },
        }),
      });
    });

    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('alice.admin@acme.com');
    await page.getByPlaceholder('Enter your password').fill('Password123!');

    const submitBtn = page.getByRole('button', { name: /^sign in$/i });
    await submitBtn.click();
    // During the in-flight request the button text switches to "Signing in..."
    await expect(submitBtn).toContainText(/signing in/i, { timeout: 2000 });
  });

  test('show/hide password toggle switches input type', async ({ page }) => {
    await page.goto('/login');
    const pwInput = page.getByPlaceholder('Enter your password');
    // Initially password type
    await expect(pwInput).toHaveAttribute('type', 'password');
    // Click the eye icon
    await page.locator('button[tabindex="-1"]').first().click();
    await expect(pwInput).toHaveAttribute('type', 'text');
    // Click again to hide
    await page.locator('button[tabindex="-1"]').first().click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('sign up link navigates to /register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

// ---------------------------------------------------------------------------
// REGISTRATION TESTS
// ---------------------------------------------------------------------------

test.describe('Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    // Stub register so we never hit a real DB
    await page.route('**/v1/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            access_token: 'mock-token',
            user: { id: 'u2', email: 'test@example.com', first_name: 'Test', last_name: 'User', avatar_url: null },
          },
        }),
      });
    });
  });

  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder('Alice')).toBeVisible();       // first name
    await expect(page.getByPlaceholder('Chen')).toBeVisible();        // last name
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder(/min 8 chars/i)).toBeVisible(); // password
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Corporation')).toBeVisible();
  });

  test('Create Workspace button is disabled when password is mismatched', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/min 8 chars/i).fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('DifferentPass!');
    const submitBtn = page.getByRole('button', { name: /create workspace/i });
    // Button should be disabled while mismatch persists
    await expect(submitBtn).toBeDisabled();
  });

  test('inline mismatch error appears when confirm password differs', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/min 8 chars/i).fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('Mismatch!');
    // The inline "Passwords do not match" message should appear
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('inline mismatch error disappears once passwords match', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/min 8 chars/i).fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('Mismatch!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    // Correct the confirm field
    await page.getByPlaceholder('Repeat your password').fill('Password123!');
    await expect(page.getByText('Passwords do not match')).not.toBeVisible();
  });

  test('password strength meter appears when typing a password', async ({ page }) => {
    await page.goto('/register');
    const pwInput = page.getByPlaceholder(/min 8 chars/i);
    // Strength meter is hidden until the first character is typed
    await pwInput.fill('a');
    // The strength bar container should now exist in the DOM
    const strengthBars = page.locator('.h-1\\.5.flex-1.rounded-full');
    await expect(strengthBars.first()).toBeVisible();
  });

  test('weak password shows "Weak" strength label', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/min 8 chars/i).fill('abc');
    await expect(page.getByText('Weak')).toBeVisible();
  });

  test('strong password shows "Strong" or "Very Strong" label', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder(/min 8 chars/i).fill('Str0ng!Pass#2024');
    // Should display "Strong" or "Very Strong"
    const label = page.locator('span').filter({ hasText: /strong/i }).first();
    await expect(label).toBeVisible();
  });

  test('org name auto-generates slug with hyphens', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Acme Corporation').fill('My Test Org');
    const slugInput = page.getByPlaceholder('acme-corp');
    // Slug should be lowercased and hyphenated
    await expect(slugInput).toHaveValue('my-test-org');
  });

  test('successful registration redirects to verify-email page', async ({ page }) => {
    await stubOtpSend(page);
    await page.goto('/register');
    await page.getByPlaceholder('Alice').fill('Test');
    await page.getByPlaceholder('Chen').fill('User');
    await page.getByPlaceholder('you@company.com').fill('test@example.com');
    await page.getByPlaceholder(/min 8 chars/i).fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('Password123!');
    await page.getByPlaceholder('Acme Corporation').fill('TestOrg');
    await page.getByRole('button', { name: /create workspace/i }).click();
    // Should land on the OTP verification page
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// OTP / VERIFY EMAIL TESTS
// ---------------------------------------------------------------------------

test.describe('OTP / Verify Email Page', () => {
  const EMAIL = 'user@example.com';
  const OTP_URL = `/verify-email?email=${encodeURIComponent(EMAIL)}&purpose=verify_email`;

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await stubOtpSend(page);
  });

  test('verify-email page renders with 6 digit input boxes', async ({ page }) => {
    await page.goto(OTP_URL);
    // There should be exactly 6 single-character input fields
    const inputs = page.locator('input[inputmode="numeric"]');
    await expect(inputs).toHaveCount(6);
  });

  test('page shows the target email address in the description', async ({ page }) => {
    await page.goto(OTP_URL);
    await expect(page.getByText(EMAIL)).toBeVisible();
  });

  test('resend button is disabled for the first 60 seconds', async ({ page }) => {
    await page.goto(OTP_URL);
    const resendBtn = page.locator('button').filter({ hasText: /resend in/i });
    await expect(resendBtn).toBeDisabled({ timeout: 5000 });
    // The countdown text should contain a numeric value > 0
    await expect(resendBtn).toContainText(/resend in \d+s/i);
  });

  test('typing a digit advances focus to the next box', async ({ page }) => {
    await page.goto(OTP_URL);
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill('1');
    // After filling the first box the second should be focused
    await expect(inputs.nth(1)).toBeFocused({ timeout: 2000 });
  });

  test('backspace on empty box moves focus to the previous box', async ({ page }) => {
    await page.goto(OTP_URL);
    const inputs = page.locator('input[inputmode="numeric"]');
    // Fill first two boxes then delete
    await inputs.nth(0).fill('1');
    await inputs.nth(1).fill('2');
    await inputs.nth(1).press('Backspace');
    // After clearing box 1 (index 1) focus should move back to box 0
    await expect(inputs.nth(0)).toBeFocused({ timeout: 2000 });
  });

  test('pasting 6 digits fills all boxes', async ({ page }) => {
    await stubOtpVerify(page, true);
    await page.goto(OTP_URL);
    const inputs = page.locator('input[inputmode="numeric"]');
    // Paste into the first input; the component's onPaste handler distributes digits
    await inputs.nth(0).focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text', '123456');
      const input = document.querySelector('input[inputmode="numeric"]') as HTMLElement;
      input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    });
    // Give the React state update a moment
    await page.waitForTimeout(500);
    // All 6 inputs should now hold digits
    for (let i = 0; i < 6; i++) {
      const val = await inputs.nth(i).inputValue();
      expect(val).toMatch(/\d/);
    }
  });

  test('verify button is disabled until all 6 digits are entered', async ({ page }) => {
    await page.goto(OTP_URL);
    const verifyBtn = page.getByRole('button', { name: /verify code/i });
    // Initially disabled
    await expect(verifyBtn).toBeDisabled();
    // Fill 5 digits — still disabled
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 5; i++) await inputs.nth(i).fill(String(i + 1));
    await expect(verifyBtn).toBeDisabled();
  });

  test('wrong OTP code shows error and clears input boxes', async ({ page }) => {
    // The verify stub returns a 400 for all codes
    await stubOtpVerify(page, false);
    await page.goto(OTP_URL);
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill(String(i + 1));
    await page.getByRole('button', { name: /verify code/i }).click();
    // Error message should appear
    await expect(page.getByText(/invalid|expired/i)).toBeVisible({ timeout: 8000 });
    // Inputs should be cleared (component resets on error)
    await expect(inputs.nth(0)).toHaveValue('');
  });

  test('correct OTP shows verified success state', async ({ page }) => {
    await stubOtpVerify(page, true);
    await page.goto(OTP_URL);
    const inputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) await inputs.nth(i).fill(String(i + 1));
    await page.getByRole('button', { name: /verify code/i }).click();
    // Success state: "Email Verified!" heading appears
    await expect(page.getByText('Email Verified!')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /go to dashboard/i })).toBeVisible();
  });

  test('missing email param shows "no email" error state', async ({ page }) => {
    await page.goto('/verify-email');
    await expect(page.getByText(/no email address/i)).toBeVisible();
  });

  test('"Back to login" link is present and navigates correctly', async ({ page }) => {
    await page.goto(OTP_URL);
    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// FORGOT PASSWORD TESTS
// ---------------------------------------------------------------------------

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('forgot password page renders reset form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Reset password')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('send reset link shows loading state and then confirmation', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@company.com').fill('user@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    // After ~1.5 s (simulated delay) the "Check your email" state appears
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 5000 });
    // The confirmation description should include the entered email
    await expect(page.getByText(/user@example\.com/)).toBeVisible();
  });

  test('"try again" link resets form back to the email input', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByPlaceholder('you@company.com').fill('user@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 5000 });
    // The "try again" text is a button
    await page.getByRole('button', { name: /try again/i }).click();
    // Should return to the form
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('"Back to login" link navigates to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByRole('link', { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// RESET PASSWORD TESTS
// ---------------------------------------------------------------------------

test.describe('Reset Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('reset password page renders with new and confirm fields', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    await expect(page.getByText('Set new password')).toBeVisible();
    await expect(page.getByPlaceholder('Min 8 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible();
  });

  test('password strength meter updates as user types', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    const pwInput = page.getByPlaceholder('Min 8 characters');
    // Initially no strength meter
    await expect(page.getByText('Weak')).not.toBeVisible();
    // Type a weak password
    await pwInput.fill('abc');
    await expect(page.getByText('Weak')).toBeVisible();
    // Type a stronger password
    await pwInput.fill('Str0ng!Password2024');
    await expect(page.getByText(/strong/i)).toBeVisible();
  });

  test('mismatch inline error appears on confirm field', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    await page.getByPlaceholder('Min 8 characters').fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('Different!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('Reset Password button is disabled during mismatch', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    await page.getByPlaceholder('Min 8 characters').fill('Password123!');
    await page.getByPlaceholder('Repeat your password').fill('Mismatch!');
    await expect(page.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });

  test('show/hide toggle on new password field works', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    const pwInput = page.getByPlaceholder('Min 8 characters');
    await expect(pwInput).toHaveAttribute('type', 'password');
    // Toggle buttons have tabIndex=-1 in the component
    await page.locator('button[tabindex="-1"]').first().click();
    await expect(pwInput).toHaveAttribute('type', 'text');
  });

  test('show/hide toggle on confirm password field works', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    const confirmInput = page.getByPlaceholder('Repeat your password');
    await expect(confirmInput).toHaveAttribute('type', 'password');
    await page.locator('button[tabindex="-1"]').nth(1).click();
    await expect(confirmInput).toHaveAttribute('type', 'text');
  });

  test('successful reset shows "Password reset!" confirmation', async ({ page }) => {
    await page.goto('/reset-password?token=mock-reset-token');
    await page.getByPlaceholder('Min 8 characters').fill('NewPassword123!');
    await page.getByPlaceholder('Repeat your password').fill('NewPassword123!');
    await page.getByRole('button', { name: /reset password/i }).click();
    // After ~1.5 s simulated delay the success state appears
    await expect(page.getByText('Password reset!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// INVITE ACCEPT TESTS
// ---------------------------------------------------------------------------

test.describe('Invite Accept Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    // Stub the accept-invite API endpoint
    await page.route('**/v1/auth/invite/accept', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            access_token: 'mock-invite-token',
            user: { id: 'u3', email: 'invited@example.com', first_name: 'New', last_name: 'Member', avatar_url: null },
            organizations: [{ role: 'member' }],
          },
        }),
      });
    });
  });

  test('invite page without token shows "Invalid Invitation" error', async ({ page }) => {
    await page.goto('/invite/accept');
    await expect(page.getByText('Invalid Invitation')).toBeVisible();
    await expect(page.getByText(/missing or invalid/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /go to login/i })).toBeVisible();
  });

  test('invite page with token shows "You\'ve been invited" state', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await expect(page.getByText("You've been invited")).toBeVisible();
    await expect(page.getByRole('button', { name: /accept invitation/i })).toBeVisible();
  });

  test('"Accept Invitation" advances to the registration form', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await page.getByRole('button', { name: /accept invitation/i }).click();
    await expect(page.getByPlaceholder('Min 6 characters')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat password')).toBeVisible();
  });

  test('show/hide password toggle on invite registration form', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await page.getByRole('button', { name: /accept invitation/i }).click();
    const pwInput = page.getByPlaceholder('Min 6 characters');
    await expect(pwInput).toHaveAttribute('type', 'password');
    // Click the eye icon (tabIndex=-1 buttons)
    await page.locator('button[tabindex="-1"]').first().click();
    await expect(pwInput).toHaveAttribute('type', 'text');
    // Toggle back
    await page.locator('button[tabindex="-1"]').first().click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('show/hide confirm password toggle on invite form', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await page.getByRole('button', { name: /accept invitation/i }).click();
    const confirmInput = page.getByPlaceholder('Repeat password');
    await expect(confirmInput).toHaveAttribute('type', 'password');
    await page.locator('button[tabindex="-1"]').nth(1).click();
    await expect(confirmInput).toHaveAttribute('type', 'text');
  });

  test('invite form shows mismatch error when passwords differ', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await page.getByRole('button', { name: /accept invitation/i }).click();
    await page.getByPlaceholder('Min 6 characters').fill('Pass123!');
    await page.getByPlaceholder('Repeat password').fill('Different!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('successful invite creates account and shows "Welcome aboard!"', async ({ page }) => {
    await page.goto('/invite/accept?token=valid-invite-token');
    await page.getByRole('button', { name: /accept invitation/i }).click();

    await page.getByPlaceholder('First Name *').or(page.locator('input').nth(0)).first().fill('New');
    await page.getByPlaceholder('Last Name *').or(page.locator('input').nth(1)).first().fill('Member');
    await page.getByPlaceholder('Min 6 characters').fill('Password123!');
    await page.getByPlaceholder('Repeat password').fill('Password123!');

    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText('Welcome aboard!')).toBeVisible({ timeout: 8000 });
  });
});
