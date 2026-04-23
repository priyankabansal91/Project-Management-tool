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

const app = express();

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

// CORS — validate origin against explicit whitelist
const ALLOWED_ORIGINS = new Set(
  [config.frontendUrl, process.env.FRONTEND_URL_ALT].filter(Boolean)
);
const IS_DEV = config.nodeEnv !== 'production';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
    // In development allow any localhost port (Vite picks 5173, 5174, etc.)
    if (IS_DEV && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id'],
}));

app.use(express.json({ limit: '2mb' }));   // tightened from 10mb
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Global rate limit — 100 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
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

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT} [${config.nodeEnv}]`);
});

module.exports = app;
