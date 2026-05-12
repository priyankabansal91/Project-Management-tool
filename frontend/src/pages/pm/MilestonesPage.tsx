import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Edit2, Trash2, ChevronRight, Flag, Calendar,
  CheckCircle2, Circle, Clock, AlertCircle, Loader2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone, useProject } from '@/api/hooks';

// ─── Types ────────────────────────────────────────────────

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  start_date: string;
  due_date: string;
  project_id: string;
  task_count?: number;
}

interface MilestoneFormData {
  title: string;
  description: string;
  status: MilestoneStatus;
  start_date: string;
  due_date: string;
  progress: number;
}

// ─── Seed Data ────────────────────────────────────────────

const SEED_MILESTONES: Milestone[] = [
  {
    id: 'ms1',
    title: 'Requirement Gathering',
    description: 'Collect and document all functional and non-functional requirements from stakeholders.',
    status: 'completed',
    progress: 100,
    start_date: '2026-01-05',
    due_date: '2026-01-20',
    project_id: '',
    task_count: 8,
  },
  {
    id: 'ms2',
    title: 'UI/UX Design',
    description: 'Create wireframes, prototypes and final design mockups for all key screens.',
    status: 'completed',
    progress: 100,
    start_date: '2026-01-21',
    due_date: '2026-02-10',
    project_id: '',
    task_count: 12,
  },
  {
    id: 'ms3',
    title: 'Development Phase 1',
    description: 'Build core modules: authentication, dashboard, and primary data management flows.',
    status: 'in_progress',
    progress: 62,
    start_date: '2026-02-11',
    due_date: '2026-03-15',
    project_id: '',
    task_count: 21,
  },
  {
    id: 'ms4',
    title: 'UAT & Testing',
    description: 'User acceptance testing, regression testing and bug fixes before production.',
    status: 'pending',
    progress: 0,
    start_date: '2026-03-16',
    due_date: '2026-04-05',
    project_id: '',
    task_count: 9,
  },
  {
    id: 'ms5',
    title: 'Production Deployment',
    description: 'Deploy to production environment, configure monitoring, and hand over to operations.',
    status: 'pending',
    progress: 0,
    start_date: '2026-04-06',
    due_date: '2026-04-15',
    project_id: '',
    task_count: 5,
  },
];

const EMPTY_FORM: MilestoneFormData = {
  title: '',
  description: '',
  status: 'pending',
  start_date: '',
  due_date: '',
  progress: 0,
};

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: MilestoneStatus) {
  switch (status) {
    case 'completed':
      return { label: 'Completed', color: 'bg-green-500', textColor: 'text-green-700', badgeClass: 'bg-green-100 text-green-700', Icon: CheckCircle2 };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-700', badgeClass: 'bg-blue-100 text-blue-700', Icon: Clock };
    case 'on_hold':
      return { label: 'On Hold', color: 'bg-orange-500', textColor: 'text-orange-700', badgeClass: 'bg-orange-100 text-orange-700', Icon: AlertCircle };
    default:
      return { label: 'Pending', color: 'bg-gray-400', textColor: 'text-gray-500', badgeClass: 'bg-gray-100 text-gray-500', Icon: Circle };
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Milestone Card ───────────────────────────────────────

function MilestoneCard({
  milestone,
  isLast,
  onEdit,
  onDelete,
}: {
  milestone: Milestone;
  isLast: boolean;
  onEdit: (m: Milestone) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = statusConfig(milestone.status);
  const StatusIcon = cfg.Icon;

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm', cfg.color)}>
          <StatusIcon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-0.5 bg-border flex-1 mt-2 min-h-[32px]" />}
      </div>

      {/* Card */}
      <Card className="flex-1 mb-6 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{milestone.title}</h3>
                <Badge className={cn('text-[10px] border-0', cfg.badgeClass)}>
                  {cfg.label}
                </Badge>
                {milestone.task_count !== undefined && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {milestone.task_count} tasks
                  </span>
                )}
              </div>
              {milestone.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm" variant="ghost" className="h-7 w-7 p-0"
                onClick={() => onEdit(milestone)} title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm" variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(milestone.id)} title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(milestone.start_date)}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{formatDate(milestone.due_date)}</span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Progress</span>
              <span className="text-xs font-semibold">{milestone.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', cfg.color)}
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Slide-in Form Panel ──────────────────────────────────

function MilestoneFormPanel({
  editingId,
  initialData,
  onSave,
  onClose,
  saving,
}: {
  editingId: string | null;
  initialData: MilestoneFormData;
  onSave: (data: MilestoneFormData) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MilestoneFormData>(initialData);
  const set = (patch: Partial<MilestoneFormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">
            {editingId ? 'Edit Milestone' : 'Add Milestone'}
          </h2>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g., Development Phase 1"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea
              placeholder="Describe what this milestone covers..."
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => set({ status: e.target.value as MilestoneStatus })}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Start Date</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => set({ start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Due Date</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set({ due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Progress slider */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Progress — <span className="text-primary font-semibold">{form.progress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) => set({ progress: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </form>

        <div className="px-5 py-4 border-t flex gap-2">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            {editingId ? 'Update Milestone' : 'Create Milestone'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────

export function MilestonesPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();

  const projectQuery = useProject(projectId);
  const milestonesQuery = useMilestones(projectId);
  const createMutation = useCreateMilestone(projectId);
  const updateMutation = useUpdateMilestone(projectId);
  const deleteMutation = useDeleteMilestone(projectId);

  // Fall back to seed data if API returns empty
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(
    SEED_MILESTONES.map((m) => ({ ...m, project_id: projectId })),
  );

  const apiMilestones: Milestone[] = (milestonesQuery.data ?? []) as Milestone[];
  const milestones = apiMilestones.length > 0 ? apiMilestones : localMilestones;

  const projectName = (projectQuery.data as any)?.name || 'Project';

  // Form panel state
  const [showPanel, setShowPanel] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Summary stats
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const pending = milestones.filter((m) => m.status === 'pending').length;

  // ── Handlers ─────────────────────────────────────────────

  const openCreate = () => {
    setEditingMilestone(null);
    setShowPanel(true);
  };

  const openEdit = (m: Milestone) => {
    setEditingMilestone(m);
    setShowPanel(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this milestone? This action cannot be undone.')) return;
    if (apiMilestones.length > 0) {
      deleteMutation.mutate(id);
    } else {
      setLocalMilestones((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSave = (data: MilestoneFormData) => {
    const payload = { ...data, project_id: projectId };
    if (editingMilestone) {
      if (apiMilestones.length > 0) {
        updateMutation.mutate({ id: editingMilestone.id, ...payload }, {
          onSuccess: () => { setShowPanel(false); setEditingMilestone(null); },
        });
      } else {
        setLocalMilestones((prev) =>
          prev.map((m) => m.id === editingMilestone.id ? { ...m, ...payload } : m),
        );
        setShowPanel(false);
        setEditingMilestone(null);
      }
    } else {
      if (apiMilestones.length > 0) {
        createMutation.mutate(payload, {
          onSuccess: () => { setShowPanel(false); },
        });
      } else {
        const newMs: Milestone = {
          ...payload,
          id: 'ms_' + Date.now(),
          task_count: 0,
        };
        setLocalMilestones((prev) => [...prev, newMs]);
        setShowPanel(false);
      }
    }
  };

  const panelInitial: MilestoneFormData = editingMilestone
    ? {
        title: editingMilestone.title,
        description: editingMilestone.description,
        status: editingMilestone.status,
        start_date: editingMilestone.start_date,
        due_date: editingMilestone.due_date,
        progress: editingMilestone.progress,
      }
    : EMPTY_FORM;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (milestonesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/projects/${projectId}/board`} className="hover:text-foreground transition-colors">{projectName}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Milestones</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" /> Milestones
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track project milestones and delivery phases
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Milestone
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, cls: 'text-foreground', bg: 'bg-card' },
          { label: 'Completed', value: completed, cls: 'text-green-600', bg: 'bg-green-50' },
          { label: 'In Progress', value: inProgress, cls: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: pending, cls: 'text-gray-500', bg: 'bg-gray-50' },
        ].map(({ label, value, cls, bg }) => (
          <Card key={label} className={cn('p-4', bg)}>
            <p className={cn('text-2xl font-bold', cls)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      {milestones.length > 0 ? (
        <div className="mt-2">
          {milestones.map((m, i) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              isLast={i === milestones.length - 1}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Flag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">No milestones yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first milestone to start tracking project phases.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add First Milestone
          </Button>
        </Card>
      )}

      {/* Slide-in form panel */}
      {showPanel && (
        <MilestoneFormPanel
          editingId={editingMilestone?.id ?? null}
          initialData={panelInitial}
          onSave={handleSave}
          onClose={() => { setShowPanel(false); setEditingMilestone(null); }}
          saving={isSaving}
        />
      )}
    </div>
  );
}
