require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'production';
const isProd = nodeEnv === 'production';

// Require strong secrets in production — fail fast rather than run insecurely
if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}
if (process.env.JWT_SECRET === 'dev-secret-change-in-production-min-32-chars') {
  console.warn('[SECURITY WARNING] JWT_SECRET is set to the known default insecure value. Change it before deploying to production.');
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv,

  db: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    // No insecure fallback — throws in prod, warns in dev
    secret: process.env.JWT_SECRET || (isProd ? null : 'dev-secret-change-in-production-min-32-chars'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  microsoft: {
    clientId: process.env.MS_CLIENT_ID || '',
    clientSecret: process.env.MS_CLIENT_SECRET || '',
    tenantId: process.env.MS_TENANT_ID || 'common',
    redirectUri: `${process.env.BACKEND_URL || 'http://localhost:4000'}/v1/integrations/outlook/callback`,
  },

  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
};
