import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, BarChart3,
  Workflow, FormInput, Shield, Bell, ChevronLeft, ChevronRight, Plug,
  Calendar, Clock, Target, Sparkles, Activity, Layers, ClipboardList, PieChart,
  Building2, KeyRound, UserPlus, History, Download, CheckCircle, FileText, Gauge,
  Crown, Map, ClipboardCheck, AlertTriangle, DollarSign, Users2,
  LayoutGrid, Lock, Briefcase, Zap, GanttChartSquare, Network,
  BarChart2, MonitorCheck, ShieldCheck, BookOpen, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useState, useCallback } from 'react';
import type { OrgRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: OrgRole[];
  section?: string;
}

const navItems: NavItem[] = [
  // Core — all roles
  { label: 'Dashboard',          path: '/dashboard',            icon: LayoutDashboard,  roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'Projects',           path: '/projects',             icon: FolderKanban,     roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'My Tasks',           path: '/my-tasks',             icon: CheckSquare,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },
  { label: 'Calendar',           path: '/calendar',             icon: Calendar,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },

  // PM — project_manager + division_admin + admin
  { label: 'Sprints',            path: '/sprints',              icon: Target,           roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Team',               path: '/team',                 icon: Users,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Time Tracking',      path: '/time-tracking',        icon: Clock,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'], section: 'pm' },
  { label: 'Reports',            path: '/reports',              icon: BarChart3,        roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Advanced Reports',   path: '/reports/advanced',     icon: PieChart,         roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Capacity Planning',  path: '/capacity',             icon: Users2,           roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'pm' },
  { label: 'Project Tracking',   path: '/project-tracking',     icon: Gauge,            roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive','viewer'], section: 'pm' },
  { label: 'AI Features',        path: '/ai',                   icon: Sparkles,         roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Gantt Timeline',     path: '/gantt',                icon: GanttChartSquare, roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'pm' },
  { label: 'Workflow Monitor',   path: '/workflow/monitor',     icon: MonitorCheck,     roles: ['org_admin','division_admin','vertical_head','project_manager','executive'], section: 'pm' },
  // Executive — executive + admin
  { label: 'Executive View',     path: '/executive',            icon: Crown,            roles: ['org_admin','executive'], section: 'executive' },
  { label: 'OKR & Goals',        path: '/executive/okrs',       icon: Target,           roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Financial Dashboard',path: '/executive/financial',  icon: DollarSign,       roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Resource Dashboard', path: '/executive/resources',  icon: Users2,           roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Roadmap',            path: '/roadmap',              icon: Map,              roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive','viewer'], section: 'executive' },
  { label: 'Status Reports',     path: '/status-reports',       icon: ClipboardCheck,   roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },
  { label: 'Risk Register',      path: '/risk-register',        icon: AlertTriangle,    roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },
  { label: 'Portfolio',          path: '/portfolio',            icon: Briefcase,        roles: ['org_admin','executive'], section: 'executive' },

  // Admin — org_admin + division_admin (scoped)
  { label: 'Admin Dashboard',    path: '/admin/dashboard',      icon: LayoutGrid,       roles: ['org_admin'], section: 'admin' },
  { label: 'Roles & Permissions',path: '/admin/roles',          icon: KeyRound,         roles: ['org_admin'], section: 'admin' },
  { label: 'Division Config',    path: '/admin/division-config',icon: Building2,        roles: ['org_admin','division_admin'], section: 'admin' },
  { label: 'Division MIS',       path: '/admin/division-mis',   icon: BarChart2,        roles: ['org_admin','division_admin'], section: 'admin' },
  { label: 'Handoff Panel',      path: '/admin/handoff',        icon: ClipboardCheck,   roles: ['org_admin'], section: 'admin' },
  { label: 'User Management',    path: '/admin/users',          icon: Shield,           roles: ['org_admin'], section: 'admin' },
  { label: 'Workflows',          path: '/admin/workflows',      icon: Workflow,         roles: ['org_admin'], section: 'admin' },
  { label: 'Issue Types',        path: '/admin/issue-types',    icon: Layers,           roles: ['org_admin'], section: 'admin' },
  { label: 'Task Templates',     path: '/admin/templates',      icon: ClipboardList,    roles: ['org_admin','division_admin','project_manager','team_lead'], section: 'admin' },
  { label: 'Custom Fields',      path: '/admin/custom-fields',  icon: FormInput,        roles: ['org_admin'], section: 'admin' },
  { label: 'Divisions',          path: '/admin/divisions',      icon: Building2,        roles: ['org_admin'], section: 'admin' },
  { label: 'Verticals',          path: '/admin/verticals',      icon: Network,          roles: ['org_admin','division_admin','vertical_head'], section: 'admin' },
  { label: 'Permission Matrix',  path: '/admin/permissions',    icon: ShieldCheck,      roles: ['org_admin'], section: 'admin' },
  { label: 'External Users',     path: '/admin/external-users', icon: UserPlus,         roles: ['org_admin'], section: 'admin' },
  { label: 'Approvals',          path: '/admin/approvals',      icon: CheckCircle,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'admin' },
  { label: 'Forms',              path: '/admin/forms',          icon: FileText,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'admin' },
  { label: 'Versioning',         path: '/admin/versioning',     icon: History,          roles: ['org_admin'], section: 'admin' },
  { label: 'Exports',            path: '/admin/exports',        icon: Download,         roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'admin' },
  { label: 'Audit Log',          path: '/admin/audit-log',      icon: Activity,         roles: ['org_admin','division_admin','vertical_head'], section: 'admin' },
  { label: 'Integrations',       path: '/settings/integrations',icon: Plug,             roles: ['org_admin','project_manager','member'], section: 'admin' },
  { label: 'Feature Flags',      path: '/admin/feature-flags',  icon: Zap,              roles: ['org_admin'], section: 'admin' },
  { label: 'Onboarding Wizard',  path: '/admin/onboarding',     icon: Network,          roles: ['org_admin'], section: 'admin' },
  { label: 'Settings',           path: '/settings',             icon: Settings,         roles: ['org_admin'], section: 'admin' },
  { label: 'Governance',         path: '/workflow/governance',  icon: ShieldCheck,      roles: ['org_admin','executive'], section: 'admin' },
  { label: 'Gov. Dashboard',     path: '/governance',           icon: TrendingUp,       roles: ['org_admin','division_admin','executive'], section: 'admin' },
  { label: 'Project Closure',    path: '/governance/closure',   icon: Lock,             roles: ['org_admin','division_admin','project_manager'], section: 'admin' },
  { label: 'Training Guide',     path: '/workflow/training',    icon: BookOpen,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive','member'], section: 'admin' },
];

const SECTIONS: Record<string, { label: string; roles: OrgRole[] }> = {
  core:      { label: 'Workspace',    roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'] },
  pm:        { label: 'Project Mgmt', roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member'] },
  executive: { label: 'Executive',    roles: ['org_admin','executive'] },
  admin:     { label: 'Admin',        roles: ['org_admin','division_admin','vertical_head'] },
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole, user } = useAuthStore();

  const visibleItems = navItems.filter(
    (item) => currentRole && item.roles.includes(currentRole)
  );

  const sectionOrder = ['core', 'pm', 'executive', 'admin'];
  const grouped = sectionOrder
    .map((sec) => ({
      section: sec,
      meta: SECTIONS[sec],
      items: visibleItems.filter((i) => i.section === sec),
    }))
    .filter((g) => g.items.length > 0);

  const ROLE_LABELS: Record<string, string> = {
    org_admin: 'System Admin', division_admin: 'Division Admin',
    vertical_head: 'Vertical Head', project_manager: 'Project Lead',
    team_lead: 'Team Lead', member: 'Project Team Member',
    executive: 'Leadership', viewer: 'Others',
  };

  const displayName = user
    ? `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim()
    : 'User';

  // Fixed-position tooltip state (escapes overflow clipping)
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const showTooltip = useCallback((e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Sidebar dark navy color tokens (inline for full JIT safety)
  const sidebarBg    = 'hsl(215 60% 14%)';   // #0D2345
  const sidebarHover = 'hsl(215 60% 20%)';   // #152F59
  const activeBg     = 'hsl(215 60% 22%)';   // #183366
  const activeBorder = 'hsl(200 88% 52%)';   // sky blue
  const inactiveText = 'hsl(215 30% 65%)';   // #8BA4C4
  const sectionLabel = 'hsl(215 20% 50%)';   // #617899
  const dividerColor = 'hsl(215 60% 20%)';   // subtle white/navy

  return (
    <aside
      style={{ background: sidebarBg }}
      className={cn(
        'flex flex-col h-screen transition-all duration-200 overflow-hidden flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Logo / Branding ── */}
      <div
        style={{ borderBottomColor: 'hsl(215 60% 20%)' }}
        className="flex h-[60px] items-center gap-3 px-4 flex-shrink-0 border-b"
      >
        {/* QF logo with orange dot */}
        <div className="relative flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white font-bold text-sm">
            QF
          </div>
          <div
            style={{
              background: activeBorder,
              borderColor: sidebarBg,
            }}
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <span className="block text-white font-semibold text-sm leading-tight">
              Q-Flow
            </span>
            <p className="text-[10px] text-white/40 mt-0 leading-tight">
              Quality Council of India
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {grouped.map(({ section, meta, items }, groupIdx) => (
          <div key={section}>
            {/* Section divider (not before first section) */}
            {groupIdx > 0 && (
              <div
                style={{ borderTopColor: dividerColor }}
                className="border-t mx-1 mb-3"
              />
            )}

            {/* Section label */}
            {!collapsed && (
              <p
                style={{ color: sectionLabel }}
                className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest select-none"
              >
                {meta.label}
              </p>
            )}

            <div className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group whitespace-nowrap',
                      isActive
                        ? 'text-white border-l-[3px] pl-[calc(0.75rem-3px)]'
                        : 'border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]',
                      collapsed && 'justify-center pl-2 border-l-0'
                    )
                  }
                  style={({ isActive }) => ({
                    background: isActive ? activeBg : undefined,
                    borderLeftColor: isActive ? activeBorder : 'transparent',
                    color: isActive ? 'white' : inactiveText,
                  })}
                  onMouseEnter={(e) => {
                    showTooltip(e, item.label);
                    const el = e.currentTarget;
                    const active = el.getAttribute('aria-current') === 'page';
                    if (!active) {
                      el.style.background = sidebarHover;
                      el.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    hideTooltip();
                    const el = e.currentTarget;
                    const active = el.getAttribute('aria-current') === 'page';
                    if (!active) {
                      el.style.background = '';
                      el.style.color = inactiveText;
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User info strip ── */}
      {!collapsed && (
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            background: isActive ? 'hsl(215 60% 15%)' : 'hsl(215 60% 11%)',
            borderTopColor: dividerColor,
          })}
          className="border-t px-3 py-2.5 flex-shrink-0 block hover:opacity-90 transition-opacity"
          title="View my profile"
        >
          <p className="text-xs font-semibold text-white/80 truncate">{displayName}</p>
          <p style={{ color: sectionLabel }} className="text-[10px] capitalize truncate">
            {ROLE_LABELS[currentRole || ''] || currentRole?.replace(/_/g, ' ')}
          </p>
        </NavLink>
      )}

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'hsl(215 60% 11%)',
          borderTopColor: dividerColor,
          color: inactiveText,
        }}
        className="flex h-10 items-center justify-center border-t flex-shrink-0 hover:text-white transition-colors duration-150"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = sidebarHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(215 60% 11%)'; }}
      >
        {collapsed
          ? <ChevronRight className="h-4 w-4" />
          : <ChevronLeft className="h-4 w-4" />
        }
      </button>

      {/* Fixed-position tooltip — escapes overflow:hidden */}
      {tooltip && (
        <div
          className="fixed z-[500] pointer-events-none px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shadow-xl -translate-y-1/2"
          style={{
            top: tooltip.top,
            left: collapsed ? 72 : 272,
            background: 'hsl(215 80% 18%)',
            color: 'white',
            border: '1px solid hsl(215 60% 32%)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </aside>
  );
}
