/**
 * Approval Workflow Templates
 * Multi-step approval processes with conditional routing
 */

const APPROVAL_WORKFLOWS = {
  // Standard Approval: PM → Director → Finance
  standardApproval: {
    id: 'standardApproval',
    name: 'Standard Approval',
    description: 'Multi-step approval: PM → Director → Finance',
    steps: [
      {
        id: 'step1',
        name: 'PM Review',
        role: 'project_manager',
        description: 'Project Manager reviews and approves',
        order: 1,
        required: true,
        canReject: true,
        rejectReason: 'PM rejected - needs revision',
      },
      {
        id: 'step2',
        name: 'Director Review',
        role: 'director',
        description: 'Director reviews and approves',
        order: 2,
        required: true,
        canReject: true,
        rejectReason: 'Director rejected - needs revision',
      },
      {
        id: 'step3',
        name: 'Finance Approval',
        role: 'finance',
        description: 'Finance approves budget/cost',
        order: 3,
        required: true,
        canReject: true,
        rejectReason: 'Finance rejected - budget issue',
      },
    ],
    conditions: [],
  },

  // Conditional Approval: Cost-based routing
  costBasedApproval: {
    id: 'costBasedApproval',
    name: 'Cost-Based Approval',
    description: 'Conditional approval based on cost: <$10k (PM+Director), >$10k (PM+Director+CFO)',
    steps: [
      {
        id: 'step1',
        name: 'PM Review',
        role: 'project_manager',
        description: 'Project Manager reviews',
        order: 1,
        required: true,
        canReject: true,
      },
      {
        id: 'step2',
        name: 'Director Review',
        role: 'director',
        description: 'Director reviews',
        order: 2,
        required: true,
        canReject: true,
      },
      {
        id: 'step3',
        name: 'CFO Approval',
        role: 'cfo',
        description: 'CFO approves high-cost items',
        order: 3,
        required: false,
        canReject: true,
        condition: {
          field: 'cost',
          operator: 'greaterThan',
          value: 10000,
        },
      },
    ],
    conditions: [
      {
        id: 'cond1',
        field: 'cost',
        operator: 'greaterThan',
        value: 10000,
        action: 'requireStep',
        stepId: 'step3',
      },
    ],
  },

  // Quick Approval: PM only
  quickApproval: {
    id: 'quickApproval',
    name: 'Quick Approval',
    description: 'Single-step approval by Project Manager',
    steps: [
      {
        id: 'step1',
        name: 'PM Approval',
        role: 'project_manager',
        description: 'Project Manager approves',
        order: 1,
        required: true,
        canReject: true,
      },
    ],
    conditions: [],
  },

  // Executive Approval: PM → Director → Executive
  executiveApproval: {
    id: 'executiveApproval',
    name: 'Executive Approval',
    description: 'High-level approval: PM → Director → Executive',
    steps: [
      {
        id: 'step1',
        name: 'PM Review',
        role: 'project_manager',
        description: 'Project Manager reviews',
        order: 1,
        required: true,
        canReject: true,
      },
      {
        id: 'step2',
        name: 'Director Review',
        role: 'director',
        description: 'Director reviews',
        order: 2,
        required: true,
        canReject: true,
      },
      {
        id: 'step3',
        name: 'Executive Approval',
        role: 'executive',
        description: 'Executive approves',
        order: 3,
        required: true,
        canReject: true,
      },
    ],
    conditions: [],
  },

  // Parallel Approval: PM and Finance simultaneously
  parallelApproval: {
    id: 'parallelApproval',
    name: 'Parallel Approval',
    description: 'Parallel approval: PM and Finance review simultaneously',
    steps: [
      {
        id: 'step1',
        name: 'PM Review',
        role: 'project_manager',
        description: 'Project Manager reviews',
        order: 1,
        required: true,
        canReject: true,
        parallel: true,
      },
      {
        id: 'step2',
        name: 'Finance Review',
        role: 'finance',
        description: 'Finance reviews',
        order: 1,
        required: true,
        canReject: true,
        parallel: true,
      },
      {
        id: 'step3',
        name: 'Director Final Approval',
        role: 'director',
        description: 'Director gives final approval',
        order: 2,
        required: true,
        canReject: true,
      },
    ],
    conditions: [],
  },
};

module.exports = APPROVAL_WORKFLOWS;
