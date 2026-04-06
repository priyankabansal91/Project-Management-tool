import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, MoreHorizontal, MessageSquare, Paperclip, Calendar, ArrowLeft } from 'lucide-react';
import { cn, priorityColor, formatDate } from '@/lib/utils';
import type { Task, KanbanColumn } from '@/types';

const mockColumns: KanbanColumn[] = [
  {
    id: 's1', name: 'Backlog', color: '#6B7280',
    tasks: [
      { id: 't6', seq_number: 6, task_key: 'CPR-6', title: 'Add dark mode support', description: null, status_id: 's1', status_name: 'Backlog', priority: 'low', assignee: null, reporter: null, due_date: null, start_date: null, estimated_hours: 4, logged_hours: 0, tags: ['frontend'], custom_fields: {}, position: 10, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
    ],
  },
  {
    id: 's2', name: 'To Do', color: '#3B82F6',
    tasks: [
      { id: 't2', seq_number: 2, task_key: 'CPR-2', title: 'Implement authentication flow', description: 'JWT-based auth with refresh token rotation', status_id: 's2', status_name: 'To Do', priority: 'critical', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-20', start_date: null, estimated_hours: 16, logged_hours: 0, tags: ['backend', 'auth'], custom_fields: {}, position: 20, comment_count: 1, subtask_count: 1, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
    ],
  },
  {
    id: 's3', name: 'In Progress', color: '#F59E0B',
    tasks: [
      { id: 't1', seq_number: 1, task_key: 'CPR-1', title: 'Design new navigation component', description: 'Responsive nav with mobile drawer and desktop mega-menu', status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-02-15', start_date: null, estimated_hours: 8, logged_hours: 3.5, tags: ['frontend', 'design'], custom_fields: {}, position: 10, comment_count: 2, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
      { id: 't5', seq_number: 5, task_key: 'CPR-5', title: 'Add Google OAuth provider', description: null, status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-18', start_date: null, estimated_hours: 4, logged_hours: 1, tags: ['backend', 'auth'], custom_fields: {}, position: 21, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
    ],
  },
  {
    id: 's4', name: 'In Review', color: '#8B5CF6',
    tasks: [
      { id: 't4', seq_number: 4, task_key: 'CPR-4', title: 'Set up CI/CD pipeline', description: null, status_id: 's4', status_name: 'In Review', priority: 'high', assignee: { id: '4', name: 'David Park', avatar_url: null }, reporter: null, due_date: '2026-02-10', start_date: null, estimated_hours: 6, logged_hours: 5, tags: ['devops'], custom_fields: {}, position: 40, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '' },
    ],
  },
  {
    id: 's5', name: 'Done', color: '#10B981',
    tasks: [
      { id: 't3', seq_number: 3, task_key: 'CPR-3', title: 'Customer dashboard wireframes', description: null, status_id: 's5', status_name: 'Done', priority: 'medium', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-01-30', start_date: null, estimated_hours: 4, logged_hours: 4, tags: ['design', 'ux'], custom_fields: {}, position: 30, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: '2026-01-29T00:00:00Z', created_at: '', updated_at: '' },
    ],
  },
];

function TaskCard({ task }: { task: Task }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed_at;

  return (
    <div className="group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <h4 className="text-sm font-medium mb-2 leading-snug">{task.title}</h4>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
          ))}
        </div>
      )}

      {/* Priority */}
      <div className="flex items-center gap-2 mb-3">
        <Badge className={cn('text-[10px] px-1.5 py-0', priorityColor(task.priority))}>{task.priority}</Badge>
        {task.estimated_hours && (
          <span className="text-[10px] text-muted-foreground">{task.logged_hours}/{task.estimated_hours}h</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.comment_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />{task.comment_count}
            </span>
          )}
          {task.subtask_count > 0 && (
            <span className="text-xs text-muted-foreground">{task.subtask_count} sub</span>
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

export function KanbanBoardPage() {
  const { projectId } = useParams();
  const [columns, setColumns] = useState(mockColumns);

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Board Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Link to="/projects">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: '#3B82F6' }} />
              <h1 className="text-lg font-semibold">Customer Portal Redesign</h1>
              <Badge variant="outline">CPR</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter tasks..." className="pl-8 h-9 w-48 text-sm" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5" /> Filters</Button>
          <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Task</Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col w-72 shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                  <span className="text-sm font-semibold">{column.name}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                    {column.tasks.length}
                  </span>
                </div>
                <button className="rounded p-1 hover:bg-accent">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg bg-secondary/30 p-2 min-h-[200px]">
                {column.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}

                {column.tasks.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
