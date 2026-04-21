import { Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { OrgRole } from '@/types';
import { cn } from '@/lib/utils';

// Permissions each system role has
const ROLE_PERMISSIONS: Record<OrgRole, string[]> = {
  org_admin: ['*'],
  division_admin: [
    'project:create','project:read','project:update','project:delete','project:manage_members',
    'task:create','task:read','task:update','task:delete','task:assign','task:comment',
    'workflow:create','workflow:read','workflow:update',
    'approval:create','approval:approve','approval:reject',
    'division:read','division:update','division:manage_members',
    'admin:view_audit',
  ],
  project_manager: [
    'project:create','project:read','project:update','project:manage_members',
    'task:create','task:read','task:update','task:delete','task:assign','task:comment',
    'workflow:create','workflow:read','workflow:update',
    'approval:create','approval:approve','approval:reject',
    'division:read','admin:view_audit',
  ],
  member: [
    'project:read','task:create','task:read','task:update','task:comment',
    'workflow:read','approval:create','division:read',
  ],
  executive: ['project:read','task:read','workflow:read','division:read','admin:view_audit'],
  viewer: ['project:read','task:read','workflow:read','division:read'],
};

export function hasRolePermission(role: OrgRole | null, permission: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

interface PermissionGateProps {
  permission?: string;
  roles?: OrgRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  silent?: boolean; // hide entirely instead of showing lock
}

export function PermissionGate({ permission, roles, children, fallback, silent = false }: PermissionGateProps) {
  const { currentRole } = useAuthStore();

  const allowed =
    (roles ? roles.includes(currentRole as OrgRole) : true) &&
    (permission ? hasRolePermission(currentRole as OrgRole, permission) : true);

  if (allowed) return <>{children}</>;
  if (silent) return null;
  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Permission Required</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your current role <span className="font-medium capitalize">{currentRole?.replace('_', ' ')}</span> doesn't have access to this feature.
        </p>
      </div>
    </div>
  );
}

// Inline variant — just grays out and shows a lock icon overlay
export function PermissionShield({ permission, roles, children }: Omit<PermissionGateProps, 'fallback' | 'silent'>) {
  const { currentRole } = useAuthStore();
  const allowed =
    (roles ? roles.includes(currentRole as OrgRole) : true) &&
    (permission ? hasRolePermission(currentRole as OrgRole, permission) : true);

  if (allowed) return <>{children}</>;

  return (
    <div className="relative pointer-events-none select-none">
      <div className="opacity-30">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium border')}>
          <Lock className="h-3 w-3" /> Restricted
        </span>
      </div>
    </div>
  );
}
