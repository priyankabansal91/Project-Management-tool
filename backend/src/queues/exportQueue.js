const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('error', (err) => {
  console.warn('[ExportQueue] Redis connection error:', err.message);
});

const exportQueue = new Queue('qflow-exports', { connection });

module.exports = { exportQueue, connection };
