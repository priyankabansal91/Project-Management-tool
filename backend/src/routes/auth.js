const { Router } = require('express');
const { z } = require('zod');
const authService = require('../services/authService');
const otpService = require('../services/otpService');
const { registerSchema, loginSchema } = require('../validators/auth');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { refresh_token, ...response } = result;
    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });

    const result = await authService.refreshAccessToken(token);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await authService.logout(req.user.id, refreshToken);
    res.clearCookie('refresh_token');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const prisma = require('../config/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, emailVerifiedAt: true, firstName: true, lastName: true, avatarUrl: true, timezone: true, status: true, preferences: true },
    });
    const memberships = await prisma.orgMember.findMany({
      where: { userId: req.user.id },
      include: { organization: { select: { id: true, name: true, slug: true, plan: true, logoUrl: true } } },
    });
    res.json({
      success: true,
      data: {
        ...user,
        current_org_id: req.user.orgId,
        current_role: req.user.role,
        organizations: memberships.map((m) => ({ ...m.organization, role: m.role })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/send-otp ──────────────────────────────────────────────────────
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, purpose } = z.object({
      email:   z.string().email(),
      purpose: z.enum(['verify_email', 'change_email', 'password_reset']),
    }).parse(req.body);

    const result = await otpService.sendOtp(email, purpose);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, code, purpose } = z.object({
      email:   z.string().email(),
      code:    z.string().length(6).regex(/^\d{6}$/),
      purpose: z.enum(['verify_email', 'change_email', 'password_reset']),
    }).parse(req.body);

    const result = await otpService.verifyOtp(email, code, purpose);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/accept-invite', async (req, res, next) => {
  try {
    const { token, first_name, last_name, password } = req.body;
    if (!token) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'token is required' } });
    if (!password || password.length < 6) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' } });
    const result = await authService.acceptInvite({ token, first_name, last_name, password });
    res.cookie('refresh_token', result.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    const { refresh_token, ...response } = result;
    res.json({ success: true, data: response });
  } catch (err) { next(err); }
});

module.exports = router;
