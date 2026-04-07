require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
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
