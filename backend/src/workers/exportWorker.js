const { Worker } = require('bullmq');
const { connection } = require('../queues/exportQueue');
const prisma = require('../config/prisma');

const logger = {
  info:  (...a) => console.log('[ExportWorker]', ...a),
  warn:  (...a) => console.warn('[ExportWorker]', ...a),
  error: (...a) => console.error('[ExportWorker]', ...a),
  debug: (...a) => console.log('[ExportWorker:debug]', ...a),
};

const worker = new Worker('qflow-exports', async (job) => {
  const { exportId, orgId, exportType, filters } = job.data;
  logger.info(`Processing export ${exportId} type=${exportType}`);

  try {
    let items = [];

    if (exportType === 'tasks') {
      const where = { project: { orgId } };
      if (filters?.projectId) where.projectId = filters.projectId;
      if (filters?.status) where.status = filters.status;
      if (filters?.assigneeId) where.assigneeId = filters.assigneeId;

      items = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { firstName: true, lastName: true, email: true } },
          project: { select: { name: true, key: true } },
          milestone: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });
    } else if (exportType === 'projects') {
      items = await prisma.project.findMany({
        where: { orgId, ...(filters?.status && { status: filters.status }) },
        include: {
          vertical: { select: { name: true } },
          _count: { select: { tasks: true, milestones: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });
    }

    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        resultUrl: JSON.stringify(items),
        completedAt: new Date(),
      },
    });

    logger.info(`Export ${exportId} completed: ${items.length} records`);
    return { count: items.length };
  } catch (err) {
    logger.error(`Export ${exportId} failed:`, err.message);
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'failed' },
    }).catch(() => {});
    throw err;
  }
}, { connection, concurrency: 2 });

worker.on('failed', (job, err) => {
  logger.error('Job permanently failed:', err.message, { jobId: job?.id });
});

module.exports = { worker };
