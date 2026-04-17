import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { WorkflowConfig } from '@/types';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void;
  project?: ProjectData | null;
  workflows?: WorkflowConfig[];
  saving?: boolean;
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

export function ProjectModal({ open, onClose, onSave, project, workflows = [], saving = false }: ProjectModalProps) {
  const isEdit = !!project;
  const [form, setForm] = useState<ProjectFormData>({
    name: '',
    description: '',
    key: '',
    visibility: 'private',
    color: '#3B82F6',
    workflow_config_id: workflows[0]?.id,
    start_date: '',
    due_date: '',
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
      });
    }
    setErrors({});
    setSubmitError('');
  }, [project, open, workflows]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Project name is required';
    if (!form.key.trim()) newErrors.key = 'Project key is required';
    if (form.key.length < 2 || form.key.length > 10) newErrors.key = 'Key must be 2-10 characters';
    if (!/^[A-Z0-9]+$/.test(form.key.toUpperCase())) newErrors.key = 'Key must contain only letters and numbers';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (validateForm()) {
      try {
        onSave({
          ...form,
          key: form.key.toUpperCase(),
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to save project');
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Customer Portal Redesign"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Project Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Key *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as 'private' | 'org_wide' | 'public' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full border-2 ${form.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Workflow Config */}
          {workflows.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
              <select
                value={form.workflow_config_id || ''}
                onChange={(e) => setForm({ ...form, workflow_config_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
