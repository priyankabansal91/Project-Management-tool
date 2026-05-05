import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectTasks, useProject, useProjects } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar, List, FolderKanban } from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';
import type { Task } from '@/types';

type ZoomLevel = 'day' | 'week' | 'month';

const PRIORITY_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-blue-400',
  low: 'bg-green-400',
  none: 'bg-gray-300',
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatHeader(date: Date, zoom: ZoomLevel) {
  if (zoom === 'day') return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (zoom === 'week') return `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-GB', { month: 'short' })}`;
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

const ZOOM_COLS: Record<ZoomLevel, { count: number; dayWidth: number; stepDays: number }> = {
  day:   { count: 30, dayWidth: 40, stepDays: 1  },
  week:  { count: 16, dayWidth: 30, stepDays: 7  },
  month: { count: 12, dayWidth: 24, stepDays: 30 },
};

export function GanttPage() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { data: allProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const projectId = routeProjectId || selectedProjectId;
  const projectQuery = useProject(projectId);
  const tasksQuery = useProjectTasks(projectId);
  const project = projectQuery.data;
  const allTasks: Task[] = tasksQuery.data?.items || [];

  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [startOffset, setStartOffset] = useState(0); // offset in steps from today

  const cfg = ZOOM_COLS[zoom];

  const viewStart = useMemo(() => {
    const base = zoom === 'day' ? new Date() : zoom === 'week' ? startOfWeek(new Date()) : startOfMonth(new Date());
    return addDays(base, startOffset * cfg.stepDays);
  }, [zoom, startOffset, cfg.stepDays]);

  const columns = useMemo(() => {
    return Array.from({ length: cfg.count }, (_, i) => addDays(viewStart, i * cfg.stepDays));
  }, [viewStart, cfg]);

  const viewEnd = addDays(viewStart, cfg.count * cfg.stepDays);
  const totalWidth = cfg.count * cfg.dayWidth * cfg.stepDays;

  const tasks = allTasks.filter((t) => t.start_date || t.due_date);

  const getBarStyle = (task: Task) => {
    const start = task.start_date ? new Date(task.start_date) : new Date(task.due_date!);
    const end = task.due_date ? new Date(task.due_date) : addDays(start, 3);

    const msPerDay = 86400000;
    const totalDays = (viewEnd.getTime() - viewStart.getTime()) / msPerDay;
    const startDays = Math.max(0, (start.getTime() - viewStart.getTime()) / msPerDay);
    const durationDays = Math.max(1, (end.getTime() - start.getTime()) / msPerDay);

    const leftPct = (startDays / totalDays) * 100;
    const widthPct = (durationDays / totalDays) * 100;

    if (leftPct > 100 || leftPct + widthPct < 0) return null; // out of view

    return {
      left: `${Math.max(0, leftPct)}%`,
      width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
    };
  };

  const today = new Date();
  const todayOffset = (today.getTime() - viewStart.getTime()) / 86400000;
  const todayPct = (todayOffset / (cfg.count * cfg.stepDays)) * 100;

  if (tasksQuery.isLoading || projectQuery.isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading timeline...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          {routeProjectId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link to="/projects" className="hover:text-primary">Projects</Link>
              <span>/</span>
              <span>{project?.name || 'Loading...'}</span>
            </div>
          )}
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Gantt Timeline
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Project selector (shown when not coming from a project route) */}
          {!routeProjectId && (
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select a project —</option>
                {(allProjects?.items || []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project view switcher (only when project selected) */}
          {projectId && (
          <div className="flex items-center rounded-md border bg-card">
            <Link to={`/projects/${projectId}/board`} className="p-2 hover:bg-muted rounded-l-md" title="Board">
              <LayoutGrid className="h-4 w-4" />
            </Link>
            <Link to={`/projects/${projectId}/calendar`} className="p-2 hover:bg-muted" title="Calendar">
              <Calendar className="h-4 w-4" />
            </Link>
            <button className="p-2 bg-muted rounded-r-md" title="Gantt" disabled>
              <List className="h-4 w-4 text-primary" />
            </button>
          </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center rounded-md border bg-card">
            {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => { setZoom(z); setStartOffset(0); }}
                className={cn('px-3 py-1.5 text-xs font-medium capitalize transition-colors', zoom === z ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Navigate */}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setStartOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setStartOffset(0)}>Today</Button>
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setStartOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!projectId ? (
        <Card className="p-12 text-center">
          <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">Select a project to view its Gantt timeline</p>
          <p className="text-sm text-muted-foreground mt-1">Use the project selector above to choose a project.</p>
        </Card>
      ) : tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No tasks with dates found</p>
          <p className="text-sm text-muted-foreground mt-1">Assign start or due dates to tasks to see them on the Gantt chart.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Task name sidebar — fixed */}
            <div className="w-56 flex-shrink-0 border-r bg-muted/20">
              <div className="h-10 border-b bg-muted/40 flex items-center px-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</span>
              </div>
              {tasks.map((task) => (
                <div key={task.id} className="h-12 border-b flex items-center px-3 gap-2 hover:bg-accent/50 transition-colors">
                  <Badge className={cn('text-[10px] px-1.5 py-0 border', priorityColor(task.priority))} variant="outline">
                    {task.priority.slice(0, 3).toUpperCase()}
                  </Badge>
                  <Link to={`/tasks/${task.id}`} className="text-xs font-medium hover:text-primary truncate">
                    {task.title}
                  </Link>
                </div>
              ))}
            </div>

            {/* Gantt chart area — scrollable */}
            <div className="flex-1 overflow-x-auto">
              {/* Column headers */}
              <div className="flex h-10 border-b bg-muted/40 sticky top-0 z-10">
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center border-r text-[10px] font-medium text-muted-foreground',
                      cfg.stepDays === 1 && col.getDay() === 0 ? 'bg-muted/60' : ''
                    )}
                    style={{ width: cfg.dayWidth * cfg.stepDays }}
                  >
                    {formatHeader(col, zoom)}
                  </div>
                ))}
              </div>

              {/* Task bars */}
              <div className="relative">
                {/* Today line */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-20 pointer-events-none"
                    style={{ left: `${todayPct}%` }}
                  />
                )}

                {tasks.map((task) => {
                  const barStyle = getBarStyle(task);
                  return (
                    <div key={task.id} className="h-12 border-b relative flex items-center" style={{ width: cfg.count * cfg.dayWidth * cfg.stepDays }}>
                      {/* Grid lines */}
                      {columns.map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-r border-border/40"
                          style={{ left: i * cfg.dayWidth * cfg.stepDays, width: cfg.dayWidth * cfg.stepDays }}
                        />
                      ))}

                      {/* Task bar */}
                      {barStyle && (
                        <Link
                          to={`/tasks/${task.id}`}
                          className={cn(
                            'absolute h-7 rounded-md flex items-center px-2 text-white text-[11px] font-medium z-10 overflow-hidden hover:opacity-80 transition-opacity shadow-sm',
                            PRIORITY_BAR[task.priority]
                          )}
                          style={barStyle}
                          title={task.title}
                        >
                          <span className="truncate">{task.title}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/10 text-xs">
            <span className="text-muted-foreground font-medium">Priority:</span>
            {Object.entries(PRIORITY_BAR).map(([p, cls]) => (
              <span key={p} className="flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-sm', cls)} />
                <span className="capitalize text-muted-foreground">{p}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5 ml-4">
              <span className="h-4 w-0.5 bg-red-400" />
              <span className="text-muted-foreground">Today</span>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
