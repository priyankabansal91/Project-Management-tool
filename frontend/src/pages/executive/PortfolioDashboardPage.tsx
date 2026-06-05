import { Briefcase, TrendingUp, AlertTriangle, XCircle, Activity, DollarSign, Users, CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioSummary } from '@/api/hooks';

// ── Types ─────────────────────────────────────────────────

interface PortfolioProject {
  id: string;
  name: string;
  division: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
  healthScore: number;
  tasksTotal: number;
  tasksDone: number;
  budgetSpent: number;
  budgetTotal: number;
  teamSize: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  phase: string;
  lastActivity: string; // ISO date string
}

interface PortfolioSummaryData {
  projects: PortfolioProject[];
  totalTasks: number;
  tasksDone: number;
  tasksBlocked: number;
  totalMembers: number;
  totalBudgetSpent: number;
  totalBudgetAllocated: number;
  avgHealthScore: number;
}

// ── Helpers ───────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1w ago';
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function getStatusConfig(status: PortfolioProject['status']) {
  switch (status) {
    case 'on_track':  return { label: 'On Track',  variant: 'default' as const,      className: 'bg-green-100 text-green-800 border-green-200' };
    case 'at_risk':   return { label: 'At Risk',   variant: 'secondary' as const,    className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    case 'off_track': return { label: 'Off Track', variant: 'destructive' as const,  className: 'bg-red-100 text-red-800 border-red-200' };
    case 'completed': return { label: 'Completed', variant: 'outline' as const,      className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
}

function getPriorityConfig(priority: PortfolioProject['priority']) {
  switch (priority) {
    case 'critical': return { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'high':     return { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-200' };
    case 'medium':   return { label: 'Medium',   className: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'low':      return { label: 'Low',       className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

function getHealthColor(score: number): string {
  if (score > 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getHealthBarColor(score: number): string {
  if (score > 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ── Skeleton ──────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-muted rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, iconClassName = 'text-muted-foreground', subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${iconClassName}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function PortfolioDashboardPage() {
  const { data: rawData, isLoading, isError } = usePortfolioSummary();

  const data = rawData as PortfolioSummaryData | undefined;
  const projects = data?.projects ?? [];

  const onTrackCount  = projects.filter(p => p.status === 'on_track').length;
  const atRiskCount   = projects.filter(p => p.status === 'at_risk').length;
  const offTrackCount = projects.filter(p => p.status === 'off_track').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground">Cross-project health, budget and progress at a glance</p>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Portfolio data unavailable. Live data will appear once the portfolio endpoint is active.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={Briefcase}
          iconClassName="text-primary"
        />
        <StatCard
          title="On Track"
          value={onTrackCount}
          icon={TrendingUp}
          iconClassName="text-green-500"
        />
        <StatCard
          title="At Risk"
          value={atRiskCount}
          icon={AlertTriangle}
          iconClassName="text-yellow-500"
        />
        <StatCard
          title="Off Track"
          value={offTrackCount}
          icon={XCircle}
          iconClassName="text-red-500"
        />
        <StatCard
          title="Avg Health"
          value={data?.avgHealthScore != null ? `${data.avgHealthScore}%` : '—'}
          icon={Activity}
          iconClassName={getHealthColor(data?.avgHealthScore ?? 0)}
        />
        <StatCard
          title="Budget"
          value={data?.totalBudgetSpent != null ? formatCurrency(data.totalBudgetSpent) : '—'}
          icon={DollarSign}
          iconClassName="text-muted-foreground"
          subtitle={data?.totalBudgetAllocated != null ? `of ${formatCurrency(data.totalBudgetAllocated)}` : undefined}
        />
      </div>

      {/* Portfolio Health Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Portfolio Health Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Health</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Budget</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phase</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activity</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => {
                    const statusCfg   = getStatusConfig(project.status);
                    const priorityCfg = getPriorityConfig(project.priority);
                    const taskPct     = project.tasksTotal > 0 ? Math.round((project.tasksDone / project.tasksTotal) * 100) : 0;
                    const budgetPct   = project.budgetTotal > 0 ? Math.round((project.budgetSpent / project.budgetTotal) * 100) : 0;
                    const budgetOver  = budgetPct > 90;

                    return (
                      <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                        {/* Project name + division */}
                        <td className="px-4 py-3">
                          <p className="font-medium">{project.name}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                            {project.division}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Health score + mini bar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm w-8 ${getHealthColor(project.healthScore)}`}>
                              {project.healthScore}
                            </span>
                            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getHealthBarColor(project.healthScore)}`}
                                style={{ width: `${project.healthScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">{project.tasksDone}/{project.tasksTotal} tasks</span>
                            <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${taskPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`text-xs ${budgetOver ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetTotal)}
                            </span>
                            <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${budgetOver ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(budgetPct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Team size */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{project.teamSize}</span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityCfg.className}`}>
                            {priorityCfg.label}
                          </span>
                        </td>

                        {/* Phase */}
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {project.phase}
                          </Badge>
                        </td>

                        {/* Last activity */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">{relativeTime(project.lastActivity)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 justify-around">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Tasks</p>
                <p className="text-xl font-bold">{data?.totalTasks ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Done</p>
                <p className="text-xl font-bold text-green-600">{data?.tasksDone ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Blocked</p>
                <p className="text-xl font-bold text-red-600">{data?.tasksBlocked ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Team Members</p>
                <p className="text-xl font-bold">{data?.totalMembers ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget Utilization</p>
                <p className="text-xl font-bold">
                  {data?.totalBudgetAllocated
                    ? `${Math.round(((data.totalBudgetSpent ?? 0) / data.totalBudgetAllocated) * 100)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
