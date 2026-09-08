const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const commentRoutes = require('./routes/comments');
const dashboardRoutes = require('./routes/dashboard');
const memberRoutes = require('./routes/members');
const workflowRoutes = require('./routes/workflows');
const approvalsRoutes = require('./routes/approvals');
const formsRoutes = require('./routes/forms');
const divisionsRoutes = require('./routes/divisions');
const customRolesRoutes = require('./routes/customRoles');
const externalUsersRoutes = require('./routes/externalUsers');
const versioningRoutes = require('./routes/versioning');
const exportsRoutes = require('./routes/exports');
const outlookRoutes = require('./routes/integrations/outlook');
const okrsRoutes = require('./routes/okrs');
const financialRoutes = require('./routes/financial');
const resourcesRoutes = require('./routes/resources');
const aiRoutes = require('./routes/ai');
const divisionConfigRoutes = require('./routes/divisionConfig');
const executiveRoutes = require('./routes/executive');
const timeLogsRoutes = require('./routes/timeLogs');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const portfolioRoutes = require('./routes/portfolio');
const sprintRoutes = require('./routes/sprints');
const auditLogRoutes = require('./routes/auditLog');
const misRoutes = require('./routes/mis');
const verticalsRoutes = require('./routes/verticals');
const milestonesRoutes = require('./routes/milestones');
const stageTemplatesRoutes = require('./routes/stageTemplates');
const dashboardV2Routes = require('./routes/dashboardV2');


const app = express();

// Trust the Vercel / reverse-proxy X-Forwarded-For header so that
// express-rate-limit can identify real client IPs correctly.
app.set('trust proxy', 1);

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────

app.use(helmet({
  // Prevent MIME-type sniffing
  noSniff: true,
  // Deny framing (clickjacking protection)
  frameguard: { action: 'deny' },
  // HSTS — only enable in production
  hsts: config.nodeEnv === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  // Restrict referrer info
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Basic CSP — tighten per-deployment as needed
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));
app.use(compression());

// CORS — explicit origin allowlist
const STATIC_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  // AWS production
  'https://testmk.qci.org.in',
  'http://testmk.qci.org.in',
  // Vercel production
  'https://frontend-priyankabansal91s-projects.vercel.app',
  'https://frontend-priyankabansal91-priyankabansal91s-projects.vercel.app',
  'https://frontend-liart-one-33.vercel.app',
  config.frontendUrl,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
].filter(Boolean));

// Additional origins from ALLOWED_ORIGINS env var (comma-separated)
const ENV_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
);

// Allow any preview deploy for this project (frontend-* or qflow-*-priyankabansal91s-projects.vercel.app)
const VERCEL_PREVIEW_RE = /^https:\/\/(frontend|qflow-[a-z0-9-]+)-[a-z0-9]+-priyankabansal91s-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (no Origin header: curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    // Check static allowlist
    if (STATIC_ORIGINS.has(origin)) return cb(null, true);
    // Check env-var allowlist
    if (ENV_ORIGINS.size > 0 && ENV_ORIGINS.has(origin)) return cb(null, true);
    // Allow any Vercel preview URL for this project (frontend-* or qflow-*-*)
    if (VERCEL_PREVIEW_RE.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id'],
}));

app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global rate limit — 300 req/min per IP (supports ~2000 concurrent users across cluster)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Stricter rate limit on authentication endpoints — 10 req/15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later' } },
});

// ─── HEALTH CHECK ───────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API ROUTES ─────────────────────────────────────────

app.use('/v1/auth', authLimiter, authRoutes);
app.use('/v1/projects', projectRoutes);
app.use('/v1/projects/:projectId/milestones', milestonesRoutes);
app.use('/v1/stage-templates', stageTemplatesRoutes);
app.use('/v1/tasks', taskRoutes);
app.use('/v1/comments', commentRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/members', memberRoutes);
app.use('/v1/workflows', workflowRoutes);
app.use('/v1/approvals', approvalsRoutes);
app.use('/v1/forms', formsRoutes);
app.use('/v1/divisions', divisionsRoutes);
app.use('/v1/roles', customRolesRoutes);
app.use('/v1/external-users', externalUsersRoutes);
app.use('/v1/versioning', versioningRoutes);
app.use('/v1/exports', exportsRoutes);
app.use('/v1/integrations/outlook', outlookRoutes);
app.use('/v1/okrs', okrsRoutes);
app.use('/v1/financial', financialRoutes);
app.use('/v1/resources', resourcesRoutes);
app.use('/v1/ai', aiRoutes);
app.use('/v1/division-config', divisionConfigRoutes);
app.use('/v1/executive', executiveRoutes);
app.use('/v1/time-logs', timeLogsRoutes);
app.use('/v1/notifications', notificationsRoutes);
app.use('/v1/search', searchRoutes);
app.use('/v1/portfolio', portfolioRoutes);
app.use('/v1/sprints', sprintRoutes);
app.use('/v1/audit-logs', auditLogRoutes);
app.use('/v1/mis', misRoutes);
app.use('/v1/dashboard/v2', dashboardV2Routes);
app.use('/v1/verticals', verticalsRoutes);

// Start export queue worker (gracefully handles Redis being unavailable)
try {
  require('./workers/exportWorker');
  console.log('[App] Export worker started');
} catch (err) {
  console.warn('[App] Export worker not started (Redis may be unavailable):', err.message);
}

// ─── 404 ────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// ─── ERROR HANDLER ──────────────────────────────────────

app.use(errorHandler);

// ─── START SERVER ───────────────────────────────────────

if (!process.env.VERCEL) {
  const PORT = config.port;
  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT} [${config.nodeEnv}]`);
  });
}

module.exports = app;
