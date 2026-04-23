import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent, type DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreHorizontal, MessageSquare, Calendar, ArrowLeft, GripVertical, Trash2, ExternalLink } from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';
import { TaskModal, type TaskFormData } from '@/components/shared/TaskModal';
import { useKanbanTasks, useCreateTask, useMoveTask, useProject, useDeleteTask } from '@/api/hooks';
import type { Task, KanbanColumn, WorkflowStatus } from '@/types';

// ─── Fallback mock data (used when API is unavailable) ──

const fallbackColumns: KanbanColumn[] = [
  { id: 's1', name: 'Backlog', color: '#6B7280', tasks: [
    { id: 't6', seq_number: 6, task_key: 'CPR-6', title: 'Add dark mode support', description: null, status_id: 's1', status_name: 'Backlog', priority: 'low', assignee: null, reporter: null, due_date: null, start_date: null, estimated_hours: 4, logged_hours: 0, tags: ['frontend'], custom_fields: {}, position: 10, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
  ]},
  { id: 's2', name: 'To Do', color: '#3B82F6', tasks: [
    { id: 't2', seq_number: 2, task_key: 'CPR-2', title: 'Implement authentication flow', description: 'JWT-based auth with refresh token rotation', status_id: 's2', status_name: 'To Do', priority: 'critical', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-20', start_date: null, estimated_hours: 16, logged_hours: 0, tags: ['backend', 'auth'], custom_fields: {}, position: 20, comment_count: 1, subtask_count: 1, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
  ]},
  { id: 's3', name: 'In Progress', color: '#F59E0B', tasks: [
    { id: 't1', seq_number: 1, task_key: 'CPR-1', title: 'Design new navigation component', description: 'Responsive nav with mobile drawer', status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-02-15', start_date: null, estimated_hours: 8, logged_hours: 3.5, tags: ['frontend', 'design'], custom_fields: {}, position: 10, comment_count: 2, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
    { id: 't5', seq_number: 5, task_key: 'CPR-5', title: 'Add Google OAuth provider', description: null, status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-18', start_date: null, estimated_hours: 4, logged_hours: 1, tags: ['backend', 'auth'], custom_fields: {}, position: 21, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
  ]},
  { id: 's4', name: 'In Review', color: '#8B5CF6', tasks: [
    { id: 't4', seq_number: 4, task_key: 'CPR-4', title: 'Set up CI/CD pipeline', description: null, status_id: 's4', status_name: 'In Review', priority: 'high', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-10', start_date: null, estimated_hours: 6, logged_hours: 5, tags: ['devops'], custom_fields: {}, position: 40, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
  ]},
  { id: 's5', name: 'Done', color: '#10B981', tasks: [
    { id: 't3', seq_number: 3, task_key: 'CPR-3', title: 'Customer dashboard wireframes', description: null, status_id: 's5', status_name: 'Done', priority: 'medium', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-01-30', start_date: null, estimated_hours: 4, logged_hours: 4, tags: ['design', 'ux'], custom_fields: {}, position: 30, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: '2026-01-29T00:00:00Z', created_at: '', updated_at: '' },
  ]},
];

const fallbackStatuses: WorkflowStatus[] = [
  { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
  { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
  { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
  { id: 's4', name: 'In Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
  { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
];

const fallbackMembers = [
  { id: '3', name: 'Carol Johnson', avatar_url: null },
  { id: '4', name: 'David Park', avatar_url: null },
  { id: '2', name: 'Bob Martinez', avatar_url: null },
  { id: '1', name: 'Alice Chen', avatar_url: null },
];

// ─── Sortable Task Card ─────────────────────────────────

function SortableTaskCard({ task, onClick, onDelete }: { task: Task; onClick: () => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardContent task={task} onClick={onClick} dragListeners={listeners} onDelete={onDelete} />
    </div>
  );
}

function TaskCardMenu({ task, onDelete, onOpen }: { task: Task; onDelete: (id: string) => void; onOpen: (task: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirmDelete(false); } }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-40 rounded-md border bg-popover shadow-lg py-1">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={(e) => { e.stopPropagation(); onOpen(task); setOpen(false); }}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Open Task
          </button>
          <div className="my-1 border-t" />
          {!confirmDelete ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Task
            </button>
          ) : (
            <div className="px-3 py-2 space-y-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-destructive font-medium">Delete this task?</p>
              <div className="flex gap-1">
                <button className="flex-1 rounded bg-destructive text-destructive-foreground text-xs py-1" onClick={() => { onDelete(task.id); setOpen(false); }}>Delete</button>
                <button className="flex-1 rounded border text-xs py-1" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCardContent({ task, onClick, dragListeners, onDelete }: { task: Task; onClick?: () => void; dragListeners?: any; onDelete?: (id: string) => void }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed_at;

  return (
    <div
      className="group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1">
          <button {...dragListeners} className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
        </div>
        {onDelete && <TaskCardMenu task={task} onDelete={onDelete} onOpen={(t) => onClick && onClick()} />}
      </div>

      <h4 className="text-sm font-medium mb-2 leading-snug">{task.title}</h4>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Badge className={cn('text-[10px] px-1.5 py-0', priorityColor(task.priority))}>{task.priority}</Badge>
        {task.estimated_hours != null && (
          <span className="text-[10px] text-muted-foreground">{task.logged_hours}/{task.estimated_hours}h</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.comment_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />{task.comment_count}
            </span>
          )}
          {task.due_date && (
            <span className={cn('flex items-center gap-0.5 text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
              <Calendar className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatar_url} size="sm" />}
      </div>
    </div>
  );
}

// ─── Droppable Column ───────────────────────────────────

function KanbanColumnComponent({ column, onAddTask, onTaskClick, onDeleteTask }: { column: KanbanColumn; onAddTask: (statusId: string) => void; onTaskClick: (task: Task) => void; onDeleteTask: (id: string) => void }) {
  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-2 py-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(column.id)} className="rounded p-1 hover:bg-accent">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-secondary/30 p-2 min-h-[200px]" data-column-id={column.id}>
          {column.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} onDelete={onDeleteTask} />
          ))}
          {column.tasks.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Kanban Board ──────────────────────────────────

export function KanbanBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // API hooks (fallback to mock data if API unavailable)
  const kanbanQuery = useKanbanTasks(projectId || '');
  const projectQuery = useProject(projectId || '');
  const createTask = useCreateTask(projectId || '');
  const moveTask = useMoveTask();
  const deleteTask = useDeleteTask();

  // State
  const [columns, setColumns] = useState<KanbanColumn[]>(fallbackColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStatusId, setModalStatusId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');

  // Use API data when available, otherwise fallback
  const boardColumns = kanbanQuery.data?.columns || columns;
  const projectData = projectQuery.data;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Find which column a task belongs to
  const findColumn = (taskId: string): KanbanColumn | undefined => {
    return boardColumns.find((col) => col.tasks.some((t) => t.id === taskId));
  };

  // ─── Drag Handlers ────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const task = boardColumns.flatMap((c) => c.tasks).find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findColumn(active.id as string);
    const overCol = findColumn(over.id as string) || boardColumns.find((c) => c.id === over.id);

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    // Move task to new column (optimistic)
    setColumns((prev) => {
      const newCols = prev.map((col) => ({ ...col, tasks: [...col.tasks] }));
      const srcCol = newCols.find((c) => c.id === activeCol.id)!;
      const dstCol = newCols.find((c) => c.id === overCol.id)!;
      const taskIdx = srcCol.tasks.findIndex((t) => t.id === active.id);
      if (taskIdx === -1) return prev;
      const [task] = srcCol.tasks.splice(taskIdx, 1);
      task.status_id = dstCol.id;
      task.status_name = dstCol.name;
      dstCol.tasks.push(task);
      return newCols;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const task = boardColumns.flatMap((c) => c.tasks).find((t) => t.id === active.id) ||
                 columns.flatMap((c) => c.tasks).find((t) => t.id === active.id);
    const targetCol = findColumn(over.id as string) || boardColumns.find((c) => c.id === over.id) ||
                      columns.find((c) => c.tasks.some((t) => t.id === over.id)) || columns.find((c) => c.id === over.id);

    if (task && targetCol) {
      // Calculate new position
      const overIdx = targetCol.tasks.findIndex((t) => t.id === over.id);
      const position = overIdx >= 0 ? (overIdx + 1) * 10 : (targetCol.tasks.length + 1) * 10;

      // Call API (fire-and-forget for optimistic UI)
      moveTask.mutate({
        taskId: task.id,
        status_id: targetCol.id,
        status_name: targetCol.name,
        position,
      });
    }
  };

  // ─── Task Modal Handlers ──────────────────────────────

  const handleAddTask = (statusId: string) => {
    setModalStatusId(statusId);
    setEditingTask(null);
    setShowModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    navigate(`/tasks/${task.id}`);
  };

  const handleSaveTask = (formData: TaskFormData) => {
    if (editingTask) {
      // TODO: update task API
      setShowModal(false);
    } else {
      createTask.mutate({
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        status_id: formData.status_id || modalStatusId,
        assignee_id: formData.assignee_id || undefined,
        due_date: formData.due_date || undefined,
        start_date: formData.start_date || undefined,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
        tags: formData.tags,
      }, {
        onSuccess: () => setShowModal(false),
      });

      // Optimistic: add to local state too
      const col = columns.find((c) => c.id === (formData.status_id || modalStatusId));
      if (col) {
        const newTask: Task = {
          id: `temp-${Date.now()}`,
          seq_number: 99,
          task_key: `CPR-?`,
          title: formData.title,
          description: formData.description,
          status_id: formData.status_id || modalStatusId,
          status_name: formData.status_name || col.name,
          priority: formData.priority as any,
          assignee: formData.assignee_id ? fallbackMembers.find((m) => m.id === formData.assignee_id) || null : null,
          reporter: null,
          due_date: formData.due_date || null,
          start_date: formData.start_date || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          logged_hours: 0,
          tags: formData.tags,
          custom_fields: {},
          position: (col.tasks.length + 1) * 10,
          comment_count: 0,
          subtask_count: 0,
          is_archived: false,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, tasks: [...c.tasks, newTask] } : c));
        setShowModal(false);
      }
    }
  };

  // Filter tasks by search
  const filteredColumns = useMemo(() => {
    if (!search) return kanbanQuery.data?.columns || columns;
    return (kanbanQuery.data?.columns || columns).map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))),
    }));
  }, [kanbanQuery.data, columns, search]);

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: projectData?.color || '#3B82F6' }} />
            <h1 className="text-lg font-semibold">{projectData?.name || 'Customer Portal Redesign'}</h1>
            <Badge variant="outline">{projectData?.key || 'CPR'}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter tasks..." className="pl-8 h-9 w-48 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => handleAddTask(fallbackStatuses[0]?.id || 's1')}>
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns with DnD */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {filteredColumns.map((column) => (
              <KanbanColumnComponent key={column.id} column={column} onAddTask={handleAddTask} onTaskClick={handleTaskClick} onDeleteTask={(id) => deleteTask.mutate(id)} />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? <TaskCardContent task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        projectKey={projectData?.key || 'CPR'}
        statuses={fallbackStatuses}
        members={fallbackMembers}
        saving={createTask.isPending}
      />
    </div>
  );
}
