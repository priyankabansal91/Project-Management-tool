import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart as RPieChart, Pie, Legend, Area, AreaChart,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, DollarSign,
  Users, FolderKanban, Target, Zap, Calendar, ArrowUpRight, ArrowDownRight,
  Building2, Download, RefreshCw, BarChart3, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExecutiveRollup } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types & helpers ─────────────────────────────────────

type RAG = 'green' | 'amber' | 'red';

const ragStyle: Record<RAG, { bg: string; text: string; dot: string; border: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
  amber: { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-l-amber-400'   },
  red:   { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-l-red-400'     },
};

// ─── Static fallback data ─────────────────────────────────

const MILESTONES = [
  { project: 'APIV3', name: 'Auth Service Complete', date: 'Apr 30', health: 'green' as RAG, owner: 'Anjali Singh' },
  { project: 'SALES', name: 'Q2 Campaign Launch', date: 'May 10', health: 'amber' as RAG, owner: 'Org Admin' },
  { project: 'HR26',  name: 'Review Cycle Open', date: 'May 1',  health: 'green' as RAG, owner: 'Priya Sharma' },
  { project: 'APIV3', name: 'Beta Deployment', date: 'Jun 15', health: 'green' as RAG, owner: 'Anjali Singh' },
];

const UTILIZATION_STATIC = [
  { name: 'Billable', value: 62, color: '#10B981' },
  { name: 'Internal', value: 24, color: '#3B82F6' },
  { name: 'Bench',    value: 10, color: '#F59E0B' },
  { name: 'Leave',    value: 4,  color: '#94A3B8' },
];

// ─── Division Health Scorecard ────────────────────────────

function DivisionScorecard({ d }: { d: any }) {
  const health = (d.health as RAG) || 'green';
  const r = ragStyle[health];
  const gradId = `vg-${d.divisionId}`;
  const sparkData = (d.velocityTrend || []).map((v: number, i: number) => ({ i, v }));

  return (
    <Card className={cn('overflow-hidden border-l-4', r.border)}>
      <div className={cn('flex items-center justify-between px-4 py-3 border-b', r.bg)}>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className="font-semibold text-sm">{d.name}</span>
        </div>
        <Badge className={cn('text-[10px]', r.bg, r.text)}>
          {health === 'green' ? 'On Track' : health === 'amber' ? 'At Risk' : 'Off Track'}
        </Badge>
      </div>

      <CardContent className="pt-3 pb-4 space-y-3">
        {/* Completion + Projects */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Completion</p>
            <p className="text-xl font-bold">{d.completionPct}%</p>
            <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${d.completionPct}%`, backgroundColor: d.color }} />
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <p className="text-[10px] text-muted-foreground">Active Projects</p>
            <p className="text-xl font-bold">{d.activeProjects}</p>
            <p className="text-[10px] text-muted-foreground">of {d.projectCount} total</p>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { label: 'Tasks', value: d.totalTasks },
            { label: 'Done', value: d.completedTasks, accent: 'text-emerald-600' },
            { label: 'Overdue', value: d.overdueTasks, accent: d.overdueTasks > 0 ? 'text-red-600' : 'text-muted-foreground' },
            { label: 'Members', value: d.memberCount },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded bg-muted/20 py-1.5">
              <p className={cn('text-sm font-bold', accent)}>{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Mini velocity sparkline */}
        {sparkData.length > 0 && (
          <div className="h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={d.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={d.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={d.color} fill={`url(#${gradId})`} strokeWidth={1.5} dot={false} />
                <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v: number) => [`${v} tasks`, 'Velocity']} labelFormatter={(l) => `Week ${+l + 1}`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Feature + workflow badges */}
        <div className="flex flex-wrap gap-1">
          {d.workflowTemplate && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
              {d.workflowTemplate.replace('wf_', '').replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}
          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {d.enabledFeatureCount} features on
          </span>
          {d.budget && (
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              ₹{(d.budget / 100000).toFixed(0)}L budget
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── KPI card ─────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, delta, trend, color }: {
  icon: typeof TrendingUp; label: string; value: string; delta: string;
  trend: 'up' | 'down' | 'flat'; color: string;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className={cn('text-[10px] flex items-center gap-0.5 mt-0.5', trendColor)}>
        <TrendIcon className="h-3 w-3" /> {delta}
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────

export function ExecutiveDashboardPage() {
  const qc = useQueryClient();
  const { data: rollup, isLoading } = useExecutiveRollup();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const org        = rollup?.orgSummary;
  const scorecards = rollup?.scorecards || [];
  const velocity   = rollup?.velocityComparison || [];
  const budget     = rollup?.budgetComparison   || [];
  const alerts     = rollup?.alerts             || [];

  // Fallback budget chart for initial render
  const budgetChartData = budget.length
    ? budget
    : [
        { division: 'Engineering', color: '#3B82F6', allocated: 50, spent: 34 },
        { division: 'Sales',       color: '#10B981', allocated: 20, spent: 9  },
        { division: 'HR',          color: '#F59E0B', allocated: 10, spent: 3  },
      ];

  const divisionColors = Object.fromEntries(scorecards.map((d: any) => [d.name, d.color]));

  return (
    <div className="space-y-5 p-1">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Cross-division rollup &middot; {new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-md border">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 text-xs font-medium capitalize', period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['executiveRollup'] })}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm">
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* ── Division Health Scorecards ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Division Health Scorecards
          </h2>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {!isLoading && org && (
            <span className="text-xs text-muted-foreground">
              {org.greenDivisions} on track · {org.amberDivisions} at risk · {org.redDivisions} off track
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-52 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scorecards.map((d: any) => <DivisionScorecard key={d.divisionId} d={d} />)}
          </div>
        )}
      </div>

      {/* ── Org KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={FolderKanban} label="Active Projects"  value={String(org?.activeProjects ?? '–')}            delta={`${org?.totalProjects ?? 0} total`}                              trend="up"   color="text-blue-500" />
        <KPICard icon={Target}       label="Org Completion"   value={`${org?.completionPct ?? 0}%`}                  delta={`${org?.completedTasks ?? 0}/${org?.totalTasks ?? 0} tasks`}    trend="up"   color="text-emerald-500" />
        <KPICard icon={CheckCircle2} label="On Track"         value={`${org?.greenDivisions ?? 0}/${org?.divisionsCount ?? 0}`} delta={`${org?.amberDivisions ?? 0} at risk`}              trend={org?.redDivisions ? 'down' : 'up'}  color="text-green-500" />
        <KPICard icon={Clock}        label="Overdue Tasks"    value={String(org?.overdueTasks ?? '–')}               delta="across all divisions"                                           trend={org?.overdueTasks ? 'down' : 'flat'} color="text-red-500" />
        <KPICard icon={DollarSign}   label="Total Budget"     value={`₹${org ? (org.totalBudget / 100000).toFixed(0) : 0}L`} delta="allocated across divisions"                           trend="flat" color="text-violet-500" />
        <KPICard icon={Users}        label="Total Members"    value={String(org?.totalMembers ?? '–')}               delta={`${org?.divisionsCount ?? 0} divisions`}                        trend="flat" color="text-amber-500" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cross-division velocity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Cross-Division Weekly Velocity (12 weeks)</CardTitle>
              <div className="flex gap-3">
                {scorecards.map((d: any) => (
                  <span key={d.divisionId} className="text-[10px] flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={velocity.length ? velocity : Array.from({ length: 12 }, (_, i) => ({ week: `W${i + 1}` }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {scorecards.map((d: any) => (
                  <Area key={d.divisionId} type="monotone" dataKey={d.name} stroke={d.color} fill={d.color} fillOpacity={0.08} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Headcount utilization */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Headcount Utilization</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={UTILIZATION_STATIC} dataKey="value" nameKey="name" outerRadius={65} innerRadius={35} label={{ fontSize: 10 }}>
                  {UTILIZATION_STATIC.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-muted-foreground mt-1">
              {org?.totalMembers ?? 0} total resources across {org?.divisionsCount ?? 0} divisions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Budget ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Division Budget Utilisation (₹ Lakhs)</CardTitle>
            <span className="text-xs text-muted-foreground">Total: ₹{org ? (org.totalBudget / 100000).toFixed(0) : 0}L allocated</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={budgetChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}L`} />
              <YAxis type="category" dataKey="division" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: number) => `₹${v}L`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="allocated" fill="#E2E8F0" name="Allocated" radius={[0, 4, 4, 0]} />
              <Bar dataKey="spent"     name="Estimated Spend" radius={[0, 4, 4, 0]}>
                {budgetChartData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Alerts + Milestones ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key milestones */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Key Milestones — This Month</CardTitle>
              <Badge variant="outline" className="text-[10px]">{MILESTONES.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {MILESTONES.map((m, i) => {
              const r = ragStyle[m.health];
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/30 cursor-pointer">
                  <div className={cn('h-3 w-3 rounded-full shrink-0', r.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{m.project}</Badge>
                      <span className="text-sm font-medium truncate">{m.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{m.owner}</div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{m.date}</div>
                  <Badge className={cn('text-[10px]', r.bg, r.text)}>
                    {m.health === 'green' ? 'On Track' : m.health === 'amber' ? 'At Risk' : 'Late'}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Escalated alerts (real from API) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Division Alerts
              </CardTitle>
              {alerts.length > 0 && <Badge variant="destructive" className="text-[10px]">{alerts.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center py-6 gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium">All divisions on track</p>
                <p className="text-xs text-muted-foreground">No escalated alerts at this time.</p>
              </div>
            ) : (
              alerts.map((a: any, i: number) => (
                <div key={i} className={cn('rounded-lg border p-3', a.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{a.division}</Badge>
                    <Badge className={cn('text-[10px]', a.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white')}>
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs">{a.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
