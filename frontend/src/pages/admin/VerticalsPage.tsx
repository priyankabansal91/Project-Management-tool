import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Network, Plus, Edit2, Trash2, Users, FolderKanban, X,
  ChevronDown, Search, Building2, UserCheck, Loader2,
  PlayCircle, Settings, PauseCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useVerticals, useCreateVertical, useUpdateVertical, useDeleteVertical, useMembers, useDivisions } from '@/api/hooks';
import { PermissionGate } from '@/components/shared/PermissionGate';

// ─── Seed Data ───────────────────────────────────────────

type VerticalLifecycle = 'DRAFT' | 'CONFIGURING' | 'ACTIVE' | 'SUSPENDED';

const LIFECYCLE_CFG: Record<VerticalLifecycle, { label: string; color: string; next: VerticalLifecycle | null; nextLabel: string; icon: React.ElementType }> = {
  DRAFT:       { label: 'Draft',       color: 'bg-gray-100 text-gray-500',   next: 'CONFIGURING', nextLabel: 'Start Setup',  icon: Settings },
  CONFIGURING: { label: 'Setting Up',  color: 'bg-yellow-100 text-yellow-700', next: 'ACTIVE',    nextLabel: 'Activate',    icon: PlayCircle },
  ACTIVE:      { label: 'Active',      color: 'bg-emerald-100 text-emerald-700', next: 'SUSPENDED', nextLabel: 'Suspend',   icon: PauseCircle },
  SUSPENDED:   { label: 'Suspended',   color: 'bg-red-100 text-red-700',     next: 'ACTIVE',    nextLabel: 'Reactivate',   icon: PlayCircle },
};

interface Vertical {
  id: string;
  name: string;
  description: string;
  // seed data sends strings; API sends objects
  division: string | { id: string; name: string } | null;
  divisionId?: string;
  division_id?: string;
  head_name?: string;
  head?: { id: string; firstName: string; lastName: string; email?: string } | null;
  color: string;
  member_count?: number;
  project_count?: number;
  status: 'active' | 'inactive';
  lifecycleStatus?: VerticalLifecycle;
  lifecycle_status?: VerticalLifecycle;
  budget?: number | string | null;
  actualBudget?: number | null;
}

function getDivisionName(v: Vertical): string {
  if (!v.division) return '';
  if (typeof v.division === 'string') return v.division;
  return v.division.name || '';
}

function getHeadName(v: Vertical): string {
  if (v.head_name) return v.head_name;
  if (v.head) return `${v.head.firstName} ${v.head.lastName}`.trim();
  return 'Unassigned';
}

const SEED_VERTICALS: Vertical[] = [
  { id: 'v1', name: 'Development Team', description: 'Core software development vertical', division: 'IT Division', division_id: 'div_it', head_name: 'Rahul Mehta', color: '#3B82F6', member_count: 8, project_count: 3, status: 'active' },
  { id: 'v2', name: 'QA & Testing', description: 'Quality assurance and testing vertical', division: 'IT Division', division_id: 'div_it', head_name: 'Sunita Rao', color: '#10B981', member_count: 4, project_count: 2, status: 'active' },
  { id: 'v3', name: 'UI/UX Design', description: 'User experience and interface design', division: 'IT Division', division_id: 'div_it', head_name: 'Priya Sharma', color: '#8B5CF6', member_count: 3, project_count: 2, status: 'active' },
  { id: 'v4', name: 'Finance Operations', description: 'Financial processing and reporting', division: 'Finance Division', division_id: 'div_finance', head_name: 'Vikram Singh', color: '#F59E0B', member_count: 5, project_count: 1, status: 'active' },
  { id: 'v5', name: 'Accreditation Team', description: 'Standards and accreditation vertical', division: 'Accreditation Division', division_id: 'div_accred', head_name: 'Anjali Gupta', color: '#EF4444', member_count: 6, project_count: 2, status: 'inactive' },
  { id: 'v6', name: 'Infrastructure', description: 'IT infrastructure and DevOps', division: 'IT Division', division_id: 'div_it', head_name: 'David Park', color: '#06B6D4', member_count: 4, project_count: 1, status: 'active' },
];

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

// ─── Form State ──────────────────────────────────────────

interface VerticalFormData {
  name: string;
  description: string;
  division_id: string;
  head_id: string;
  color: string;
  status: 'active' | 'inactive';
  budget: string;
}

const EMPTY_FORM: VerticalFormData = {
  name: '',
  description: '',
  division_id: '',
  head_id: '',
  color: COLORS[0],
  status: 'active',
  budget: '',
};

// ─── Stat Card ───────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass, bgClass }: {
  label: string; value: number;
  icon: React.ElementType; colorClass: string; bgClass: string;
}) {
  return (
    <Card className={cn('p-4', bgClass)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', colorClass)} />
        <div>
          <p className={cn('text-2xl font-bold', colorClass)}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Vertical Card ───────────────────────────────────────

function VerticalCard({ vertical, onEdit, onDelete, onLifecycleChange, onManageMembers }: {
  vertical: Vertical;
  onEdit: (v: Vertical) => void;
  onDelete: (id: string) => void;
  onLifecycleChange: (id: string, status: VerticalLifecycle) => void;
  onManageMembers?: (v: Vertical) => void;
}) {
  const lifecycle: VerticalLifecycle = vertical.lifecycleStatus || vertical.lifecycle_status || 'ACTIVE';
  const cfg = LIFECYCLE_CFG[lifecycle];
  const NextIcon = cfg.icon;

  return (
    <Card
      className="overflow-hidden border-l-4 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: vertical.color }}
    >
      <CardContent className="p-4">
        {/* Name + Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: vertical.color }}
              >
                {vertical.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-sm truncate">{vertical.name}</h3>
            </div>
            {vertical.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vertical.description}</p>
            )}
          </div>
          <PermissionGate roles={['org_admin', 'division_admin']} silent>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm" variant="ghost" className="h-7 w-7 p-0"
                onClick={() => onEdit(vertical)} title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(vertical.id)} title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </PermissionGate>
        </div>

        {/* Division badge + lifecycle badge */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <Badge variant="outline" className="text-[10px] font-medium">{getDivisionName(vertical)}</Badge>
          <Badge className={cn('text-[10px] border-0 ml-auto', cfg.color)}>{cfg.label}</Badge>
        </div>

        {/* Lifecycle transition button */}
        {cfg.next && (
          <div className="mb-3">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs w-full"
              onClick={() => onLifecycleChange(vertical.id, cfg.next!)}
            >
              <NextIcon className="h-3 w-3 mr-1.5" />
              {cfg.nextLabel}
            </Button>
          </div>
        )}

        {/* Vertical Head */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-muted/30">
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground mr-1">Head:</span>
          <Avatar name={getHeadName(vertical)} size="sm" />
          <span className="text-xs font-medium truncate">{getHeadName(vertical)}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2 flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{vertical.member_count}</span> members
          </span>
          <span className="flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{vertical.project_count}</span> projects
          </span>
          {vertical.budget != null && Number(vertical.budget) > 0 && (
            <span className="flex items-center gap-1 ml-auto text-xs">
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium text-green-600">₹{Number(vertical.budget).toLocaleString('en-IN')}</span>
              {vertical.actualBudget != null && vertical.actualBudget > 0 && (
                <>
                  <span className="text-muted-foreground">· Actual:</span>
                  <span className={`font-medium ${vertical.actualBudget > Number(vertical.budget) ? 'text-red-600' : 'text-blue-600'}`}>
                    ₹{Number(vertical.actualBudget).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Manage Members button */}
        {onManageMembers && (
          <div className="border-t pt-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => onManageMembers(vertical)}
            >
              <Users className="h-3 w-3 mr-1.5" /> Manage Members
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Modal ───────────────────────────────────────────────

function VerticalModal({ editingId, initialData, onSave, onClose, members, divisions }: {
  editingId: string | null;
  initialData: VerticalFormData;
  onSave: (id: string | null, data: VerticalFormData) => void;
  onClose: () => void;
  members: Array<{ id: string; firstName?: string; lastName?: string; first_name?: string; last_name?: string; email?: string }>;
  divisions: Array<{ id: string; name: string; code?: string }>;
}) {
  const [form, setForm] = useState<VerticalFormData>(initialData);

  const set = (patch: Partial<VerticalFormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.head_id) {
      alert('Please select a Vertical Head. This is required.');
      return;
    }
    onSave(editingId, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle className="text-base">
            {editingId ? 'Edit Vertical' : 'Create Vertical'}
          </CardTitle>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Vertical Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Development Team"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                placeholder="Brief description of this vertical's purpose..."
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-sm font-medium block mb-1">Budget (₹)</label>
              <Input
                placeholder="e.g., 500000"
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => set({ budget: e.target.value })}
              />
            </div>

            {/* Division */}
            <div>
              <label className="text-sm font-medium block mb-1">Division <span className="text-destructive">*</span></label>
              <div className="relative">
                <select
                  value={form.division_id}
                  onChange={(e) => set({ division_id: e.target.value })}
                  required
                  className="w-full appearance-none px-3 py-2 pr-8 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select a Division —</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ''}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Vertical Head */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Vertical Head <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.head_id}
                  onChange={(e) => set({ head_id: e.target.value })}
                  required
                  className="w-full appearance-none px-3 py-2 pr-8 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select a user —</option>
                  {members.map((m) => {
                    const name = `${m.firstName || m.first_name || ''} ${m.lastName || m.last_name || ''}`.trim() || m.email || m.id;
                    const role = (m as any).role ? ` (${((m as any).role as string).replace(/_/g, ' ')})` : '';
                    return <option key={m.id} value={m.id}>{name}{role}</option>;
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Required. The person responsible for leading this vertical.</p>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm font-medium block mb-2">Color</label>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set({ color: c })}
                    className={cn(
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                      form.color === c ? 'border-foreground scale-110' : 'border-transparent',
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
                <div
                  className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold ml-2"
                  style={{ backgroundColor: form.color }}
                >
                  {form.name.charAt(0) || 'V'}
                </div>
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">
                  {form.status === 'active' ? 'This vertical is active and visible.' : 'This vertical is inactive and hidden from members.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => set({ status: form.status === 'active' ? 'inactive' : 'active' })}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  form.status === 'active' ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    form.status === 'active' ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="submit">
                {editingId ? 'Update Vertical' : 'Create Vertical'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export function VerticalsPage() {
  const { user, currentRole } = useAuthStore();

  const { data: apiData, isLoading } = useVerticals();
  const rawApiItems = (apiData as any)?.items ?? (Array.isArray(apiData) ? apiData : []);
  const apiVerticals: Vertical[] = rawApiItems as Vertical[];
  const createMutation = useCreateVertical();
  const updateMutation = useUpdateVertical();
  const deleteMutation = useDeleteVertical();

  const membersQ = useMembers({ page_size: 200 });
  const orgMembers = (membersQ.data?.items ?? []) as Array<{ id: string; firstName?: string; lastName?: string; first_name?: string; last_name?: string; email?: string }>;

  const { data: divisionsData } = useDivisions();
  const allDivisionsList = ((divisionsData as any)?.items ?? (Array.isArray(divisionsData) ? divisionsData : [])) as Array<{ id: string; name: string; code?: string }>;

  // Fall back to seed data if API returns nothing
  const [localVerticals, setLocalVerticals] = useState<Vertical[]>(SEED_VERTICALS);
  const verticals: Vertical[] = apiVerticals.length > 0 ? apiVerticals : localVerticals;

  const [showModal, setShowModal] = useState(false);
  const [editingVertical, setEditingVertical] = useState<Vertical | null>(null);
  const [managingMembersFor, setManagingMembersFor] = useState<Vertical | null>(null);

  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // ── Filtered list ────────────────────────────────────
  const filtered = verticals.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = v.name.toLowerCase().includes(q)
      || (v.description || '').toLowerCase().includes(q)
      || getHeadName(v).toLowerCase().includes(q);
    const vDivId = (typeof v.division === 'object' && v.division !== null) ? v.division.id : (v.divisionId || v.division_id || '');
    const matchDivision = !divisionFilter || vDivId === divisionFilter;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchDivision && matchStatus;
  });

  // ── Stats ────────────────────────────────────────────
  const totalMembers = verticals.reduce((s, v) => s + (v.member_count ?? 0), 0);
  const totalProjects = verticals.reduce((s, v) => s + (v.project_count ?? 0), 0);
  const activeCount = verticals.filter((v) => v.status === 'active').length;

  // ── Handlers ─────────────────────────────────────────
  const openCreate = () => {
    setEditingVertical(null);
    setShowModal(true);
  };

  const openEdit = (v: Vertical) => {
    setEditingVertical(v);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this vertical? This action cannot be undone.')) return;
    if (apiVerticals.length > 0) {
      deleteMutation.mutate(id);
    } else {
      setLocalVerticals((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleLifecycleChange = (id: string, newStatus: VerticalLifecycle) => {
    if (apiVerticals.length > 0) {
      updateMutation.mutate({ id, lifecycleStatus: newStatus } as any);
    } else {
      setLocalVerticals((prev) => prev.map((v) => v.id === id ? { ...v, lifecycleStatus: newStatus } : v));
    }
  };

  const handleSave = (id: string | null, data: VerticalFormData) => {
    const payload = {
      name: data.name,
      description: data.description,
      division_id: data.division_id,
      headId: data.head_id,
      color: data.color,
      status: data.status,
      ...(data.budget !== '' && { budget: parseFloat(data.budget) }),
    };

    if (id) {
      if (apiVerticals.length > 0) {
        updateMutation.mutate({ id, ...payload });
      } else {
        setLocalVerticals((prev) => prev.map((v) => v.id === id ? { ...v, ...payload } : v));
      }
    } else {
      const newVertical: Vertical = {
        ...payload,
        division: null,
        id: 'v_' + Date.now(),
        member_count: 0,
        project_count: 0,
        status: payload.status,
      };
      if (apiVerticals.length > 0) {
        createMutation.mutate(payload);
      } else {
        setLocalVerticals((prev) => [newVertical, ...prev]);
      }
    }
    setShowModal(false);
    setEditingVertical(null);
  };

  const modalInitial: VerticalFormData = editingVertical
    ? {
        name: editingVertical.name,
        description: editingVertical.description || '',
        division_id: (typeof editingVertical.division === 'object' && editingVertical.division !== null)
          ? editingVertical.division.id
          : (editingVertical.divisionId || editingVertical.division_id || ''),
        head_id: editingVertical.head?.id || '',
        color: editingVertical.color,
        status: editingVertical.status,
        budget: editingVertical.budget != null ? String(editingVertical.budget) : '',
      }
    : EMPTY_FORM;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            {currentRole === 'vertical_head' ? 'My Vertical' : 'Verticals'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {currentRole === 'vertical_head'
              ? 'Your assigned vertical and its projects'
              : 'Manage team verticals within your boards/divisions'}
          </p>
        </div>
        <PermissionGate roles={['org_admin', 'division_admin']} silent>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Vertical
          </Button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Verticals" value={verticals.length} icon={Network} colorClass="text-blue-600" bgClass="bg-blue-50" />
        <StatCard label="Active Verticals" value={activeCount} icon={UserCheck} colorClass="text-green-600" bgClass="bg-green-50" />
        <StatCard label="Total Members" value={totalMembers} icon={Users} colorClass="text-purple-600" bgClass="bg-purple-50" />
        <StatCard label="Total Projects" value={totalProjects} icon={FolderKanban} colorClass="text-orange-600" bgClass="bg-orange-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search verticals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Division filter */}
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="appearance-none pl-9 pr-8 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
          >
            <option value="">All Divisions</option>
            {allDivisionsList.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-md border bg-card p-1">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || divisionFilter !== '' || statusFilter !== 'all') && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {verticals.length} verticals
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VerticalCard
              key={v.id}
              vertical={v}
              onEdit={openEdit}
              onDelete={handleDelete}
              onLifecycleChange={handleLifecycleChange}
              onManageMembers={(vert) => setManagingMembersFor(vert)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <Card className="p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-muted-foreground" />
          </div>
          {search || divisionFilter !== 'All Divisions' || statusFilter !== 'all' ? (
            <>
              <p className="font-medium text-muted-foreground">No verticals match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearch(''); setDivisionFilter(''); setStatusFilter('all'); }}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <p className="font-medium text-muted-foreground">No verticals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first vertical to start organizing teams within your divisions.
              </p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Create First Vertical
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Members management panel */}
      {managingMembersFor && (
        <Card className="border-primary/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Members — {managingMembersFor.name}</h2>
            <Button size="sm" variant="ghost" onClick={() => setManagingMembersFor(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Add org members to this vertical so Project Managers can assign them to projects and tasks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {orgMembers.map((m) => {
              const name = `${m.firstName || m.first_name || ''} ${m.lastName || m.last_name || ''}`.trim() || m.email || '';
              return (
                <div key={m.id} className="flex items-center gap-2 p-2 border rounded-md text-sm">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email || ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            All org members are available to Project Managers. Use User Management to invite new members.
          </p>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <VerticalModal
          editingId={editingVertical?.id ?? null}
          initialData={modalInitial}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingVertical(null); }}
          members={orgMembers}
          divisions={allDivisionsList}
        />
      )}
    </div>
  );
}
