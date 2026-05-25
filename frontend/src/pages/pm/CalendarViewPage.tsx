import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Plus, Filter, Eye, EyeOff } from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';
import { TaskModal, type TaskFormData } from '@/components/shared/TaskModal';
import { useMyTasks, useCreateTask, useProjects, useWorkflows, useMilestones } from '@/api/hooks';

interface CalendarTask {
  id: string;
  task_key: string;
  title: string;
  priority: string;
  assignee: { name: string } | null;
  status_name: string;
  due_date: string;
  project: { key: string; color: string; id: string; name?: string };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const mockProjects = [
  { id: 'p1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6' },
  { id: 'p2', name: 'API Gateway Migration', key: 'AGM', color: '#8B5CF6' },
  { id: 'p3', name: 'Mobile App v2', key: 'MAV2', color: '#F59E0B' },
  { id: 'p4', name: 'HR Onboarding Platform', key: 'HROP', color: '#10B981' },
  { id: 'p5', name: 'Data Analytics Dashboard', key: 'DAD', color: '#EF4444' },
];

const mockCalendarTasks: CalendarTask[] = [
  { id: 't1', task_key: 'CPR-12', title: 'Implement user auth flow', priority: 'high', assignee: { name: 'Alice Chen' }, status_name: 'In Progress', due_date: '2026-04-20', project: { key: 'CPR', color: '#3B82F6', id: 'p1', name: 'Customer Portal Redesign' } },
  { id: 't2', task_key: 'CPR-14', title: 'Design settings page', priority: 'medium', assignee: { name: 'Emily Zhang' }, status_name: 'To Do', due_date: '2026-04-22', project: { key: 'CPR', color: '#3B82F6', id: 'p1', name: 'Customer Portal Redesign' } },
  { id: 't3', task_key: 'AGM-5', title: 'Migrate payment endpoints', priority: 'critical', assignee: { name: 'David Park' }, status_name: 'In Review', due_date: '2026-04-21', project: { key: 'AGM', color: '#8B5CF6', id: 'p2', name: 'API Gateway Migration' } },
  { id: 't4', task_key: 'AGM-8', title: 'Load testing new gateway', priority: 'high', assignee: { name: 'Raj Patel' }, status_name: 'To Do', due_date: '2026-04-25', project: { key: 'AGM', color: '#8B5CF6', id: 'p2', name: 'API Gateway Migration' } },
  { id: 't5', task_key: 'MAV2-3', title: 'Push notification setup', priority: 'high', assignee: { name: 'James Wright' }, status_name: 'In Progress', due_date: '2026-04-23', project: { key: 'MAV2', color: '#F59E0B', id: 'p3', name: 'Mobile App v2' } },
  { id: 't6', task_key: 'MAV2-7', title: 'Offline mode sync', priority: 'medium', assignee: { name: 'Lena Novak' }, status_name: 'Backlog', due_date: '2026-04-28', project: { key: 'MAV2', color: '#F59E0B', id: 'p3', name: 'Mobile App v2' } },
  { id: 't7', task_key: 'HROP-2', title: 'Create onboarding wizard', priority: 'high', assignee: { name: 'Kate Adams' }, status_name: 'In Progress', due_date: '2026-04-24', project: { key: 'HROP', color: '#10B981', id: 'p4', name: 'HR Onboarding Platform' } },
  { id: 't8', task_key: 'HROP-6', title: 'Email template builder', priority: 'low', assignee: { name: 'Mike Torres' }, status_name: 'To Do', due_date: '2026-04-30', project: { key: 'HROP', color: '#10B981', id: 'p4', name: 'HR Onboarding Platform' } },
  { id: 't9', task_key: 'DAD-4', title: 'Real-time chart streaming', priority: 'critical', assignee: { name: 'Marco Silva' }, status_name: 'In Progress', due_date: '2026-04-21', project: { key: 'DAD', color: '#EF4444', id: 'p5', name: 'Data Analytics Dashboard' } },
  { id: 't10', task_key: 'DAD-9', title: 'Export to Power BI', priority: 'medium', assignee: null, status_name: 'Backlog', due_date: '2026-04-29', project: { key: 'DAD', color: '#EF4444', id: 'p5', name: 'Data Analytics Dashboard' } },
  { id: 't11', task_key: 'CPR-18', title: 'Profile image upload', priority: 'low', assignee: { name: 'Emily Zhang' }, status_name: 'Done', due_date: '2026-04-18', project: { key: 'CPR', color: '#3B82F6', id: 'p1', name: 'Customer Portal Redesign' } },
  { id: 't12', task_key: 'AGM-11', title: 'Rate limiter config', priority: 'high', assignee: { name: 'Sarah Kim' }, status_name: 'To Do', due_date: '2026-04-27', project: { key: 'AGM', color: '#8B5CF6', id: 'p2', name: 'API Gateway Migration' } },
  { id: 't13', task_key: 'CPR-22', title: 'Accessibility audit fixes', priority: 'medium', assignee: { name: 'Alice Chen' }, status_name: 'To Do', due_date: '2026-04-26', project: { key: 'CPR', color: '#3B82F6', id: 'p1', name: 'Customer Portal Redesign' } },
  { id: 't14', task_key: 'MAV2-11', title: 'Biometric login', priority: 'medium', assignee: { name: 'James Wright' }, status_name: 'To Do', due_date: '2026-04-30', project: { key: 'MAV2', color: '#F59E0B', id: 'p3', name: 'Mobile App v2' } },
  { id: 't15', task_key: 'HROP-9', title: 'Document upload flow', priority: 'high', assignee: { name: 'Kate Adams' }, status_name: 'In Review', due_date: '2026-04-22', project: { key: 'HROP', color: '#10B981', id: 'p4', name: 'HR Onboarding Platform' } },
  { id: 't16', task_key: 'DAD-12', title: 'Anomaly detection alerts', priority: 'high', assignee: { name: 'Marco Silva' }, status_name: 'In Progress', due_date: '2026-04-25', project: { key: 'DAD', color: '#EF4444', id: 'p5', name: 'Data Analytics Dashboard' } },
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  while (days.length < 42) { const d = new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1); days.push({ date: d, isCurrentMonth: false }); }
  return days;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarViewPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<string | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [visibleProjects, setVisibleProjects] = useState<Set<string>>(new Set(mockProjects.map((p) => p.id)));
  const [showProjectPanel, setShowProjectPanel] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const { data: apiTasksData } = useMyTasks();
  const { data: apiProjectsData } = useProjects();
  const { data: workflows = [] } = useWorkflows();

  const allProjects = apiProjectsData?.items?.length ? apiProjectsData.items : mockProjects;
  const allTasks: CalendarTask[] = (apiTasksData?.items?.length ? apiTasksData.items : mockCalendarTasks) as CalendarTask[];

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => visibleProjects.has(t.project.id));
  }, [allTasks, visibleProjects]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    filteredTasks.forEach((t) => { if (t.due_date) { const k = t.due_date.slice(0, 10); (map[k] = map[k] || []).push(t); } });
    return map;
  }, [filteredTasks]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const createTaskMutation = useCreateTask(selectedProjectId || '');
  const milestonesQuery = useMilestones(selectedProjectId || '');

  const today = dateKey(new Date());
  const monthLabel = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const toggleProject = (pid: string) => {
    setVisibleProjects((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  const showAllProjects = () => setVisibleProjects(new Set(allProjects.map((p: any) => p.id)));
  const hideAllProjects = () => setVisibleProjects(new Set());

  const handleDateClick = (date: Date) => {
    if (allProjects.length > 0) {
      setSelectedProjectId((allProjects[0] as any).id);
      setSelectedDateForTask(dateKey(date));
      setModalOpen(true);
    }
  };

  const handleCreateTask = async (data: TaskFormData) => {
    if (!selectedProjectId) return;
    try {
      const taskData = {
        ...data,
        due_date: selectedDateForTask || data.due_date,
        milestone_id: data.milestone_id || undefined,
        estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      };
      await createTaskMutation.mutateAsync(taskData);
      setModalOpen(false);
      setSelectedDateForTask(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const selectedProject = allProjects.find((p: any) => p.id === selectedProjectId) as any;
  const projectWorkflow = workflows.find((w) => w.id === selectedProject?.workflow_config_id);

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTasks.forEach((t) => {
      const pid = t.project.id;
      counts[pid] = (counts[pid] || 0) + 1;
    });
    return counts;
  }, [allTasks]);

  const monthTasks = filteredTasks
    .filter((t) => t.due_date && t.due_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View tasks by due date &middot; {filteredTasks.length} tasks across {visibleProjects.size} projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowProjectPanel(!showProjectPanel)}>
            <Filter className="h-3.5 w-3.5" /> {showProjectPanel ? 'Hide' : 'Show'} Filter
          </Button>
          <Button size="sm" onClick={() => { if (allProjects.length) { setSelectedProjectId((allProjects[0] as any).id); setModalOpen(true); } }}>
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedDateForTask(null); }}
        onSave={handleCreateTask}
        projectKey={selectedProject?.key}
        statuses={projectWorkflow?.statuses || []}
        milestones={(milestonesQuery.data ?? []).map((m: any) => ({ id: m.id, title: m.title }))}
        saving={createTaskMutation.isPending}
        error={(createTaskMutation.error as any)?.response?.data?.error?.message}
      />

      <div className="flex gap-5">
        {/* Project Filter Panel */}
        {showProjectPanel && (
          <Card className="w-64 shrink-0 p-4 space-y-3 self-start">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Projects</h3>
              <div className="flex gap-1">
                <button onClick={showAllProjects} className="text-[10px] text-primary hover:underline">All</button>
                <span className="text-muted-foreground text-[10px]">/</span>
                <button onClick={hideAllProjects} className="text-[10px] text-primary hover:underline">None</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {(allProjects as any[]).map((p) => {
                const isVisible = visibleProjects.has(p.id);
                const count = projectTaskCounts[p.id] || 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProject(p.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-left transition-all',
                      isVisible ? 'bg-accent/60' : 'opacity-40 hover:opacity-70',
                    )}
                  >
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: isVisible ? p.color : '#D1D5DB' }} />
                    <span className="flex-1 truncate font-medium text-xs">{p.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{count}</Badge>
                    {isVisible ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
            {/* Legend */}
            <div className="pt-2 border-t text-[11px] text-muted-foreground">
              <p>Click to show/hide project tasks on calendar.</p>
              <p className="mt-1">Color bars on tasks match project colors.</p>
            </div>
          </Card>
        )}

        {/* Calendar */}
        <div className="flex-1 space-y-4">
          {/* Month Nav */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-secondary/30">
              {DAYS.map((day) => (<div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">{day}</div>))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(({ date, isCurrentMonth }, i) => {
                const key = dateKey(date);
                const isToday = key === today;
                const dayTasks = tasksByDate[key] || [];
                return (
                  <div
                    key={i}
                    onClick={() => isCurrentMonth && handleDateClick(date)}
                    className={cn(
                      'min-h-[110px] border-b border-r p-1.5 transition-colors',
                      !isCurrentMonth && 'bg-secondary/20 opacity-40',
                      isToday && 'bg-primary/5',
                      isCurrentMonth && 'cursor-pointer hover:bg-accent/30',
                      (i + 1) % 7 === 0 && 'border-r-0',
                    )}
                  >
                    <div className={cn(
                      'text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full',
                      isToday && 'bg-primary text-primary-foreground',
                      !isToday && 'text-muted-foreground'
                    )}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent transition-colors"
                          style={{ borderLeft: `3px solid ${task.project.color}` }}
                          title={`[${task.project.key}] ${task.title} — ${task.priority} — ${task.assignee?.name || 'Unassigned'}`}
                        >
                          <span className="text-[10px] truncate flex-1">{task.task_key} {task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{dayTasks.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Task List Below Calendar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Tasks due in {monthLabel} ({monthTasks.length})</h3>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                <option value="all">All visible projects</option>
                {(allProjects as any[]).filter((p) => visibleProjects.has(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {monthTasks
                .filter((t) => selectedProjectFilter === 'all' || t.project.id === selectedProjectFilter)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent/50">
                    <div className="h-2.5 w-2.5 rounded" style={{ backgroundColor: task.project.color }} />
                    <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                    <span className="text-sm font-medium flex-1 truncate">{task.title}</span>
                    <Badge variant="outline" className="text-[10px]">{task.project.key}</Badge>
                    <Badge className={cn('text-[10px]', priorityColor(task.priority))}>{task.priority}</Badge>
                    <Badge variant="outline" className="text-xs">{task.status_name}</Badge>
                    {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                    <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              {monthTasks.filter((t) => selectedProjectFilter === 'all' || t.project.id === selectedProjectFilter).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No tasks due this month for selected projects</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
