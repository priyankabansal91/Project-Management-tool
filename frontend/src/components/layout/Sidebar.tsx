import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, BarChart3,
  Workflow, FormInput, Shield, Bell, ChevronLeft, ChevronRight, Plug,
  Calendar, Clock, Target, Sparkles, Activity, Layers, ClipboardList, PieChart,
  Building2, KeyRound, UserPlus, History, Download, CheckCircle, FileText, Gauge,
  Crown, Map, ClipboardCheck, AlertTriangle, DollarSign, Users2,
  LayoutGrid, Lock, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
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
  { label: 'Dashboard',         path: '/dashboard',           icon: LayoutDashboard, roles: ['org_admin','division_admin','project_manager','member','viewer','executive'], section: 'core' },
  { label: 'Projects',          path: '/projects',            icon: FolderKanban,    roles: ['org_admin','division_admin','project_manager','member','viewer','executive'], section: 'core' },
  { label: 'My Tasks',          path: '/my-tasks',            icon: CheckSquare,     roles: ['org_admin','division_admin','project_manager','member','viewer'], section: 'core' },
  { label: 'Calendar',          path: '/calendar',            icon: Calendar,        roles: ['org_admin','division_admin','project_manager','member','viewer'], section: 'core' },

  // PM — project_manager + division_admin + admin
  { label: 'Sprints',           path: '/sprints',             icon: Target,          roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Team',              path: '/team',                icon: Users,           roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Time Tracking',     path: '/time-tracking',       icon: Clock,           roles: ['org_admin','division_admin','project_manager','member'], section: 'pm' },
  { label: 'Reports',           path: '/reports',             icon: BarChart3,       roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Advanced Reports',  path: '/reports/advanced',    icon: PieChart,        roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Capacity Planning', path: '/capacity',            icon: Users2,          roles: ['org_admin','division_admin','project_manager'], section: 'pm' },
  { label: 'Project Tracking',  path: '/project-tracking',    icon: Gauge,           roles: ['org_admin','division_admin','project_manager','executive','viewer'], section: 'pm' },
  { label: 'AI Features',       path: '/ai',                  icon: Sparkles,        roles: ['org_admin','division_admin','project_manager'], section: 'pm' },

  // Executive — executive + admin
  { label: 'Executive View',    path: '/executive',           icon: Crown,           roles: ['org_admin','executive'], section: 'executive' },
  { label: 'OKR & Goals',       path: '/executive/okrs',      icon: Target,          roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Financial Dashboard',path: '/executive/financial',icon: DollarSign,      roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Resource Dashboard', path: '/executive/resources',icon: Users2,          roles: ['org_admin','executive'], section: 'executive' },
  { label: 'Roadmap',           path: '/roadmap',             icon: Map,             roles: ['org_admin','division_admin','project_manager','executive','viewer'], section: 'executive' },
  { label: 'Status Reports',    path: '/status-reports',      icon: ClipboardCheck,  roles: ['org_admin','division_admin','project_manager','executive'], section: 'executive' },
  { label: 'Risk Register',     path: '/risk-register',       icon: AlertTriangle,   roles: ['org_admin','division_admin','project_manager','executive'], section: 'executive' },
  { label: 'Portfolio',         path: '/portfolio',           icon: Briefcase,       roles: ['org_admin','executive'], section: 'executive' },

  // Admin — org_admin + division_admin (scoped)
  { label: 'Admin Dashboard',   path: '/admin/dashboard',     icon: LayoutGrid,      roles: ['org_admin'], section: 'admin' },
  { label: 'Roles & Permissions',path: '/admin/roles',        icon: KeyRound,        roles: ['org_admin'], section: 'admin' },
  { label: 'Division Config',   path: '/admin/division-config',icon: Building2,      roles: ['org_admin','division_admin'], section: 'admin' },
  { label: 'Handoff Panel',    path: '/admin/handoff',        icon: ClipboardCheck,  roles: ['org_admin'], section: 'admin' },
  { label: 'User Management',   path: '/admin/users',         icon: Shield,          roles: ['org_admin'], section: 'admin' },
  { label: 'Workflows',         path: '/admin/workflows',     icon: Workflow,        roles: ['org_admin'], section: 'admin' },
  { label: 'Issue Types',       path: '/admin/issue-types',   icon: Layers,          roles: ['org_admin'], section: 'admin' },
  { label: 'Task Templates',    path: '/admin/templates',     icon: ClipboardList,   roles: ['org_admin','division_admin','project_manager'], section: 'admin' },
  { label: 'Custom Fields',     path: '/admin/custom-fields', icon: FormInput,       roles: ['org_admin'], section: 'admin' },
  { label: 'Divisions',         path: '/admin/divisions',     icon: Building2,       roles: ['org_admin'], section: 'admin' },
  { label: 'External Users',    path: '/admin/external-users',icon: UserPlus,        roles: ['org_admin'], section: 'admin' },
  { label: 'Approvals',         path: '/admin/approvals',     icon: CheckCircle,     roles: ['org_admin','division_admin','project_manager'], section: 'admin' },
  { label: 'Forms',             path: '/admin/forms',         icon: FileText,        roles: ['org_admin','division_admin','project_manager'], section: 'admin' },
  { label: 'Versioning',        path: '/admin/versioning',    icon: History,         roles: ['org_admin'], section: 'admin' },
  { label: 'Exports',           path: '/admin/exports',       icon: Download,        roles: ['org_admin','division_admin','project_manager'], section: 'admin' },
  { label: 'Audit Log',         path: '/admin/audit-log',     icon: Activity,        roles: ['org_admin','division_admin'], section: 'admin' },
  { label: 'Integrations',      path: '/settings/integrations',icon: Plug,           roles: ['org_admin','project_manager','member'], section: 'admin' },
  { label: 'Settings',          path: '/settings',            icon: Settings,        roles: ['org_admin'], section: 'admin' },
];

const SECTIONS: Record<string, { label: string; color: string; roles: OrgRole[] }> = {
  core:      { label: 'Workspace',    color: 'text-muted-foreground', roles: ['org_admin','division_admin','project_manager','member','viewer','executive'] },
  pm:        { label: 'Project Mgmt', color: 'text-blue-500',         roles: ['org_admin','division_admin','project_manager','member'] },
  executive: { label: 'Executive',    color: 'text-purple-500',       roles: ['org_admin','executive'] },
  admin:     { label: 'Admin',        color: 'text-red-500',          roles: ['org_admin','division_admin'] },
};

const ROLE_ACCENT: Record<string, string> = {
  org_admin:       'border-red-400',
  division_admin:  'border-orange-400',
  project_manager: 'border-blue-400',
  member:          'border-green-400',
  executive:       'border-indigo-400',
  viewer:          'border-purple-400',
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole } = useAuthStore();

  const visibleItems = navItems.filter((item) => currentRole && item.roles.includes(currentRole));

  // Group by section, keeping section order
  const sectionOrder = ['core', 'pm', 'executive', 'admin'];
  const grouped = sectionOrder
    .map((sec) => ({
      section: sec,
      meta: SECTIONS[sec],
      items: visibleItems.filter((i) => i.section === sec),
    }))
    .filter((g) => g.items.length > 0);

  const accentClass = ROLE_ACCENT[currentRole || ''] || 'border-primary';

  return (
    <aside className={cn(
      'flex flex-col h-screen border-r bg-card transition-all duration-200 overflow-hidden border-t-4',
      accentClass,
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b px-4 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">PF</div>
        {!collapsed && <span className="text-base font-semibold truncate">ProjectFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {grouped.map(({ section, meta, items }) => (
          <div key={section}>
            {!collapsed && (
              <p className={cn('px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest', meta.color)}>
                {meta.label}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-11 items-center justify-center border-t text-muted-foreground hover:text-foreground flex-shrink-0"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
