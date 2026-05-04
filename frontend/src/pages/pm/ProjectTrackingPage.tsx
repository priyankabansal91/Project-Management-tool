import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart as RPieChart, Pie, Legend,
} from 'recharts';
import {
  Search, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, Users, Calendar, FolderKanban, ChevronRight, Download, Filter,
  Eye, BarChart3, Target, Zap, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RAG = 'green' | 'amber' | 'red';
type Trend = 'up' | 'down' | 'flat';

interface ProjectTracking {
  id: string;
  name: string;
  key: string;
  color: string;
  division: string;
  pm: string;
  start_date: string;
  due_date: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  story_points_total: number;
  story_points_done: number;
  budget_allocated: number;
  budget_spent: number;
  team_size: number;
  health: RAG;
  schedule_health: RAG;
  scope_health: RAG;
  budget_health: RAG;
  completion_pct: number;
  velocity_trend: Trend;
  last_updated: string;
  milestones: { name: string; due: string; done: boolean }[];
  risks: string[];
}

const mockProjects: ProjectTracking[] = [
  {
    id: 'p1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6',
    division: 'Product Engineering', pm: 'Emily Zhang',
    start_date: '2026-01-15', due_date: '2026-06-30',
    total_tasks: 128, completed_tasks: 72, in_progress_tasks: 18, overdue_tasks: 3, blocked_tasks: 2,
    story_points_total: 340, story_points_done: 198,
    budget_allocated: 280000, budget_spent: 165000, team_size: 14,
    health: 'green', schedule_health: 'green', scope_health: 'green', budget_health: 'green',
    completion_pct: 56.3, velocity_trend: 'up', last_updated: '2h ago',
    milestones: [
      { name: 'Design Complete', due: '2026-02-28', done: true },
      { name: 'Beta Release', due: '2026-04-30', done: false },
      { name: 'GA Launch', due: '2026-06-30', done: false },
    ],
    risks: [],
  },
  {
    id: 'p2', name: 'API Gateway Migration', key: 'AGM', color: '#8B5CF6',
    division: 'Platform Engineering', pm: 'David Park',
    start_date: '2026-02-01', due_date: '2026-05-31',
    total_tasks: 85, completed_tasks: 28, in_progress_tasks: 12, overdue_tasks: 8, blocked_tasks: 4,
    story_points_total: 210, story_points_done: 68,
    budget_allocated: 180000, budget_spent: 112000, team_size: 8,
    health: 'red', schedule_health: 'red', scope_health: 'amber', budget_health: 'amber',
    completion_pct: 32.9, velocity_trend: 'down', last_updated: '30m ago',
    milestones: [
      { name: 'Auth migration', due: '2026-03-15', done: true },
      { name: 'Payment endpoints', due: '2026-04-15', done: false },
      { name: 'Full cutover', due: '2026-05-31', done: false },
    ],
    risks: ['8 overdue tasks blocking downstream', 'Budget 62% spent at 33% completion', 'Key developer on leave until May'],
  },
  {
    id: 'p3', name: 'Mobile App v2', key: 'MAV2', color: '#F59E0B',
    division: 'Product Engineering', pm: 'James Wright',
    start_date: '2026-01-01', due_date: '2026-07-31',
    total_tasks: 156, completed_tasks: 64, in_progress_tasks: 22, overdue_tasks: 5, blocked_tasks: 1,
    story_points_total: 420, story_points_done: 178,
    budget_allocated: 350000, budget_spent: 148000, team_size: 12,
    health: 'amber', schedule_health: 'amber', scope_health: 'green', budget_health: 'green',
    completion_pct: 41.0, velocity_trend: 'flat', last_updated: '1h ago',
    milestones: [
      { name: 'Core Navigation', due: '2026-02-15', done: true },
      { name: 'Offline Mode', due: '2026-04-30', done: false },
      { name: 'App Store Submit', due: '2026-07-01', done: false },
    ],
    risks: ['5 overdue tasks in offline sync module'],
  },
  {
    id: 'p4', name: 'HR Onboarding Platform', key: 'HROP', color: '#10B981',
    division: 'Human Resources', pm: 'Kate Adams',
    start_date: '2026-03-01', due_date: '2026-08-31',
    total_tasks: 68, completed_tasks: 18, in_progress_tasks: 8, overdue_tasks: 0, blocked_tasks: 0,
    story_points_total: 160, story_points_done: 42,
    budget_allocated: 120000, budget_spent: 32000, team_size: 6,
    health: 'green', schedule_health: 'green', scope_health: 'green', budget_health: 'green',
    completion_pct: 26.5, velocity_trend: 'up', last_updated: '4h ago',
    milestones: [
      { name: 'Wizard Prototype', due: '2026-04-15', done: true },
      { name: 'Integration with Workday', due: '2026-06-30', done: false },
      { name: 'Go-live', due: '2026-08-31', done: false },
    ],
    risks: [],
  },
  {
    id: 'p5', name: 'Data Analytics Dashboard', key: 'DAD', color: '#EF4444',
    division: 'Data Engineering', pm: 'Marco Silva',
    start_date: '2026-02-15', due_date: '2026-06-15',
    total_tasks: 94, completed_tasks: 52, in_progress_tasks: 15, overdue_tasks: 2, blocked_tasks: 0,
    story_points_total: 250, story_points_done: 142,
    budget_allocated: 200000, budget_spent: 118000, team_size: 10,
    health: 'green', schedule_health: 'green', scope_health: 'green', budget_health: 'amber',
    completion_pct: 55.3, velocity_trend: 'up', last_updated: '1h ago',
    milestones: [
      { name: 'Core Charts', due: '2026-03-31', done: true },
      { name: 'Real-time Streaming', due: '2026-05-15', done: false },
      { name: 'Power BI Export', due: '2026-06-15', done: false },
    ],
    risks: ['Budget at 59% with 55% complete — tight margin'],
  },
  {
    id: 'p6', name: 'SOC 2 Compliance Audit', key: 'SOC2', color: '#6366F1',
    division: 'Legal & Compliance', pm: 'George Hayes',
    start_date: '2026-01-01', due_date: '2026-12-31',
    total_tasks: 42, completed_tasks: 30, in_progress_tasks: 5, overdue_tasks: 0, blocked_tasks: 0,
    story_points_total: 100, story_points_done: 72,
    budget_allocated: 90000, budget_spent: 45000, team_size: 4,
    health: 'green', schedule_health: 'green', scope_health: 'green', budget_health: 'green',
    completion_pct: 71.4, velocity_trend: 'up', last_updated: '6h ago',
    milestones: [
      { name: 'Gap Assessment', due: '2026-03-01', done: true },
      { name: 'Controls Implementation', due: '2026-06-30', done: false },
      { name: 'Audit Complete', due: '2026-12-31', done: false },
    ],
    risks: [],
  },
];

const ragColors: Record<RAG, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'On Track' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', label: 'At Risk' },
  red: { bg: 'bg-red-100 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', label: 'Off Track' },
};

const trendIcons: Record<Trend, typeof ArrowUpRight> = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };
const trendColors: Record<Trend, string> = { up: 'text-emerald-600', down: 'text-red-600', flat: 'text-muted-foreground' };

export function ProjectTrackingPage() {
  const [search, setSearch] = useState('');
  const [filterHealth, setFilterHealth] = useState<RAG | 'all'>('all');
  const [filterDivision, setFilterDivision] = useState('all');
  const [selectedProject, setSelectedProject] = useState<ProjectTracking | null>(null);
  const [sortBy, setSortBy] = useState<'completion' | 'health' | 'name' | 'overdue'>('health');

  const divisions = useMemo(() => [...new Set(mockProjects.map((p) => p.division))], []);

  function exportCSV() {
    const headers = ['Name', 'Key', 'Division', 'PM', 'Completion %', 'Health', 'Total Tasks', 'Completed Tasks', 'Overdue Tasks', 'Budget Allocated', 'Budget Spent', 'Due Date'];
    const rows = mockProjects.map((p) => [
      p.name, p.key, p.division, p.pm, p.completion_pct.toFixed(1),
      ragColors[p.health].label, p.total_tasks, p.completed_tasks, p.overdue_tasks,
      p.budget_allocated, p.budget_spent, p.due_date,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    let list = mockProjects.filter((p) => {
      if (filterHealth !== 'all' && p.health !== filterHealth) return false;
      if (filterDivision !== 'all' && p.division !== filterDivision) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.key.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    const healthOrder: Record<RAG, number> = { red: 0, amber: 1, green: 2 };
    if (sortBy === 'health') list.sort((a, b) => healthOrder[a.health] - healthOrder[b.health]);
    else if (sortBy === 'completion') list.sort((a, b) => b.completion_pct - a.completion_pct);
    else if (sortBy === 'overdue') list.sort((a, b) => b.overdue_tasks - a.overdue_tasks);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [search, filterHealth, filterDivision, sortBy]);

  // Portfolio summary stats
  const totalTasks = mockProjects.reduce((a, p) => a + p.total_tasks, 0);
  const totalCompleted = mockProjects.reduce((a, p) => a + p.completed_tasks, 0);
  const totalOverdue = mockProjects.reduce((a, p) => a + p.overdue_tasks, 0);
  const totalBudget = mockProjects.reduce((a, p) => a + p.budget_allocated, 0);
  const totalSpent = mockProjects.reduce((a, p) => a + p.budget_spent, 0);
  const overallPct = Math.round((totalCompleted / totalTasks) * 100);

  const healthCounts = { green: mockProjects.filter((p) => p.health === 'green').length, amber: mockProjects.filter((p) => p.health === 'amber').length, red: mockProjects.filter((p) => p.health === 'red').length };

  const completionChart = mockProjects.map((p) => ({
    name: p.key, completion: p.completion_pct, color: p.color,
  })).sort((a, b) => b.completion - a.completion);

  const healthPie = [
    { name: 'On Track', value: healthCounts.green, color: '#10B981' },
    { name: 'At Risk', value: healthCounts.amber, color: '#F59E0B' },
    { name: 'Off Track', value: healthCounts.red, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Project Tracking</h1>
          <p className="text-muted-foreground">{mockProjects.length} active projects &middot; Portfolio overview for leadership</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /> Export Report
        </Button>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <FolderKanban className="h-5 w-5 mx-auto text-blue-500" />
          <div className="text-2xl font-bold mt-1">{mockProjects.length}</div>
          <div className="text-[11px] text-muted-foreground">Active Projects</div>
        </Card>
        <Card className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto text-emerald-500" />
          <div className="text-2xl font-bold mt-1">{overallPct}%</div>
          <div className="text-[11px] text-muted-foreground">Overall Completion</div>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto text-green-500" />
          <div className="text-2xl font-bold mt-1">{healthCounts.green}</div>
          <div className="text-[11px] text-muted-foreground">On Track</div>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-amber-500" />
          <div className="text-2xl font-bold mt-1">{healthCounts.amber + healthCounts.red}</div>
          <div className="text-[11px] text-muted-foreground">At Risk / Off Track</div>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-red-500" />
          <div className="text-2xl font-bold mt-1">{totalOverdue}</div>
          <div className="text-[11px] text-muted-foreground">Overdue Tasks</div>
        </Card>
        <Card className="p-4 text-center">
          <Zap className="h-5 w-5 mx-auto text-violet-500" />
          <div className="text-2xl font-bold mt-1">${(totalSpent / 1000).toFixed(0)}k</div>
          <div className="text-[11px] text-muted-foreground">of ${(totalBudget / 1000).toFixed(0)}k budget</div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Completion by Project (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={completionChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="completion" radius={[0, 4, 4, 0]}>
                  {completionChart.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Portfolio Health</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RPieChart>
                <Pie data={healthPie} dataKey="value" nameKey="name" outerRadius={65} innerRadius={35} label={{ fontSize: 10 }}>
                  {healthPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="inline-flex rounded-md border">
          {(['all', 'red', 'amber', 'green'] as const).map((h) => (
            <button key={h} onClick={() => setFilterHealth(h)} className={cn('px-3 py-1.5 text-xs font-medium capitalize', filterHealth === h ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
              {h === 'all' ? 'All' : ragColors[h].label}
            </button>
          ))}
        </div>
        <select value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
          <option value="all">All Divisions</option>
          {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
          <option value="health">Sort: Health (worst first)</option>
          <option value="completion">Sort: Completion %</option>
          <option value="overdue">Sort: Most overdue</option>
          <option value="name">Sort: Name A-Z</option>
        </select>
      </div>

      {/* Project Cards */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const rag = ragColors[p.health];
          const TrendIcon = trendIcons[p.velocity_trend];
          const budgetPct = Math.round((p.budget_spent / p.budget_allocated) * 100);
          const isSelected = selectedProject?.id === p.id;

          return (
            <Card
              key={p.id}
              className={cn('overflow-hidden transition-all cursor-pointer', isSelected && 'ring-2 ring-primary')}
              onClick={() => setSelectedProject(isSelected ? null : p)}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Color bar + icon */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <Badge className={cn('text-[10px]', rag.bg, rag.text)}>{rag.label}</Badge>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono">{p.key}</Badge>
                      <span className="text-[11px] text-muted-foreground">&middot; {p.division}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.completion_pct}%`, backgroundColor: p.color }}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{ color: p.color }}>{p.completion_pct}%</span>
                      <div className={cn('flex items-center gap-0.5 text-xs', trendColors[p.velocity_trend])}>
                        <TrendIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{p.completed_tasks}/{p.total_tasks} tasks</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" />{p.in_progress_tasks} in progress</span>
                      {p.overdue_tasks > 0 && <span className="inline-flex items-center gap-1 text-red-600 font-medium"><AlertTriangle className="h-3 w-3" />{p.overdue_tasks} overdue</span>}
                      {p.blocked_tasks > 0 && <span className="inline-flex items-center gap-1 text-orange-600 font-medium">{p.blocked_tasks} blocked</span>}
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{p.team_size} members</span>
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{p.pm}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Due {p.due_date}</span>
                    </div>
                  </div>

                  {/* Right side — health indicators */}
                  <div className="hidden lg:flex flex-col gap-1.5 shrink-0 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-14 text-muted-foreground">Schedule</span>
                      <div className={cn('h-2.5 w-2.5 rounded-full', p.schedule_health === 'green' ? 'bg-emerald-500' : p.schedule_health === 'amber' ? 'bg-amber-500' : 'bg-red-500')} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-14 text-muted-foreground">Scope</span>
                      <div className={cn('h-2.5 w-2.5 rounded-full', p.scope_health === 'green' ? 'bg-emerald-500' : p.scope_health === 'amber' ? 'bg-amber-500' : 'bg-red-500')} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-14 text-muted-foreground">Budget</span>
                      <div className={cn('h-2.5 w-2.5 rounded-full', p.budget_health === 'green' ? 'bg-emerald-500' : p.budget_health === 'amber' ? 'bg-amber-500' : 'bg-red-500')} />
                    </div>
                    <div className="mt-1 text-muted-foreground">${(p.budget_spent / 1000).toFixed(0)}k / ${(p.budget_allocated / 1000).toFixed(0)}k ({budgetPct}%)</div>
                  </div>

                  <ChevronRight className={cn('h-5 w-5 text-muted-foreground transition-transform shrink-0', isSelected && 'rotate-90')} />
                </div>
              </div>

              {/* Expanded detail */}
              {isSelected && (
                <div className="border-t bg-secondary/20 p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Milestones */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Milestones</h4>
                      <div className="space-y-2">
                        {p.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0',
                              m.done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground'
                            )}>
                              {m.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={cn('flex-1', m.done && 'line-through text-muted-foreground')}>{m.name}</span>
                            <span className="text-muted-foreground">{m.due}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Story Points */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Story Points</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Completed</span>
                          <span className="font-bold">{p.story_points_done} / {p.story_points_total} SP</span>
                        </div>
                        <div className="h-3 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(p.story_points_done / p.story_points_total * 100)}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(p.story_points_done / p.story_points_total * 100)}% of scope delivered
                        </div>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Budget</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Spent</span>
                          <span className="font-bold">${(p.budget_spent / 1000).toFixed(0)}k / ${(p.budget_allocated / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="h-3 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', budgetPct > 80 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(budgetPct, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {budgetPct}% budget used at {p.completion_pct.toFixed(0)}% completion
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risks */}
                  {p.risks.length > 0 && (
                    <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3">
                      <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Risks & Issues ({p.risks.length})
                      </h4>
                      <ul className="space-y-1">
                        {p.risks.map((r, i) => (
                          <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {p.start_date} → {p.due_date}
                    <span>&middot;</span>
                    Updated {p.last_updated}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">No projects match your filters</Card>
      )}
    </div>
  );
}
