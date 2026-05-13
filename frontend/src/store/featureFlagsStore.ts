import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrgRole } from '@/types';

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  category: string;
  enabledForRoles: OrgRole[];
  isCore: boolean; // core features can't be disabled
}

export const DEFAULT_FEATURES: FeatureFlag[] = [
  // Core (always on)
  { key: 'projects',         label: 'Projects',           description: 'Create and manage projects',                 category: 'Core',       enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], isCore: true },
  { key: 'kanban_board',     label: 'Kanban Board',       description: 'Drag-and-drop task boards',                  category: 'Core',       enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], isCore: true },
  { key: 'my_tasks',         label: 'My Tasks',           description: 'Personal task list',                         category: 'Core',       enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'],             isCore: true },

  // PM Features
  { key: 'gantt_view',       label: 'Gantt / Timeline',   description: 'Visual project timeline with task bars',     category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'],                              isCore: false },
  { key: 'sprints',          label: 'Sprints',            description: 'Agile sprint planning and tracking',         category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'],                              isCore: false },
  { key: 'time_tracking',    label: 'Time Tracking',      description: 'Log hours against tasks',                    category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'],                     isCore: false },
  { key: 'calendar_view',    label: 'Calendar View',      description: 'Tasks and deadlines on a calendar',         category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'],                     isCore: false },
  { key: 'reports',          label: 'Reports',            description: 'Project and team performance reports',       category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'],                              isCore: false },
  { key: 'advanced_reports', label: 'Advanced Reports',   description: 'Custom charts and data exports',             category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager'],                                          isCore: false },
  { key: 'capacity_planning',label: 'Capacity Planning',  description: 'Team workload and capacity management',      category: 'PM',         enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager'],                                          isCore: false },

  // Executive
  { key: 'executive_view',   label: 'Executive Dashboard','description': 'Cross-division KPI overview',             category: 'Executive',  enabledForRoles: ['org_admin','executive'],                                                      isCore: false },
  { key: 'financial_dash',   label: 'Financial Dashboard','description': 'Budget and cost tracking',                 category: 'Executive',  enabledForRoles: ['org_admin','executive'],                                                      isCore: false },
  { key: 'roadmap',          label: 'Roadmap',            description: 'High-level product/project roadmap',         category: 'Executive',  enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive','viewer'],         isCore: false },
  { key: 'risk_register',    label: 'Risk Register',      description: 'Track and mitigate project risks',           category: 'Executive',  enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'],                  isCore: false },
  { key: 'portfolio',        label: 'Portfolio',          description: 'Multi-project portfolio view',               category: 'Executive',  enabledForRoles: ['org_admin','executive'],                                                      isCore: false },

  // Admin
  { key: 'approvals',        label: 'Approval Workflows', description: 'Multi-step approval chains for tasks',       category: 'Admin',      enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'],  isCore: false },
  { key: 'ai_features',      label: 'AI Assistant',       description: 'AI-powered task suggestions and summaries', category: 'Admin',      enabledForRoles: ['org_admin','division_admin','project_manager'],                              isCore: false },
  { key: 'custom_fields',    label: 'Custom Fields',      description: 'Add custom data fields to tasks/projects',   category: 'Admin',      enabledForRoles: ['org_admin'],                                                                 isCore: false },
  { key: 'forms',            label: 'Forms',              description: 'Build custom intake/request forms',          category: 'Admin',      enabledForRoles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'],  isCore: false },
  { key: 'audit_log',        label: 'Audit Log',          description: 'Full activity history for compliance',       category: 'Admin',      enabledForRoles: ['org_admin','division_admin','vertical_head'],                               isCore: false },
  { key: 'onboarding',       label: 'Onboarding Wizard',  description: 'Guided setup for new divisions/teams',      category: 'Admin',      enabledForRoles: ['org_admin'],                                                                 isCore: false },
  // New vertical management feature
  { key: 'verticals',        label: 'Verticals',          description: 'Manage team verticals within boards',        category: 'Admin',      enabledForRoles: ['org_admin','division_admin','vertical_head'],                               isCore: false },
  { key: 'permission_matrix',label: 'Permission Matrix',  description: 'View and manage role permissions',           category: 'Admin',      enabledForRoles: ['org_admin'],                                                                 isCore: false },
];

interface FeatureFlagsState {
  features: FeatureFlag[];
  setFeatures: (features: FeatureFlag[]) => void;
  toggleRoleAccess: (featureKey: string, role: OrgRole) => void;
  isEnabled: (featureKey: string, role: OrgRole | null) => boolean;
  resetToDefaults: () => void;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      features: DEFAULT_FEATURES,

      setFeatures: (features) => set({ features }),

      toggleRoleAccess: (featureKey, role) => {
        set((state) => ({
          features: state.features.map((f) => {
            if (f.key !== featureKey || f.isCore) return f;
            const has = f.enabledForRoles.includes(role);
            return {
              ...f,
              enabledForRoles: has
                ? f.enabledForRoles.filter((r) => r !== role)
                : [...f.enabledForRoles, role],
            };
          }),
        }));
      },

      isEnabled: (featureKey, role) => {
        if (!role) return false;
        const feature = get().features.find((f) => f.key === featureKey);
        if (!feature) return false;
        if (role === 'org_admin') return true; // org_admin always has access
        return feature.enabledForRoles.includes(role);
      },

      resetToDefaults: () => set({ features: DEFAULT_FEATURES }),
    }),
    { name: 'pm-feature-flags-v2' }
  )
);
