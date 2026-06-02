import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';

const EXPENSE_HEAD_OPTIONS = [
  { value: 'assessment_cost', label: 'Assessment Cost' },
  { value: 'travel_expenses', label: 'Travel Expenses' },
  { value: 'manpower_cost', label: 'Manpower Cost' },
  { value: 'infrastructure_cost', label: 'Infrastructure Cost' },
  { value: 'training_cost', label: 'Training Cost' },
  { value: 'documentation_cost', label: 'Documentation Cost' },
  { value: 'contingency', label: 'Contingency' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

interface ExpenseHead { head: string; label: string; amount: string; description: string; }
import { WorkflowPicker } from './WorkflowPicker';
import type { WorkflowConfig } from '@/types';
import { useMembers } from '@/api/hooks';

interface VerticalOption { id: string; name: string; }

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void | Promise<void>;
  project?: ProjectData | null;
  workflows?: WorkflowConfig[];
  verticals?: VerticalOption[];
  saving?: boolean;
  error?: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  key: string;
  visibility: 'private' | 'org_wide' | 'public';
  color: string;
  workflow_config_id?: string;
  start_date?: string;
  due_date?: string;
  vertical_id?: string;
  budget?: string;
  expense_heads?: ExpenseHead[];
  project_manager_id?: string;
  milestones?: Array<{ title: string; budget: string; due_date: string }>;
  submit_for_approval?: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  key: string;
  visibility: 'private' | 'org_wide' | 'public';
  color: string;
  workflow_config_id?: string;
  start_date?: string;
  due_date?: string;
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'org_wide', label: 'Organization Wide' },
  { value: 'public', label: 'Public' },
];

export function ProjectModal({ open, onClose, onSave, project, workflows = [], verticals = [], saving = false, error: externalError }: ProjectModalProps) {
  const isEdit = !!project;
  const [step, setStep] = useState<1 | 2>(1);
  const [milestoneRows, setMilestoneRows] = useState<Array<{ title: string; budget: string; due_date: string }>>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [submitForApproval, setSubmitForApproval] = useState(true);
  const [form, setForm] = useState<ProjectFormData>({
    name: '',
    description: '',
    key: '',
    visibility: 'private',
    color: '#3B82F6',
    workflow_config_id: workflows[0]?.id,
    start_date: '',
    due_date: '',
    vertical_id: '',
    budget: '',
    project_manager_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || '',
        key: project.key,
        visibility: project.visibility,
        color: project.color,
        workflow_config_id: project.workflow_config_id,
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        budget: '',
        project_manager_id: '',
      });
    } else {
      setForm({
        name: '',
        description: '',
        key: '',
        visibility: 'private',
        color: '#3B82F6',
        workflow_config_id: workflows[0]?.id,
        start_date: '',
        due_date: '',
        vertical_id: '',
        budget: '',
        project_manager_id: '',
      });
    }
    setErrors({});
    setSubmitError('');
    setStep(1);
    setMilestoneRows([]);
    setExpenseHeads([]);
    setSubmitForApproval(true);
  }, [project, open, workflows]);

  const membersQ = useMembers({ page_size: 200 });
  const orgMembers = (membersQ.data?.items ?? []) as Array<{ id: string; firstName?: string; lastName?: string; email?: string }>;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Project name is required';
    if (!form.key.trim()) newErrors.key = 'Project code is required';
    if (form.key.length < 2 || form.key.length > 10) newErrors.key = 'Code must be 2-10 characters';
    if (!/^[A-Z0-9]+$/.test(form.key.toUpperCase())) newErrors.key = 'Code must contain only letters and numbers';
    if (!form.project_manager_id) newErrors.project_manager_id = 'Project Lead is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await onSave({
        ...form,
        key: form.key.toUpperCase(),
        budget: form.budget || undefined,
        expense_heads: expenseHeads.length > 0 ? expenseHeads : undefined,
        milestones: milestoneRows.filter((r) => r.title.trim()),
        submit_for_approval: submitForApproval,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save project');
    }
  };

  const addMilestoneRow = () => {
    setMilestoneRows([...milestoneRows, { title: '', budget: '', due_date: '' }]);
  };

  const removeMilestoneRow = (index: number) => {
    setMilestoneRows(milestoneRows.filter((_, i) => i !== index));
  };

  const updateMilestoneRow = (index: number, field: 'title' | 'budget' | 'due_date', value: string) => {
    setMilestoneRows(milestoneRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const milestoneTotal = milestoneRows.reduce((s, r) => s + (Number(r.budget) || 0), 0);

  const addExpenseHead = () => {
    setExpenseHeads([...expenseHeads, { head: 'assessment_cost', label: 'Assessment Cost', amount: '', description: '' }]);
  };
  const removeExpenseHead = (i: number) => setExpenseHeads(expenseHeads.filter((_, idx) => idx !== i));
  const updateExpenseHead = (i: number, patch: Partial<ExpenseHead>) => {
    setExpenseHeads(expenseHeads.map((eh, idx) => {
      if (idx !== i) return eh;
      const merged = { ...eh, ...patch };
      if (patch.head) {
        const opt = EXPENSE_HEAD_OPTIONS.find((o) => o.value === patch.head);
        merged.label = opt?.label || patch.head;
      }
      return merged;
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={() => { onClose(); setSubmitError(''); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator (only on create) */}
        {!isEdit && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              Project Details
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </span>
              Initial Milestones
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {(externalError || submitError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
              {externalError || submitError}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {(step === 1 || isEdit) && (
            <>
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Project Name *</label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Customer Portal Redesign"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Project Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Project Code *</label>
                <Input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                  placeholder="e.g., CPR"
                  maxLength={10}
                  className={errors.key ? 'border-red-500' : ''}
                />
                {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Project description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as 'private' | 'org_wide' | 'public' })}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full border-2 ${form.color === color ? 'border-foreground' : 'border-border'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Vertical — required on create */}
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vertical <span className="text-destructive">*</span></label>
                  {verticals.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm dark:bg-amber-950/30">
                      No active verticals found. Create and activate a vertical before creating a project.
                    </div>
                  ) : (
                    <select
                      value={form.vertical_id || ''}
                      onChange={(e) => setForm({ ...form, vertical_id: e.target.value })}
                      className={`w-full px-3 py-2 border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.vertical_id ? 'border-red-500' : 'border-input'}`}
                    >
                      <option value="">— Select a vertical —</option>
                      {verticals.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.vertical_id && <p className="text-red-500 text-sm mt-1">{errors.vertical_id}</p>}
                </div>
              )}

              {/* Project Lead (Project Manager) */}
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Project Lead <span className="text-destructive">*</span></label>
                  {orgMembers.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm dark:bg-amber-950/30">
                      No members found. Invite members first.
                    </div>
                  ) : (
                    <select
                      value={form.project_manager_id || ''}
                      onChange={(e) => setForm({ ...form, project_manager_id: e.target.value })}
                      className={`w-full px-3 py-2 border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${errors.project_manager_id ? 'border-red-500' : 'border-input'}`}
                    >
                      <option value="">— Select Project Lead —</option>
                      {orgMembers.map((m) => {
                        const name = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email || m.id;
                        const role = (m as any).role ? ` (${((m as any).role as string).replace(/_/g, ' ')})` : '';
                        return <option key={m.id} value={m.id}>{name}{role}</option>;
                      })}
                    </select>
                  )}
                  {errors.project_manager_id && <p className="text-red-500 text-sm mt-1">{errors.project_manager_id}</p>}
                  <p className="text-xs text-muted-foreground mt-1">The Project Lead is responsible for managing and delivering this project.</p>
                </div>
              )}

              {/* Workflow Config */}
              {workflows.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Workflow</label>
                  <WorkflowPicker
                    workflows={workflows}
                    value={form.workflow_config_id || workflows[0]?.id || ''}
                    onChange={(id) => setForm({ ...form, workflow_config_id: id })}
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>

              {/* Project Budget */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Project Budget (₹) <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  min="0"
                  value={form.budget || ''}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="e.g., 5000000"
                  required
                />
              </div>

              {/* Expense Heads */}
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Expense Heads</label>
                  <button type="button" onClick={addExpenseHead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                {expenseHeads.length === 0 && (
                  <p className="text-xs text-muted-foreground">No expense heads. Click Add to categorize project costs.</p>
                )}
                {expenseHeads.map((eh, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <select value={eh.head} onChange={(e) => updateExpenseHead(i, { head: e.target.value })}
                      className="px-2 py-1.5 border rounded-md text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                      {EXPENSE_HEAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Input type="number" min="0" placeholder="Amount (₹)" value={eh.amount}
                      className="h-8 text-xs"
                      onChange={(e) => updateExpenseHead(i, { amount: e.target.value })} />
                    <button type="button" onClick={() => removeExpenseHead(i)}
                      className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {expenseHeads.length > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    Total: <span className="font-semibold text-foreground">
                      ₹{expenseHeads.reduce((s, eh) => s + (parseFloat(eh.amount) || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions — Step 1 */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                {isEdit ? (
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Saving...' : 'Update Project'}
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNextStep} className="flex-1">
                    Next: Add Milestones →
                  </Button>
                )}
              </div>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && !isEdit && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-foreground">Initial Milestones</h3>
                <button
                  type="button"
                  onClick={addMilestoneRow}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Milestone
                </button>
              </div>

              {milestoneRows.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No milestones added yet. You can add them now or later from the project page.
                </p>
              )}

              {/* Milestone Rows */}
              <div className="space-y-2">
                {milestoneRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateMilestoneRow(index, 'title', e.target.value)}
                      placeholder="Milestone title"
                      className="flex-1 min-w-0"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={row.budget}
                      onChange={(e) => updateMilestoneRow(index, 'budget', e.target.value)}
                      placeholder="Budget ₹"
                      className="w-28"
                    />
                    <Input
                      type="date"
                      value={row.due_date}
                      onChange={(e) => updateMilestoneRow(index, 'due_date', e.target.value)}
                      className="w-36"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestoneRow(index)}
                      className="text-muted-foreground hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Budget indicator */}
              {form.budget && Number(form.budget) > 0 && (
                <div className={`p-2 rounded text-xs ${milestoneTotal > Number(form.budget) ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  Milestone budgets: ₹{milestoneTotal.toLocaleString('en-IN')} of ₹{Number(form.budget).toLocaleString('en-IN')} project budget
                  {milestoneTotal > Number(form.budget) && ' ⚠ Exceeds project budget'}
                </div>
              )}

              {/* Submit for Approval checkbox */}
              {form.vertical_id && (
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={submitForApproval}
                    onChange={(e) => setSubmitForApproval(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-foreground font-medium">Submit for Approval to Vertical Head</span>
                </label>
              )}

              {/* Actions — Step 2 */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  ← Back
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : submitForApproval && form.vertical_id ? 'Submit for Approval' : 'Create Project'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}
