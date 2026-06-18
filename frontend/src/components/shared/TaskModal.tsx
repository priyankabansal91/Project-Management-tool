import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn, priorityColor, calcBusinessHours } from '@/lib/utils';
import { X, Bold, Italic, List, Link2, Eye, Code, ChevronDown, Paperclip, FileText, FileSpreadsheet, Image, File, Upload, Flag, AlertCircle } from 'lucide-react';
import type { Task, WorkflowStatus } from '@/types';

const ACCEPTED_TYPES = '.doc,.docx,.xls,.xlsx,.csv,.pdf,.jpg,.jpeg,.png,.gif,.webp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

function fileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('word') || type.includes('document')) return FileText;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface MilestoneOption {
  id: string;
  title: string;
  status?: string;
  waterfall_status?: string;
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
  task?: Task | null;               // null = create mode
  projectKey?: string;
  statuses?: WorkflowStatus[];
  members?: { id: string; name: string; avatar_url: string | null }[];
  milestones?: MilestoneOption[];
  saving?: boolean;
  error?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  status_id: string;
  status_name: string;
  assignee_id: string | null;
  milestone_id: string;
  due_date: string;
  start_date: string;
  estimated_hours: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  attachments: StagedFile[];
}

const PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'] as const;

export function TaskModal({ open, onClose, onSave, task, projectKey, statuses = [], members = [], milestones, saving, error }: TaskModalProps) {
  const isEdit = !!task;

  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status_id: '',
    status_name: '',
    assignee_id: null,
    milestone_id: '',
    due_date: '',
    start_date: '',
    estimated_hours: '',
    tags: [],
    custom_fields: {},
    attachments: [],
  });
  const [milestoneError, setMilestoneError] = useState('');
  const [assigneeError, setAssigneeError] = useState('');
  const [manualHours, setManualHours] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate estimated hours from start/due dates (skip if user manually set a value)
  useEffect(() => {
    if (manualHours) return;
    if (form.start_date && form.due_date) {
      const hours = calcBusinessHours(form.start_date, form.due_date);
      if (hours > 0) setForm((prev) => ({ ...prev, estimated_hours: String(hours) }));
    }
  }, [form.start_date, form.due_date, manualHours]);

  // Populate form when editing
  useEffect(() => {
    setMilestoneError('');
    setManualHours(false);
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status_id: task.status_id || '',
        status_name: task.status_name || '',
        assignee_id: task.assignee?.id || null,
        milestone_id: (task as any).milestone_id || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        start_date: task.start_date ? task.start_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours?.toString() || '',
        tags: task.tags || [],
        custom_fields: task.custom_fields || {},
        attachments: [],
      });
    } else {
      const initialStatus = statuses.find((s) => s.is_initial) || statuses[0];
      // Auto-select if only one active milestone available
      const defaultMilestone = milestones?.length === 1 ? milestones[0].id : '';
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        status_id: initialStatus?.id || '',
        status_name: initialStatus?.name || '',
        assignee_id: null,
        milestone_id: defaultMilestone,
        due_date: '',
        start_date: '',
        estimated_hours: '',
        tags: [],
        custom_fields: {},
        attachments: [],
      });
    }
  }, [task, statuses, milestones]);

  const handleFiles = (files: File[]) => {
    setFileError('');
    const valid: StagedFile[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" exceeds 10 MB limit`);
        continue;
      }
      valid.push({ id: `f_${Date.now()}_${Math.random()}`, file, name: file.name, size: file.size, type: file.type });
    }
    if (valid.length) updateField('attachments', [...form.attachments, ...valid]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const removeAttachment = (id: string) => {
    updateField('attachments', form.attachments.filter((a) => a.id !== id));
  };

  const updateField = (field: keyof TaskFormData, value: unknown) => {
    if (field === 'estimated_hours') setManualHours(true);
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

    // Milestone required on create
    if (!isEdit && milestones !== undefined) {
      if (milestones.length === 0) {
        setMilestoneError('No milestones exist. Create a milestone for this project first.');
        return;
      }
      if (!form.milestone_id) {
        setMilestoneError('A milestone is required. Please select one before creating the task.');
        return;
      }
    }
    setMilestoneError('');

    // Assignee required on create
    if (!isEdit && !form.assignee_id) {
      setAssigneeError('Please assign this task to a team member.');
      return;
    }
    setAssigneeError('');

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
              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Attachments
                    {form.attachments.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{form.attachments.length}</Badge>
                    )}
                  </label>
                  <span className="text-xs text-muted-foreground">Docs, Excel, Images · max 10 MB each</span>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors',
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30'
                  )}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop<br />
                    .doc .docx .xls .xlsx .csv .pdf .jpg .png .gif
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>

                {fileError && <p className="text-xs text-destructive">{fileError}</p>}

                {/* Staged files list */}
                {form.attachments.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {form.attachments.map((a) => {
                      const Icon = fileIcon(a.type);
                      return (
                        <div key={a.id} className="flex items-center gap-2 rounded-md border bg-secondary/30 px-3 py-2">
                          <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatBytes(a.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }}
                            className="flex-shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="p-4 space-y-4 bg-secondary/20">
              {/* Milestone — required on create */}
              {milestones !== undefined && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Flag className="h-3 w-3" /> Milestone
                    {!isEdit && <span className="text-destructive">*</span>}
                  </label>
                  <select
                    value={form.milestone_id}
                    onChange={(e) => { updateField('milestone_id', e.target.value); setMilestoneError(''); }}
                    className={cn(
                      'w-full rounded-md border p-2 text-sm bg-card',
                      milestoneError ? 'border-destructive ring-1 ring-destructive' : ''
                    )}
                  >
                    <option value="">— Select milestone —</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                  {milestoneError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {milestoneError}
                    </p>
                  )}
                  {milestones.length === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> No milestones exist yet. Create one first.
                    </p>
                  )}
                </div>
              )}

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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Assignee {!isEdit && <span className="text-destructive">*</span>}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowAssigneeDropdown(!showAssigneeDropdown); setAssigneeError(''); }}
                    className={cn('flex w-full items-center gap-2 rounded-md border p-2 text-sm bg-card hover:bg-accent', assigneeError && 'border-destructive ring-1 ring-destructive')}
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
                          onClick={() => { updateField('assignee_id', m.id); setShowAssigneeDropdown(false); setAssigneeError(''); }}
                          className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent', form.assignee_id === m.id && 'bg-primary/5')}
                        >
                          <Avatar name={m.name} src={m.avatar_url} size="sm" />
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {assigneeError && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="h-3 w-3" /> {assigneeError}
                  </p>
                )}
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimated Hours</label>
                  {form.estimated_hours && !manualHours && (
                    <span className="text-xs text-blue-500 font-medium">auto</span>
                  )}
                  {form.estimated_hours && manualHours && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-blue-500"
                      onClick={() => { setManualHours(false); }}
                      title="Reset to auto-calculated value"
                    >
                      reset to auto
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.estimated_hours}
                  onChange={(e) => updateField('estimated_hours', e.target.value)}
                  placeholder={form.start_date && form.due_date ? 'Calculating...' : '0'}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-secondary/30 space-y-2">
            {(error || milestoneError) && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{error || milestoneError}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {isEdit ? `Editing ${task?.task_key}` : 'New task'}
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={!form.title.trim() || saving || (!isEdit && milestones && milestones.length > 0 && !form.milestone_id)}
                >
                  {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
