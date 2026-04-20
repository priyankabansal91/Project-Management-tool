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

const app = express();

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// ─── HEALTH CHECK ───────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API ROUTES ─────────────────────────────────────────

app.use('/v1/auth', authRoutes);
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
