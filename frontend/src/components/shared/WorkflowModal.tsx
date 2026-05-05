import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { WorkflowTemplateSelector } from './WorkflowTemplateSelector';
import type { WorkflowStatus } from '@/types';

interface WorkflowModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WorkflowFormData) => void;
  workflow?: WorkflowData | null;
  saving?: boolean;
}

export interface WorkflowFormData {
  name: string;
  description?: string;
  statuses: WorkflowStatus[];
  transitions?: Array<{ from: string; to: string[] }>;
}

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  statuses: WorkflowStatus[];
  transitions?: Array<{ from: string; to: string[] }>;
}

const DEFAULT_COLORS = [
  '#6B7280', '#3B82F6', '#F59E0B', '#8B5CF6', '#10B981',
  '#06B6D4', '#EC4899', '#EF4444', '#14B8A6', '#F97316',
];

const BLANK_STATUSES: WorkflowStatus[] = [
  { id: 's1', name: 'To Do',       color: '#6B7280', is_initial: true,  is_final: false, order: 1 },
  { id: 's2', name: 'In Progress', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
  { id: 's3', name: 'Done',        color: '#10B981', is_initial: false, is_final: true,  order: 3 },
];

export function WorkflowModal({ open, onClose, onSave, workflow, saving = false }: WorkflowModalProps) {
  const isEdit = !!workflow;
  const [step, setStep] = useState<'template' | 'editor'>(isEdit ? 'editor' : 'template');
  const [form, setForm] = useState<WorkflowFormData>({ name: '', description: '', statuses: BLANK_STATUSES, transitions: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (workflow) {
      setForm({ name: workflow.name, description: workflow.description || '', statuses: workflow.statuses || [], transitions: workflow.transitions || [] });
      setStep('editor');
    } else {
      setForm({ name: '', description: '', statuses: BLANK_STATUSES, transitions: [] });
      setStep('template');
    }
    setErrors({});
  }, [workflow, open]);

  const applyTemplate = (template: any) => {
    setForm({ name: template.name, description: template.description || '', statuses: template.statuses, transitions: template.transitions || [] });
    setStep('editor');
  };

  const startBlank = () => {
    setForm({ name: '', description: '', statuses: BLANK_STATUSES, transitions: [] });
    setStep('editor');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Workflow name is required';
    if (form.statuses.length === 0) e.statuses = 'At least one status is required';
    else if (!form.statuses.some(s => s.is_initial)) e.statuses = 'Mark at least one status as Initial';
    else if (!form.statuses.some(s => s.is_final))   e.statuses = 'Mark at least one status as Final';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const addStatus = () => {
    const newStatus: WorkflowStatus = {
      id: `s${Date.now()}`,
      name: 'New Status',
      color: DEFAULT_COLORS[form.statuses.length % DEFAULT_COLORS.length],
      is_initial: false,
      is_final: false,
      order: form.statuses.length + 1,
    };
    setForm(f => ({ ...f, statuses: [...f.statuses, newStatus] }));
  };

  const updateStatus = (index: number, updates: Partial<WorkflowStatus>) => {
    setForm(f => {
      const updated = [...f.statuses];
      updated[index] = { ...updated[index], ...updates };
      return { ...f, statuses: updated };
    });
  };

  const removeStatus = (index: number) => {
    setForm(f => ({ ...f, statuses: f.statuses.filter((_, i) => i !== index) }));
  };

  if (!open) return null;

  // ── Template selection screen ─────────────────────────────
  if (step === 'template') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="text-lg font-semibold">Create New Workflow</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <p className="text-sm text-muted-foreground mb-4">
              Choose a template to start from, or build your own workflow from scratch.
            </p>
            <WorkflowTemplateSelector selectedTemplate={null} onSelect={applyTemplate} />
          </div>

          {/* Footer — always visible */}
          <div className="flex gap-3 px-6 py-4 border-t shrink-0">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="outline" onClick={startBlank} className="flex-1">
              Start from Scratch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Workflow editor screen ────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            {!isEdit && (
              <button onClick={() => setStep('template')} className="text-sm text-muted-foreground hover:text-foreground">
                ← Templates
              </button>
            )}
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Workflow' : 'New Workflow'}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Workflow Name <span className="text-destructive">*</span></label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Kanban, Scrum, Approval Flow"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe when to use this workflow..."
                rows={2}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Statuses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Statuses <span className="text-destructive">*</span>
                  <span className="text-xs font-normal text-muted-foreground ml-2">({form.statuses.length} steps)</span>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addStatus}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Status
                </Button>
              </div>

              {errors.statuses && <p className="text-destructive text-xs mb-2">{errors.statuses}</p>}

              <div className="space-y-2">
                {form.statuses.map((status, idx) => (
                  <div key={status.id} className="flex items-center gap-2 p-3 border rounded-lg bg-secondary/30">
                    {/* Drag handle (visual only) */}
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

                    {/* Color picker */}
                    <div className="relative shrink-0">
                      <input
                        type="color"
                        value={status.color}
                        onChange={(e) => updateStatus(idx, { color: e.target.value })}
                        className="h-8 w-8 rounded cursor-pointer border border-border p-0.5 bg-transparent"
                        title="Pick colour"
                      />
                    </div>

                    {/* Status name */}
                    <Input
                      value={status.name}
                      onChange={(e) => updateStatus(idx, { name: e.target.value })}
                      placeholder="Status name"
                      className="flex-1 h-8 text-sm"
                    />

                    {/* Initial toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={status.is_initial}
                        onChange={(e) => updateStatus(idx, { is_initial: e.target.checked })}
                        className="h-3.5 w-3.5 rounded"
                      />
                      Initial
                    </label>

                    {/* Final toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={status.is_final}
                        onChange={(e) => updateStatus(idx, { is_final: e.target.checked })}
                        className="h-3.5 w-3.5 rounded"
                      />
                      Final
                    </label>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeStatus(idx)}
                      disabled={form.statuses.length <= 1}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {form.statuses.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    No statuses yet — click "Add Status" to build your workflow
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Tip: "Initial" marks where tasks start; "Final" marks where they complete.
              </p>
            </div>
          </div>

          {/* Footer — always visible */}
          <div className="flex gap-3 px-6 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving…' : isEdit ? 'Update Workflow' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
