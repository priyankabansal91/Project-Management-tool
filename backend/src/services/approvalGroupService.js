/**
 * Approval Group Service
 * In-memory implementation — drop-in replace with Prisma after running migrations.
 * All functions are async so callers don't change when switching to DB.
 *
 * Prisma migration additions needed (see prisma/approval-groups-addition.prisma):
 *   ApprovalGroup, ApprovalGroupMember, WorkflowGroupStep,
 *   GroupWorkflowInstance, StepMemberVote, ApprovalGroupAuditLog
 */

const { v4: uuid } = require('uuid');

// ── In-memory stores ──────────────────────────────────────────────────────────

const groupsStore      = new Map(); // id → ApprovalGroup
const membersStore     = new Map(); // id → ApprovalGroupMember
const stepsStore       = new Map(); // id → WorkflowGroupStep
const instancesStore   = new Map(); // id → GroupWorkflowInstance
const votesStore       = new Map(); // id → StepMemberVote
const auditStore       = new Map(); // id → ApprovalGroupAuditLog

// ── Seed dev-org defaults ─────────────────────────────────────────────────────

const DEV_ORG = 'dev-org-id';
const NOW = new Date();

[
  { id: 'grp-core',    orgId: DEV_ORG, name: 'Core Team',    description: 'Technical + administrative review before CFO escalation', approvalType: 'QUORUM', quorumCount: 2, slaHours: 48, isActive: true, createdAt: NOW, createdBy: 'dev-org_admin-id' },
  { id: 'grp-cfo',     orgId: DEV_ORG, name: 'CFO Group',    description: 'Financial sanction — any one CFO-level executive can approve', approvalType: 'ANY',    quorumCount: 1, slaHours: 72, isActive: true, createdAt: NOW, createdBy: 'dev-org_admin-id' },
  { id: 'grp-divhead', orgId: DEV_ORG, name: 'Division Head', description: 'Unanimous divisional approval required', approvalType: 'ALL',    quorumCount: null, slaHours: 36, isActive: true, createdAt: NOW, createdBy: 'dev-org_admin-id' },
].forEach(g => groupsStore.set(g.id, g));

[
  { id: uuid(), groupId: 'grp-core',    userId: 'dev-division_admin-id',  title: 'Division Head',    orgRole: 'division_admin', addedAt: NOW, addedBy: 'dev-org_admin-id' },
  { id: uuid(), groupId: 'grp-core',    userId: 'dev-project_manager-id', title: 'Senior Engineer',  orgRole: 'project_manager', addedAt: NOW, addedBy: 'dev-org_admin-id' },
  { id: uuid(), groupId: 'grp-core',    userId: 'dev-member-id',          title: 'Finance Officer',  orgRole: 'member', addedAt: NOW, addedBy: 'dev-org_admin-id' },
  { id: uuid(), groupId: 'grp-cfo',     userId: 'dev-executive-id',       title: 'CFO',              orgRole: 'executive', addedAt: NOW, addedBy: 'dev-org_admin-id' },
  { id: uuid(), groupId: 'grp-divhead', userId: 'dev-division_admin-id',  title: 'Division Head — Infrastructure', orgRole: 'division_admin', addedAt: NOW, addedBy: 'dev-org_admin-id' },
].forEach(m => membersStore.set(m.id, m));

// Workflow steps: 2-step pipeline (Core → CFO)
[
  { id: 'step-1', orgId: DEV_ORG, name: 'Core Team Review',  stepOrder: 1, groupId: 'grp-core',    onApproveNextStep: 'step-2', onRejectStatus: 'DRAFT',    onApproveStatus: 'PENDING_CFO_APPROVAL', slaHours: 48, escalateAfterHours: 60, escalateToGroupId: null,    isActive: true },
  { id: 'step-2', orgId: DEV_ORG, name: 'CFO Final Approval', stepOrder: 2, groupId: 'grp-cfo',    onApproveNextStep: null,     onRejectStatus: 'REJECTED', onApproveStatus: 'ACTIVE',               slaHours: 72, escalateAfterHours: 84, escalateToGroupId: 'grp-divhead', isActive: true },
].forEach(s => stepsStore.set(s.id, s));

// ── helpers ───────────────────────────────────────────────────────────────────

function membersOfGroup(groupId) {
  return Array.from(membersStore.values()).filter(m => m.groupId === groupId);
}

function votesForInstance(instanceId, stepId) {
  return Array.from(votesStore.values()).filter(v => v.instanceId === instanceId && v.stepId === stepId);
}

function writeAudit(orgId, { instanceId, groupId, stepId, actorId, action, comment, meta }) {
  const id = uuid();
  auditStore.set(id, { id, orgId, instanceId, groupId, stepId, actorId, action, comment, meta: meta || null, at: new Date() });
  return id;
}

/**
 * Evaluate whether a step is resolved given current votes.
 * Returns: 'approved' | 'rejected' | 'pending'
 */
function evaluateStep(step, votes) {
  const members  = membersOfGroup(step.groupId);
  const approves = votes.filter(v => v.action === 'APPROVE').length;
  const rejects  = votes.filter(v => v.action === 'REJECT').length;
  const total    = members.length;

  if (step.approvalType === 'ANY') {
    if (approves >= 1)       return 'approved';
    if (rejects >= total)    return 'rejected';
    return 'pending';
  }
  if (step.approvalType === 'ALL') {
    if (approves >= total)   return 'approved';
    if (rejects >= 1)        return 'rejected';
    return 'pending';
  }
  // QUORUM
  const q = step.quorumCount || Math.ceil(total / 2);
  if (approves >= q)         return 'approved';
  if ((total - rejects) < q) return 'rejected'; // can no longer reach quorum
  return 'pending';
}

// ── Group CRUD ────────────────────────────────────────────────────────────────

async function listGroups(orgId) {
  const groups = Array.from(groupsStore.values()).filter(g => g.orgId === orgId);
  return groups.map(g => ({
    ...g,
    members: membersOfGroup(g.id),
    stepCount: Array.from(stepsStore.values()).filter(s => s.orgId === orgId && s.groupId === g.id).length,
  }));
}

async function createGroup(orgId, actorId, { name, description, approvalType, quorumCount, slaHours }) {
  if (!name || !approvalType) throw Object.assign(new Error('name and approvalType are required'), { status: 400 });
  const existing = Array.from(groupsStore.values()).find(g => g.orgId === orgId && g.name === name);
  if (existing) throw Object.assign(new Error(`Group "${name}" already exists`), { status: 409 });

  const id = `grp-${uuid().slice(0, 8)}`;
  const group = { id, orgId, name, description: description || null, approvalType, quorumCount: quorumCount ?? null, slaHours: slaHours || 48, isActive: true, createdAt: new Date(), createdBy: actorId };
  groupsStore.set(id, group);
  writeAudit(orgId, { groupId: id, actorId, action: 'GROUP_CREATED', comment: `Group "${name}" created`, meta: { approvalType } });
  return { ...group, members: [] };
}

async function updateGroup(orgId, actorId, groupId, patch) {
  const g = groupsStore.get(groupId);
  if (!g || g.orgId !== orgId) throw Object.assign(new Error('Group not found'), { status: 404 });
  const updated = { ...g, ...patch, id: g.id, orgId: g.orgId, updatedAt: new Date() };
  groupsStore.set(groupId, updated);
  writeAudit(orgId, { groupId, actorId, action: 'GROUP_UPDATED', comment: null, meta: patch });
  return { ...updated, members: membersOfGroup(groupId) };
}

async function deleteGroup(orgId, actorId, groupId) {
  const g = groupsStore.get(groupId);
  if (!g || g.orgId !== orgId) throw Object.assign(new Error('Group not found'), { status: 404 });
  const inUse = Array.from(stepsStore.values()).some(s => s.orgId === orgId && s.groupId === groupId && s.isActive);
  if (inUse) throw Object.assign(new Error('Cannot delete group: it is assigned to active workflow steps'), { status: 409 });
  groupsStore.delete(groupId);
  // soft-delete members
  Array.from(membersStore.values()).filter(m => m.groupId === groupId).forEach(m => membersStore.delete(m.id));
  writeAudit(orgId, { groupId, actorId, action: 'GROUP_DELETED', comment: null, meta: null });
}

// ── Member management ─────────────────────────────────────────────────────────

async function addMember(orgId, actorId, groupId, { userId, title, orgRole }) {
  const g = groupsStore.get(groupId);
  if (!g || g.orgId !== orgId) throw Object.assign(new Error('Group not found'), { status: 404 });
  const exists = Array.from(membersStore.values()).find(m => m.groupId === groupId && m.userId === userId);
  if (exists) throw Object.assign(new Error('User is already a member'), { status: 409 });
  const id = uuid();
  const member = { id, groupId, userId, title: title || '', orgRole: orgRole || '', addedAt: new Date(), addedBy: actorId };
  membersStore.set(id, member);
  writeAudit(orgId, { groupId, actorId, action: 'MEMBER_ADDED', comment: null, meta: { userId, title } });
  return member;
}

async function removeMember(orgId, actorId, groupId, userId) {
  const entry = Array.from(membersStore.values()).find(m => m.groupId === groupId && m.userId === userId);
  if (!entry) throw Object.assign(new Error('Member not found'), { status: 404 });
  membersStore.delete(entry.id);
  writeAudit(orgId, { groupId, actorId, action: 'MEMBER_REMOVED', comment: null, meta: { userId } });
}

// ── Workflow Steps (config) ────────────────────────────────────────────────────

async function listSteps(orgId) {
  return Array.from(stepsStore.values())
    .filter(s => s.orgId === orgId)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map(s => ({ ...s, group: groupsStore.get(s.groupId) || null }));
}

async function upsertStep(orgId, actorId, { id, name, stepOrder, groupId, onApproveStatus, onRejectStatus, onApproveNextStep, slaHours, escalateAfterHours, escalateToGroupId }) {
  const stepId = id || `step-${uuid().slice(0, 8)}`;
  const step = { id: stepId, orgId, name, stepOrder, groupId, onApproveStatus, onRejectStatus, onApproveNextStep: onApproveNextStep || null, slaHours: slaHours || 48, escalateAfterHours: escalateAfterHours || null, escalateToGroupId: escalateToGroupId || null, isActive: true };
  stepsStore.set(stepId, step);
  writeAudit(orgId, { stepId, actorId, action: 'STEP_UPSERTED', comment: null, meta: step });
  return { ...step, group: groupsStore.get(groupId) || null };
}

async function deleteStep(orgId, actorId, stepId) {
  const s = stepsStore.get(stepId);
  if (!s || s.orgId !== orgId) throw Object.assign(new Error('Step not found'), { status: 404 });
  stepsStore.delete(stepId);
  writeAudit(orgId, { stepId, actorId, action: 'STEP_DELETED', comment: null, meta: null });
}

// ── Workflow Instances ─────────────────────────────────────────────────────────

async function startWorkflow(orgId, actorId, { entityId, entityType, entityName }) {
  const steps = Array.from(stepsStore.values()).filter(s => s.orgId === orgId && s.isActive).sort((a, b) => a.stepOrder - b.stepOrder);
  if (!steps.length) throw Object.assign(new Error('No active workflow steps configured'), { status: 422 });

  const firstStep = steps[0];
  const id = `wfi-${uuid().slice(0, 8)}`;
  const instance = { id, orgId, entityId, entityType, entityName, currentStepId: firstStep.id, status: 'IN_PROGRESS', startedAt: new Date(), completedAt: null, initiatedBy: actorId };
  instancesStore.set(id, instance);
  writeAudit(orgId, { instanceId: id, groupId: firstStep.groupId, stepId: firstStep.id, actorId, action: 'WORKFLOW_STARTED', comment: null, meta: { entityId, entityType, entityName } });
  return { ...instance, currentStep: { ...firstStep, group: groupsStore.get(firstStep.groupId) } };
}

async function castVote(orgId, actorId, instanceId, { action, comment }) {
  const instance = instancesStore.get(instanceId);
  if (!instance || instance.orgId !== orgId) throw Object.assign(new Error('Instance not found'), { status: 404 });
  if (instance.status !== 'IN_PROGRESS') throw Object.assign(new Error('Workflow is not active'), { status: 400 });

  const step = stepsStore.get(instance.currentStepId);
  if (!step) throw Object.assign(new Error('Current step not found'), { status: 500 });

  // Verify actor is a member of the current step's group
  const membership = Array.from(membersStore.values()).find(m => m.groupId === step.groupId && m.userId === actorId);
  if (!membership) throw Object.assign(new Error('You are not a member of the group assigned to this step'), { status: 403 });

  // Idempotency: if already voted, update vote
  const existing = Array.from(votesStore.values()).find(v => v.instanceId === instanceId && v.stepId === step.id && v.actorId === actorId);
  if (existing) {
    existing.action = action;
    existing.comment = comment || null;
    existing.updatedAt = new Date();
  } else {
    const voteId = uuid();
    votesStore.set(voteId, { id: voteId, instanceId, stepId: step.id, groupId: step.groupId, actorId, action, comment: comment || null, at: new Date() });
  }

  writeAudit(orgId, { instanceId, groupId: step.groupId, stepId: step.id, actorId, action: `VOTE_${action}`, comment, meta: null });

  // Evaluate step outcome
  const allVotes = votesForInstance(instanceId, step.id);
  const outcome = evaluateStep(step, allVotes);

  if (outcome === 'pending') return { outcome: 'pending', instance: instancesStore.get(instanceId), step, votes: allVotes };

  // Step resolved — find next step or complete workflow
  const allSteps = Array.from(stepsStore.values()).filter(s => s.orgId === orgId && s.isActive).sort((a, b) => a.stepOrder - b.stepOrder);

  if (outcome === 'approved') {
    const nextStep = step.onApproveNextStep ? stepsStore.get(step.onApproveNextStep) : allSteps.find(s => s.stepOrder === step.stepOrder + 1);
    if (nextStep) {
      instancesStore.get(instanceId).currentStepId = nextStep.id;
      writeAudit(orgId, { instanceId, groupId: nextStep.groupId, stepId: nextStep.id, actorId: 'system', action: 'STEP_ADVANCED', comment: `Step ${step.name} approved. Moved to ${nextStep.name}`, meta: null });
    } else {
      // Final approval
      const inst = instancesStore.get(instanceId);
      inst.status = 'COMPLETED';
      inst.completedAt = new Date();
      inst.finalStatus = step.onApproveStatus;
      writeAudit(orgId, { instanceId, groupId: step.groupId, stepId: step.id, actorId: 'system', action: 'WORKFLOW_COMPLETED', comment: `All steps approved. Entity → ${step.onApproveStatus}`, meta: { finalStatus: step.onApproveStatus } });
    }
  } else {
    const inst = instancesStore.get(instanceId);
    inst.status = 'REJECTED';
    inst.completedAt = new Date();
    inst.finalStatus = step.onRejectStatus;
    writeAudit(orgId, { instanceId, groupId: step.groupId, stepId: step.id, actorId: 'system', action: 'WORKFLOW_REJECTED', comment: `Step ${step.name} rejected. Entity → ${step.onRejectStatus}`, meta: { finalStatus: step.onRejectStatus } });
  }

  return { outcome, instance: instancesStore.get(instanceId), step, votes: allVotes };
}

async function getInstanceDetail(orgId, instanceId) {
  const instance = instancesStore.get(instanceId);
  if (!instance || instance.orgId !== orgId) throw Object.assign(new Error('Instance not found'), { status: 404 });

  const allSteps = Array.from(stepsStore.values()).filter(s => s.orgId === orgId && s.isActive).sort((a, b) => a.stepOrder - b.stepOrder);
  const stepsWithVotes = allSteps.map(s => {
    const votes = votesForInstance(instanceId, s.id);
    const group = groupsStore.get(s.groupId);
    const members = membersOfGroup(s.groupId);
    return { ...s, group, members, votes, outcome: evaluateStep(s, votes) };
  });

  const auditLog = Array.from(auditStore.values()).filter(a => a.instanceId === instanceId).sort((a, b) => new Date(a.at) - new Date(b.at));

  return { ...instance, steps: stepsWithVotes, auditLog };
}

async function listPendingForUser(orgId, userId) {
  const userGroups = Array.from(membersStore.values()).filter(m => m.userId === userId).map(m => m.groupId);
  const instances = Array.from(instancesStore.values()).filter(i => i.orgId === orgId && i.status === 'IN_PROGRESS');

  return instances
    .filter(inst => {
      const step = stepsStore.get(inst.currentStepId);
      return step && userGroups.includes(step.groupId);
    })
    .map(inst => {
      const step = stepsStore.get(inst.currentStepId);
      const group = groupsStore.get(step?.groupId);
      const votes = votesForInstance(inst.id, inst.currentStepId);
      const members = membersOfGroup(step?.groupId);
      const userVote = votes.find(v => v.actorId === userId);
      return { ...inst, currentStep: { ...step, group, members, votes, userVote: userVote || null } };
    });
}

async function getAuditLog(orgId, { instanceId, groupId, limit = 50 }) {
  return Array.from(auditStore.values())
    .filter(a => {
      if (a.orgId !== orgId) return false;
      if (instanceId && a.instanceId !== instanceId) return false;
      if (groupId && a.groupId !== groupId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, limit);
}

module.exports = {
  listGroups, createGroup, updateGroup, deleteGroup,
  addMember, removeMember,
  listSteps, upsertStep, deleteStep,
  startWorkflow, castVote, getInstanceDetail, listPendingForUser,
  getAuditLog,
  // expose stores for admin monitoring
  _stores: { groupsStore, membersStore, stepsStore, instancesStore, votesStore, auditStore },
};
