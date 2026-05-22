import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Widget IDs
// ---------------------------------------------------------------------------

export type WidgetId =
  | 'stat_cards'
  | 'project_progress'
  | 'recent_activity'
  | 'task_inbox'
  | 'notifications'
  | 'time_week'
  | 'my_projects_ctx'
  | 'milestone_nav'
  | 'task_detail'
  | 'burn_plan'
  | 'time_agg'
  | 'sprint_status'
  | 'team_workload'
  | 'project_health_vh'
  | 'financial_variance'
  | 'vh_approvals'
  | 'vertical_grid'
  | 'milestone_calendar'
  | 'da_approvals'
  | 'org_health'
  | 'division_rag'
  | 'exec_scorecard'
  | 'risk_alerts_exec';

// ---------------------------------------------------------------------------
// Density
// ---------------------------------------------------------------------------

export type Density = 'compact' | 'comfortable' | 'spacious';

// ---------------------------------------------------------------------------
// Widget registry
// ---------------------------------------------------------------------------

export interface WidgetDef {
  id: WidgetId;
  label: string;
  description: string;
  /** Role slugs that can see this widget. 'all' means every role. */
  roles: string[];
  /** Section heading used to group widgets in the customizer panel. */
  section: string;
}

export const WIDGET_DEFINITIONS: WidgetDef[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    id: 'stat_cards',
    label: 'Summary Stats',
    description: 'Top-level KPI cards (tasks, projects, overdue)',
    roles: ['all'],
    section: 'Overview',
  },
  {
    id: 'project_progress',
    label: 'Project Progress',
    description: 'Progress bars for active projects',
    roles: ['all'],
    section: 'Overview',
  },
  {
    id: 'recent_activity',
    label: 'Recent Activity',
    description: 'Team activity feed',
    roles: ['all'],
    section: 'Overview',
  },

  // ── Tasks & Work ──────────────────────────────────────────────────────────
  {
    id: 'task_inbox',
    label: 'My Task Inbox',
    description: 'Tasks grouped Overdue / Today / This Week',
    roles: ['member', 'team_lead', 'project_manager', 'viewer'],
    section: 'Tasks & Work',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: '@mentions, assignments, approval requests',
    roles: ['all'],
    section: 'Tasks & Work',
  },
  {
    id: 'time_week',
    label: 'Time This Week',
    description: 'Timer, daily bars, utilization ring',
    roles: ['member', 'team_lead', 'project_manager', 'viewer'],
    section: 'Tasks & Work',
  },
  {
    id: 'my_projects_ctx',
    label: 'My Projects',
    description: 'Project context cards with milestones',
    roles: ['member', 'team_lead', 'project_manager', 'viewer'],
    section: 'Tasks & Work',
  },

  // ── Project Management ────────────────────────────────────────────────────
  {
    id: 'milestone_nav',
    label: 'Milestone Navigator',
    description: 'Horizontal milestone cards with status indicators',
    roles: ['project_manager', 'team_lead', 'vertical_head', 'division_admin'],
    section: 'Project Management',
  },
  {
    id: 'task_detail',
    label: 'Milestone Task List',
    description: 'Tasks grouped by status for selected milestone',
    roles: ['project_manager', 'team_lead'],
    section: 'Project Management',
  },
  {
    id: 'burn_plan',
    label: 'Burn vs Plan',
    description: 'Effort + budget planned vs actual chart',
    roles: ['project_manager', 'team_lead', 'vertical_head', 'division_admin', 'executive'],
    section: 'Project Management',
  },
  {
    id: 'time_agg',
    label: 'Team Time Tracking',
    description: 'Per-member utilization bars',
    roles: ['project_manager', 'team_lead', 'vertical_head', 'division_admin'],
    section: 'Project Management',
  },
  {
    id: 'sprint_status',
    label: 'Sprint Status',
    description: 'Active + upcoming sprint cards',
    roles: ['project_manager', 'team_lead', 'member', 'vertical_head'],
    section: 'Project Management',
  },
  {
    id: 'team_workload',
    label: 'Team Workload',
    description: 'Member task load breakdown table',
    roles: ['team_lead', 'project_manager', 'vertical_head'],
    section: 'Project Management',
  },
  {
    id: 'milestone_calendar',
    label: 'Milestones This Month',
    description: '14-day rolling milestone calendar',
    roles: ['project_manager', 'team_lead', 'vertical_head', 'division_admin'],
    section: 'Project Management',
  },

  // ── Approvals ─────────────────────────────────────────────────────────────
  {
    id: 'vh_approvals',
    label: 'Approvals Queue',
    description: 'Pending approvals with SLA countdown',
    roles: ['vertical_head', 'project_manager', 'division_admin', 'org_admin', 'team_lead'],
    section: 'Approvals',
  },
  {
    id: 'da_approvals',
    label: 'Division Approvals',
    description: 'Division-level pending approval queue',
    roles: ['division_admin', 'org_admin'],
    section: 'Approvals',
  },

  // ── Vertical / Division ───────────────────────────────────────────────────
  {
    id: 'project_health_vh',
    label: 'Project Health Cards',
    description: 'Per-project RAG status + milestone track',
    roles: ['vertical_head', 'division_admin', 'org_admin', 'executive'],
    section: 'Vertical / Division',
  },
  {
    id: 'financial_variance',
    label: 'Financial Variance',
    description: 'Over-budget milestones + resource overload',
    roles: ['vertical_head', 'division_admin', 'org_admin', 'executive'],
    section: 'Vertical / Division',
  },
  {
    id: 'vertical_grid',
    label: 'Vertical Cards',
    description: 'Vertical health with burn rate + completion',
    roles: ['division_admin', 'org_admin', 'executive'],
    section: 'Vertical / Division',
  },

  // ── Executive / Admin ─────────────────────────────────────────────────────
  {
    id: 'org_health',
    label: 'Org Health Summary',
    description: 'Organisation-wide KPIs and division RAG',
    roles: ['org_admin', 'executive'],
    section: 'Executive / Admin',
  },
  {
    id: 'division_rag',
    label: 'Division Overview',
    description: 'Division scorecards with alerts',
    roles: ['org_admin', 'executive', 'division_admin'],
    section: 'Executive / Admin',
  },
  {
    id: 'exec_scorecard',
    label: 'Portfolio Scorecard',
    description: 'Division + project completion summary',
    roles: ['executive', 'org_admin'],
    section: 'Executive / Admin',
  },
  {
    id: 'risk_alerts_exec',
    label: 'Risk & Alerts',
    description: 'Risk flags and critical system alerts',
    roles: ['executive', 'org_admin', 'vertical_head', 'division_admin'],
    section: 'Executive / Admin',
  },
];

// ---------------------------------------------------------------------------
// Saved views
// ---------------------------------------------------------------------------

export interface SavedView {
  id: string;
  name: string;
  hiddenWidgets: WidgetId[];
  density: Density;
  createdAt: string; // ISO string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface DashboardCustomizerState {
  hiddenWidgets: WidgetId[];
  density: Density;
  autoRefreshSeconds: number;
  savedViews: SavedView[];
  activeViewId: string | null;

  toggleWidget: (id: WidgetId) => void;
  setDensity: (d: Density) => void;
  setAutoRefreshSeconds: (s: number) => void;
  saveView: (name: string) => void;
  loadView: (id: string) => void;
  deleteView: (id: string) => void;
  resetToDefault: () => void;
  isWidgetVisible: (id: WidgetId) => boolean;
}

const MAX_SAVED_VIEWS = 8;

export const useDashboardCustomizer = create<DashboardCustomizerState>()(
  persist(
    (set, get) => ({
      hiddenWidgets: [],
      density: 'comfortable',
      autoRefreshSeconds: 0,
      savedViews: [],
      activeViewId: null,

      toggleWidget: (id) =>
        set((state) => {
          const isHidden = state.hiddenWidgets.includes(id);
          return {
            hiddenWidgets: isHidden
              ? state.hiddenWidgets.filter((w) => w !== id)
              : [...state.hiddenWidgets, id],
            activeViewId: null,
          };
        }),

      setDensity: (d) => set({ density: d, activeViewId: null }),

      setAutoRefreshSeconds: (s) => set({ autoRefreshSeconds: s }),

      saveView: (name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return state;

          const newView: SavedView = {
            id: `view_${Date.now()}`,
            name: trimmed,
            hiddenWidgets: [...state.hiddenWidgets],
            density: state.density,
            createdAt: new Date().toISOString(),
          };

          const updated = [newView, ...state.savedViews].slice(0, MAX_SAVED_VIEWS);
          return { savedViews: updated, activeViewId: newView.id };
        }),

      loadView: (id) =>
        set((state) => {
          const view = state.savedViews.find((v) => v.id === id);
          if (!view) return state;
          return {
            hiddenWidgets: [...view.hiddenWidgets],
            density: view.density,
            activeViewId: id,
          };
        }),

      deleteView: (id) =>
        set((state) => ({
          savedViews: state.savedViews.filter((v) => v.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId,
        })),

      resetToDefault: () =>
        set({ hiddenWidgets: [], density: 'comfortable', activeViewId: null }),

      isWidgetVisible: (id) => !get().hiddenWidgets.includes(id),
    }),
    { name: 'pm-dashboard-customizer' }
  )
);
