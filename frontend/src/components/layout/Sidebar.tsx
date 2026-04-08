import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, BarChart3,
  Workflow, FormInput, Shield, ListTodo, Bell, ChevronLeft, ChevronRight, Plug,
  Zap, Calendar, Clock, Target,
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
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['org_admin', 'project_manager', 'member', 'viewer'] },
  { label: 'Projects', path: '/projects', icon: FolderKanban, roles: ['org_admin', 'project_manager', 'member', 'viewer'] },
  { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare, roles: ['org_admin', 'project_manager', 'member', 'viewer'] },
  { label: 'Calendar', path: '/calendar', icon: Calendar, roles: ['org_admin', 'project_manager', 'member', 'viewer'] },
  { label: 'Sprints', path: '/sprints', icon: Target, roles: ['org_admin', 'project_manager'] },
  { label: 'Team', path: '/team', icon: Users, roles: ['org_admin', 'project_manager'] },
  { label: 'Time Tracking', path: '/time-tracking', icon: Clock, roles: ['org_admin', 'project_manager', 'member'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['org_admin', 'project_manager'] },
  { label: 'Workflows', path: '/admin/workflows', icon: Workflow, roles: ['org_admin'] },
  { label: 'Custom Fields', path: '/admin/custom-fields', icon: FormInput, roles: ['org_admin'] },
  { label: 'User Management', path: '/admin/users', icon: Shield, roles: ['org_admin'] },
  { label: 'Integrations', path: '/settings/integrations', icon: Plug, roles: ['org_admin', 'project_manager', 'member'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['org_admin'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentRole } = useAuthStore();

  const visibleItems = navItems.filter((item) => currentRole && item.roles.includes(currentRole));

  return (
    <aside className={cn('flex flex-col border-r bg-card transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">PF</div>
        {!collapsed && <span className="text-lg font-semibold">ProjectFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
