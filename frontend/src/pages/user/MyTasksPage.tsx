import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Search, Filter, CheckSquare, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn, priorityColor, formatDate } from '@/lib/utils';
import type { Task } from '@/types';

const mockMyTasks: (Task & { project?: { id: string; name: string; key: string; color: string } })[] = [
  { id: 't1', seq_number: 1, task_key: 'CPR-1', title: 'Design new navigation component', description: null, status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-02-15', start_date: null, estimated_hours: 8, logged_hours: 3.5, tags: ['frontend'], custom_fields: {}, position: 10, comment_count: 2, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '', project: { id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6' } },
  { id: 't5', seq_number: 5, task_key: 'CPR-5', title: 'Add Google OAuth provider', description: null, status_id: 's3', status_name: 'In Progress', priority: 'high', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-02-18', start_date: null, estimated_hours: 4, logged_hours: 1, tags: ['backend'], custom_fields: {}, position: 21, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: null, created_at: '', updated_at: '', project: { id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6' } },
  { id: 't7', seq_number: 3, task_key: 'AGM-3', title: 'Set up GraphQL schema types', description: null, status_id: 's2', status_name: 'To Do', priority: 'medium', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-03-01', start_date: null, estimated_hours: 6, logged_hours: 0, tags: ['backend', 'graphql'], custom_fields: {}, position: 30, comment_count: 1, subtask_count: 2, is_archived: false, completed_at: null, created_at: '', updated_at: '', project: { id: '2', name: 'API Gateway Migration', key: 'AGM', color: '#8B5CF6' } },
  { id: 't3', seq_number: 3, task_key: 'CPR-3', title: 'Customer dashboard wireframes', description: null, status_id: 's5', status_name: 'Done', priority: 'medium', assignee: { id: '3', name: 'Carol Johnson', avatar_url: null }, reporter: null, due_date: '2026-01-30', start_date: null, estimated_hours: 4, logged_hours: 4, tags: ['design'], custom_fields: {}, position: 30, comment_count: 0, subtask_count: 0, is_archived: false, completed_at: '2026-01-29T00:00:00Z', created_at: '', updated_at: '', project: { id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6' } },
];

type TabFilter = 'all' | 'open' | 'overdue' | 'completed';

export function MyTasksPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = mockMyTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'open') return !t.completed_at;
    if (tab === 'completed') return !!t.completed_at;
    if (tab === 'overdue') return t.due_date && new Date(t.due_date) < new Date() && !t.completed_at;
    return true;
  });

  const tabs: { id: TabFilter; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'all', label: 'All Tasks', icon: CheckSquare, count: mockMyTasks.length },
    { id: 'open', label: 'Open', icon: Clock, count: mockMyTasks.filter((t) => !t.completed_at).length },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, count: mockMyTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && !t.completed_at).length },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: mockMyTasks.filter((t) => !!t.completed_at).length },
  ];

  return (
    <div className="space-y-6">
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
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs', tab === t.id ? 'bg-primary/10' : 'bg-secondary')}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Task Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-4 font-medium w-8"></th>
                <th className="p-4 font-medium">Task</th>
                <th className="p-4 font-medium">Project</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed_at;
                return (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                    <td className="p-4">
                      <div className={cn('h-4 w-4 rounded border-2', task.completed_at ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30')} />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                          <span className={cn('font-medium', task.completed_at && 'line-through text-muted-foreground')}>{task.title}</span>
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
                    <td className="p-4"><Badge variant="outline" className="text-xs">{task.status_name}</Badge></td>
                    <td className="p-4"><Badge className={cn('text-xs', priorityColor(task.priority))}>{task.priority}</Badge></td>
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
    </div>
  );
}
