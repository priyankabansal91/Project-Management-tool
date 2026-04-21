import { Users, AlertCircle, TrendingUp, Briefcase, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { useResources, useExecutiveRollup } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// ─── Static fallback resources ────────────────────────────

const STATIC_RESOURCES = [
  { id: 'r1', name: 'Anjali Singh',  type: 'fte',        department: 'Engineering', division: 'div_engineering', utilization: 92,  skills: ['React','TypeScript','Node.js'],           available: 8 },
  { id: 'r2', name: 'Ravi Kumar',    type: 'fte',        department: 'Engineering', division: 'div_engineering', utilization: 105, skills: ['Python','AWS','DevOps'],                  available: -5 },
  { id: 'r3', name: 'Rahul Mehta',   type: 'fte',        department: 'Engineering', division: 'div_engineering', utilization: 78,  skills: ['Architecture','Postgres','Redis'],        available: 22 },
  { id: 'r4', name: 'Priya Sharma',  type: 'fte',        department: 'Management',  division: 'div_engineering', utilization: 85,  skills: ['Product Strategy','OKR','Stakeholders'],  available: 15 },
  { id: 'r5', name: 'Sneha Patel',   type: 'contractor', department: 'Sales',       division: 'div_sales',       utilization: 65,  skills: ['CRM','Salesforce','Lead Gen'],            available: 35 },
  { id: 'r6', name: 'Vikram Nair',   type: 'fte',        department: 'Sales',       division: 'div_sales',       utilization: 88,  skills: ['Enterprise Sales','Negotiation'],         available: 12 },
  { id: 'r7', name: 'Deepa Rao',     type: 'fte',        department: 'HR',          division: 'div_hr',          utilization: 60,  skills: ['L&D','HRMS','Recruitment'],               available: 40 },
  { id: 'r8', name: 'Arjun Pillai',  type: 'contractor', department: 'HR',          division: 'div_hr',          utilization: 0,   skills: ['Payroll','Compliance'],                   available: 100 },
];

const DIV_COLORS: Record<string, string> = {
  div_engineering: '#3B82F6',
  div_sales:       '#10B981',
  div_hr:          '#F59E0B',
};

// ─── Utilization bar ─────────────────────────────────────

function UtilBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100);
  const color = pct > 100 ? '#EF4444' : pct >= 80 ? '#10B981' : pct > 0 ? '#F59E0B' : '#94A3B8';
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className="h-2 rounded-full transition-all" style={{ width: `${capped}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Resource row ─────────────────────────────────────────

function ResourceRow({ r }: { r: any }) {
  const statusColor = r.utilization > 100 ? 'text-red-600 bg-red-50' : r.utilization >= 80 ? 'text-green-700 bg-green-50' : r.utilization > 0 ? 'text-yellow-700 bg-yellow-50' : 'text-muted-foreground bg-muted';
  return (
    <div className="rounded-lg border p-3 space-y-2 hover:bg-muted/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
            {r.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{r.name}</p>
            <p className="text-[11px] text-muted-foreground">{r.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px]">{r.type === 'fte' ? 'FTE' : 'Contractor'}</Badge>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', statusColor)}>{r.utilization}%</span>
        </div>
      </div>
      <UtilBar pct={r.utilization} />
      {r.utilization > 100 && <p className="text-[11px] text-red-600">Overallocated by {r.utilization - 100}%</p>}
      <div className="flex flex-wrap gap-1">
        {(r.skills || []).slice(0, 3).map((s: string) => (
          <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export function ResourceDashboardPage() {
  const qc = useQueryClient();
  const { data: apiResources, isLoading: resLoading } = useResources();
  const { data: rollup, isLoading: rollupLoading }     = useExecutiveRollup();

  const resources: any[] = (apiResources && Array.isArray(apiResources) && apiResources.length > 0)
    ? apiResources
    : STATIC_RESOURCES;

  const overloaded     = resources.filter((r) => r.utilization > 100);
  const fullyUtilized  = resources.filter((r) => r.utilization >= 80 && r.utilization <= 100);
  const available      = resources.filter((r) => r.utilization > 0 && r.utilization < 80);
  const bench          = resources.filter((r) => r.utilization === 0);
  const avgUtil        = resources.length ? Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length) : 0;

  // Per-division capacity from rollup scorecards
  const scorecards = rollup?.scorecards || [];
  const divCapacity = scorecards.map((d: any) => ({
    name:    d.name.split(' ')[0],
    color:   d.color,
    members: d.memberCount,
    tasks:   d.totalTasks,
    overdue: d.overdueTasks,
  }));

  // Skill coverage
  const allSkills = [...new Set(resources.flatMap((r) => r.skills || []))];
  const skillData = allSkills.slice(0, 8).map((skill) => ({
    skill,
    count: resources.filter((r) => (r.skills || []).includes(skill)).length,
  }));

  // Utilization chart by department
  const deptMap: Record<string, number[]> = {};
  resources.forEach((r) => {
    if (!deptMap[r.department]) deptMap[r.department] = [];
    deptMap[r.department].push(r.utilization);
  });
  const deptChart = Object.entries(deptMap).map(([dept, utils]) => ({
    dept,
    avg: Math.round(utils.reduce((s, v) => s + v, 0) / utils.length),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Resource & Capacity Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Cross-division capacity, utilization, and skills</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { qc.invalidateQueries({ queryKey: ['resources'] }); qc.invalidateQueries({ queryKey: ['executiveRollup'] }); }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: resources.length, icon: Users,         cls: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Avg Utilization', value: `${avgUtil}%`,     icon: TrendingUp,    cls: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Overloaded',      value: overloaded.length, icon: AlertCircle,   cls: 'text-red-600',   bg: 'bg-red-50'   },
          { label: 'On Bench',        value: bench.length,      icon: Briefcase,     cls: 'text-gray-600',  bg: 'bg-gray-50'  },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <Card key={label} className={cn('p-5', bg)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-3xl font-bold', cls)}>{value}</p>
              </div>
              <Icon className={cn('w-10 h-10 opacity-20', cls)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Division capacity + Dept utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division capacity from rollup */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Division Capacity (from Rollup)</CardTitle>
          </CardHeader>
          <CardContent>
            {rollupLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : divCapacity.length > 0 ? (
              <div className="space-y-3">
                {divCapacity.map((d: any) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-medium">{d.name}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{d.members} members</span>
                        <span className={cn(d.overdue > 0 ? 'text-red-600 font-medium' : '')}>{d.overdue} overdue</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${Math.min((d.members / 8) * 100, 100)}%`, backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No division data</p>
            )}
          </CardContent>
        </Card>

        {/* Dept avg utilization */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Utilization by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptChart}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 120]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="avg" name="Avg Util" radius={[4, 4, 0, 0]}>
                  {deptChart.map((d, i) => (
                    <Cell key={i} fill={d.avg > 100 ? '#EF4444' : d.avg >= 80 ? '#10B981' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resource list */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          All Resources {resLoading && <Loader2 className="h-3.5 w-3.5 inline-block animate-spin ml-2" />}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((r) => <ResourceRow key={r.id} r={r} />)}
        </div>
      </div>

      {/* Capacity status + Skill matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Capacity Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Overloaded',     count: overloaded.length,    note: 'Needs immediate action',  cls: 'bg-red-50 text-red-900 border-red-200' },
              { label: 'Fully Utilized', count: fullyUtilized.length, note: 'Optimal allocation',      cls: 'bg-green-50 text-green-900 border-green-200' },
              { label: 'Available',      count: available.length,     note: 'Can take more work',      cls: 'bg-yellow-50 text-yellow-900 border-yellow-200' },
              { label: 'On Bench',       count: bench.length,         note: 'Between projects',        cls: 'bg-muted text-muted-foreground border-border' },
            ].map(({ label, count, note, cls }) => (
              <div key={label} className={cn('rounded-lg border p-3 flex items-center justify-between', cls)}>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs opacity-70">{note}</p>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Skill Coverage</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {skillData.map(({ skill, count }) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="text-xs w-32 truncate">{skill}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(count / resources.length) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{count}p</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bench report */}
      {bench.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bench Report</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bench.map((r) => (
              <div key={r.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.department}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{r.type === 'fte' ? 'FTE' : 'Contractor'}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(r.skills || []).map((s: string) => (
                    <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
