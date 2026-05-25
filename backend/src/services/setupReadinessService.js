const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIVISION_CHECKLIST_KEYS = [
  'admin_assigned',
  'workflow_configured',
  'budget_allocated',
  'approval_routing',
  'notification_setup'
];

async function getDivisionReadiness(divisionId) {
  const division = await prisma.division.findUnique({ where: { id: divisionId } });
  if (!division) return null;

  const checklist = division.setupChecklist || {};
  const completed = DIVISION_CHECKLIST_KEYS.filter((k) => checklist[k] === true);
  const readinessScore = Math.round((completed.length / DIVISION_CHECKLIST_KEYS.length) * 100);
  const isReady = division.setupStatus === 'ACTIVE';

  // Auto-derive checklist items from real data
  const [hasManager, verticalCount, projectCount] = await Promise.all([
    division.managerId ? prisma.user.count({ where: { id: division.managerId } }) : Promise.resolve(0),
    prisma.vertical.count({ where: { divisionId } }),
    prisma.project.count({ where: { divisionId } })
  ]);

  const derivedChecklist = {
    admin_assigned: hasManager > 0,
    workflow_configured: checklist.workflow_configured === true,
    budget_allocated: division.budget !== null,
    approval_routing: checklist.approval_routing === true,
    notification_setup: checklist.notification_setup === true
  };

  const derivedCompleted = DIVISION_CHECKLIST_KEYS.filter((k) => derivedChecklist[k]);
  const derivedScore = Math.round((derivedCompleted.length / DIVISION_CHECKLIST_KEYS.length) * 100);

  return {
    divisionId,
    setupStatus: division.setupStatus,
    isReady,
    readinessScore: derivedScore,
    checklist: derivedChecklist,
    stats: { verticalCount, projectCount }
  };
}

async function updateChecklistItem(divisionId, key, value) {
  if (!DIVISION_CHECKLIST_KEYS.includes(key)) {
    throw new Error(`Unknown checklist key: ${key}`);
  }
  const division = await prisma.division.findUnique({ where: { id: divisionId } });
  if (!division) throw new Error('Division not found');

  const checklist = { ...(division.setupChecklist || {}), [key]: value };
  const allDone = DIVISION_CHECKLIST_KEYS.every((k) => checklist[k] === true);

  return prisma.division.update({
    where: { id: divisionId },
    data: {
      setupChecklist: checklist,
      ...(allDone && { setupStatus: 'ACTIVE', setupCompletedAt: new Date() })
    }
  });
}

async function getVerticalReadiness(verticalId) {
  const vertical = await prisma.vertical.findUnique({ where: { id: verticalId } });
  if (!vertical) return null;

  const projectCount = await prisma.project.count({ where: { verticalId } });
  const hasHead = vertical.headId !== null;

  return {
    verticalId,
    lifecycleStatus: vertical.lifecycleStatus,
    isReady: vertical.lifecycleStatus === 'ACTIVE',
    hasHead,
    projectCount
  };
}

module.exports = { getDivisionReadiness, updateChecklistItem, getVerticalReadiness, DIVISION_CHECKLIST_KEYS };
