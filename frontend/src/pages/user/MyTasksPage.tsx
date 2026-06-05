import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CheckSquare, Clock, AlertTriangle, CheckCircle2, Trash2, ChevronDown, X } from 'lucide-react';
import { cn, priorityColor, formatDate } from '@/lib/utils';
import { useMyTasks, useBulkTaskAction } from '@/api/hooks';
import type { Task } from '@/types';


type TabFilter = 'all' | 'open' | 'overdue' | 'completed';

// ─── Bulk Action Bar ────────────────────────────────────

interface BulkActionBarProps {
  selectedCount: number;
  onMarkDone: () => void;
  onSetPriority: (priority: string) => void;
  onDelete: () => void;
  onClear: () => void;
  isPending: boolean;
}

function BulkActionBar({ selectedCount, onMarkDone, onSetPriority, onDelete, onClear, isPending }: BulkActionBarProps) {
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 lg:left-64 z-30 flex justify-center pb-6 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-card shadow-2xl px-5 py-3">
        {/* Count label */}
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {selectedCount} {selectedCount === 1 ? 'task' : 'tasks'} selected
        </span>

        <div className="h-4 w-px bg-border" />

        {/* Mark Done */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={onMarkDone}
          disabled={isPending}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />
          Mark Done
        </Button>

        {/* Set Priority dropdown */}
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => { setPriorityOpen((p) => !p); setConfirmDelete(false); }}
            disabled={isPending}
          >
            Priority
            <ChevronDown className="h-3.5 w-3.5 ml-1" />
          </Button>
          {priorityOpen && (
            <div className="absolute bottom-full mb-1 left-0 w-36 rounded-lg border bg-card shadow-lg py-1 z-50">
              {['critical', 'high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  onClick={() => { onSetPriority(p); setPriorityOpen(false); }}
                  className="flex w-full items-center px-3 py-1.5 text-xs hover:bg-accent capitalize"
                >
                  <Badge className={cn('text-[10px] mr-2', priorityColor(p))}>{p}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-destructive font-medium">Are you sure?</span>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs px-2"
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              disabled={isPending}
            >
              Yes, delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-destructive hover:text-destructive hover:border-destructive"
            onClick={() => { setConfirmDelete(true); setPriorityOpen(false); }}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}

        <div className="h-4 w-px bg-border" />

        {/* Clear selection */}
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export function MyTasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabFilter) || 'all';
  const [tab, setTab] = useState<TabFilter>(initialTab);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: apiData } = useMyTasks();
  const apiItems = (apiData as any)?.items;
  const sourceTasks = (apiItems ?? []) as (Task & { project?: { id: string; name: string; key: string; color: string } })[];

  // Local task state so bulk operations reflect immediately without a round-trip
  const [localTasks, setLocalTasks] = useState(sourceTasks);
  const lastSourceRef = useRef(sourceTasks);

  // Sync when API data changes (e.g. initial load, or after refetch)
  // Using useEffect avoids reverting optimistic updates when selection is cleared
  useEffect(() => {
    if (sourceTasks !== lastSourceRef.current) {
      lastSourceRef.current = sourceTasks;
      setLocalTasks(sourceTasks);
    }
  }, [sourceTasks]);

  const bulkAction = useBulkTaskAction();

  const filtered = localTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'open') return !t.completed_at;
    if (tab === 'completed') return !!t.completed_at;
    if (tab === 'overdue') return !!(t.due_date && new Date(t.due_date) < new Date() && !t.completed_at);
    return true;
  });

  const tabs: { id: TabFilter; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'all', label: 'All Tasks', icon: CheckSquare, count: localTasks.length },
    { id: 'open', label: 'Open', icon: Clock, count: localTasks.filter((t) => !t.completed_at).length },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, count: localTasks.filter((t) => !!(t.due_date && new Date(t.due_date) < new Date() && !t.completed_at)).length },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: localTasks.filter((t) => !!t.completed_at).length },
  ];

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id));
  const someFilteredSelected = filtered.some((t) => selectedIds.has(t.id));

  const toggleTask = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkOperation = (operation: 'status' | 'priority' | 'assignee' | 'delete', value?: string) => {
    const taskIds = Array.from(selectedIds);
    if (taskIds.length === 0) return;

    // Optimistic local update so UI responds immediately
    setLocalTasks((prev) => {
      if (operation === 'delete') return prev.filter((t) => !taskIds.includes(t.id));
      return prev.map((t) => {
        if (!taskIds.includes(t.id)) return t;
        if (operation === 'status') {
          const isDone = value === 'done';
          return { ...t, status_name: isDone ? 'Done' : (value ?? t.status_name), completed_at: isDone ? new Date().toISOString() : null };
        }
        if (operation === 'priority') return { ...t, priority: (value ?? t.priority) as Task['priority'] };
        return t;
      });
    });

    const snapshot = localTasks;
    bulkAction.mutate({ taskIds, operation, value }, {
      onSuccess: () => clearSelection(),
      onError: () => { setLocalTasks(snapshot); clearSelection(); },
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">All tasks assigned to you across projects</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs', tab === t.id ? 'bg-primary/10' : 'bg-secondary')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Task Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {/* Select all checkbox */}
                <th className="p-4 font-medium w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 cursor-pointer rounded border-muted-foreground/30"
                    aria-label="Select all tasks"
                  />
                </th>
                <th className="p-4 font-medium">Task</th>
                <th className="p-4 font-medium">Project</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground text-sm">
                    No tasks found
                  </td>
                </tr>
              )}
              {filtered.map((task) => {
                const isOverdue = !!(task.due_date && new Date(task.due_date) < new Date() && !task.completed_at);
                const isSelected = selectedIds.has(task.id);
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      'border-b last:border-0 hover:bg-accent/50 cursor-pointer',
                      isSelected && 'bg-primary/5'
                    )}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    {/* Per-row checkbox */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTask(task.id)}
                        className="h-4 w-4 cursor-pointer rounded border-muted-foreground/30"
                        aria-label={`Select task ${task.task_key}`}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                          <span className={cn('font-medium', task.completed_at && 'line-through text-muted-foreground')}>
                            {task.title}
                          </span>
                        </div>
                        {task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.map((tag) => (
                              <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded" style={{ backgroundColor: task.project?.color }} />
                        <span className="text-muted-foreground">{task.project?.key}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">{task.status_name}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={cn('text-xs', priorityColor(task.priority))}>{task.priority}</Badge>
                    </td>
                    <td className="p-4">
                      <span className={cn('text-sm', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                        {formatDate(task.due_date)}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground">
                      {task.logged_hours}/{task.estimated_hours || 0}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onMarkDone={() => handleBulkOperation('status', 'done')}
        onSetPriority={(p) => handleBulkOperation('priority', p)}
        onDelete={() => handleBulkOperation('delete')}
        onClear={clearSelection}
        isPending={bulkAction.isPending}
      />
    </div>
  );
}
