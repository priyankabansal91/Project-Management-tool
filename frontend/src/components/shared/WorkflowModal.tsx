import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';
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

export function WorkflowModal({ open, onClose, onSave, workflow, saving = false }: WorkflowModalProps) {
  const isEdit = !!workflow;
  const [form, setForm] = useState<WorkflowFormData>({
    name: '',
    description: '',
    statuses: [],
    transitions: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (workflow) {
      setForm({
        name: workflow.name,
        description: workflow.description || '',
        statuses: workflow.statuses || [],
        transitions: workflow.transitions || [],
      });
    } else {
      setForm({
        name: '',
        description: '',
        statuses: [
          { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
          { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
          { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
          { id: 's4', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 4 },
        ],
        transitions: [],
      });
    }
    setErrors({});
  }, [workflow, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Workflow name is required';
    if (form.statuses.length === 0) newErrors.statuses = 'At least one status is required';
    if (!form.statuses.some((s) => s.is_initial)) newErrors.statuses = 'At least one initial status is required';
    if (!form.statuses.some((s) => s.is_final)) newErrors.statuses = 'At least one final status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(form);
    }
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
    setForm({ ...form, statuses: [...form.statuses, newStatus] });
  };

  const updateStatus = (index: number, updates: Partial<WorkflowStatus>) => {
    const updated = [...form.statuses];
    updated[index] = { ...updated[index], ...updates };
    setForm({ ...form, statuses: updated });
  };

  const removeStatus = (index: number) => {
    setForm({ ...form, statuses: form.statuses.filter((_, i) => i !== index) });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Workflow' : 'Create New Workflow'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workflow Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name *</label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Kanban, Scrum, Waterfall"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Workflow description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Statuses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Statuses *</label>
              <Button type="button" variant="outline" size="sm" onClick={addStatus}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Status
              </Button>
            </div>

            {errors.statuses && <p className="text-red-500 text-sm mb-3">{errors.statuses}</p>}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {form.statuses.map((status, idx) => (
                <div key={status.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                  {/* Color Picker */}
                  <input
                    type="color"
                    value={status.color}
                    onChange={(e) => updateStatus(idx, { color: e.target.value })}
                    className="h-8 w-8 rounded cursor-pointer border-0"
                  />

                  {/* Status Name */}
                  <Input
                    type="text"
                    value={status.name}
                    onChange={(e) => updateStatus(idx, { name: e.target.value })}
                    placeholder="Status name"
                    className="flex-1 h-8"
                  />

                  {/* Initial Checkbox */}
                  <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={status.is_initial}
                      onChange={(e) => updateStatus(idx, { is_initial: e.target.checked })}
                      className="rounded"
                    />
                    Initial
                  </label>

                  {/* Final Checkbox */}
                  <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={status.is_final}
                      onChange={(e) => updateStatus(idx, { is_final: e.target.checked })}
                      className="rounded"
                    />
                    Final
                  </label>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeStatus(idx)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : isEdit ? 'Update Workflow' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
