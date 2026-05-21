import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, BarChart3,
  Workflow, FormInput, Shield, Bell, Plug, Calendar, Clock, Target, Sparkles,
  Activity, Layers, ClipboardList, PieChart, Building2, KeyRound, UserPlus,
  History, Download, CheckCircle, FileText, Gauge, Crown, Map, ClipboardCheck,
  AlertTriangle, DollarSign, Users2, LayoutGrid, Lock, Briefcase, Zap,
  GanttChartSquare, Network, BarChart2, MonitorCheck, ShieldCheck, BookOpen,
  TrendingUp, Flag, RotateCcw, Save, Eye, EyeOff, LayoutList, BarChart,
  PanelLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSidebarConfigStore } from '@/store/sidebarConfigStore';
import { useDashboardCustomizer } from '@/store/dashboardCustomizerStore';
import type { OrgRole } from '@/types';

// ── Nav item registry (mirrors Sidebar.tsx) ──────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: OrgRole[];
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',           path: '/dashboard',             icon: LayoutDashboard,  roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'Projects',            path: '/projects',              icon: FolderKanban,     roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'My Tasks',            path: '/my-tasks',              icon: CheckSquare,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },
  { label: 'Calendar',            path: '/calendar',              icon: Calendar,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },
  { label: 'Notifications',       path: '/notifications',         icon: Bell,             roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'Divisions',           path: '/admin/divisions',       icon: Building2,        roles: ['org_admin'], section: 'hierarchy' },
  { label: 'Verticals',           path: '/admin/verticals',       icon: Network,          roles: ['org_admin','division_admin','vertical_head'], section: 'hierarchy' },
  { label: 'Org Hierarchy',       path: '/admin/hierarchy',       icon: Layers,           roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], section: 'hierarchy' },
  { label: 'Division Config',     path: '/admin/division-config', icon: Building2,        roles: ['org_admin','division_admin'], section: 'hierarchy' },
  { label: 'Division MIS',        path: '/admin/division-mis',    icon: BarChart2,        roles: ['org_admin','division_admin'], section: 'hierarchy' },
  { label: 'Milestones',          path: '/milestones',            icon: Flag,             roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Sprints',             path: '/sprints',               icon: Target,           roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Gantt Timeline',      path: '/gantt',                 icon: GanttChartSquare, roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Team',                path: '/team',                  icon: Users,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Time Tracking',       path: '/time-tracking',         icon: Clock,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'], section: 'pm' },
  { label: 'Capacity Planning',   path: '/capacity',              icon: Users2,           roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'pm' },
  { label: 'Project Tracking',    path: '/project-tracking',      icon: Gauge,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], section: 'pm' },
  { label: 'Reports',             path: '/reports',               icon: BarChart3,        roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Advanced Reports',    path: '/reports/advanced',      icon: PieChart,         roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'pm' },
  { label: 'AI Features',         path: '/ai',                    icon: Sparkles,         roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'pm' },
  { label: 'Workflow Monitor',    path: '/workflow/monitor',      icon: MonitorCheck,     roles: ['org_admin','division_admin','vertical_head','project_manager','executive'], section: 'pm' },
  { label: 'Approval Inbox',      path: '/admin/approvals',       icon: CheckCircle,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'approvals' },
  { label: 'Gov. Dashboard',      path: '/governance',            icon: TrendingUp,       roles: ['org_admin','division_admin','vertical_head','executive'], section: 'approvals' },
  { label: 'Project Closure',     path: '/governance/closure',    icon: Lock,             roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'approvals' },
  { label: 'Governance',          path: '/workflow/governance',   icon: ShieldCheck,      roles: ['org_admin','executive'], section: 'approvals' },
  { label: 'Executive View',      path: '/executive',             icon: Crown,            roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Portfolio',           path: '/portfolio',             icon: Briefcase,        roles: ['org_admin','division_admin','vertical_head','executive'], section: 'executive' },
  { label: 'Financial Dashboard', path: '/executive/financial',   icon: DollarSign,       roles: ['org_admin','division_admin','vertical_head','executive'], section: 'executive' },
  { label: 'Resource Dashboard',  path: '/executive/resources',   icon: Users2,           roles: ['org_admin','division_admin','executive'], section: 'executive' },
  { label: 'Risk Register',       path: '/risk-register',         icon: AlertTriangle,    roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },
  { label: 'Roadmap',             path: '/roadmap',               icon: Map,              roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], section: 'executive' },
  { label: 'Status Reports',      path: '/status-reports',        icon: ClipboardCheck,   roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },
  { label: 'Admin Dashboard',     path: '/admin/dashboard',       icon: LayoutGrid,       roles: ['org_admin'], section: 'admin' },
  { label: 'User Management',     path: '/admin/users',           icon: Shield,           roles: ['org_admin'], section: 'admin' },
  { label: 'Roles & Permissions', path: '/admin/roles',           icon: KeyRound,         roles: ['org_admin'], section: 'admin' },
  { label: 'Permission Matrix',   path: '/admin/permissions',     icon: ShieldCheck,      roles: ['org_admin'], section: 'admin' },
  { label: 'Workflows',           path: '/admin/workflows',       icon: Workflow,         roles: ['org_admin'], section: 'admin' },
  { label: 'Forms',               path: '/admin/forms',           icon: FileText,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'admin' },
  { label: 'Task Templates',      path: '/admin/templates',       icon: ClipboardList,    roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'admin' },
  { label: 'Issue Types',         path: '/admin/issue-types',     icon: Layers,           roles: ['org_admin'], section: 'admin' },
  { label: 'Custom Fields',       path: '/admin/custom-fields',   icon: FormInput,        roles: ['org_admin'], section: 'admin' },
  { label: 'External Users',      path: '/admin/external-users',  icon: UserPlus,         roles: ['org_admin'], section: 'admin' },
  { label: 'Handoff Panel',       path: '/admin/handoff',         icon: ClipboardCheck,   roles: ['org_admin'], section: 'admin' },
  { label: 'Audit Log',           path: '/admin/audit-log',       icon: Activity,         roles: ['org_admin','division_admin','vertical_head'], section: 'admin' },
  { label: 'Exports',             path: '/admin/exports',         icon: Download,         roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'admin' },
  { label: 'Versioning',          path: '/admin/versioning',      icon: History,          roles: ['org_admin'], section: 'admin' },
  { label: 'Integrations',        path: '/settings/integrations', icon: Plug,             roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'], section: 'admin' },
  { label: 'Feature Flags',       path: '/admin/feature-flags',   icon: Zap,              roles: ['org_admin'], section: 'admin' },
  { label: 'Onboarding Wizard',   path: '/admin/onboarding',      icon: Network,          roles: ['org_admin'], section: 'admin' },
  { label: 'Training Guide',      path: '/workflow/training',     icon: BookOpen,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive','member'], section: 'admin' },
  { label: 'Settings',            path: '/settings',              icon: Settings,         roles: ['org_admin'], section: 'admin' },
  { label: 'Sidebar Config',      path: '/admin/sidebar-config',  icon: PanelLeft,        roles: ['org_admin'], section: 'admin' },
];

const SECTIONS: Record<string, string> = {
  core: 'Workspace', hierarchy: 'Hierarchy', pm: 'Project Mgmt',
  approvals: 'Approvals', executive: 'Executive', admin: 'Admin',
};

const ALL_ROLES: OrgRole[] = [
  'org_admin', 'division_admin', 'vertical_head', 'project_manager',
  'team_lead', 'member', 'executive', 'viewer',
];

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Sys Admin', division_admin: 'Div Admin', vertical_head: 'Vert Head',
  project_manager: 'PM', team_lead: 'Team Lead', member: 'Member',
  executive: 'Executive', viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  org_admin: 'bg-red-100 text-red-700 border-red-200',
  division_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  vertical_head: 'bg-blue-100 text-blue-700 border-blue-200',
  project_manager: 'bg-green-100 text-green-700 border-green-200',
  team_lead: 'bg-teal-100 text-teal-700 border-teal-200',
  member: 'bg-gray-100 text-gray-700 border-gray-200',
  executive: 'bg-amber-100 text-amber-700 border-amber-200',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ── Dashboard Widget Definitions ─────────────────────────────────────────────

const WIDGET_ROLE_MAP: Record<string, string[]> = {
  'kpi-strip':         ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive'],
  'project-health':    ['org_admin','division_admin','vertical_head','project_manager'],
  'milestone-nav':     ['project_manager','team_lead','vertical_head'],
  'financial-panel':   ['org_admin','division_admin','vertical_head','executive'],
  'approvals-queue':   ['org_admin','division_admin','vertical_head','project_manager','team_lead'],
  'active-risks':      ['org_admin','division_admin','vertical_head','executive'],
  'time-tracking':     ['project_manager','team_lead','member'],
  'sprint-status':     ['project_manager','team_lead'],
  'my-tasks-inbox':    ['member','team_lead'],
  'notifications':     ['member','team_lead','project_manager'],
  'my-projects':       ['member'],
  'time-this-week':    ['member'],
  'executive-rollup':  ['org_admin','executive'],
  'team-workload':     ['team_lead'],
};

const WIDGET_LABELS: Record<string, string> = {
  'kpi-strip': 'KPI Strip', 'project-health': 'Project Health Cards',
  'milestone-nav': 'Milestone Navigator', 'financial-panel': 'Financial Variance',
  'approvals-queue': 'Approvals Queue', 'active-risks': 'Active Risks Panel',
  'time-tracking': 'Time Tracking Chart', 'sprint-status': 'Sprint Status',
  'my-tasks-inbox': 'My Tasks Inbox', 'notifications': 'Notifications Panel',
  'my-projects': 'My Projects', 'time-this-week': 'Time This Week',
  'executive-rollup': 'Executive Rollup', 'team-workload': 'Team Workload',
};

// ── Main Component ────────────────────────────────────────────────────────────

export function SidebarConfigPage() {
  const navigate = useNavigate();
  const { adminHidden, toggleAdminHide, resetRole, resetAllRoles } = useSidebarConfigStore();
  const { hiddenWidgets, toggleWidget } = useDashboardCustomizer();

  const [activeTab, setActiveTab] = useState<'sidebar' | 'dashboard'>('sidebar');
  const [selectedRole, setSelectedRole] = useState<OrgRole>('member');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [savedMsg, setSavedMsg] = useState(false);

  const roleItems = NAV_ITEMS.filter((item) => item.roles.includes(selectedRole));
  const hiddenForRole = adminHidden[selectedRole] ?? [];
  const hiddenCount = hiddenForRole.length;

  const filteredItems = sectionFilter === 'all'
    ? roleItems
    : roleItems.filter((i) => i.section === sectionFilter);

  const sectionCounts = Object.fromEntries(
    Object.keys(SECTIONS).map((sec) => [sec, roleItems.filter((i) => i.section === sec).length])
  );

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PanelLeft className="h-6 w-6 text-primary" /> Navigation & Dashboard Config
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control which sidebar items and dashboard widgets are visible per role.
            Changes take effect immediately for all users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { resetAllRoles(); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            {savedMsg ? <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Config</>}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([['sidebar', LayoutList, 'Sidebar Navigation'], ['dashboard', BarChart, 'Dashboard Widgets']] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setActiveTab(id as 'sidebar' | 'dashboard')}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Sidebar Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'sidebar' && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 px-4 py-3 flex items-start gap-3">
            <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You can <strong>hide</strong> nav items from a role's sidebar. You cannot grant access to items
              beyond a role's base permissions. Items hidden here are also excluded from user favourites.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left: Role selector */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Select Role</p>
              {ALL_ROLES.map((role) => {
                const hCount = (adminHidden[role] ?? []).length;
                return (
                  <button key={role} onClick={() => setSelectedRole(role)}
                    className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                      selectedRole === role ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted/40')}>
                    <span>{ROLE_LABELS[role]}</span>
                    {hCount > 0 && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-300 bg-amber-50">
                        {hCount} hidden
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Items for selected role */}
            <div className="lg:col-span-3 space-y-4">
              {/* Role header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs border', ROLE_COLORS[selectedRole])}>
                    {ROLE_LABELS[selectedRole]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {roleItems.length - hiddenCount} visible / {roleItems.length} total items
                    {hiddenCount > 0 && <span className="text-amber-600 ml-1">· {hiddenCount} hidden</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                    onClick={() => resetRole(selectedRole)}>
                    <RotateCcw className="h-3 w-3" /> Reset role
                  </Button>
                </div>
              </div>

              {/* Section filter pills */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setSectionFilter('all')}
                  className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                    sectionFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>
                  All ({roleItems.length})
                </button>
                {Object.entries(SECTIONS).filter(([sec]) => sectionCounts[sec] > 0).map(([sec, label]) => (
                  <button key={sec} onClick={() => setSectionFilter(sec)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                      sectionFilter === sec ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted')}>
                    {label} ({sectionCounts[sec]})
                  </button>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => filteredItems.forEach((i) => {
                    if (!hiddenForRole.includes(i.path)) toggleAdminHide(selectedRole, i.path);
                  })}>
                  <EyeOff className="h-3 w-3" /> Hide all shown
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => filteredItems.forEach((i) => {
                    if (hiddenForRole.includes(i.path)) toggleAdminHide(selectedRole, i.path);
                  })}>
                  <Eye className="h-3 w-3" /> Show all hidden
                </Button>
              </div>

              {/* Item list */}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isHidden = hiddenForRole.includes(item.path);
                  const Icon = item.icon;
                  return (
                    <div key={item.path}
                      className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all',
                        isHidden ? 'opacity-50 bg-muted/30 border-dashed' : 'hover:bg-muted/20')}>
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className={cn('text-sm font-medium flex-1', isHidden && 'line-through text-muted-foreground')}>
                        {item.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground shrink-0">
                        {SECTIONS[item.section]}
                      </Badge>
                      <button
                        onClick={() => toggleAdminHide(selectedRole, item.path)}
                        className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all shrink-0',
                          isHidden
                            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                            : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100')}>
                        {isHidden ? <><Eye className="h-3 w-3" /> Show</> : <><EyeOff className="h-3 w-3" /> Hide</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dashboard Widgets Tab ─────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 px-4 py-3 flex items-start gap-3">
            <BarChart className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Toggle dashboard widget visibility org-wide. These are the default settings — individual users can
              further customise their own dashboard using the Dashboard Customizer (⚙ icon on the dashboard).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(WIDGET_LABELS).map(([widgetId, label]) => {
              const applicableRoles = WIDGET_ROLE_MAP[widgetId] ?? [];
              const isHidden = hiddenWidgets.includes(widgetId as any);
              return (
                <div key={widgetId}
                  className={cn('rounded-xl border p-4 space-y-3 transition-all',
                    isHidden ? 'opacity-60 border-dashed bg-muted/20' : 'hover:shadow-sm')}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('text-sm font-semibold', isHidden && 'line-through text-muted-foreground')}>
                        {label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                        Widget ID: {widgetId}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWidget(widgetId as any)}
                      className={cn('shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all',
                        isHidden
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100')}>
                      {isHidden ? <><Eye className="h-3 w-3" />Show</> : <><EyeOff className="h-3 w-3" />Hide</>}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {applicableRoles.map((r) => (
                      <span key={r} className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', ROLE_COLORS[r])}>
                        {ROLE_LABELS[r]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Usage Guide ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-primary">Admin Controls</p>
              <p className="text-muted-foreground text-xs">
                Hide sidebar items for specific roles org-wide. E.g., hide "AI Features" from members
                while keeping it visible to project managers.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-primary">User Favourites</p>
              <p className="text-muted-foreground text-xs">
                Each user can ★ star any sidebar item to pin it to a "Favourites" section at the top.
                Favourites persist per-user in their browser.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-primary">Priority Order</p>
              <p className="text-muted-foreground text-xs">
                Admin hides → User favourites → Default role items. Admin hidden items cannot be starred by users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => navigate('/admin/dashboard')}>← Back to Admin</Button>
      </div>
    </div>
  );
}
