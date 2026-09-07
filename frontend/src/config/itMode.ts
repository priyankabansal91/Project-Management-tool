// IT Mode — enabled when VITE_IT_MODE=true in environment
// Used to switch branding, task fields, and sidebar for the IT Division deployment.

export const IT_MODE = import.meta.env.VITE_IT_MODE === 'true';

export const IT_BRAND = {
  appName: 'Q-Flow IT',
  abbrev: 'IT',
  subtitle: 'Information Technology Division',
  primaryColor: '#0f5bc4', // deeper blue for IT
};

// Sidebar paths to HIDE in IT mode (non-IT modules)
export const IT_HIDDEN_PATHS = new Set([
  '/executive/financial',
  '/portfolio',
]);

// IT-specific task field options
export const IT_ENVIRONMENTS = ['Dev', 'SIT', 'UAT', 'Prod', 'Cross-Env'] as const;
export const IT_CHANGE_TYPES = ['Feature', 'Bug Fix', 'Configuration', 'Patch / Hotfix', 'Emergency'] as const;
