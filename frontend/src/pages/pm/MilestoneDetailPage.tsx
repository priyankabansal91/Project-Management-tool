import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMilestone, useCloseMilestone } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Flag, CheckCircle2, Clock, AlertTriangle, Ban,
  CheckSquare2, Circle, TrendingUp, DollarSign, ListChecks, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  medium: 'text-blue-600 bg-blue-50 border-blue-200',
  low: 'text-green-600 bg-green-50 border-green-200',
  none: 'text-gray-500 bg-gray-50 border-gray-200',
};

const STATUS_DONE = ['done', 'completed', 'accepted'];

type WaterfallStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED';

const WF_CFG: Record<WaterfallStatus, { label: string; className: string }> = {
  NOT_STARTED:      { label: 'Not Started',      className: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS:      { label: 'In Progress',       className: 'bg-blue-100 text-blue-700' },
  BLOCKED:          { label: 'Blocked',            className: 'bg-red-100 text-red-700' },
  PENDING_APPROVAL: { label: 'Pending Approval',  className: 'bg-yellow-100 text-yellow-700' },
  APPROVED:         { label: 'Approved',           className: 'bg-green-100 text-green-700' },
  COMPLETED:        { label: 'Completed',          className: 'bg-emerald-100 text-emerald-700' },
};

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 100 ? '#10B981' : pct >= 60 ? '#3B82F6' : pct >= 30 ? '#F59E0B' : '#6B7280';
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} stroke="#E5E7EB" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={8}
        stroke={color} fill="none" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 6}
        textAnchor="middle" fontSize={13} fontWeight={600} fill={color}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {pct}%
      </text>
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, sub, colorClass }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; colorClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClass || 'bg-primary/10')}>
          <Icon className={cn('h-5 w-5', colorClass ? 'text-white' : 'text-primary')} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function MilestoneDetailPage() {
  const { projectId, milestoneId } = useParams<{ projectId: string; milestoneId: string }>();
  const navigate = useNavigate();
  const [closeNotes, setCloseNotes] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const { data: milestone, isLoading, error } = useMilestone(projectId!, milestoneId!);
  const closeMutation = useCloseMilestone(projectId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading milestone…
      </div>
    );
  }

  if (error || !milestone) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Milestone not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/milestones`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Milestones
        </Button>
      </div>
    );
  }

  const ws: WaterfallStatus = (milestone.waterfallStatus as WaterfallStatus) ?? 'NOT_STARTED';
  const wCfg = WF_CFG[ws] || WF_CFG.NOT_STARTED;
  const progress = milestone.progress ?? 0;
  const tasks: any[] = milestone.tasks ?? [];
  const doneTasks = tasks.filter((t) => STATUS_DONE.includes((t.statusName || '').toLowerCase()));
  const blockedTasks = tasks.filter((t) => !STATUS_DONE.includes((t.statusName || '').toLowerCase()) && t.dueDate && new Date(t.dueDate) < new Date());
  const isBlocked = ws === 'BLOCKED';
  const canClose = !['completed', 'review'].includes(milestone.status) && !isBlocked;

  const budget = milestone.budget ?? null;
  const effortEst = milestone.effortEstimate ?? milestone.totalEstimatedHours ?? 0;
  const effortLogged = milestone.totalLoggedHours ?? milestone.actualEffort ?? 0;
  const burnRate = milestone.burnRate ?? (effortEst > 0 ? Math.round((effortLogged / effortEst) * 100) : 0);

  const handleClose = () => {
    closeMutation.mutate({ milestoneId: milestoneId!, completionNotes: closeNotes }, {
      onSuccess: () => setShowCloseDialog(false),
    });
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-primary">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${projectId}/milestones`} className="hover:text-primary">
          {milestone.project?.name ?? 'Milestones'}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{milestone.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5" onClick={() => navigate(`/projects/${projectId}/milestones`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Flag className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">{milestone.title}</h1>
              <Badge className={cn('text-xs border-0', wCfg.className)}>{wCfg.label}</Badge>
              {milestone.approvalRequired && (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 bg-purple-50">Approval Required</Badge>
              )}
            </div>
            {milestone.description && (
              <p className="text-sm text-muted-foreground ml-7">{milestone.description}</p>
            )}
          </div>
        </div>
        {canClose && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setShowCloseDialog(true)}
          >
            <CheckSquare2 className="h-3.5 w-3.5 mr-1.5" /> Close Milestone
          </Button>
        )}
        {milestone.status === 'completed' && (
          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
          </Badge>
        )}
      </div>

      {/* Blocked banner */}
      {isBlocked && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <Ban className="h-4 w-4 shrink-0" />
          <span className="font-medium">This milestone is blocked.</span>
          {milestone.blockedReason
            ? <span className="text-red-600">— {milestone.blockedReason}</span>
            : <span className="text-red-500"> The predecessor milestone must be completed first.</span>
          }
        </div>
      )}

      {/* Progress + metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <ProgressRing pct={progress} size={80} />
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{progress}%</p>
              <p className="text-xs text-muted-foreground">{doneTasks.length}/{tasks.length} tasks done</p>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          icon={ListChecks} label="Tasks" value={tasks.length}
          sub={`${doneTasks.length} done · ${tasks.length - doneTasks.length} open`}
          colorClass="bg-blue-500"
        />

        <MetricCard
          icon={Clock} label="Effort (hrs)" value={`${effortLogged}/${effortEst}`}
          sub={`Burn rate: ${burnRate}%`}
          colorClass={burnRate > 100 ? 'bg-red-500' : 'bg-amber-500'}
        />

        {budget != null ? (
          <MetricCard
            icon={DollarSign} label="Budget" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: milestone.currency || 'INR', maximumFractionDigits: 0 }).format(budget)}
            sub={milestone.milestoneType ? `Type: ${milestone.milestoneType}` : undefined}
            colorClass="bg-emerald-500"
          />
        ) : (
          <MetricCard icon={TrendingUp} label="Type" value={milestone.milestoneType || 'general'} colorClass="bg-purple-500" />
        )}
      </div>

      {/* Dates row */}
      {(milestone.startDate || milestone.dueDate) && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {milestone.startDate && (
            <span className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-blue-400" />
              Start: <strong className="text-foreground">{new Date(milestone.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
          {milestone.dueDate && (
            <span className={cn('flex items-center gap-1.5', new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed' ? 'text-red-600' : '')}>
              <Clock className="h-3 w-3" />
              Due: <strong>{new Date(milestone.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              {new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed' && (
                <Badge className="bg-red-100 text-red-600 border-0 text-[10px] px-1.5">Overdue</Badge>
              )}
            </span>
          )}
          {milestone.completedAt && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Closed: <strong>{new Date(milestone.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
        </div>
      )}

      {/* Task list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Tasks in this milestone
            <span className="ml-auto text-xs font-normal text-muted-foreground">{tasks.length} total · {doneTasks.length} done</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks assigned to this milestone</div>
          ) : (
            <ul className="divide-y">
              {tasks.map((t) => {
                const isDone = STATUS_DONE.includes((t.statusName || '').toLowerCase());
                const isOverdue = !isDone && t.dueDate && new Date(t.dueDate) < new Date();
                return (
                  <li
                    key={t.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors',
                      isOverdue && 'bg-red-50/60 dark:bg-red-950/10',
                    )}
                  >
                    {isDone
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      : isOverdue
                        ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    }
                    <Link to={`/tasks/${t.id}`} className={cn('flex-1 text-sm hover:text-primary transition-colors truncate', isDone && 'line-through text-muted-foreground')}>
                      {t.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.priority && (
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.none)}>
                          {t.priority}
                        </Badge>
                      )}
                      {t.statusName && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{t.statusName}</span>
                      )}
                      {t.dueDate && (
                        <span className={cn('text-[10px]', isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                          {new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {(t.estimatedHours || t.loggedHours) && (
                        <span className="text-[10px] text-muted-foreground">{Number(t.loggedHours || 0)}/{Number(t.estimatedHours || 0)}h</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Overdue summary banner */}
      {blockedTasks.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{blockedTasks.length} task{blockedTasks.length > 1 ? 's are' : ' is'} overdue and may be blocking milestone completion.</span>
        </div>
      )}

      {/* Close Milestone Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 mx-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare2 className="h-5 w-5 text-green-600" /> Close Milestone
            </h2>
            <p className="text-sm text-muted-foreground">
              {milestone.approvalRequired
                ? 'This will submit a closure approval request. The milestone will be marked completed once approved.'
                : 'Mark this milestone as completed. This action will unblock the next milestone in the sequence.'}
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Completion notes (optional)</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                placeholder="Summary of work done, deliverables, outcomes…"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCloseDialog(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleClose}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {milestone.approvalRequired ? 'Submit for Approval' : 'Close Milestone'}
              </Button>
            </div>
            {closeMutation.isError && (
              <p className="text-xs text-destructive">{(closeMutation.error as any)?.response?.data?.error?.message || 'Failed to close milestone'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
