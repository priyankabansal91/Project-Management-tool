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
}

export const WIDGET_DEFINITIONS: WidgetDef[] = [
  {
    id: 'stat_cards',
    label: 'Summary Stats',
    description: 'Top-level KPI cards',
    roles: ['all'],
  },
  {
    id: 'project_progress',
    label: 'Project Progress',
    description: 'Progress bars for active projects',
    roles: ['project_manager', 'team_lead', 'member', 'viewer'],
  },
  {
    id: 'recent_activity',
    label: 'Recent Activity',
    description: 'Team activity feed',
    roles: ['project_manager', 'team_lead', 'member', 'viewer'],
  },
  {
    id: 'task_inbox',
    label: 'My Task Inbox',
    description: 'Tasks grouped Overdue/Today/Week',
    roles: ['member', 'team_lead'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: '@mentions, assignments, approvals',
    roles: ['member', 'team_lead'],
  },
  {
    id: 'time_week',
    label: 'Time This Week',
    description: 'Timer, daily bars, utilization',
    roles: ['member', 'team_lead', 'project_manager'],
  },
  {
    id: 'my_projects_ctx',
    label: 'My Projects',
    description: 'Project context, milestones, activity',
    roles: ['member'],
  },
  {
    id: 'milestone_nav',
    label: 'Milestone Navigator',
    description: 'Horizontal milestone cards',
    roles: ['project_manager'],
  },
  {
    id: 'task_detail',
    label: 'Milestone Task List',
    description: 'Tasks grouped by status',
    roles: ['project_manager'],
  },
  {
    id: 'burn_plan',
    label: 'Burn vs Plan',
    description: 'Effort + budget planned vs actual',
    roles: ['project_manager', 'vertical_head'],
  },
  {
    id: 'time_agg',
    label: 'Team Time Tracking',
    description: 'Per-member utilization bars',
    roles: ['project_manager', 'team_lead'],
  },
  {
    id: 'sprint_status',
    label: 'Sprint Status',
    description: 'Active + upcoming sprint cards',
    roles: ['project_manager', 'team_lead'],
  },
  {
    id: 'team_workload',
    label: 'Team Workload',
    description: 'Member task load table',
    roles: ['team_lead'],
  },
  {
    id: 'project_health_vh',
    label: 'Project Health Cards',
    description: 'Per-project RAG + milestone track',
    roles: ['vertical_head'],
  },
  {
    id: 'financial_variance',
    label: 'Financial Variance',
    description: 'Over-budget milestones + resource overload',
    roles: ['vertical_head', 'division_admin'],
  },
  {
    id: 'vh_approvals',
    label: 'Approvals Queue',
    description: 'Pending approvals with SLA timers',
    roles: ['vertical_head', 'project_manager'],
  },
  {
    id: 'vertical_grid',
    label: 'Vertical Cards',
    description: 'Vertical health with burn + completion',
    roles: ['division_admin'],
  },
  {
    id: 'milestone_calendar',
    label: 'Milestones This Month',
    description: '14-day rolling calendar',
    roles: ['division_admin'],
  },
  {
    id: 'da_approvals',
    label: 'Pending Approvals',
    description: 'Division-level approval queue',
    roles: ['division_admin'],
  },
  {
    id: 'org_health',
    label: 'Org Health Summary',
    description: 'Org-wide KPIs and division RAG',
    roles: ['org_admin'],
  },
  {
    id: 'division_rag',
    label: 'Division Overview',
    description: 'Division scorecards with alerts',
    roles: ['org_admin'],
  },
  {
    id: 'exec_scorecard',
    label: 'Portfolio Scorecard',
    description: 'Division + project completion',
    roles: ['executive'],
  },
  {
    id: 'risk_alerts_exec',
    label: 'Risk & Alerts',
    description: 'Risk flags and system alerts',
    roles: ['executive', 'org_admin'],
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
