/**
 * Predefined workflow templates for different project management styles
 */

const WORKFLOW_TEMPLATES = {
  // Simple Kanban - Best for small teams and simple projects
  kanban: {
    name: 'Simple Kanban',
    description: 'Basic workflow for simple project management - ideal for small teams',
    statuses: [
      { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 4 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3'] },
    ],
  },

  // Kanban with Review - For teams that need code/work review
  kanbanWithReview: {
    name: 'Kanban with Review',
    description: 'Kanban workflow with review stage - good for quality-focused teams',
    statuses: [
      { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'In Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3', 's5'] },
      { from: 's5', to: ['s3'] },
    ],
  },

  // Scrum - For teams using Scrum methodology
  scrum: {
    name: 'Scrum',
    description: 'Scrum workflow with sprint-based development',
    statuses: [
      { id: 's1', name: 'Product Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Sprint Backlog', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Testing', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s3'] },
    ],
  },

  // Waterfall - For sequential project phases
  waterfall: {
    name: 'Waterfall',
    description: 'Sequential workflow for waterfall-style projects',
    statuses: [
      { id: 's1', name: 'Requirements', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Design', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'Development', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Testing', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Deployment', color: '#EC4899', is_initial: false, is_final: false, order: 5 },
      { id: 's6', name: 'Complete', color: '#10B981', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s6'] },
    ],
  },

  // Bug Tracking - For bug and issue tracking
  bugTracking: {
    name: 'Bug Tracking',
    description: 'Workflow optimized for bug and issue tracking',
    statuses: [
      { id: 's1', name: 'New', color: '#EF4444', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Assigned', color: '#F59E0B', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#3B82F6', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Fixed', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Verified', color: '#10B981', is_initial: false, is_final: true, order: 5 },
      { id: 's6', name: 'Closed', color: '#6B7280', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3', 's6'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s6'] },
    ],
  },

  // Marketing Campaign - For marketing projects
  marketing: {
    name: 'Marketing Campaign',
    description: 'Workflow for marketing campaign management',
    statuses: [
      { id: 's1', name: 'Idea', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Planning', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'Creation', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Approved', color: '#EC4899', is_initial: false, is_final: false, order: 5 },
      { id: 's6', name: 'Live', color: '#10B981', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3', 's5'] },
      { from: 's5', to: ['s6'] },
      { from: 's6', to: [] },
    ],
  },
};

module.exports = WORKFLOW_TEMPLATES;
