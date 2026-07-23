import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { useDivisionHierarchy, useCreateDivision, useUpdateDivision, useDeleteDivision, useMembers } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Users,
  FolderKanban, Crown, Loader2, Network, List, ShieldAlert, ShieldCheck,
  CheckCircle2, Circle, PlayCircle, Settings, PauseCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DIV_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];

const SETUP_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  DRAFT:            { label: 'Draft',            cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  CONFIGURING:      { label: 'Configuring',       cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  PENDING_APPROVAL: { label: 'Pending Approval',  cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  ACTIVE:           { label: 'Active',            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  SUSPENDED:        { label: 'Suspended',         cls: 'bg-red-100 text-red-700 border-red-200' },
};

const DIVISION_LIFECYCLE_NEXT: Record<string, { next: string; label: string; icon: React.ElementType } | null> = {
  DRAFT:            { next: 'CONFIGURING', label: 'Start Setup',  icon: Settings },
  CONFIGURING:      { next: 'ACTIVE',      label: 'Activate',     icon: PlayCircle },
  PENDING_APPROVAL: null,
  ACTIVE:           { next: 'SUSPENDED',   label: 'Suspend',      icon: PauseCircle },
  SUSPENDED:        { next: 'ACTIVE',      label: 'Reactivate',   icon: PlayCircle },
};

const CHECKLIST_KEYS = ['admin_assigned', 'workflow_configured', 'budget_allocated', 'approval_routing', 'notification_setup'];
const CHECKLIST_LABELS: Record<string, string> = {
  admin_assigned: 'Admin',
  workflow_configured: 'Workflow',
  budget_allocated: 'Budget',
  approval_routing: 'Approvals',
  notification_setup: 'Notifications',
};

function ReadinessBar({ checklist, setupStatus }: { checklist?: Record<string, boolean>; setupStatus?: string }) {
  if (!checklist && !setupStatus) return null;
  const done = CHECKLIST_KEYS.filter((k) => checklist?.[k]).length;
  const pct = Math.round((done / CHECKLIST_KEYS.length) * 100);
  const isActive = setupStatus === 'ACTIVE';

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          {isActive
            ? <ShieldCheck className="h-3 w-3 text-emerald-500" />
            : <ShieldAlert className="h-3 w-3 text-yellow-500" />
          }
          Setup readiness
        </span>
        <span className={cn('font-semibold', isActive ? 'text-emerald-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500')}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isActive ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {CHECKLIST_KEYS.map((k) => {
          const done = checklist?.[k];
          return (
            <span key={k} className={cn('text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5',
              done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            )}>
              {done ? <CheckCircle2 className="h-2 w-2" /> : <Circle className="h-2 w-2" />}
              {CHECKLIST_LABELS[k]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getColor(index: number) { return DIV_COLORS[index % DIV_COLORS.length]; }

interface DivisionFormData { name: string; code: string; description: string; budget: string; head_count: string; manager_id: string; [key: string]: unknown; }
interface MemberOption { id: string; label: string; }

function DivisionNode({
  division, depth, index, onEdit, onDelete, onLifecycleChange,
  editingId, formData, setFormData, onUpdate, onCancelEdit, isPendingUpdate, membersList,
}: {
  division: any; depth: number; index: number;
  onEdit: (d: any) => void; onDelete: (id: string) => void;
  onLifecycleChange: (id: string, status: string) => void;
  editingId: string | null;
  formData: DivisionFormData;
  setFormData: (data: DivisionFormData) => void;
  onUpdate: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  isPendingUpdate: boolean;
  membersList: MemberOption[];
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = division.children && division.children.length > 0;
  const color = getColor(index);
  const currentStatus: string = division.setupStatus || 'ACTIVE';
  const lifecycleNext = DIVISION_LIFECYCLE_NEXT[currentStatus];
  const isEditing = editingId === division.id;

  return (
    <div className={cn('relative', depth > 0 && 'ml-8')}>
      {/* Vertical connector */}
      {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-px bg-border" />
      )}
      {depth > 0 && (
        <div className="absolute -left-4 top-6 w-4 h-px bg-border" />
      )}

      <Card className={cn('mb-2 border-l-4 hover:shadow-md transition-shadow', isEditing && 'ring-2 ring-primary/30')} style={{ borderLeftColor: color }}>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {hasChildren && (
                <button onClick={() => setExpanded((e) => !e)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-4 flex-shrink-0" />}

              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                {division.code?.slice(0, 2) || division.name?.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base">{division.name}</h3>
                  <Badge variant="outline" className="text-xs">{division.code}</Badge>
                  {depth === 0 && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Root</Badge>}
                  {division.setupStatus && division.setupStatus !== 'ACTIVE' && (
                    <Badge variant="outline" className={cn('text-[10px] border', SETUP_STATUS_CFG[division.setupStatus]?.cls)}>
                      {SETUP_STATUS_CFG[division.setupStatus]?.label ?? division.setupStatus}
                    </Badge>
                  )}
                </div>
                {division.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{division.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  {division.member_count !== undefined && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {division.member_count} members</span>
                  )}
                  {division.project_count !== undefined && (
                    <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {division.project_count} projects</span>
                  )}
                  {division.budget && (
                    <span className="font-medium text-green-600">₹{Number(division.budget).toLocaleString()}</span>
                  )}
                </div>
                {(division.setupChecklist || division.setupStatus) && (
                  <ReadinessBar
                    checklist={typeof division.setupChecklist === 'string'
                      ? JSON.parse(division.setupChecklist)
                      : division.setupChecklist}
                    setupStatus={division.setupStatus}
                  />
                )}
                {lifecycleNext && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onLifecycleChange(division.id, lifecycleNext.next)}
                    >
                      <lifecycleNext.icon className="h-3 w-3 mr-1.5" />
                      {lifecycleNext.label}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant={isEditing ? 'default' : 'ghost'} className="h-8 w-8 p-0" onClick={() => isEditing ? onCancelEdit() : onEdit(division)} title={isEditing ? 'Cancel' : 'Edit'}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(division.id)} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Inline edit form — expands below the card header */}
        {isEditing && (
          <div className="border-t border-primary/20 bg-muted/30 p-4">
            <p className="text-xs font-semibold text-primary mb-3">Edit Division</p>
            <form onSubmit={onUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Division Name *</label>
                  <Input placeholder="e.g., Engineering" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Code *</label>
                  <Input placeholder="e.g., ENG" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} maxLength={8} required />
                </div>
              </div>
              <textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
                <Input placeholder="Head Count" type="number" value={formData.head_count} onChange={(e) => setFormData({ ...formData, head_count: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Division Head / HOD</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Division Head (optional)</option>
                  {membersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isPendingUpdate}>
                  {isPendingUpdate && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Update Division
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onCancelEdit}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative ml-4">
          <div className="absolute left-0 top-0 bottom-4 w-px bg-border" />
          {division.children.map((child: any, i: number) => (
            <DivisionNode key={child.id} division={child} depth={depth + 1} index={index + i + 1}
              onEdit={onEdit} onDelete={onDelete} onLifecycleChange={onLifecycleChange}
              editingId={editingId} formData={formData} setFormData={setFormData}
              onUpdate={onUpdate} onCancelEdit={onCancelEdit} isPendingUpdate={isPendingUpdate}
              membersList={membersList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DivisionsPage() {
  const dialog = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [formData, setFormData] = useState<DivisionFormData>({ name: '', code: '', description: '', budget: '', head_count: '', manager_id: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data: hierarchy, isLoading } = useDivisionHierarchy();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();

  const { data: membersData } = useMembers({ page_size: 200 });
  const membersList: MemberOption[] = (membersData?.items ?? []).map((m: any) => ({
    id: m.id,
    label: `${m.first_name || ''} ${m.last_name || ''}`.trim() + (m.email ? ` — ${m.email}` : ''),
  }));

  const handleEdit = (division: any) => {
    setEditingId(division.id);
    setFormData({ name: division.name, code: division.code, description: division.description || '', budget: division.budget || '', head_count: division.head_count || '', manager_id: division.manager_id || division.managerId || '' });
    setShowForm(false); // close create form if open
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', description: '', budget: '', head_count: '', manager_id: '' });
  };

  const handleDelete = async (id: string) => {
    if (!await dialog.danger({ title: 'Delete Division', message: 'Delete this division and all sub-divisions? This cannot be undone.', confirmLabel: 'Delete' })) return;
    await deleteDivision.mutateAsync(id).catch(() => {});
  };

  const handleLifecycleChange = async (id: string, status: string) => {
    await updateDivision.mutateAsync({ divisionId: id, setupStatus: status } as any).catch(() => {});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const payload: Record<string, unknown> = { ...formData };
      if (payload.head_count === '') delete payload.head_count;
      else if (payload.head_count) payload.head_count = Number(payload.head_count);
      if (payload.budget === '') delete payload.budget;
      if (payload.manager_id === '') delete payload.manager_id;
      await createDivision.mutateAsync(payload);
      setFormData({ name: '', code: '', description: '', budget: '', head_count: '', manager_id: '' });
      setShowForm(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.error ?? err?.message ?? 'Failed to create division';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setUpdateError(null);
    try {
      const payload: Record<string, unknown> = { divisionId: editingId, ...formData };
      if (payload.head_count === '') delete payload.head_count;
      else if (payload.head_count) payload.head_count = Number(payload.head_count);
      if (payload.budget === '') delete payload.budget;
      if (payload.manager_id === '') delete payload.manager_id;
      await updateDivision.mutateAsync(payload as any);
      setEditingId(null);
      setFormData({ name: '', code: '', description: '', budget: '', head_count: '', manager_id: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.error ?? err?.message ?? 'Failed to update division';
      setUpdateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const flatList = (divisions: any[], out: any[] = []): any[] => {
    for (const d of divisions) { out.push(d); if (d.children?.length) flatList(d.children, out); }
    return out;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const divisions = hierarchy || [];
  const allDivisions = flatList(divisions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" /> Divisions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allDivisions.length} divisions across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-card">
            <button onClick={() => setViewMode('tree')} className={cn('p-2 rounded-l-md', viewMode === 'tree' && 'bg-accent')} title="Tree view">
              <Network className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-r-md', viewMode === 'list' && 'bg-accent')} title="List view">
              <List className="h-4 w-4" />
            </button>
          </div>
          <Link to="/admin/onboarding">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Onboarding Wizard
            </Button>
          </Link>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', code: '', description: '', budget: '', head_count: '', manager_id: '' }); }}>
            <Plus className="h-4 w-4 mr-2" /> New Division
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Divisions', value: allDivisions.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Members', value: allDivisions.reduce((s: number, d: any) => s + (d.member_count || 0), 0), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Projects', value: allDivisions.reduce((s: number, d: any) => s + (d.project_count || 0), 0), icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Root Divisions', value: divisions.length, icon: Crown, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={cn('p-4', stat.bg)}>
              <div className="flex items-center gap-3">
                <Icon className={cn('h-5 w-5', stat.color)} />
                <div>
                  <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Form (new division only) */}
      {showForm && !editingId && (
        <Card className="border-primary/40 p-5">
          <h2 className="text-base font-semibold mb-4">Create Division</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Division Name *</label>
                <Input placeholder="e.g., Engineering" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Code *</label>
                <Input placeholder="e.g., ENG" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} maxLength={8} required />
              </div>
            </div>
            <textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
              <Input placeholder="Head Count" type="number" value={formData.head_count} onChange={(e) => setFormData({ ...formData, head_count: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Division Head / HOD</label>
              <select
                value={formData.manager_id}
                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select Division Head (optional)</option>
                {membersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                The Division Head (HOD/CEO) is responsible for approving project closures and major decisions.
              </p>
            </div>
            {createError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {createError}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={createDivision.isPending}>
                {createDivision.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Division
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCreateError(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Divisions display */}
      {divisions.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No divisions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Use the Onboarding Wizard to set up your first division.</p>
          <Link to="/admin/onboarding">
            <Button className="mt-4"><Plus className="h-4 w-4 mr-2" /> Start Onboarding Wizard</Button>
          </Link>
        </Card>
      ) : viewMode === 'tree' ? (
        <div className="space-y-1">
          {divisions.map((div: any, i: number) => (
            <DivisionNode key={div.id} division={div} depth={0} index={i}
              onEdit={handleEdit} onDelete={handleDelete} onLifecycleChange={handleLifecycleChange}
              editingId={editingId} formData={formData} setFormData={setFormData}
              onUpdate={handleUpdate} onCancelEdit={handleCancelEdit} isPendingUpdate={updateDivision.isPending}
              membersList={membersList}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground font-semibold">
                <th className="px-4 py-3 text-left">Division</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Members</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Projects</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDivisions.map((div: any, i: number) => (
                <tr key={div.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getColor(i) }}>
                        {div.code?.slice(0, 2)}
                      </div>
                      <span className="font-medium">{div.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{div.code}</Badge></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{div.member_count || 0}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{div.project_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(div)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(div.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
