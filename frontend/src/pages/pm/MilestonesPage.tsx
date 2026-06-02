import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Edit2, Trash2, ChevronRight, Flag, Calendar,
  CheckCircle2, Circle, Clock, AlertCircle, Loader2, X,
  Wallet, Activity, Lock, CheckSquare2, Ban, PlayCircle,
  ArrowRight, ShieldCheck, Hash, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone, useProject } from '@/api/hooks';
import api from '@/api/client';

// ─── Types ────────────────────────────────────────────────

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'review';
type WaterfallStatus = 'NOT_STARTED' | 'BLOCKED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED';

interface ExpenseHead {
  head: string;
  label: string;
  amount: string;
  description: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progress: number;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  project_id?: string;
  projectId?: string;
  taskCount?: number;
  task_count?: number;
  budget?: number | null;          // planned budget
  actualBudget?: number | null;
  budgetLocked?: boolean;
  expenseHeads?: ExpenseHead[];
  effortEstimate?: number | null;
  actualEffort?: number;
  burnRate?: number;
  milestoneType?: string;
  approvalRequired?: boolean;
  currency?: string;
  // Waterfall fields
  waterfallStatus?: WaterfallStatus;
  sequenceOrder?: number;
  predecessorId?: string | null;
  blockedReason?: string | null;
}

interface MilestoneFormData {
  title: string;
  description: string;
  status: MilestoneStatus;
  start_date: string;
  due_date: string;
  progress: number;
  budget: string;          // planned budget
  actualBudget: string;
  budgetLocked: boolean;
  expenseHeads: ExpenseHead[];
  effortEstimate: string;
  milestoneType: string;
  approvalRequired: boolean;
  currency: string;
}

// ─── Seed Data ────────────────────────────────────────────

const SEED_MILESTONES: Milestone[] = [
  { id: 'ms1', title: 'Requirement Gathering', description: 'Collect and document all requirements from stakeholders.', status: 'completed', progress: 100, start_date: '2026-01-05', due_date: '2026-01-20', taskCount: 8, milestoneType: 'planning', budget: null, effortEstimate: 40 },
  { id: 'ms2', title: 'UI/UX Design', description: 'Create wireframes, prototypes and final design mockups.', status: 'completed', progress: 100, start_date: '2026-01-21', due_date: '2026-02-10', taskCount: 12, milestoneType: 'design', budget: 50000, effortEstimate: 80 },
  { id: 'ms3', title: 'Development Phase 1', description: 'Build core modules: authentication, dashboard, primary data flows.', status: 'in_progress', progress: 62, start_date: '2026-02-11', due_date: '2026-03-15', taskCount: 21, milestoneType: 'development', budget: 120000, effortEstimate: 200, actualEffort: 124, burnRate: 62 },
  { id: 'ms4', title: 'UAT & Testing', description: 'User acceptance testing, regression and bug fixes.', status: 'pending', progress: 0, start_date: '2026-03-16', due_date: '2026-04-05', taskCount: 9, milestoneType: 'testing', approvalRequired: true, budget: 30000, effortEstimate: 60 },
  { id: 'ms5', title: 'Production Deployment', description: 'Deploy to production, configure monitoring, hand over to operations.', status: 'pending', progress: 0, start_date: '2026-04-06', due_date: '2026-04-15', taskCount: 5, milestoneType: 'deployment', approvalRequired: true },
];

const EMPTY_FORM: MilestoneFormData = {
  title: '', description: '', status: 'pending',
  start_date: '', due_date: '', progress: 0,
  budget: '', actualBudget: '', budgetLocked: false, expenseHeads: [],
  effortEstimate: '', milestoneType: 'general',
  approvalRequired: false, currency: 'INR',
};

const MILESTONE_TYPES = ['general', 'planning', 'design', 'development', 'testing', 'deployment', 'review', 'closure'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const EXPENSE_HEAD_OPTIONS = [
  { value: 'assessment_cost',    label: 'Assessment Cost' },
  { value: 'technology_cost',    label: 'Technology Cost' },
  { value: 'professional_cost',  label: 'Professional Cost' },
  { value: 'travel_lodging',     label: 'Travel & Lodging' },
  { value: 'infrastructure',     label: 'Infrastructure Cost' },
  { value: 'training',           label: 'Training Cost' },
  { value: 'overheads',          label: 'Overheads' },
  { value: 'other',              label: 'Other' },
];

// ─── Helpers ─────────────────────────────────────────────

function statusConfig(status: MilestoneStatus) {
  switch (status) {
    case 'completed': return { label: 'Completed', color: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700', Icon: CheckCircle2 };
    case 'in_progress': return { label: 'In Progress', color: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-700', Icon: Clock };
    case 'on_hold': return { label: 'On Hold', color: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700', Icon: AlertCircle };
    case 'review': return { label: 'Pending Approval', color: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-700', Icon: Lock };
    default: return { label: 'Pending', color: 'bg-gray-400', badgeClass: 'bg-gray-100 text-gray-500', Icon: Circle };
  }
}

function waterfallConfig(ws: WaterfallStatus) {
  switch (ws) {
    case 'COMPLETED':        return { label: 'Completed',        bg: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500',  Icon: CheckCircle2 };
    case 'IN_PROGRESS':      return { label: 'In Progress',      bg: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500',   Icon: Clock };
    case 'PENDING_APPROVAL': return { label: 'Pending Approval', bg: 'bg-purple-100 text-purple-700 border-purple-200',dot: 'bg-purple-500', Icon: Lock };
    case 'APPROVED':         return { label: 'Approved',         bg: 'bg-teal-100 text-teal-700 border-teal-200',      dot: 'bg-teal-500',   Icon: ShieldCheck };
    case 'BLOCKED':          return { label: 'Blocked',          bg: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500',    Icon: Ban };
    default:                 return { label: 'Not Started',      bg: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400',   Icon: Circle };
  }
}

function fmtDate(ds?: string) {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCurrency(amount?: number | null, currency = 'INR') {
  if (amount == null) return null;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

// ─── Milestone Card ───────────────────────────────────────

function WaterfallBadge({ ws }: { ws: WaterfallStatus }) {
  const cfg = waterfallConfig(ws);
  const Icon = cfg.Icon;
  return (
    <span className={cn('text-[10px] border px-2 py-0.5 rounded-full flex items-center gap-1 font-medium', cfg.bg)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function MilestoneCard({
  milestone, isLast, onEdit, onDelete, onClose, onStart, projectId,
}: {
  milestone: Milestone;
  isLast: boolean;
  onEdit: (m: Milestone) => void;
  onDelete: (id: string) => void;
  onClose: (m: Milestone) => void;
  onStart: (m: Milestone) => void;
  projectId: string;
}) {
  const cfg = statusConfig(milestone.status);
  const ws = milestone.waterfallStatus ?? 'NOT_STARTED';
  const wCfg = waterfallConfig(ws);
  const StatusIcon = cfg.Icon;
  const startDate = milestone.start_date || milestone.startDate;
  const dueDate = milestone.due_date || milestone.dueDate;
  const taskCount = milestone.taskCount ?? milestone.task_count ?? 0;
  const burn = milestone.burnRate ?? milestone.progress ?? 0;
  const canClose = ['in_progress', 'pending', 'on_hold'].includes(milestone.status);
  const isBlocked = ws === 'BLOCKED';
  const canStart = ws === 'NOT_STARTED' && !isBlocked;

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm',
          isBlocked ? 'bg-red-400' : cfg.color,
        )}>
          {isBlocked ? <Ban className="h-4 w-4" /> : <StatusIcon className="h-4 w-4" />}
        </div>
        {!isLast && (
          <div className="relative w-0.5 flex-1 mt-2 min-h-[32px]">
            <div className="absolute inset-0 bg-border" />
            {milestone.sequenceOrder != null && (
              <ArrowRight className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Card */}
      <Card className={cn(
        'flex-1 mb-6 transition-shadow',
        isBlocked
          ? 'border-red-200 bg-red-50/40 dark:bg-red-950/10 opacity-80'
          : 'hover:shadow-md',
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Blocked banner */}
          {isBlocked && (
            <div className="flex items-center gap-2 rounded-md bg-red-100 dark:bg-red-950/30 border border-red-200 px-3 py-2 text-xs text-red-700">
              <Ban className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium">Blocked</span>
              {milestone.blockedReason
                ? <span className="text-red-600">— {milestone.blockedReason}</span>
                : <span className="text-red-500">Predecessor milestone must be completed first</span>
              }
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {milestone.sequenceOrder != null && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                    <Hash className="h-2.5 w-2.5" />{milestone.sequenceOrder}
                  </span>
                )}
                <Link
                  to={`/projects/${projectId}/milestones/${milestone.id}`}
                  className={cn('font-semibold text-sm hover:text-primary hover:underline transition-colors', isBlocked && 'text-muted-foreground')}
                >{milestone.title}</Link>
                <Badge className={cn('text-[10px] border-0', cfg.badgeClass)}>{cfg.label}</Badge>
                <WaterfallBadge ws={ws} />
                {taskCount > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{taskCount} tasks</span>
                )}
                {milestone.milestoneType && milestone.milestoneType !== 'general' && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">{milestone.milestoneType}</span>
                )}
                {milestone.approvalRequired && (
                  <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Approval Required
                  </span>
                )}
              </div>
              {milestone.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{milestone.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {canStart && (
                <Button size="sm" variant="ghost"
                  className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onStart(milestone)} title="Start milestone">
                  <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start
                </Button>
              )}
              {canClose && !isBlocked && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => onClose(milestone)} title="Close milestone">
                  <CheckSquare2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(milestone)} title="Edit">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(milestone.id)} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{fmtDate(startDate)}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{fmtDate(dueDate)}</span>
          </div>

          {/* Budget + Effort row */}
          {(milestone.budget != null || milestone.actualBudget != null || milestone.effortEstimate != null) && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {milestone.budget != null && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-muted-foreground">Planned:</span>
                  <span className="font-medium text-foreground">{fmtCurrency(milestone.budget, milestone.currency)}</span>
                  {milestone.budgetLocked && <span title="Budget locked"><Lock className="h-3 w-3 text-amber-500" /></span>}
                </div>
              )}
              {milestone.actualBudget != null && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-muted-foreground">Actual:</span>
                  <span className={cn('font-medium', milestone.budget && milestone.actualBudget > milestone.budget ? 'text-red-600' : 'text-emerald-600')}>
                    {fmtCurrency(milestone.actualBudget, milestone.currency)}
                  </span>
                </div>
              )}
              {milestone.effortEstimate != null && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{milestone.actualEffort ?? 0}h / {milestone.effortEstimate}h</span>
                </div>
              )}
            </div>
          )}

          {/* Expense heads summary */}
          {milestone.expenseHeads && milestone.expenseHeads.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {milestone.expenseHeads.map((eh, i) => (
                <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  {eh.label || eh.head}: {fmtCurrency(parseFloat(eh.amount) || 0, milestone.currency)}
                </span>
              ))}
            </div>
          )}

          {/* Budget bar (if budget exists) */}
          {milestone.budget != null && milestone.budget > 0 && (() => {
            const consumed = Math.min(100, milestone.burnRate ?? milestone.progress ?? 0);
            const consumedAmt = Math.round((consumed / 100) * milestone.budget!);
            return (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Budget</span>
                  <span className="text-xs font-semibold">
                    ₹{consumedAmt.toLocaleString('en-IN')} · {consumed}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      isBlocked ? 'bg-red-300' :
                      consumed > 90 ? 'bg-red-500' :
                      consumed > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${consumed}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Progress</span>
              <span className="text-xs font-semibold">{milestone.progress ?? 0}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all',
                  milestone.status === 'completed' ? 'bg-green-500' :
                  (milestone.progress ?? 0) > 60 ? 'bg-blue-500' : 'bg-blue-400'
                )}
                style={{ width: `${milestone.progress ?? 0}%` }}
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
  editingId, initialData, onSave, onClose, saving, apiError,
  projectBudget, usedBudget,
  projectStartDate, projectDueDate,
}: {
  editingId: string | null;
  initialData: MilestoneFormData;
  onSave: (data: MilestoneFormData) => void;
  onClose: () => void;
  saving: boolean;
  apiError?: string | null;
  projectBudget: number | null;
  usedBudget: number;
  projectStartDate?: string;
  projectDueDate?: string;
}) {
  const [form, setForm] = useState<MilestoneFormData>(initialData);
  const [budgetError, setBudgetError] = useState('');
  const [dateError, setDateError] = useState('');
  const [lockConfirm, setLockConfirm] = useState(false);
  const set = (patch: Partial<MilestoneFormData>) => setForm((f) => ({ ...f, ...patch }));

  const isCreate = !editingId;

  // Remaining budget = project total − already used (exclude current milestone when editing)
  const remainingBudget = projectBudget != null
    ? projectBudget - (isCreate ? usedBudget : (usedBudget - (parseFloat(initialData.budget) || 0)))
    : null;

  const handleBudgetChange = (val: string) => {
    set({ budget: val });
    if (projectBudget != null && val) {
      const entered = parseFloat(val) || 0;
      const used = isCreate ? usedBudget : (usedBudget - (parseFloat(initialData.budget) || 0));
      if (used + entered > projectBudget) {
        setBudgetError(`Exceeds project budget. Remaining: ₹${(projectBudget - used).toLocaleString('en-IN')}`);
      } else {
        setBudgetError('');
      }
    } else {
      setBudgetError('');
    }
  };

  const validateDates = (startDate: string, dueDate: string): string => {
    if (projectStartDate && startDate && startDate < projectStartDate) {
      return `Start date cannot be before project start date (${projectStartDate})`;
    }
    if (projectDueDate && dueDate && dueDate > projectDueDate) {
      return `Due date cannot be after project end date (${projectDueDate})`;
    }
    if (projectStartDate && dueDate && dueDate < projectStartDate) {
      return `Due date cannot be before project start date (${projectStartDate})`;
    }
    if (startDate && dueDate && dueDate < startDate) {
      return `Due date cannot be before start date`;
    }
    return '';
  };

  const handleDateChange = (field: 'start_date' | 'due_date', val: string) => {
    const updated = { ...form, [field]: val };
    set({ [field]: val });
    setDateError(validateDates(updated.start_date, updated.due_date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.budget || parseFloat(form.budget) <= 0) {
      setBudgetError('Budget is required and must be greater than 0');
      return;
    }
    if (budgetError) return;
    const dErr = validateDates(form.start_date, form.due_date);
    if (dErr) { setDateError(dErr); return; }
    onSave(form);
  };

  const addExpenseHead = () => {
    set({ expenseHeads: [...form.expenseHeads, { head: 'assessment_cost', label: 'Assessment Cost', amount: '', description: '' }] });
  };

  const updateExpenseHead = (index: number, patch: Partial<ExpenseHead>) => {
    const updated = form.expenseHeads.map((eh, i) => {
      if (i !== index) return eh;
      const merged = { ...eh, ...patch };
      if (patch.head) {
        const opt = EXPENSE_HEAD_OPTIONS.find((o) => o.value === patch.head);
        merged.label = opt?.label || patch.head;
      }
      return merged;
    });
    set({ expenseHeads: updated });
  };

  const removeExpenseHead = (index: number) => {
    set({ expenseHeads: form.expenseHeads.filter((_, i) => i !== index) });
  };

  const handleLockBudget = () => {
    set({ budgetLocked: true });
    setLockConfirm(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">{editingId ? 'Edit Milestone' : 'Add Milestone'}</h2>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-1">Title <span className="text-destructive">*</span></label>
            <Input placeholder="e.g., Development Phase 1" value={form.title} onChange={(e) => set({ title: e.target.value })} required />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea placeholder="Describe what this milestone covers..."
              value={form.description} onChange={(e) => set({ description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Type</label>
              <select value={form.milestoneType} onChange={(e) => set({ milestoneType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {MILESTONE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Status</label>
              <select value={form.status} onChange={(e) => set({ status: e.target.value as MilestoneStatus })}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Start Date</label>
                <Input type="date" value={form.start_date}
                  min={projectStartDate}
                  max={projectDueDate}
                  onChange={(e) => handleDateChange('start_date', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Due Date</label>
                <Input type="date" value={form.due_date}
                  min={projectStartDate || form.start_date}
                  max={projectDueDate}
                  onChange={(e) => handleDateChange('due_date', e.target.value)} />
              </div>
            </div>
            {dateError && (
              <p className="text-[10px] text-red-600 flex items-center gap-1">⚠ {dateError}</p>
            )}
            {(projectStartDate || projectDueDate) && !dateError && (
              <p className="text-[10px] text-muted-foreground">
                Dates must be within project period:
                {projectStartDate ? ` from ${projectStartDate}` : ''}
                {projectDueDate ? ` to ${projectDueDate}` : ''}
              </p>
            )}
          </div>

          {/* ── Budget Section ─────────────────────────────── */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Budget</span>
            </div>

            {/* Currency */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground w-16 flex-shrink-0">Currency</label>
              <select value={form.currency} onChange={(e) => set({ currency: e.target.value })}
                className="flex-1 px-3 py-1.5 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Planned Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  Planned / Proposed Budget <span className="text-destructive">*</span>
                  {form.budgetLocked && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> Locked
                    </span>
                  )}
                </label>
                {!isCreate && !form.budgetLocked && form.budget && (
                  <button
                    type="button"
                    className="text-[10px] text-amber-600 hover:text-amber-700 underline"
                    onClick={() => setLockConfirm(true)}
                  >
                    Lock budget
                  </button>
                )}
              </div>
              <Input
                type="number" min="0"
                placeholder="e.g., 500000"
                value={form.budget}
                disabled={form.budgetLocked}
                className={form.budgetLocked ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
              />
              {budgetError && (
                <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">⚠ {budgetError}</p>
              )}
              {!budgetError && remainingBudget != null && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Remaining project budget: <span className="font-semibold text-foreground">₹{remainingBudget.toLocaleString('en-IN')}</span>
                </p>
              )}
              {isCreate && !budgetError && (
                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Budget will be auto-locked on save.
                </p>
              )}
              {!isCreate && form.budgetLocked && (
                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Planned budget is locked and cannot be changed.
                </p>
              )}
            </div>

            {/* Lock confirmation prompt */}
            {lockConfirm && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm space-y-2">
                <p className="font-medium text-amber-800 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Lock planned budget?
                </p>
                <p className="text-xs text-amber-700">
                  Once locked, the planned budget of <strong>{fmtCurrency(parseFloat(form.budget) || 0, form.currency)}</strong> cannot be changed. The actual budget remains editable.
                </p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={handleLockBudget}>
                    Confirm Lock
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLockConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Actual Budget */}
            <div>
              <label className="text-sm font-medium block mb-1">Actual Budget (Editable)</label>
              <Input
                type="number" min="0"
                placeholder="e.g., 480000"
                value={form.actualBudget}
                onChange={(e) => set({ actualBudget: e.target.value })}
              />
              {form.budget && form.actualBudget && parseFloat(form.actualBudget) > parseFloat(form.budget) && (
                <p className="text-[10px] text-red-600 mt-1">⚠ Actual exceeds planned budget by {fmtCurrency(parseFloat(form.actualBudget) - parseFloat(form.budget), form.currency)}</p>
              )}
            </div>
          </div>

          {/* ── Expense Heads ──────────────────────────────── */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Expense Heads
              </span>
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addExpenseHead}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {form.expenseHeads.length === 0 && (
              <p className="text-xs text-muted-foreground">No expense heads added. Click Add to record cost categories.</p>
            )}
            {form.expenseHeads.map((eh, i) => (
              <div key={i} className="rounded-md border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={eh.head}
                    onChange={(e) => updateExpenseHead(i, { head: e.target.value })}
                    className="flex-1 px-2 py-1.5 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {EXPENSE_HEAD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => removeExpenseHead(i)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input
                  type="number" min="0"
                  placeholder="Amount (₹)"
                  value={eh.amount}
                  onChange={(e) => updateExpenseHead(i, { amount: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={eh.description}
                  onChange={(e) => updateExpenseHead(i, { description: e.target.value })}
                />
              </div>
            ))}
            {form.expenseHeads.length > 0 && (
              <div className="text-xs text-muted-foreground text-right">
                Total expense heads: <span className="font-semibold text-foreground">
                  {fmtCurrency(form.expenseHeads.reduce((s, eh) => s + (parseFloat(eh.amount) || 0), 0), form.currency)}
                </span>
              </div>
            )}
          </div>

          {/* Effort Estimate */}
          <div>
            <label className="text-sm font-medium block mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Effort Estimate (hours)
            </label>
            <Input type="number" min="0" placeholder="e.g., 160"
              value={form.effortEstimate} onChange={(e) => set({ effortEstimate: e.target.value })} />
          </div>

          {/* Progress slider */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Progress — <span className="text-primary font-semibold">{form.progress}%</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={form.progress}
              onChange={(e) => set({ progress: Number(e.target.value) })} className="w-full accent-primary" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Approval required */}
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-purple-50/50 dark:bg-purple-950/20">
            <input type="checkbox" id="approvalRequired" checked={form.approvalRequired}
              onChange={(e) => set({ approvalRequired: e.target.checked })}
              className="h-4 w-4 accent-purple-600" />
            <div>
              <label htmlFor="approvalRequired" className="text-sm font-medium flex items-center gap-1 cursor-pointer">
                <Lock className="h-3.5 w-3.5 text-purple-600" /> Require Approval to Close
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">An approval request will be created before this milestone can be marked complete.</p>
            </div>
          </div>
        </form>

        {apiError && (
          <div className="px-5 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-xs text-destructive">{apiError}</p>
          </div>
        )}
        <div className="px-5 py-4 border-t flex gap-2">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            {editingId ? 'Update Milestone' : 'Create Milestone'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </div>
    </>
  );
}

// ─── Close Milestone Dialog ───────────────────────────────

function CloseMilestoneDialog({
  milestone, onClose, onConfirm, saving,
}: {
  milestone: Milestone;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  saving: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-xl border shadow-2xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckSquare2 className="h-5 w-5 text-green-600" /> Close Milestone
              </h3>
              <p className="text-sm text-muted-foreground mt-1">"{milestone.title}"</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>

          {milestone.approvalRequired && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-3 text-sm text-purple-700">
              <Lock className="h-4 w-4 inline mr-1.5" />
              This milestone requires approval. An approval request will be created and the milestone will move to <strong>Pending Approval</strong> status.
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">Completion Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Summarize what was accomplished…"
              className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3} />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onConfirm(notes)} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
              {milestone.approvalRequired ? 'Submit for Approval' : 'Close Milestone'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────

export function MilestonesPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const projectQuery = useProject(projectId);
  const milestonesQuery = useMilestones(projectId);
  const createMutation = useCreateMilestone(projectId);
  const updateMutation = useUpdateMilestone(projectId);
  const deleteMutation = useDeleteMilestone(projectId);

  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(
    SEED_MILESTONES.map((m) => ({ ...m, project_id: projectId })),
  );
  const [showPanel, setShowPanel] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [closingMilestone, setClosingMilestone] = useState<Milestone | null>(null);
  const [closingSaving, setClosingSaving] = useState(false);
  const [startingSaving, setStartingSaving] = useState(false);

  const apiMilestones: Milestone[] = (milestonesQuery.data ?? []) as Milestone[];
  const milestones = apiMilestones.length > 0 ? apiMilestones : localMilestones;
  const project = projectQuery.data as any;

  // Auto-start milestones whose start_date has passed and are still NOT_STARTED (not BLOCKED)
  useEffect(() => {
    if (apiMilestones.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      setLocalMilestones((prev) =>
        prev.map((m) => {
          const sd = m.start_date || m.startDate || '';
          if ((m.waterfallStatus === 'NOT_STARTED' || !m.waterfallStatus) && sd && sd <= today && m.status === 'pending') {
            return { ...m, waterfallStatus: 'IN_PROGRESS' as WaterfallStatus, status: 'in_progress' as MilestoneStatus };
          }
          return m;
        })
      );
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const toAutoStart = apiMilestones.filter((m) => {
      const sd = m.start_date || m.startDate || '';
      return (m.waterfallStatus === 'NOT_STARTED' || !m.waterfallStatus) && sd && sd <= today && m.status === 'pending';
    });
    if (toAutoStart.length === 0) return;
    Promise.all(
      toAutoStart.map((m) =>
        api.patch(`/projects/${projectId}/milestones/${m.id}`, { waterfallStatus: 'IN_PROGRESS', status: 'in_progress' }).catch(() => {})
      )
    ).then(() => milestonesQuery.refetch?.());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestonesQuery.data]);
  const projectName = project?.name || 'Project';

  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length;
  const pending = milestones.filter((m) => m.status === 'pending').length;
  const blocked = milestones.filter((m) => m.waterfallStatus === 'BLOCKED').length;
  const totalBudget = milestones.reduce((s, m) => s + (m.budget ?? 0), 0);
  const totalMilestoneBudget = totalBudget;

  // ── Handlers ─────────────────────────────────────────────

  const openCreate = () => { setEditingMilestone(null); setShowPanel(true); };
  const openEdit = (m: Milestone) => { setEditingMilestone(m); setShowPanel(true); };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this milestone? This action cannot be undone.')) return;
    if (apiMilestones.length > 0) {
      deleteMutation.mutate(id);
    } else {
      setLocalMilestones((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSave = (data: MilestoneFormData) => {
    const payload = {
      title: data.title, description: data.description, status: data.status,
      startDate: data.start_date, dueDate: data.due_date, progress: data.progress,
      budget: data.budget ? parseFloat(data.budget) : undefined,
      actualBudget: data.actualBudget ? parseFloat(data.actualBudget) : undefined,
      budgetLocked: data.budgetLocked,
      expenseHeads: data.expenseHeads.length > 0 ? data.expenseHeads : undefined,
      effortEstimate: data.effortEstimate ? parseFloat(data.effortEstimate) : undefined,
      milestoneType: data.milestoneType, approvalRequired: data.approvalRequired, currency: data.currency,
    };
    if (editingMilestone) {
      if (apiMilestones.length > 0) {
        updateMutation.mutate({ id: editingMilestone.id, ...payload }, {
          onSuccess: () => { setShowPanel(false); setEditingMilestone(null); },
        });
      } else {
        const patch: Partial<Milestone> = {
          title: data.title, description: data.description, status: data.status,
          start_date: data.start_date, due_date: data.due_date, progress: data.progress,
          budget: data.budget ? parseFloat(data.budget) : null,
          actualBudget: data.actualBudget ? parseFloat(data.actualBudget) : null,
          budgetLocked: data.budgetLocked,
          expenseHeads: data.expenseHeads,
          effortEstimate: data.effortEstimate ? parseFloat(data.effortEstimate) : null,
          milestoneType: data.milestoneType, approvalRequired: data.approvalRequired, currency: data.currency,
        };
        setLocalMilestones((prev) => prev.map((m) => m.id === editingMilestone.id ? { ...m, ...patch } : m));
        setShowPanel(false); setEditingMilestone(null);
      }
    } else {
      if (apiMilestones.length > 0) {
        createMutation.mutate(payload, { onSuccess: () => setShowPanel(false) });
      } else {
        const newMs: Milestone = {
          id: 'ms_' + Date.now(), project_id: projectId, taskCount: 0,
          title: data.title, description: data.description, status: data.status,
          start_date: data.start_date, due_date: data.due_date, progress: data.progress,
          budget: data.budget ? parseFloat(data.budget) : null,
          actualBudget: data.actualBudget ? parseFloat(data.actualBudget) : null,
          budgetLocked: data.budgetLocked,
          expenseHeads: data.expenseHeads,
          effortEstimate: data.effortEstimate ? parseFloat(data.effortEstimate) : null,
          milestoneType: data.milestoneType, approvalRequired: data.approvalRequired, currency: data.currency,
        };
        setLocalMilestones((prev) => [...prev, newMs]);
        setShowPanel(false);
      }
    }
  };

  const handleCloseMilestone = async (notes: string) => {
    if (!closingMilestone) return;
    setClosingSaving(true);
    try {
      if (apiMilestones.length > 0) {
        await api.post(`/projects/${projectId}/milestones/${closingMilestone.id}/close`, { completionNotes: notes });
        milestonesQuery.refetch?.();
      } else {
        setLocalMilestones((prev) => prev.map((m) =>
          m.id === closingMilestone.id
            ? { ...m, status: closingMilestone.approvalRequired ? 'review' : 'completed', progress: closingMilestone.approvalRequired ? m.progress : 100 }
            : m
        ));
      }
    } finally {
      setClosingSaving(false);
      setClosingMilestone(null);
    }
  };

  const handleStartMilestone = async (m: Milestone) => {
    setStartingSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const originalStart = m.start_date || m.startDate || '';
    // Shift start date to today if today is after original start date
    const newStartDate = originalStart && today > originalStart ? today : originalStart;
    try {
      if (apiMilestones.length > 0) {
        await api.patch(`/projects/${projectId}/milestones/${m.id}`, {
          waterfallStatus: 'IN_PROGRESS',
          status: 'in_progress',
          ...(newStartDate && newStartDate !== originalStart && { startDate: newStartDate }),
        });
        milestonesQuery.refetch?.();
      } else {
        setLocalMilestones((prev) => prev.map((ms) =>
          ms.id === m.id
            ? { ...ms, waterfallStatus: 'IN_PROGRESS' as WaterfallStatus, status: 'in_progress', start_date: newStartDate || ms.start_date }
            : ms
        ));
      }
    } finally {
      setStartingSaving(false);
    }
  };

  const panelInitial: MilestoneFormData = editingMilestone
    ? {
        title: editingMilestone.title,
        description: editingMilestone.description || '',
        status: editingMilestone.status,
        start_date: editingMilestone.start_date || editingMilestone.startDate || '',
        due_date: editingMilestone.due_date || editingMilestone.dueDate || '',
        progress: editingMilestone.progress,
        budget: editingMilestone.budget != null ? String(editingMilestone.budget) : '',
        actualBudget: editingMilestone.actualBudget != null ? String(editingMilestone.actualBudget) : '',
        budgetLocked: editingMilestone.budgetLocked ?? false,
        expenseHeads: editingMilestone.expenseHeads ?? [],
        effortEstimate: editingMilestone.effortEstimate != null ? String(editingMilestone.effortEstimate) : '',
        milestoneType: editingMilestone.milestoneType || 'general',
        approvalRequired: editingMilestone.approvalRequired ?? false,
        currency: editingMilestone.currency || 'INR',
      }
    : EMPTY_FORM;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (milestonesQuery.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/projects/${projectId}/board`} className="hover:text-foreground">{projectName}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Milestones</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Flag className="h-6 w-6 text-primary" /> Milestones</h1>
            <p className="text-muted-foreground text-sm mt-1">Track project milestones, budgets and delivery phases</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Milestone</Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: total, cls: 'text-foreground', bg: '' },
          { label: 'Completed', value: completed, cls: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'In Progress', value: inProgress, cls: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Pending', value: pending, cls: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/30' },
          { label: 'Blocked', value: blocked, cls: blocked > 0 ? 'text-red-600' : 'text-gray-400', bg: blocked > 0 ? 'bg-red-50 dark:bg-red-950/20' : '' },
        ].map(({ label, value, cls, bg }) => (
          <Card key={label} className={cn('p-4', bg)}>
            <p className={cn('text-2xl font-bold', cls)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Card>
        ))}
        {totalBudget > 0 && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-lg font-bold text-amber-700">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Budget</p>
          </Card>
        )}
      </div>

      {/* Budget summary + ERP badge */}
      <div className="flex flex-wrap items-center gap-3">
        {project?.budget && (
          <div className="text-xs text-muted-foreground">
            Project budget: <span className="font-semibold text-foreground">₹{Number(project.budget).toLocaleString('en-IN')}</span>
            {' · '}Allocated: <span className={cn('font-semibold', totalMilestoneBudget > Number(project.budget) ? 'text-red-600' : 'text-foreground')}>
              ₹{totalMilestoneBudget.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {/* ERP Sync badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
          ERP Sync: Not connected
          <button className="ml-1 text-primary hover:underline text-[10px]" onClick={() => {}}>Configure</button>
        </div>
      </div>

      {/* Timeline */}
      {milestones.length > 0 ? (
        <div className="mt-2">
          {milestones.map((m, i) => (
            <MilestoneCard key={m.id} milestone={m} isLast={i === milestones.length - 1}
              onEdit={openEdit} onDelete={handleDelete} onClose={setClosingMilestone} onStart={handleStartMilestone}
              projectId={projectId} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Flag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">No milestones yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first milestone to start tracking project phases.</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add First Milestone</Button>
        </Card>
      )}

      {/* Slide-in form panel */}
      {showPanel && (
        <MilestoneFormPanel editingId={editingMilestone?.id ?? null} initialData={panelInitial}
          onSave={handleSave} onClose={() => { setShowPanel(false); setEditingMilestone(null); }} saving={isSaving}
          apiError={(createMutation.error as any)?.response?.data?.error?.message || (updateMutation.error as any)?.response?.data?.error?.message || null}
          projectBudget={project?.budget ? Number(project.budget) : null}
          usedBudget={totalMilestoneBudget}
          projectStartDate={project?.startDate || project?.start_date || undefined}
          projectDueDate={project?.dueDate || project?.due_date || undefined}
        />
      )}

      {/* Close milestone dialog */}
      {closingMilestone && (
        <CloseMilestoneDialog milestone={closingMilestone}
          onClose={() => setClosingMilestone(null)} onConfirm={handleCloseMilestone} saving={closingSaving} />
      )}
    </div>
  );
}
