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
const outlookRoutes = require('./routes/integrations/outlook');

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
app.use('/v1/integrations/outlook', outlookRoutes);

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
