const REDIS_URL = process.env.REDIS_URL;

// Skip queue entirely when no Redis URL is configured (e.g. Vercel serverless without Redis)
if (!REDIS_URL) {
  console.warn('[ExportQueue] REDIS_URL not set — export queue disabled, exports will run synchronously.');
  module.exports = { exportQueue: null, connection: null };
  return;
}

const IORedis = require('ioredis');
const { Queue } = require('bullmq');

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('error', (err) => {
  console.warn('[ExportQueue] Redis connection error:', err.message);
});

const exportQueue = new Queue('qflow-exports', { connection });

module.exports = { exportQueue, connection };
