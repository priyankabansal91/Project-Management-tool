const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const WORKFLOW_TEMPLATES = require('../utils/workflowTemplates');

const DEFAULT_KANBAN_STATUSES = [
  { id: 'todo',        name: 'To Do',       color: '#6B7280', order: 1 },
  { id: 'in_progress', name: 'In Progress', color: '#3B82F6', order: 2 },
  { id: 'in_review',   name: 'In Review',   color: '#F59E0B', order: 3 },
  { id: 'done',        name: 'Done',        color: '#10B981', order: 4 },
];

function parseJson(value, fallback) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

function fmt(config) {
  return {
    id: config.id,
    org_id: config.orgId,
    name: config.name,
    description: config.description || null,
    is_default: config.isDefault,
    statuses: parseJson(config.statuses, DEFAULT_KANBAN_STATUSES),
    transitions: parseJson(config.transitions, []),
    created_at: config.createdAt,
    updated_at: config.updatedAt,
  };
}

/**
 * Seed default workflow templates for an org if none exist yet.
 * Called lazily on first list() so orgs created before DB migration still get data.
 */
async function ensureDefaults(orgId, userId) {
  const count = await prisma.workflowConfig.count({ where: { orgId } });
  if (count > 0) return;

  const fallbackUserId = userId || 'system';
  const entries = Object.entries(WORKFLOW_TEMPLATES);
  for (let i = 0; i < entries.length; i++) {
    const [key, template] = entries[i];
    await prisma.workflowConfig.create({
      data: {
        orgId,
        name: template.name,
        description: template.description || null,
        isDefault: key === 'kanban',
        statuses: JSON.stringify(template.statuses),
        transitions: JSON.stringify(template.transitions || []),
        createdBy: fallbackUserId,
      },
    }).catch((err) => logger.warn(`Failed to seed workflow template "${key}"`, err));
  }
}

async function list(orgId, userId) {
  try {
    await ensureDefaults(orgId, userId);
    const configs = await prisma.workflowConfig.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
    });
    return configs.map(fmt);
  } catch (err) {
    logger.warn('Failed to list workflow configs', err);
    return [];
  }
}

async function getById(orgId, id) {
  const config = await prisma.workflowConfig.findFirst({ where: { id, orgId } });
  if (!config) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  return fmt(config);
}

async function create(orgId, userId, data) {
  const statuses = data.statuses || DEFAULT_KANBAN_STATUSES;
  const transitions = data.transitions || [];
  const config = await prisma.workflowConfig.create({
    data: {
      orgId,
      name: data.name,
      description: data.description || null,
      isDefault: false,
      statuses: JSON.stringify(statuses),
      transitions: JSON.stringify(transitions),
      createdBy: userId,
    },
  });
  return fmt(config);
}

async function update(orgId, id, data) {
  const existing = await prisma.workflowConfig.findFirst({ where: { id, orgId } });
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.statuses !== undefined) patch.statuses = JSON.stringify(data.statuses);
  if (data.transitions !== undefined) patch.transitions = JSON.stringify(data.transitions);
  if (data.is_default !== undefined) patch.isDefault = data.is_default;

  const updated = await prisma.workflowConfig.update({ where: { id }, data: patch });
  return fmt(updated);
}

async function remove(orgId, id) {
  const existing = await prisma.workflowConfig.findFirst({ where: { id, orgId } });
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.isDefault) {
    const err = new Error('Cannot delete default workflow');
    err.statusCode = 400;
    throw err;
  }
  await prisma.workflowConfig.delete({ where: { id } });
  return { id };
}

module.exports = { list, getById, create, update, remove };
