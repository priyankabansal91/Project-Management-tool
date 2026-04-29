import { useAuthStore } from '@/store/authStore';
import { useFeatureFlagsStore } from '@/store/featureFlagsStore';
import { hasRolePermission } from '@/components/shared/PermissionGate';
import type { OrgRole } from '@/types';

/** Check if current user has a specific permission string (e.g. 'task:delete') */
export function usePermission(permission: string): boolean {
  const { currentRole } = useAuthStore();
  return hasRolePermission(currentRole as OrgRole, permission);
}

/** Check if a feature module is enabled for the current user's role */
export function useFeature(featureKey: string): boolean {
  const { currentRole } = useAuthStore();
  const { isEnabled } = useFeatureFlagsStore();
  return isEnabled(featureKey, currentRole as OrgRole);
}

/** Check both: role permission AND feature flag enabled */
export function useCanAccess(featureKey: string, permission?: string): boolean {
  const { currentRole } = useAuthStore();
  const { isEnabled } = useFeatureFlagsStore();
  const featureOn = isEnabled(featureKey, currentRole as OrgRole);
  const permOk = permission ? hasRolePermission(currentRole as OrgRole, permission) : true;
  return featureOn && permOk;
}

/** Returns the current user's role */
export function useCurrentRole(): OrgRole | null {
  return useAuthStore((s) => s.currentRole) as OrgRole | null;
}
