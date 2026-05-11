import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlagsStore, DEFAULT_FEATURES } from '@/store/featureFlagsStore';
import type { OrgRole } from '@/types';
import {
  RotateCcw, Shield, Zap, BarChart3, Users, Crown, Settings2,
  Check, X, Lock, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES: { key: OrgRole; label: string; color: string; bg: string }[] = [
  { key: 'org_admin',       label: 'System Admin',    color: 'text-red-600',    bg: 'bg-red-50'    },
  { key: 'division_admin',  label: 'Div Admin',       color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'project_manager', label: 'Project Lead',    color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { key: 'member',          label: 'Team Member',     color: 'text-green-600',  bg: 'bg-green-50'  },
  { key: 'executive',       label: 'Leadership',      color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'viewer',          label: 'Others',          color: 'text-gray-600',   bg: 'bg-gray-50'   },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Core: Shield, PM: Zap, Executive: Crown, Admin: Settings2,
};

const CATEGORY_COLORS: Record<string, string> = {
  Core: 'text-blue-600', PM: 'text-green-600', Executive: 'text-purple-600', Admin: 'text-red-600',
};

export function FeatureFlagsPage() {
  const { features, toggleRoleAccess, setFeatures, resetToDefaults } = useFeatureFlagsStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const categories = [...new Set(DEFAULT_FEATURES.map((f) => f.category))];

  const nonCoreFeatures = features.filter((f) => !f.isCore);

  const handleToggle = (featureKey: string, role: OrgRole) => {
    if (role === 'org_admin') return;
    toggleRoleAccess(featureKey, role);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const enableAllForRole = (role: OrgRole) => {
    if (role === 'org_admin') return;
    setFeatures(features.map((f) => {
      if (f.isCore || f.enabledForRoles.includes(role)) return f;
      return { ...f, enabledForRoles: [...f.enabledForRoles, role] };
    }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const disableAllForRole = (role: OrgRole) => {
    if (role === 'org_admin') return;
    setFeatures(features.map((f) => {
      if (f.isCore) return f;
      return { ...f, enabledForRoles: f.enabledForRoles.filter((r) => r !== role) };
    }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleReset = () => {
    resetToDefaults();
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control which features are visible and accessible for each role. Changes take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedFlash && (
            <span className="text-sm text-green-600 flex items-center gap-1 font-medium">
              <Check className="h-4 w-4" /> Auto-saved
            </span>
          )}
          {!confirmReset ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset to Defaults
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-destructive font-medium">Reset all?</span>
              <Button size="sm" variant="destructive" onClick={handleReset}>Yes, reset</Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4 text-sm text-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p><span className="font-medium">System Admin</span> always has full access to all features — that column cannot be changed.</p>
          <p>Core features <Lock className="h-3 w-3 inline mx-1" aria-hidden /> cannot be disabled for any role.</p>
          <p className="font-medium">To change access: click any colored circle to toggle on/off, or use the <span className="text-emerald-700 dark:text-emerald-400">All On</span> / <span className="text-red-700 dark:text-red-400">All Off</span> buttons in each role column header.</p>
          <p className="text-xs opacity-75">Changes are auto-saved instantly. Use "Reset to Defaults" to restore original settings.</p>
        </div>
      </div>

      {/* Matrix by category */}
      {categories.map((category) => {
        const catFeatures = features.filter((f) => f.category === category);
        const Icon = CATEGORY_ICONS[category] || Settings2;
        const colorClass = CATEGORY_COLORS[category] || 'text-gray-600';

        return (
          <Card key={category} className="overflow-hidden">
            <CardHeader className="py-3 px-5 bg-muted/30 border-b">
              <CardTitle className={cn('text-base flex items-center gap-2', colorClass)}>
                <Icon className="h-4 w-4" /> {category} Features
              </CardTitle>
              <CardDescription className="text-xs">{catFeatures.length} features in this category</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Role header row */}
              <div className="grid grid-cols-[220px_repeat(6,1fr)] border-b bg-muted/20 text-xs font-semibold text-muted-foreground">
                <div className="px-4 py-2.5">Feature</div>
                {ROLES.map((r) => {
                  const isOrgAdminCol = r.key === 'org_admin';
                  return (
                    <div key={r.key} className={cn('px-2 py-2 text-center', r.bg)}>
                      <span className={cn('font-semibold block mb-1', r.color)}>{r.label}</span>
                      {!isOrgAdminCol && (
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => enableAllForRole(r.key)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium"
                            title={`Enable all features for ${r.label}`}
                          >All On</button>
                          <button
                            onClick={() => disableAllForRole(r.key)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
                            title={`Disable all non-core features for ${r.label}`}
                          >All Off</button>
                        </div>
                      )}
                      {isOrgAdminCol && (
                        <span className="text-[9px] text-muted-foreground">Always on</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Feature rows */}
              {catFeatures.map((feature, idx) => (
                <div
                  key={feature.key}
                  className={cn(
                    'grid grid-cols-[220px_repeat(6,1fr)] items-center border-b last:border-0 hover:bg-muted/10 transition-colors',
                    idx % 2 === 0 ? '' : 'bg-muted/5'
                  )}
                >
                  {/* Feature name */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{feature.label}</span>
                      {feature.isCore && (
                        <span title="Core feature — cannot be disabled"><Lock className="h-3 w-3 text-muted-foreground" /></span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{feature.description}</p>
                  </div>

                  {/* Toggle cells per role */}
                  {ROLES.map((r) => {
                    const isOrgAdmin = r.key === 'org_admin';
                    const isEnabled = isOrgAdmin || feature.enabledForRoles.includes(r.key);
                    const isLocked = feature.isCore || isOrgAdmin;

                    return (
                      <div key={r.key} className="flex justify-center py-3 px-2">
                        <button
                          disabled={isLocked}
                          onClick={() => handleToggle(feature.key, r.key)}
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center transition-all border-2',
                            isLocked
                              ? 'cursor-default opacity-75'
                              : 'cursor-pointer hover:scale-110 hover:shadow-md',
                            isEnabled
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-card border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/50'
                          )}
                          title={isOrgAdmin ? 'System Admin always has access' : isLocked ? 'Core feature — cannot be changed' : isEnabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}
                        >
                          {isEnabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Summary stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ROLES.map((r) => {
            const count = features.filter((f) =>
              r.key === 'org_admin' || f.enabledForRoles.includes(r.key)
            ).length;
            return (
              <div key={r.key} className={cn('rounded-lg p-3 text-center', r.bg)}>
                <p className={cn('text-2xl font-bold', r.color)}>{count}</p>
                <p className={cn('text-xs font-medium mt-0.5', r.color)}>{r.label}</p>
                <p className="text-[10px] text-muted-foreground">{count}/{features.length} features</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
