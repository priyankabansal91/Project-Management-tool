import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';
import { TaskModal, type TaskFormData } from '@/components/shared/TaskModal';
import { useMyTasks, useCreateTask, useProjects, useWorkflows } from '@/api/hooks';

interface CalendarTask {
  id: string;
  task_key: string;
  title: string;
  priority: string;
  assignee: { name: string } | null;
  status_name: string;
  due_date: string;
  project: { key: string; color: string; id: string };
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Next month padding (fill to 42 = 6 rows)
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1);
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarViewPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  const { data: tasksData } = useMyTasks();
  const tasks = (tasksData?.items || []) as CalendarTask[];
  
  const { data: projectsData } = useProjects();
  const projects = projectsData?.items || [];
  
  const { data: workflows = [] } = useWorkflows();

  const createTaskMutation = useCreateTask(selectedProjectId || '');

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        const key = t.due_date;
        (map[key] = map[key] || []).push(t);
      }
    });
    return map;
  }, [tasks]);

  const today = dateKey(new Date());
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleAddTask = () => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      setModalOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
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
      };
      await createTaskMutation.mutateAsync(taskData);
      setModalOpen(false);
      setSelectedDateForTask(null);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectWorkflow = workflows.find((w) => w.id === selectedProject?.workflow_config_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View tasks by due date</p>
        </div>
        <Button onClick={handleAddTask}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDateForTask(null);
        }}
        onSave={handleCreateTask}
        projectKey={selectedProject?.key}
        statuses={projectWorkflow?.statuses || []}
        saving={createTaskMutation.isPending}
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-secondary/30">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
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
                  (i + 1) % 7 === 0 && 'border-r-0', // No right border on last column
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
                      className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:bg-accent transition-colors"
                      style={{ borderLeft: `2px solid ${task.project.color}` }}
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

      {/* Task List for selected month */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Tasks due in {monthLabel}</h3>
        <div className="space-y-2">
          {tasks
            .filter((t) => t.due_date && t.due_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
            .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
            .map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent/50">
                <div className="h-2.5 w-2.5 rounded" style={{ backgroundColor: task.project.color }} />
                <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
                <span className="text-sm font-medium flex-1 truncate">{task.title}</span>
                <Badge className={cn('text-[10px]', priorityColor(task.priority))}>{task.priority}</Badge>
                <Badge variant="outline" className="text-xs">{task.status_name}</Badge>
                {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
