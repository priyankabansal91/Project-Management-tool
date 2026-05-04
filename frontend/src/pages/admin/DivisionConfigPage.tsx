import { useState } from 'react';
import { useAllDivisionConfigs, useUpdateDivisionConfig, useDivisionMembers, useAddDivisionMember, useRemoveDivisionMember, useWorkflows } from '@/api/hooks';
import type { WorkflowConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Shield, Check, X, ChevronDown, ChevronRight,
  Clock, Calendar, Zap, BarChart3, DollarSign, Target, FileText, CheckCircle,
  Download, Brain, Loader2, UserPlus, Trash2, Crown, Briefcase, UserCheck, Eye,
  Workflow, LayoutGrid, FolderKanban, Timer, ClipboardCheck, FormInput,
  Gauge, BookOpen, Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Feature definitions ─────────────────────────────────

const FEATURES = [
  { key: 'timeTracking',      label: 'Time Tracking',       icon: Clock,       description: 'Members can log hours against tasks' },
  { key: 'sprints',           label: 'Sprints',             icon: Target,      description: 'Sprint planning, backlog, burndown charts' },
  { key: 'calendar',          label: 'Calendar View',       icon: Calendar,    description: 'Task calendar and scheduling' },
  { key: 'ai',                label: 'AI Features',         icon: Brain,       description: 'Claude-powered task generation & reports' },
  { key: 'exports',           label: 'Data Exports',        icon: Download,    description: 'Export tasks, reports, and data' },
  { key: 'financialDashboard',label: 'Financial Dashboard', icon: DollarSign,  description: 'Budget tracking, ROI, cost analysis' },
  { key: 'okrDashboard',      label: 'OKR Dashboard',       icon: Target,      description: 'Goals, key results, and alignment' },
  { key: 'resourceDashboard', label: 'Resource Dashboard',  icon: Users,       description: 'Capacity planning and skill matrix' },
  { key: 'approvals',         label: 'Approvals',           icon: CheckCircle, description: 'Multi-step approval workflows' },
  { key: 'forms',             label: 'Forms & Intake',      icon: FileText,    description: 'Intake forms for requests' },
];

// ─── Module definitions ───────────────────────────────────

const MODULES = [
  {
    id: 'projects',
    label: 'Projects & Tasks',
    icon: FolderKanban,
    description: 'Core project and task management (always enabled)',
    core: true,
  },
  {
    id: 'time_tracking',
    label: 'Time Tracking',
    icon: Timer,
    description: 'Log hours, timesheets, and weekly summaries',
    core: false,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ClipboardCheck,
    description: 'Multi-step approval workflows for tasks and documents',
    core: false,
  },
  {
    id: 'forms_templates',
    label: 'Forms & Templates',
    icon: FormInput,
    description: 'Intake forms, task templates, and structured submissions',
    core: false,
  },
  {
    id: 'sprint_management',
    label: 'Sprint Management',
    icon: Gauge,
    description: 'Agile sprints, backlog, and burndown charts',
    core: false,
  },
  {
    id: 'reports_mis',
    label: 'Reports & MIS',
    icon: BarChart3,
    description: 'Analytics, executive reports, and data exports',
    core: false,
  },
  {
    id: 'resource_planning',
    label: 'Resource Planning',
    icon: Boxes,
    description: 'Capacity planning, skill matrix, and resource allocation',
    core: false,
  },
  {
    id: 'documents_files',
    label: 'Documents / Files',
    icon: BookOpen,
    description: 'File attachments, document versioning, and storage',
    core: false,
  },
];

const ROLE_OVERRIDES = [
  { role: 'project_manager', label: 'Project Manager', actions: ['task_delete', 'project_create', 'project_delete', 'member_invite', 'report_download', 'export_data'] },
  { role: 'member',          label: 'Team Member',     actions: ['task_delete', 'task_assign', 'comment_delete', 'time_edit', 'report_view', 'report_download'] },
  { role: 'viewer',          label: 'Viewer',          actions: ['report_download', 'export_data', 'comment_add'] },
];

const ACTION_LABELS: Record<string, string> = {
  task_delete: 'Delete tasks', task_assign: 'Assign tasks', project_create: 'Create projects',
  project_delete: 'Delete projects', member_invite: 'Invite members', report_download: 'Download reports',
  export_data: 'Export data', comment_delete: 'Delete comments', time_edit: 'Edit time logs',
  report_view: 'View reports', comment_add: 'Add comments',
};

const ROLE_ICONS: Record<string, any> = {
  org_admin: Crown, division_admin: Briefcase, project_manager: Briefcase, member: UserCheck, viewer: Eye,
};

const DIVISION_COLORS: Record<string, string> = {
  div_engineering: 'bg-blue-100 text-blue-700 border-blue-200',
  div_sales: 'bg-green-100 text-green-700 border-green-200',
  div_hr: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

// ─── Feature Toggle Section ───────────────────────────────

function FeatureToggles({ divisionId, features, onChange }: { divisionId: string; features: Record<string, boolean>; onChange: (key: string, val: boolean) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {FEATURES.map((f) => {
        const Icon = f.icon;
        const enabled = features[f.key] ?? true;
        return (
          <div key={f.key} className={cn('flex items-center gap-3 rounded-lg border p-3 transition-colors', enabled ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20')}>
            <div className={cn('rounded-lg p-2', enabled ? 'bg-primary/10' : 'bg-muted')}>
              <Icon className={cn('h-4 w-4', enabled ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium', !enabled && 'text-muted-foreground')}>{f.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{f.description}</p>
            </div>
            <button
              onClick={() => onChange(f.key, !enabled)}
              className={cn('relative h-6 w-11 rounded-full transition-colors flex-shrink-0 overflow-hidden', enabled ? 'bg-primary' : 'bg-muted-foreground/30')}
              title={enabled ? 'Click to disable' : 'Click to enable'}
            >
              <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200', enabled ? 'translate-x-5' : 'translate-x-0')} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Role Overrides Section ───────────────────────────────

function RoleOverridesSection({ overrides, onChange }: { overrides: Record<string, Record<string, boolean>>; onChange: (role: string, action: string, val: boolean) => void }) {
  const [expanded, setExpanded] = useState<string | null>('member');
  return (
    <div className="space-y-2">
      {ROLE_OVERRIDES.map((r) => {
        const roleOverrides = overrides[r.role] || {};
        const restrictedCount = r.actions.filter((a) => roleOverrides[a] === false).length;
        return (
          <div key={r.role} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === r.role ? null : r.role)}
              className="flex w-full items-center gap-3 bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              {expanded === r.role ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="text-sm font-semibold">{r.label}</span>
              {restrictedCount > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto">{restrictedCount} restricted</Badge>
              )}
            </button>
            {expanded === r.role && (
              <div className="grid grid-cols-2 gap-2 p-3">
                {r.actions.map((action) => {
                  const allowed = roleOverrides[action] !== false;
                  return (
                    <button
                      key={action}
                      onClick={() => onChange(r.role, action, !allowed)}
                      className={cn('flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors', allowed ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800')}
                    >
                      {allowed ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      <span className="text-xs">{ACTION_LABELS[action]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Members Section ─────────────────────────────────────

function DivisionMembersSection({ divisionId }: { divisionId: string }) {
  const { data: members, isLoading } = useDivisionMembers(divisionId);
  const addMember = useAddDivisionMember();
  const removeMember = useRemoveDivisionMember();
  const [showAdd, setShowAdd] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('member');

  const DEV_USERS = [
    { id: 'dev-org_admin-id', name: 'Priya Sharma', email: 'priya.sharma@qcin.org' },
    { id: 'dev-division_admin-id', name: 'Rahul Mehta', email: 'rahul.mehta@qcin.org' },
    { id: 'dev-project_manager-id', name: 'Anjali Singh', email: 'anjali.singh@qcin.org' },
    { id: 'dev-member-id', name: 'Ravi Kumar', email: 'ravi.kumar@qcin.org' },
    { id: 'dev-viewer-id', name: 'Sneha Patel', email: 'sneha.patel@qcin.org' },
    { id: 'dev-executive-id', name: 'Vikram Nair', email: 'vikram.nair@qcin.org' },
  ];

  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{(members || []).length} members</p>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}>
          <UserPlus className="h-3.5 w-3.5 mr-1" /> Add Member
        </Button>
      </div>

      {showAdd && (
        <div className="flex gap-2 p-3 border rounded-lg bg-muted/20">
          <select value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="flex-1 text-sm border rounded px-2 py-1.5 bg-background">
            <option value="">Select user...</option>
            {DEV_USERS.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="text-sm border rounded px-2 py-1.5 bg-background">
            <option value="project_manager">Project Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
            <option value="division_admin">Division Admin</option>
          </select>
          <Button size="sm" disabled={!newUserId || addMember.isPending} onClick={async () => {
            await addMember.mutateAsync({ divisionId, userId: newUserId, role: newRole });
            setShowAdd(false); setNewUserId(''); setNewRole('member');
          }}>Add</Button>
        </div>
      )}

      <div className="divide-y border rounded-lg overflow-hidden">
        {(members || []).map((m: any) => {
          const RoleIcon = ROLE_ICONS[m.role] || UserCheck;
          return (
            <div key={m.userId} className="flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-muted/20">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                {m.name?.charAt(0) || m.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name || m.email}</p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <span className="flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-full">
                <RoleIcon className="h-3 w-3" />{m.role.replace('_', ' ')}
              </span>
              <button onClick={() => removeMember.mutate({ divisionId, userId: m.userId })} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {(members || []).length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No members assigned to this division yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Workflow Section ─────────────────────────────────────

function WorkflowSection({ selectedId, onChange }: { selectedId: string | null; onChange: (id: string) => void }) {
  const { data: workflows, isLoading } = useWorkflows();
  if (isLoading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Choose the default workflow template for new projects in this division.
      </p>
      <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {(workflows || []).map((wf: WorkflowConfig) => {
          const isSelected = selectedId === wf.id;
          return (
            <button
              key={wf.id}
              onClick={() => onChange(wf.id)}
              className={cn(
                'text-left rounded-lg border p-3 transition-all hover:border-primary/50',
                isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-muted/10'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold">{wf.name}</p>
                  <p className="text-[11px] text-muted-foreground">{wf.description}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
              </div>
              <div className="flex flex-wrap gap-1">
                {(wf.statuses || []).map((s) => (
                  <span
                    key={s.id}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Module Access Section ────────────────────────────────

function ModuleAccessSection({
  enabledModules,
  onChange,
}: {
  enabledModules: string[];
  onChange: (modules: string[]) => void;
}) {
  const toggle = (moduleId: string, enabled: boolean) => {
    if (enabled) {
      onChange([...enabledModules, moduleId]);
    } else {
      onChange(enabledModules.filter((m) => m !== moduleId));
    }
  };

  const enabledCount = enabledModules.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Choose which modules are accessible to members of this division.
        <strong> Projects &amp; Tasks</strong> is always on as the core module.
      </p>
      <div className="text-xs text-muted-foreground font-medium">
        {enabledCount} / {MODULES.length} modules enabled
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const enabled = mod.core || enabledModules.includes(mod.id);
          return (
            <div
              key={mod.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                enabled ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/20',
                mod.core && 'opacity-80'
              )}
            >
              <div className={cn('rounded-lg p-2 flex-shrink-0', enabled ? 'bg-primary/10' : 'bg-muted')}>
                <Icon className={cn('h-4 w-4', enabled ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', !enabled && 'text-muted-foreground')}>
                  {mod.label}
                  {mod.core && (
                    <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Core
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{mod.description}</p>
              </div>
              <button
                disabled={mod.core}
                onClick={() => toggle(mod.id, !enabled)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors flex-shrink-0 overflow-hidden',
                  enabled ? 'bg-primary' : 'bg-muted-foreground/30',
                  mod.core ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                )}
                title={mod.core ? 'Core module — always enabled' : (enabled ? 'Disable module' : 'Enable module')}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Division Card ────────────────────────────────────────

function DivisionCard({ division }: { division: any }) {
  const [activeTab, setActiveTab] = useState<'modules' | 'features' | 'permissions' | 'members' | 'workflow'>('modules');
  const [localConfig, setLocalConfig] = useState({
    features:         division.config?.features         || {},
    roleOverrides:    division.config?.roleOverrides    || {},
    reportAccess:     division.config?.reportAccess     || {},
    workflowTemplate: division.config?.workflowTemplate || null,
    enabled_modules:  division.config?.enabled_modules  || MODULES.map((m) => m.id),
  });
  const [dirty, setDirty] = useState(false);
  const update = useUpdateDivisionConfig();

  const setFeature = (key: string, val: boolean) => {
    setLocalConfig((c: any) => ({ ...c, features: { ...c.features, [key]: val } }));
    setDirty(true);
  };

  const setOverride = (role: string, action: string, val: boolean) => {
    setLocalConfig((c: any) => ({
      ...c,
      roleOverrides: { ...c.roleOverrides, [role]: { ...(c.roleOverrides?.[role] || {}), [action]: val } },
    }));
    setDirty(true);
  };

  const setWorkflowTemplate = (wfId: string) => {
    setLocalConfig((c: any) => ({ ...c, workflowTemplate: wfId }));
    setDirty(true);
  };

  const setEnabledModules = (modules: string[]) => {
    setLocalConfig((c: any) => ({ ...c, enabled_modules: modules }));
    setDirty(true);
  };

  const save = async () => {
    await update.mutateAsync({ divisionId: division.id, config: localConfig });
    setDirty(false);
  };

  const enabledModulesCount = (localConfig.enabled_modules || []).length;
  const colorClass = DIVISION_COLORS[division.id] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <Card className="overflow-hidden">
      {/* Division header */}
      <div className={cn('px-5 py-4 border-b', colorClass.split(' ').map(c => c.replace('text-', 'bg-').replace('700', '50')).join(' '))}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-xl p-2.5 border', colorClass)}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{division.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{division.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('text-[11px] font-semibold rounded-full px-2.5 py-1 border', colorClass)}>
              {enabledModulesCount}/{MODULES.length} modules on
            </span>
            {division.budget && (
              <span className="text-[11px] text-muted-foreground">Budget: ₹{(division.budget / 100000).toFixed(1)}L</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {([
          { key: 'modules',      label: 'Modules',      icon: LayoutGrid },
          { key: 'features',     label: 'Features',     icon: Zap },
          { key: 'permissions',  label: 'Permissions',  icon: Shield },
          { key: 'workflow',     label: 'Workflow',     icon: Workflow },
          { key: 'members',      label: 'Members',      icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap', activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      <CardContent className="pt-4">
        {activeTab === 'modules' && (
          <ModuleAccessSection
            enabledModules={localConfig.enabled_modules || []}
            onChange={setEnabledModules}
          />
        )}
        {activeTab === 'features' && (
          <FeatureToggles divisionId={division.id} features={localConfig.features || {}} onChange={setFeature} />
        )}
        {activeTab === 'permissions' && (
          <RoleOverridesSection overrides={localConfig.roleOverrides || {}} onChange={setOverride} />
        )}
        {activeTab === 'workflow' && (
          <WorkflowSection selectedId={localConfig.workflowTemplate} onChange={setWorkflowTemplate} />
        )}
        {activeTab === 'members' && (
          <DivisionMembersSection divisionId={division.id} />
        )}

        {dirty && activeTab !== 'members' && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                setLocalConfig({
                  features:         division.config?.features         || {},
                  roleOverrides:    division.config?.roleOverrides    || {},
                  reportAccess:     division.config?.reportAccess     || {},
                  workflowTemplate: division.config?.workflowTemplate || null,
                  enabled_modules:  division.config?.enabled_modules  || MODULES.map((m) => m.id),
                });
                setDirty(false);
              }}>Discard</Button>
              <Button size="sm" onClick={save} disabled={update.isPending}>
                {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Save Configuration
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────

export function DivisionConfigPage() {
  const { data: divisions, isLoading } = useAllDivisionConfigs();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Division Configuration
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure features, permissions, and members for each division. Changes apply immediately to that division's users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {(divisions || []).map((division: any) => (
          <DivisionCard key={division.id} division={division} />
        ))}
      </div>

      {(!divisions || divisions.length === 0) && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No divisions configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create divisions in the Divisions section first.</p>
        </div>
      )}
    </div>
  );
}
