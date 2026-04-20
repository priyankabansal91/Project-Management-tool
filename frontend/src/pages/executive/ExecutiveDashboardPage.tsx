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
  Building2, Download, RefreshCw, ChevronRight, BarChart3, Shield, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RAG = 'green' | 'amber' | 'red';

const ragStyle: Record<RAG, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

// Portfolio projects
const portfolioProjects = [
  { id: 'p1', name: 'Customer Portal Redesign', key: 'CPR', division: 'Product Engineering', pm: 'Emily Zhang', health: 'green' as RAG, pct: 56, budget: 280, spent: 165, overdue: 3, team: 14 },
  { id: 'p2', name: 'API Gateway Migration', key: 'AGM', division: 'Platform Engineering', pm: 'David Park', health: 'red' as RAG, pct: 33, budget: 180, spent: 112, overdue: 8, team: 8 },
  { id: 'p3', name: 'Mobile App v2', key: 'MAV2', division: 'Product Engineering', pm: 'James Wright', health: 'amber' as RAG, pct: 41, budget: 350, spent: 148, overdue: 5, team: 12 },
  { id: 'p4', name: 'HR Onboarding Platform', key: 'HROP', division: 'Human Resources', pm: 'Kate Adams', health: 'green' as RAG, pct: 27, budget: 120, spent: 32, overdue: 0, team: 6 },
  { id: 'p5', name: 'Data Analytics Dashboard', key: 'DAD', division: 'Data Engineering', pm: 'Marco Silva', health: 'green' as RAG, pct: 55, budget: 200, spent: 118, overdue: 2, team: 10 },
  { id: 'p6', name: 'SOC 2 Compliance', key: 'SOC2', division: 'Legal & Compliance', pm: 'George Hayes', health: 'green' as RAG, pct: 71, budget: 90, spent: 45, overdue: 0, team: 4 },
  { id: 'p7', name: 'CRM Integration', key: 'CRM', division: 'Sales & Marketing', pm: 'Lisa Chang', health: 'amber' as RAG, pct: 38, budget: 160, spent: 85, overdue: 4, team: 7 },
  { id: 'p8', name: 'Cloud Migration Phase 2', key: 'CMP2', division: 'IT Operations', pm: 'Bob Martinez', health: 'green' as RAG, pct: 62, budget: 450, spent: 280, overdue: 1, team: 16 },
];

// Weekly velocity trend (12 weeks)
const velocityTrend = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  throughput: 35 + Math.round(Math.sin(i / 3) * 8 + Math.random() * 5),
  target: 40,
}));

// Budget by division
const divisionBudget = [
  { division: 'Product Eng', allocated: 630, spent: 313, color: '#3B82F6' },
  { division: 'Platform Eng', allocated: 180, spent: 112, color: '#8B5CF6' },
  { division: 'Data Eng', allocated: 200, spent: 118, color: '#EF4444' },
  { division: 'IT Ops', allocated: 450, spent: 280, color: '#F59E0B' },
  { division: 'HR', allocated: 120, spent: 32, color: '#10B981' },
  { division: 'Legal', allocated: 90, spent: 45, color: '#6366F1' },
  { division: 'Sales & Mkt', allocated: 160, spent: 85, color: '#EC4899' },
];

// Headcount utilization
const utilization = [
  { name: 'Billable', value: 68, color: '#10B981' },
  { name: 'Internal', value: 22, color: '#3B82F6' },
  { name: 'Bench', value: 7, color: '#F59E0B' },
  { name: 'Leave', value: 3, color: '#94A3B8' },
];

// Key milestones this month
const milestones = [
  { project: 'CPR', name: 'Beta Release', date: 'Apr 30', health: 'green' as RAG, owner: 'Emily Zhang' },
  { project: 'AGM', name: 'Payment Endpoint Migration', date: 'Apr 15', health: 'red' as RAG, owner: 'David Park' },
  { project: 'MAV2', name: 'Offline Mode Complete', date: 'Apr 30', health: 'amber' as RAG, owner: 'James Wright' },
  { project: 'DAD', name: 'Real-time Streaming', date: 'May 15', health: 'green' as RAG, owner: 'Marco Silva' },
  { project: 'CMP2', name: 'Staging Env Cutover', date: 'Apr 25', health: 'green' as RAG, owner: 'Bob Martinez' },
];

// Top risks
const topRisks = [
  { project: 'AGM', risk: 'Key developer on leave — 8 overdue tasks blocking downstream', severity: 'critical', owner: 'David Park' },
  { project: 'MAV2', risk: 'Offline sync module behind — 5 tasks overdue in sprint', severity: 'high', owner: 'James Wright' },
  { project: 'CRM', risk: 'Salesforce API rate limits hitting during peak hours', severity: 'high', owner: 'Lisa Chang' },
  { project: 'DAD', risk: 'Budget tight — 59% spent at 55% completion', severity: 'medium', owner: 'Marco Silva' },
];

export function ExecutiveDashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const totalBudget = divisionBudget.reduce((a, d) => a + d.allocated, 0);
  const totalSpent = divisionBudget.reduce((a, d) => a + d.spent, 0);
  const totalTeam = portfolioProjects.reduce((a, p) => a + p.team, 0);
  const avgCompletion = Math.round(portfolioProjects.reduce((a, p) => a + p.pct, 0) / portfolioProjects.length);
  const totalOverdue = portfolioProjects.reduce((a, p) => a + p.overdue, 0);
  const healthCounts = { green: portfolioProjects.filter((p) => p.health === 'green').length, amber: portfolioProjects.filter((p) => p.health === 'amber').length, red: portfolioProjects.filter((p) => p.health === 'red').length };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">Portfolio overview &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-md border">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 text-xs font-medium capitalize', period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>{p}</button>
            ))}
          </div>
          <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
          <Button size="sm" onClick={() => alert('Generating executive PDF report...')}><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={FolderKanban} label="Active Projects" value={String(portfolioProjects.length)} delta="+2 this quarter" trend="up" color="text-blue-500" />
        <KPICard icon={Target} label="Avg Completion" value={`${avgCompletion}%`} delta="+8% this month" trend="up" color="text-emerald-500" />
        <KPICard icon={CheckCircle2} label="On Track" value={`${healthCounts.green}/${portfolioProjects.length}`} delta={`${healthCounts.red} off track`} trend={healthCounts.red > 0 ? 'down' : 'up'} color="text-green-500" />
        <KPICard icon={Clock} label="Overdue Tasks" value={String(totalOverdue)} delta="-3 from last week" trend="down" color="text-red-500" />
        <KPICard icon={DollarSign} label="Budget Burn" value={`$${(totalSpent / 1000).toFixed(0)}k`} delta={`of $${(totalBudget / 1000).toFixed(0)}k (${Math.round(totalSpent / totalBudget * 100)}%)`} trend="flat" color="text-violet-500" />
        <KPICard icon={Users} label="Team Size" value={String(totalTeam)} delta="77 active resources" trend="flat" color="text-amber-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Portfolio Heatmap — All Projects</CardTitle>
              <div className="flex gap-2 text-[10px]">
                <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />On Track ({healthCounts.green})</span>
                <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" />At Risk ({healthCounts.amber})</span>
                <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-red-500" />Off Track ({healthCounts.red})</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {portfolioProjects.map((p) => {
                const r = ragStyle[p.health];
                return (
                  <div key={p.id} className={cn('rounded-lg p-3 border cursor-pointer hover:shadow-md transition-shadow', r.bg)}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={cn('h-2.5 w-2.5 rounded-full', r.dot)} />
                      <span className="text-xs font-bold">{p.key}</span>
                    </div>
                    <div className="text-[11px] font-medium truncate mb-1">{p.name}</div>
                    <div className="h-2 rounded-full bg-white/60 dark:bg-black/20 overflow-hidden mb-1.5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, backgroundColor: p.health === 'green' ? '#10B981' : p.health === 'amber' ? '#F59E0B' : '#EF4444' }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={cn('font-bold', r.text)}>{p.pct}%</span>
                      <span className="text-muted-foreground">{p.division}</span>
                    </div>
                    {p.overdue > 0 && <div className="text-[10px] text-red-600 font-medium mt-1">{p.overdue} overdue</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Utilization Pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Headcount Utilization</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={utilization} dataKey="value" nameKey="name" outerRadius={65} innerRadius={35} label={{ fontSize: 10 }}>
                  {utilization.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-muted-foreground mt-1">{totalTeam} total resources across {portfolioProjects.length} projects</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Velocity Trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Org Velocity Trend (12 weeks)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={velocityTrend}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="throughput" stroke="#3B82F6" fill="url(#vGrad)" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget by Division */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Budget by Division ($k)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={divisionBudget} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="division" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={(v: number) => `$${v}k`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" fill="#E2E8F0" name="Allocated" radius={[0, 4, 4, 0]} />
                <Bar dataKey="spent" name="Spent" radius={[0, 4, 4, 0]}>
                  {divisionBudget.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Key Milestones */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Key Milestones — This Month</CardTitle>
              <Badge variant="outline" className="text-[10px]">{milestones.length} milestones</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {milestones.map((m, i) => {
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

        {/* Top Risks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" /> Escalated Risks</CardTitle>
              <Badge variant="destructive" className="text-[10px]">{topRisks.length} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {topRisks.map((r, i) => (
              <div key={i} className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] font-mono">{r.project}</Badge>
                  <Badge className={cn('text-[10px]', r.severity === 'critical' ? 'bg-red-600 text-white' : r.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-100 text-amber-800')}>{r.severity}</Badge>
                  <span className="text-[11px] text-muted-foreground ml-auto">{r.owner}</span>
                </div>
                <p className="text-xs">{r.risk}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
