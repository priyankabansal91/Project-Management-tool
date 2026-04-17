import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Play, CheckCircle2, Clock, Target, Calendar, ArrowRight, X, GripVertical, MoreHorizontal } from 'lucide-react';
import { cn, formatDate, priorityColor } from '@/lib/utils';

interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  start_date: string | null;
  end_date: string | null;
  tasks: SprintTask[];
}

interface SprintTask {
  id: string;
  task_key: string;
  title: string;
  priority: string;
  assignee: { name: string } | null;
  status_name: string;
  estimated_hours: number | null;
}

const mockSprints: Sprint[] = [
  {
    id: 'sp3', name: 'Sprint 3', goal: 'Complete auth flow and navigation redesign', status: 'active',
    start_date: '2026-02-10', end_date: '2026-02-24',
    tasks: [
      { id: 't1', task_key: 'CPR-1', title: 'Design new navigation component', priority: 'high', assignee: { name: 'Carol Johnson' }, status_name: 'In Progress', estimated_hours: 8 },
      { id: 't2', task_key: 'CPR-2', title: 'Implement authentication flow', priority: 'critical', assignee: { name: 'David Park' }, status_name: 'To Do', estimated_hours: 16 },
      { id: 't5', task_key: 'CPR-5', title: 'Add Google OAuth provider', priority: 'high', assignee: { name: 'David Park' }, status_name: 'In Progress', estimated_hours: 4 },
      { id: 't4', task_key: 'CPR-4', title: 'Set up CI/CD pipeline', priority: 'high', assignee: { name: 'David Park' }, status_name: 'In Review', estimated_hours: 6 },
    ],
  },
  {
    id: 'sp2', name: 'Sprint 2', goal: 'Dashboard wireframes and project setup', status: 'completed',
    start_date: '2026-01-27', end_date: '2026-02-09',
    tasks: [
      { id: 't3', task_key: 'CPR-3', title: 'Customer dashboard wireframes', priority: 'medium', assignee: { name: 'Carol Johnson' }, status_name: 'Done', estimated_hours: 4 },
    ],
  },
  {
    id: 'sp4', name: 'Sprint 4', goal: 'Search, notifications, and polish', status: 'planned',
    start_date: '2026-02-24', end_date: '2026-03-10',
    tasks: [
      { id: 't6', task_key: 'CPR-6', title: 'Add dark mode support', priority: 'low', assignee: null, status_name: 'Backlog', estimated_hours: 4 },
    ],
  },
];

const backlogTasks: SprintTask[] = [
  { id: 'b1', task_key: 'CPR-7', title: 'Implement full-text search', priority: 'medium', assignee: null, status_name: 'Backlog', estimated_hours: 10 },
  { id: 'b2', task_key: 'CPR-8', title: 'Add email notification preferences', priority: 'low', assignee: null, status_name: 'Backlog', estimated_hours: 6 },
  { id: 'b3', task_key: 'CPR-9', title: 'Create onboarding tutorial', priority: 'low', assignee: null, status_name: 'Backlog', estimated_hours: 8 },
];

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

export function SprintManagementPage() {
  const navigate = useNavigate();
  const [sprints, setSprints] = useState(mockSprints);
  const [selectedSprint, setSelectedSprint] = useState(mockSprints[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);

  const activeSprint = sprints.find((s) => s.status === 'active');
  const totalPoints = selectedSprint.tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const completedTasks = selectedSprint.tasks.filter((t) => t.status_name === 'Done').length;

  const handleCreateSprint = () => {
    if (!newSprint.name) return;
    setSprints((prev) => [...prev, {
      id: `sp-${Date.now()}`, ...newSprint, status: 'planned' as const, tasks: [],
    }]);
    setShowCreate(false);
    setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
  };

  const handleStartSprint = (sprintId: string) => {
    setSprints((prev) => prev.map((s) => {
      if (s.id === sprintId) return { ...s, status: 'active' as const };
      if (s.status === 'active') return { ...s, status: 'completed' as const };
      return s;
    }));
  };

  const handleCompleteSprint = (sprintId: string) => {
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, status: 'completed' as const } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sprint Management</h1>
          <p className="text-muted-foreground">Plan, track, and deliver work in time-boxed iterations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Sprint</Button>
      </div>

      {/* Active Sprint Banner */}
      {activeSprint && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{activeSprint.name}</h3>
                    <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeSprint.goal}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-lg font-bold">{activeSprint.tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{totalPoints}h</p>
                  <p className="text-xs text-muted-foreground">Estimated</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{Math.round((completedTasks / Math.max(activeSprint.tasks.length, 1)) * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(activeSprint.start_date)} → {formatDate(activeSprint.end_date)}</span>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-green-200 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(completedTasks / Math.max(activeSprint.tasks.length, 1)) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sprints</h3>
          {sprints.map((sprint) => (
            <Card
              key={sprint.id}
              className={cn('p-4 cursor-pointer transition-all', selectedSprint.id === sprint.id ? 'ring-2 ring-primary' : 'hover:shadow-md')}
              onClick={() => setSelectedSprint(sprint)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{sprint.name}</h4>
                <Badge className={cn('text-xs', statusColors[sprint.status])}>{sprint.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{sprint.goal}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{sprint.tasks.length} tasks</span>
                <span>{sprint.tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0)}h</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Sprint Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{selectedSprint.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedSprint.goal}</p>
              </div>
              <div className="flex gap-2">
                {selectedSprint.status === 'planned' && (
                  <Button size="sm" onClick={() => handleStartSprint(selectedSprint.id)} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-3.5 w-3.5" /> Start Sprint
                  </Button>
                )}
                {selectedSprint.status === 'active' && (
                  <Button size="sm" variant="outline" onClick={() => handleCompleteSprint(selectedSprint.id)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete Sprint
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSprint.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                      <span className="text-sm font-medium truncate">{task.title}</span>
                    </div>
                  </div>
                  <Badge className={cn('text-[10px] shrink-0', priorityColor(task.priority))}>{task.priority}</Badge>
                  <Badge variant="outline" className="text-xs shrink-0">{task.status_name}</Badge>
                  {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                  <span className="text-xs text-muted-foreground shrink-0">{task.estimated_hours || 0}h</span>
                  <div className="relative">
                    <button
                      onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                    >
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {taskMenuOpen === task.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[150px]">
                        <button
                          onClick={() => {
                            navigate(`/tasks/${task.id}`);
                            setTaskMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent first:rounded-t-lg"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement edit task
                            setTaskMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent"
                        >
                          Edit Task
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement remove from sprint
                            setTaskMenuOpen(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-red-600 last:rounded-b-lg"
                        >
                          Remove from Sprint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {selectedSprint.tasks.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No tasks in this sprint. Drag tasks from the backlog.</p>
                </div>
              )}
            </div>

            {/* Sprint Backlog */}
            {selectedSprint.status !== 'completed' && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Product Backlog (drag to add)</h4>
                <div className="space-y-2">
                  {backlogTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 rounded-lg border border-dashed p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-grab">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                      <span className="text-sm flex-1 truncate">{task.title}</span>
                      <Badge className={cn('text-[10px]', priorityColor(task.priority))}>{task.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{task.estimated_hours}h</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <ArrowRight className="h-3 w-3" /> Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Sprint Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Sprint</h2>
                <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sprint Name</label>
                <Input value={newSprint.name} onChange={(e) => setNewSprint((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Sprint 5" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal</label>
                <textarea className="w-full rounded-md border p-2 text-sm resize-none h-20" value={newSprint.goal} onChange={(e) => setNewSprint((p) => ({ ...p, goal: e.target.value }))} placeholder="What should this sprint achieve?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={newSprint.start_date} onChange={(e) => setNewSprint((p) => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input type="date" value={newSprint.end_date} onChange={(e) => setNewSprint((p) => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreateSprint} disabled={!newSprint.name}>Create Sprint</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
