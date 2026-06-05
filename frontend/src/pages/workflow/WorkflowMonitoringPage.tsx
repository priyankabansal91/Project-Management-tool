import { useState, useMemo } from 'react';
import {
  Clock, AlertTriangle, CheckCircle2, TrendingUp, BarChart3,
  RefreshCw, Filter, Eye, ArrowRight, Zap, Users, Bell,
  ChevronDown, ChevronUp, CircleDot, Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePendingApprovals } from '@/api/hooks';

// ── helpers ──────────────────────────────────────────────────────────────────

function getSlaInfo(submittedAt: string, thresholdHours: number) {
  const elapsed = (Date.now() - new Date(submittedAt).getTime()) / 3_600_000;
  const remaining = thresholdHours - elapsed;
  const pct = Math.min(100, (elapsed / thresholdHours) * 100);
  if (remaining < 0) return { status: 'overdue' as const, remaining, pct: 100, elapsed };
  if (remaining < thresholdHours * 0.25) return { status: 'at-risk' as const, remaining, pct, elapsed };
  return { status: 'on-track' as const, remaining, pct, elapsed };
}

function fmtHours(h: number) {
  const abs = Math.abs(h);
  if (abs < 1) return `${Math.round(abs * 60)}m`;
  if (abs < 24) return `${abs.toFixed(1)}h`;
  return `${(abs / 24).toFixed(1)}d`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',
  high: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900',
  medium: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900',
};

// ── SLA Progress Bar ──────────────────────────────────────────────────────────

function SlaBar({ submittedAt, thresholdHours }: { submittedAt: string; thresholdHours: number }) {
  const sla = getSlaInfo(submittedAt, thresholdHours);
  const color =
    sla.status === 'overdue' ? 'bg-red-500' :
    sla.status === 'at-risk' ? 'bg-amber-400' : 'bg-emerald-500';
  const label =
    sla.status === 'overdue' ? `Overdue by ${fmtHours(-sla.remaining)}` :
    sla.status === 'at-risk' ? `At risk — ${fmtHours(sla.remaining)} left` :
    `${fmtHours(sla.remaining)} remaining`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          'font-semibold',
          sla.status === 'overdue' ? 'text-red-600' :
          sla.status === 'at-risk' ? 'text-amber-600' : 'text-emerald-600'
        )}>
          {label}
        </span>
        <span className="text-muted-foreground">{fmtHours(sla.elapsed)} elapsed / {thresholdHours}h SLA</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${sla.pct}%` }} />
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon: Icon, color, trend,
}: {
  title: string; value: string | number; sub: string;
  icon: React.ComponentType<{ className?: string }>; color: string; trend?: 'up' | 'down';
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
              {sub}
            </p>
          </div>
          <div className={cn('p-2.5 rounded-xl', color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type StepFilter = 'all' | '1' | '2';
type SlaFilter = 'all' | 'overdue' | 'at-risk' | 'on-track';

export function WorkflowMonitoringPage() {
  const navigate = useNavigate();
  const [stepFilter, setStepFilter] = useState<StepFilter>('all');
  const [slaFilter, setSlaFilter] = useState<SlaFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const approvalsQ = usePendingApprovals({ page_size: 50 });
  const allInstances: any[] = approvalsQ.data?.items ?? [];

  const instances = useMemo(() => {
    return allInstances
      .filter((i) => stepFilter === 'all' || String(i.currentStep ?? i.step_order ?? '') === stepFilter)
      .filter((i) => {
        if (slaFilter === 'all') return true;
        const createdAt = i.stepStartedAt || i.created_at || new Date().toISOString();
        const threshold = i.slaThresholdHours ?? 72;
        const sla = getSlaInfo(createdAt, threshold);
        return sla.status === slaFilter;
      });
  }, [allInstances, stepFilter, slaFilter]);

  const overdue = allInstances.filter((i) => {
    const createdAt = i.stepStartedAt || i.created_at || new Date().toISOString();
    return getSlaInfo(createdAt, i.slaThresholdHours ?? 72).status === 'overdue';
  }).length;

  const atRisk = allInstances.filter((i) => {
    const createdAt = i.stepStartedAt || i.created_at || new Date().toISOString();
    return getSlaInfo(createdAt, i.slaThresholdHours ?? 72).status === 'at-risk';
  }).length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Workflow Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time approval pipeline status · Last refreshed {lastRefresh.toLocaleTimeString('en-GB')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/workflow/governance')}>
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Governance
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLastRefresh(new Date())}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/admin/approvals')}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> My Queue
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Pending Approvals"
          value={allInstances.length}
          sub={`${overdue} overdue, ${atRisk} at risk`}
          icon={Clock}
          color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          trend="up"
        />
        <KpiCard
          title="Overdue"
          value={overdue}
          sub={`${atRisk} more at-risk`}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        />
        <KpiCard
          title="Avg Resolution"
          value="—"
          sub="no completed data yet"
          icon={Timer}
          color="bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
        />
        <KpiCard
          title="On-Time Rate"
          value="—"
          sub="no completed data yet"
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
        />
      </div>

      {/* Step analytics + SLA summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SLA breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">SLA Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const onTrack = allInstances.filter(i => getSlaInfo(i.stepStartedAt || i.created_at || new Date().toISOString(), i.slaThresholdHours ?? 72).status === 'on-track').length;
              const total = allInstances.length || 1;
              return (
                <>
                  {[
                    { label: 'On Track', count: onTrack, color: 'bg-emerald-500', text: 'text-emerald-600' },
                    { label: 'At Risk (< 25% SLA left)', count: atRisk, color: 'bg-amber-400', text: 'text-amber-600' },
                    { label: 'Overdue', count: overdue, color: 'bg-red-500', text: 'text-red-600' },
                  ].map(({ label, count, color, text }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', color)} />
                      <span className="text-sm flex-1">{label}</span>
                      <span className={cn('text-sm font-bold', text)}>{count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                      {[
                        { count: onTrack, color: 'bg-emerald-500' },
                        { count: atRisk, color: 'bg-amber-400' },
                        { count: overdue, color: 'bg-red-500' },
                      ].map(({ count, color }, i) => (
                        <div key={i} className={cn('h-full rounded-sm', color)} style={{ width: `${(count / total) * 100}%` }} />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Per-step stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Per-Step Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {allInstances.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No step analytics yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2 text-center">
                    <p className="font-bold text-blue-700 dark:text-blue-400 text-lg">{allInstances.length}</p>
                    <p className="text-blue-600/70 dark:text-blue-400/70">Pending</p>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2 text-center">
                    <p className="font-bold text-red-700 dark:text-red-400 text-lg">{overdue}</p>
                    <p className="text-red-600/70 dark:text-red-400/70">Overdue</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="font-bold text-lg">—</p>
                    <p className="text-muted-foreground">Avg Time</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters + Instances table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" /> Active Instances
              <Badge variant="secondary">{instances.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" /> Step:
              </div>
              {(['all', '1', '2'] as StepFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStepFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    stepFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  )}
                >
                  {f === 'all' ? 'All Steps' : f === '1' ? 'Core Review' : 'CFO Approval'}
                </button>
              ))}
              <span className="text-muted-foreground text-xs">|</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">SLA:</div>
              {(['all', 'overdue', 'at-risk', 'on-track'] as SlaFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setSlaFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    slaFilter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                  )}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {instances.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">No instances match this filter</p>
            </div>
          ) : (
            <div className="divide-y">
              {instances.map((inst) => {
                const createdAt = inst.stepStartedAt || inst.created_at || new Date().toISOString();
                const threshold = inst.slaThresholdHours ?? 72;
                const sla = getSlaInfo(createdAt, threshold);
                const isExp = expanded === inst.id;
                const title = inst.title || inst.description || 'Approval Request';
                const priority = inst.priority || 'medium';
                return (
                  <div key={inst.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <div className={cn(
                          'h-2.5 w-2.5 rounded-full mt-0.5',
                          priority === 'critical' ? 'bg-red-500' :
                          priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-sm">{title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs flex-shrink-0',
                              sla.status === 'overdue' ? 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30' :
                              sla.status === 'at-risk' ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30' :
                              'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            )}
                          >
                            {sla.status === 'overdue' ? `⚠ Overdue ${fmtHours(-sla.remaining)}` :
                             sla.status === 'at-risk' ? `⏱ ${fmtHours(sla.remaining)} left` :
                             `✓ ${fmtHours(sla.remaining)} left`}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          {inst.requestedBy && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {inst.requestedBy}</span>
                          )}
                          <span>Submitted {fmtDate(createdAt)}</span>
                          {inst.approvalType && <span>{inst.approvalType}</span>}
                        </div>

                        <SlaBar submittedAt={createdAt} thresholdHours={threshold} />
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sla.status === 'overdue' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50">
                            <Bell className="h-3 w-3 mr-1" /> Escalate
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate('/admin/approvals')}>
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Button>
                        <button onClick={() => setExpanded(isExp ? null : inst.id)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                          {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
