import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn, priorityColor } from '@/lib/utils';
import { X, Bold, Italic, List, Link2, Eye, Code, ChevronDown } from 'lucide-react';
import type { Task, WorkflowStatus } from '@/types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  task?: Task | null;               // null = create mode
  projectKey?: string;
  statuses?: WorkflowStatus[];
  members?: { id: string; name: string; avatar_url: string | null }[];
  saving?: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status_id: string;
  status_name: string;
  assignee_id: string | null;
  due_date: string;
  start_date: string;
  estimated_hours: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const;

export function TaskModal({ open, onClose, onSave, task, projectKey, statuses = [], members = [], saving }: TaskModalProps) {
  const isEdit = !!task;

  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status_id: '',
    status_name: '',
    assignee_id: null,
    due_date: '',
    start_date: '',
    estimated_hours: '',
    tags: [],
    custom_fields: {},
  });

  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status_id: task.status_id || '',
        status_name: task.status_name || '',
        assignee_id: task.assignee?.id || null,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        start_date: task.start_date ? task.start_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours?.toString() || '',
        tags: task.tags || [],
        custom_fields: task.custom_fields || {},
      });
    } else {
      // Default for new task
      const initialStatus = statuses.find((s) => s.is_initial) || statuses[0];
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        status_id: initialStatus?.id || '',
        status_name: initialStatus?.name || '',
        assignee_id: null,
        due_date: '',
        start_date: '',
        estimated_hours: '',
        tags: [],
        custom_fields: {},
      });
    }
  }, [task, statuses]);

  const updateField = (field: keyof TaskFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    setForm((prev) => ({ ...prev, status_id: statusId, status_name: status?.name || '' }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        updateField('tags', [...form.tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField('tags', form.tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const selectedAssignee = members.find((m) => m.id === form.assignee_id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] bg-black/50" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            {projectKey && <Badge variant="outline" className="font-mono text-xs">{projectKey}</Badge>}
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Cmd+Enter to save</span>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 p-6 space-y-4 border-r">
              {/* Title */}
              <div>
                <Input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Task title..."
                  className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  autoFocus
                  required
                />
              </div>

              {/* Description Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Description</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPreviewMode(false)} className={cn('px-2 py-1 text-xs rounded', !previewMode && 'bg-accent font-medium')}>
                      Write
                    </button>
                    <button type="button" onClick={() => setPreviewMode(true)} className={cn('px-2 py-1 text-xs rounded', previewMode && 'bg-accent font-medium')}>
                      <Eye className="h-3 w-3 inline mr-1" />Preview
                    </button>
                  </div>
                </div>

                {!previewMode && (
                  <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-1 border rounded-t-md bg-secondary/30">
                      <button type="button" className="p-1.5 rounded hover:bg-accent" onClick={() => {
                        const ta = document.getElementById('desc-editor') as HTMLTextAreaElement;
                        const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
                        const rep = `**${sel || 'bold text'}**`;
                        updateField('description', ta.value.substring(0, ta.selectionStart) + rep + ta.value.substring(ta.selectionEnd));
                      }}><Bold className="h-3.5 w-3.5" /></button>
                      <button type="button" className="p-1.5 rounded hover:bg-accent" onClick={() => {
                        const ta = document.getElementById('desc-editor') as HTMLTextAreaElement;
                        const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
                        updateField('description', ta.value.substring(0, ta.selectionStart) + `*${sel || 'italic'}*` + ta.value.substring(ta.selectionEnd));
                      }}><Italic className="h-3.5 w-3.5" /></button>
                      <button type="button" className="p-1.5 rounded hover:bg-accent" onClick={() => {
                        updateField('description', form.description + '\n- ');
                      }}><List className="h-3.5 w-3.5" /></button>
                      <button type="button" className="p-1.5 rounded hover:bg-accent" onClick={() => {
                        updateField('description', form.description + '\n```\ncode\n```');
                      }}><Code className="h-3.5 w-3.5" /></button>
                      <button type="button" className="p-1.5 rounded hover:bg-accent" onClick={() => {
                        updateField('description', form.description + '[text](url)');
                      }}><Link2 className="h-3.5 w-3.5" /></button>
                    </div>
                    <textarea
                      id="desc-editor"
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe the task... (Markdown supported)"
                      className="w-full min-h-[160px] rounded-b-md border border-t-0 p-3 text-sm font-mono resize-y bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </>
                )}

                {previewMode && (
                  <div className="min-h-[160px] rounded-md border p-3 text-sm prose prose-sm max-w-none">
                    {form.description ? (
                      form.description.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold mt-3 mb-1">{line.replace('## ', '')}</h3>;
                        if (line.startsWith('- [ ] ')) return <div key={i} className="flex items-center gap-2"><input type="checkbox" disabled /><span>{line.replace('- [ ] ', '')}</span></div>;
                        if (line.startsWith('- [x] ')) return <div key={i} className="flex items-center gap-2"><input type="checkbox" checked disabled /><span className="line-through">{line.replace('- [x] ', '')}</span></div>;
                        if (line.startsWith('- ')) return <div key={i} className="ml-4">• {line.replace('- ', '')}</div>;
                        if (line.startsWith('```')) return <pre key={i} className="bg-secondary p-2 rounded text-xs">{line.replace('```', '')}</pre>;
                        if (!line.trim()) return <br key={i} />;
                        return <p key={i}>{line}</p>;
                      })
                    ) : (
                      <p className="text-muted-foreground italic">No description yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-md border min-h-[40px]">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={form.tags.length === 0 ? 'Type tag and press Enter...' : ''}
                    className="flex-1 min-w-[100px] text-sm bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="p-4 space-y-4 bg-secondary/20">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={form.status_id}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-md border p-2 text-sm bg-card"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {form.status_id && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statuses.find((s) => s.id === form.status_id)?.color }} />
                    <span className="text-xs">{form.status_name}</span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                <div className="grid grid-cols-5 gap-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateField('priority', p)}
                      className={cn(
                        'rounded-md px-1.5 py-1.5 text-[10px] font-medium border transition-all text-center',
                        form.priority === p ? cn(priorityColor(p), 'ring-2 ring-ring ring-offset-1') : 'bg-card hover:bg-accent'
                      )}
                    >
                      {p === 'none' ? '—' : p.charAt(0).toUpperCase() + p.slice(1, 4)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    className="flex w-full items-center gap-2 rounded-md border p-2 text-sm bg-card hover:bg-accent"
                  >
                    {selectedAssignee ? (
                      <>
                        <Avatar name={selectedAssignee.name} src={selectedAssignee.avatar_url} size="sm" />
                        <span>{selectedAssignee.name}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </button>

                  {showAssigneeDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-card shadow-lg z-10 max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { updateField('assignee_id', null); setShowAssigneeDropdown(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span className="text-muted-foreground">Unassigned</span>
                      </button>
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { updateField('assignee_id', m.id); setShowAssigneeDropdown(false); }}
                          className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent', form.assignee_id === m.id && 'bg-primary/5')}
                        >
                          <Avatar name={m.name} src={m.avatar_url} size="sm" />
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
                <Input type="date" value={form.due_date} onChange={(e) => updateField('due_date', e.target.value)} className="text-sm" />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                <Input type="date" value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} className="text-sm" />
              </div>

              {/* Estimated Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Hours</label>
                <Input type="number" step="0.5" min="0" value={form.estimated_hours} onChange={(e) => updateField('estimated_hours', e.target.value)} placeholder="0" className="text-sm" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-secondary/30">
            <p className="text-xs text-muted-foreground">
              {isEdit ? `Editing ${task?.task_key}` : 'New task'}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!form.title.trim() || saving}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
