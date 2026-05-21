import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, BarChart3,
  Workflow, FormInput, Shield, Bell, ChevronLeft, ChevronRight, Plug,
  Calendar, Clock, Target, Sparkles, Activity, Layers, ClipboardList, PieChart,
  Building2, KeyRound, UserPlus, History, Download, CheckCircle, FileText, Gauge,
  Crown, Map, ClipboardCheck, AlertTriangle, DollarSign, Users2,
  LayoutGrid, Lock, Briefcase, Zap, GanttChartSquare, Network,
  BarChart2, MonitorCheck, ShieldCheck, BookOpen, TrendingUp, Flag, Star, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useSidebarConfigStore } from '@/store/sidebarConfigStore';
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
  // ── Workspace ─────────────────────────────────────────────────────────────
  { label: 'Dashboard',           path: '/dashboard',             icon: LayoutDashboard,  roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'Projects',            path: '/projects',              icon: FolderKanban,     roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },
  { label: 'My Tasks',            path: '/my-tasks',              icon: CheckSquare,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },
  { label: 'Calendar',            path: '/calendar',              icon: Calendar,         roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'], section: 'core' },
  { label: 'Notifications',       path: '/notifications',         icon: Bell,             roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer','executive'], section: 'core' },

  // ── Hierarchy ─────────────────────────────────────────────────────────────
  { label: 'Divisions',           path: '/admin/divisions',       icon: Building2,        roles: ['org_admin'], section: 'hierarchy' },
  { label: 'Verticals',           path: '/admin/verticals',       icon: Network,          roles: ['org_admin','division_admin','vertical_head'], section: 'hierarchy' },
  { label: 'Org Hierarchy',       path: '/admin/hierarchy',       icon: Layers,           roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], section: 'hierarchy' },
  { label: 'Division Config',     path: '/admin/division-config', icon: Building2,        roles: ['org_admin','division_admin'], section: 'hierarchy' },
  { label: 'Division MIS',        path: '/admin/division-mis',    icon: BarChart2,        roles: ['org_admin','division_admin'], section: 'hierarchy' },

  // ── Project Mgmt ──────────────────────────────────────────────────────────
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

  // ── Approvals ─────────────────────────────────────────────────────────────
  { label: 'Approval Inbox',      path: '/admin/approvals',       icon: CheckCircle,      roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead'], section: 'approvals' },
  { label: 'Gov. Dashboard',      path: '/governance',            icon: TrendingUp,       roles: ['org_admin','division_admin','vertical_head','executive'], section: 'approvals' },
  { label: 'Project Closure',     path: '/governance/closure',    icon: Lock,             roles: ['org_admin','division_admin','vertical_head','project_manager'], section: 'approvals' },
  { label: 'Governance',          path: '/workflow/governance',   icon: ShieldCheck,      roles: ['org_admin','executive'], section: 'approvals' },

  // ── Executive ─────────────────────────────────────────────────────────────
  { label: 'Executive View',      path: '/executive',             icon: Crown,            roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Portfolio',           path: '/portfolio',             icon: Briefcase,        roles: ['org_admin','division_admin','vertical_head','executive'], section: 'executive' },
  { label: 'Financial Dashboard', path: '/executive/financial',   icon: DollarSign,       roles: ['org_admin','division_admin','vertical_head','executive'], section: 'executive' },
  { label: 'Resource Dashboard',  path: '/executive/resources',   icon: Users2,           roles: ['org_admin','division_admin','executive'], section: 'executive' },
  { label: 'Risk Register',       path: '/risk-register',         icon: AlertTriangle,    roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },
  { label: 'Roadmap',             path: '/roadmap',               icon: Map,              roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','executive','viewer'], section: 'executive' },
  { label: 'Status Reports',      path: '/status-reports',        icon: ClipboardCheck,   roles: ['org_admin','division_admin','vertical_head','project_manager','team_lead','executive'], section: 'executive' },

  // ── Admin ─────────────────────────────────────────────────────────────────
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

const SECTIONS: Record<string, { label: string }> = {
  core:       { label: 'Workspace'    },
  hierarchy:  { label: 'Hierarchy'    },
  pm:         { label: 'Project Mgmt' },
  approvals:  { label: 'Approvals'    },
  executive:  { label: 'Executive'    },
  admin:      { label: 'Admin'        },
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole, user } = useAuthStore();
  const { isAdminHidden, toggleFavorite, isFavorite, getFavorites } = useSidebarConfigStore();

  const userId = user?.id ?? 'guest';

  // Items visible to this role and not admin-hidden
  const visibleItems = navItems.filter(
    (item) => currentRole && item.roles.includes(currentRole) && !isAdminHidden(currentRole, item.path)
  );

  // Favourites: ordered list of paths the user has starred
  const favPaths = getFavorites(userId);
  const favItems = favPaths
    .map((p) => visibleItems.find((i) => i.path === p))
    .filter(Boolean) as NavItem[];

  // Regular grouped sections (favorites excluded from their section display)
  const sectionOrder = ['core', 'hierarchy', 'pm', 'approvals', 'executive', 'admin'];
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

  // Fixed-position tooltip
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null);
  const showTooltip = useCallback((e: React.MouseEvent<Element>, label: string) => {
    const rect = (e.currentTarget as Element).getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Sidebar color tokens
  const sidebarBg    = 'hsl(215 60% 14%)';
  const sidebarHover = 'hsl(215 60% 20%)';
  const activeBg     = 'hsl(215 60% 22%)';
  const activeBorder = 'hsl(200 88% 52%)';
  const inactiveText = 'hsl(215 30% 65%)';
  const sectionLabel = 'hsl(215 20% 50%)';
  const dividerColor = 'hsl(215 60% 20%)';
  const favStarActive = 'hsl(43 96% 56%)';  // amber-400

  // Renders a single nav item row (used for both favourites + sections)
  const NavItemRow = ({ item, inFavSection = false }: { item: NavItem; inFavSection?: boolean }) => {
    const isFav = isFavorite(userId, item.path);
    return (
      <div key={item.path} className="relative group/item">
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap',
              isActive ? 'text-white border-l-[3px] pl-[calc(0.75rem-3px)]' : 'border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]',
              collapsed && 'justify-center pl-2 border-l-0',
              !collapsed && 'pr-8' // make room for star button
            )
          }
          style={({ isActive }) => ({
            background: isActive ? activeBg : undefined,
            borderLeftColor: isActive ? (inFavSection ? favStarActive : activeBorder) : 'transparent',
            color: isActive ? 'white' : inactiveText,
          })}
          onMouseEnter={(e) => {
            showTooltip(e, item.label);
            const el = e.currentTarget;
            if (el.getAttribute('aria-current') !== 'page') {
              el.style.background = sidebarHover;
              el.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            hideTooltip();
            const el = e.currentTarget;
            if (el.getAttribute('aria-current') !== 'page') {
              el.style.background = '';
              el.style.color = inactiveText;
            }
          }}
        >
          <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-150 group-hover/item:scale-110" />
          {!collapsed && (
            <>
              <span className="truncate flex-1">{item.label}</span>
              {isFav && (
                <Star className="h-3 w-3 flex-shrink-0 ml-auto opacity-60"
                  style={{ color: favStarActive, fill: favStarActive }} />
              )}
            </>
          )}
        </NavLink>

        {/* Star/unstar button — only in expanded mode, visible on hover */}
        {!collapsed && (
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-white/10"
            title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(userId, item.path);
            }}
          >
            <Star
              className="h-3.5 w-3.5 transition-colors"
              style={{
                color: isFav ? favStarActive : inactiveText,
                fill: isFav ? favStarActive : 'none',
              }}
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{ background: sidebarBg }}
      className={cn(
        'flex flex-col h-screen transition-all duration-200 overflow-hidden flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Logo ── */}
      <div style={{ borderBottomColor: dividerColor }} className="flex h-[60px] items-center gap-3 px-4 flex-shrink-0 border-b">
        <div className="relative flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white font-bold text-sm">QF</div>
          <div style={{ background: activeBorder, borderColor: sidebarBg }}
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block text-white font-semibold text-sm leading-tight">Q-Flow</span>
            <p className="text-[10px] text-white/40 mt-0 leading-tight">Quality Council of India</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3" style={{ scrollbarWidth: 'thin' }}>

        {/* Favourites section (only if user has any) */}
        {favItems.length > 0 && (
          <div>
            {!collapsed && (
              <div className="flex items-center gap-1.5 px-3 pb-1.5">
                <Star className="h-2.5 w-2.5" style={{ color: favStarActive, fill: favStarActive }} />
                <p className="text-[10px] font-semibold uppercase tracking-widest select-none"
                  style={{ color: favStarActive }}>
                  Favourites
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              {favItems.map((item) => <NavItemRow key={item.path} item={item} inFavSection />)}
            </div>
            <div style={{ borderTopColor: dividerColor }} className="border-t mx-1 mt-3" />
          </div>
        )}

        {/* Regular sections */}
        {grouped.map(({ section, meta, items }, groupIdx) => (
          <div key={section}>
            {groupIdx > 0 && (
              <div style={{ borderTopColor: dividerColor }} className="border-t mx-1 mb-3" />
            )}
            {!collapsed && (
              <p style={{ color: sectionLabel }}
                className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest select-none">
                {meta.label}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => <NavItemRow key={item.path} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User strip ── */}
      {!collapsed && (
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            background: isActive ? 'hsl(215 60% 15%)' : 'hsl(215 60% 11%)',
            borderTopColor: dividerColor,
          })}
          className="border-t px-3 py-2.5 flex-shrink-0 block hover:opacity-90 transition-opacity"
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
        style={{ background: 'hsl(215 60% 11%)', borderTopColor: dividerColor, color: inactiveText }}
        className="flex h-10 items-center justify-center border-t flex-shrink-0 hover:text-white transition-colors duration-150"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = sidebarHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(215 60% 11%)'; }}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Fixed tooltip */}
      {tooltip && (
        <div className="fixed z-[500] pointer-events-none px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shadow-xl -translate-y-1/2"
          style={{
            top: tooltip.top, left: collapsed ? 72 : 272,
            background: 'hsl(215 80% 18%)', color: 'white',
            border: '1px solid hsl(215 60% 32%)',
          }}>
          {tooltip.label}
        </div>
      )}
    </aside>
  );
}
