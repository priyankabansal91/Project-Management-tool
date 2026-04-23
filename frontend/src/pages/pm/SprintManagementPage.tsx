import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Plus, Play, CheckCircle2, Clock, Target, Calendar,
  ArrowRight, X, GripVertical, MoreHorizontal, Loader2, ChevronDown,
} from 'lucide-react';
import { cn, formatDate, priorityColor } from '@/lib/utils';
import {
  useProjects,
  useSprints, useSprintBacklog, useCreateSprint, useUpdateSprint, useDeleteSprint,
  useAddTaskToSprint, useRemoveTaskFromSprint,
} from '@/api/hooks';

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

export function SprintManagementPage() {
  const navigate = useNavigate();

  // Project selector
  const projectsQuery = useProjects();
  const projects = projectsQuery.data?.items ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Sprint data
  const sprintsQuery = useSprints(selectedProjectId);
  const backlogQuery = useSprintBacklog(selectedProjectId);
  const sprints = sprintsQuery.data ?? [];
  const backlogTasks = backlogQuery.data ?? [];

  // Mutations
  const createSprint = useCreateSprint(selectedProjectId);
  const updateSprint = useUpdateSprint(selectedProjectId);
  const deleteSprint = useDeleteSprint(selectedProjectId);
  const addTask = useAddTaskToSprint(selectedProjectId);
  const removeTask = useRemoveTaskFromSprint(selectedProjectId);

  // Local UI state
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-select first or active sprint when data loads
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      const active = sprints.find((s) => s.status === 'active');
      setSelectedSprintId(active?.id ?? sprints[0].id);
    }
  }, [sprints, selectedSprintId]);

  // Reset sprint selection when project changes
  useEffect(() => {
    setSelectedSprintId(null);
  }, [selectedProjectId]);

  // Close task menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setTaskMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId) ?? sprints[0];
  const activeSprint = sprints.find((s) => s.status === 'active');

  const totalEstimated = selectedSprint?.tasks.reduce((sum, t: any) => sum + (t.estimated_hours || 0), 0) ?? 0;
  const completedCount = selectedSprint?.tasks.filter((t: any) => t.status_name?.toLowerCase() === 'done').length ?? 0;

  const handleCreateSprint = async () => {
    if (!newSprint.name) return;
    await createSprint.mutateAsync(newSprint);
    setShowCreate(false);
    setNewSprint({ name: '', goal: '', start_date: '', end_date: '' });
  };

  const handleStartSprint = (sprintId: string) => {
    updateSprint.mutate({ sprintId, status: 'active' });
  };

  const handleCompleteSprint = (sprintId: string) => {
    updateSprint.mutate({ sprintId, status: 'completed' });
  };

  const handleAddTask = (taskId: string) => {
    if (!selectedSprint) return;
    addTask.mutate({ sprintId: selectedSprint.id, taskId });
  };

  const handleRemoveTask = (taskId: string) => {
    if (!selectedSprint) return;
    removeTask.mutate({ sprintId: selectedSprint.id, taskId });
    setTaskMenuOpen(null);
  };

  if (projectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Target className="h-12 w-12 text-muted-foreground mb-3 opacity-30" />
        <h3 className="font-semibold text-lg">No projects yet</h3>
        <p className="text-muted-foreground">Create a project first to manage its sprints.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sprint Management</h1>
          <p className="text-muted-foreground">Plan, track, and deliver work in time-boxed iterations</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Project selector */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none rounded-md border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button onClick={() => setShowCreate(true)} disabled={!selectedProjectId}>
            <Plus className="h-4 w-4 mr-1" /> New Sprint
          </Button>
        </div>
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
                  <p className="text-lg font-bold">{activeSprint.task_count}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {activeSprint.tasks.reduce((s: number, t: any) => s + (t.estimated_hours || 0), 0)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Estimated</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">
                    {Math.round((activeSprint.completed_tasks / Math.max(activeSprint.task_count, 1)) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
                {activeSprint.start_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(activeSprint.start_date)} → {formatDate(activeSprint.end_date)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-green-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(activeSprint.completed_tasks / Math.max(activeSprint.task_count, 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {sprintsQuery.isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sprint List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Sprints ({sprints.length})
            </h3>

            {sprints.length === 0 && (
              <div className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sprints yet.</p>
                <p className="text-xs">Click "New Sprint" to create one.</p>
              </div>
            )}

            {sprints.map((sprint) => (
              <Card
                key={sprint.id}
                className={cn(
                  'p-4 cursor-pointer transition-all',
                  selectedSprint?.id === sprint.id ? 'ring-2 ring-primary' : 'hover:shadow-md',
                )}
                onClick={() => setSelectedSprintId(sprint.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{sprint.name}</h4>
                  <div className="flex items-center gap-1">
                    <Badge className={cn('text-xs', statusColors[sprint.status])}>{sprint.status}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(sprint.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {sprint.goal && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{sprint.goal}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{sprint.task_count} tasks</span>
                  <span>{sprint.tasks.reduce((s: number, t: any) => s + (t.estimated_hours || 0), 0)}h</span>
                </div>
                {confirmDelete === sprint.id && (
                  <div className="mt-2 pt-2 border-t flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-destructive flex-1">Delete sprint?</span>
                    <button
                      onClick={() => { deleteSprint.mutate(sprint.id); setConfirmDelete(null); setSelectedSprintId(null); }}
                      className="text-xs px-2 py-0.5 bg-destructive text-destructive-foreground rounded"
                    >
                      Delete
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-0.5 border rounded">
                      Cancel
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Sprint Detail */}
          {selectedSprint ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedSprint.name}</CardTitle>
                    {selectedSprint.goal && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedSprint.goal}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedSprint.status === 'planned' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSprint(selectedSprint.id)}
                        disabled={updateSprint.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updateSprint.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                        Start Sprint
                      </Button>
                    )}
                    {selectedSprint.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteSprint(selectedSprint.id)}
                        disabled={updateSprint.isPending}
                      >
                        {updateSprint.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                        Complete Sprint
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Sprint stats row */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>{selectedSprint.task_count} tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{totalEstimated}h estimated</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{completedCount} done</span>
                  </div>
                </div>

                <div className="space-y-2" ref={menuRef}>
                  {selectedSprint.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
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
                          <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[160px]">
                            <button
                              onClick={() => { navigate(`/tasks/${task.id}`); setTaskMenuOpen(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-accent first:rounded-t-lg"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleRemoveTask(task.id)}
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
                      <p>No tasks in this sprint yet.</p>
                      <p className="text-xs mt-1">Add tasks from the backlog below.</p>
                    </div>
                  )}
                </div>

                {/* Sprint Backlog */}
                {selectedSprint.status !== 'completed' && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Product Backlog
                        {backlogTasks.length > 0 && (
                          <span className="ml-1.5 text-xs font-normal">({backlogTasks.length} tasks)</span>
                        )}
                      </h4>
                      {backlogQuery.isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                    {backlogTasks.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground border border-dashed rounded-lg">
                        <p className="text-sm">All tasks are assigned to sprints.</p>
                        <p className="text-xs mt-1">Create a new task to add it here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {backlogTasks.map((task: any) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 rounded-lg border border-dashed p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                            <span className="text-sm flex-1 truncate">{task.title}</span>
                            <Badge className={cn('text-[10px]', priorityColor(task.priority))}>{task.priority}</Badge>
                            <span className="text-xs text-muted-foreground">{task.estimated_hours || 0}h</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleAddTask(task.id)}
                              disabled={addTask.isPending}
                            >
                              {addTask.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ArrowRight className="h-3 w-3 mr-1" /> Add
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-2 flex items-center justify-center">
              <div className="py-16 text-center text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Select a sprint to see its tasks.</p>
              </div>
            </Card>
          )}
        </div>
      )}

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
                <label className="text-sm font-medium">Sprint Name *</label>
                <Input
                  value={newSprint.name}
                  onChange={(e) => setNewSprint((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sprint 4"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Goal</label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm resize-none h-20 bg-background"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint((p) => ({ ...p, goal: e.target.value }))}
                  placeholder="What should this sprint achieve?"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newSprint.start_date}
                    onChange={(e) => setNewSprint((p) => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newSprint.end_date}
                    onChange={(e) => setNewSprint((p) => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreateSprint} disabled={!newSprint.name || createSprint.isPending}>
                  {createSprint.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Create Sprint
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
