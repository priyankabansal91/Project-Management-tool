import { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, Loader2, RefreshCw, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useOKRs } from '@/api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// ─── Fallback static OKRs (used when API returns empty) ──

const STATIC_OKRS = [
  {
    id: 'okr_1', title: 'Increase Revenue by 50%', level: 'company', progress: 65, health: 'on_track', quarter: 'Q2',
    keyResults: [
      { id: 'kr_1', title: 'Close 10 enterprise deals',    progress: 70, targetValue: 10,      currentValue: 7 },
      { id: 'kr_2', title: 'Increase ARR to ₹5Cr',         progress: 60, targetValue: 5000000, currentValue: 3000000 },
    ],
    linkedProjects: ['APIV3', 'SALES'], division: null,
  },
  {
    id: 'okr_2', title: 'Improve Engineering Delivery', level: 'division', progress: 52, health: 'behind', quarter: 'Q2',
    keyResults: [
      { id: 'kr_3', title: 'Reduce cycle time to <3 days',  progress: 48, targetValue: 3,  currentValue: 4.2 },
      { id: 'kr_4', title: 'Zero critical bugs in releases', progress: 55, targetValue: 0,  currentValue: 2 },
    ],
    linkedProjects: ['APIV3'], division: 'Engineering',
  },
  {
    id: 'okr_3', title: 'Grow Sales Pipeline 3x', level: 'division', progress: 38, health: 'at_risk', quarter: 'Q2',
    keyResults: [
      { id: 'kr_5', title: 'Generate 50 qualified leads', progress: 40, targetValue: 50, currentValue: 20 },
      { id: 'kr_6', title: 'Win rate > 30%',              progress: 35, targetValue: 30, currentValue: 11 },
    ],
    linkedProjects: ['SALES'], division: 'Sales',
  },
  {
    id: 'okr_4', title: 'Build Culture of Learning', level: 'division', progress: 70, health: 'on_track', quarter: 'Q2',
    keyResults: [
      { id: 'kr_7', title: 'Complete annual reviews for all staff', progress: 75, targetValue: 100, currentValue: 75 },
      { id: 'kr_8', title: 'eNPS > 60',                             progress: 65, targetValue: 60,  currentValue: 39 },
    ],
    linkedProjects: ['HR26'], division: 'HR',
  },
];

// ─── Helpers ─────────────────────────────────────────────

const healthConfig = {
  on_track: { label: 'On Track',  icon: CheckCircle,   cls: 'bg-green-100 text-green-800',  bar: '#10B981' },
  behind:   { label: 'Behind',    icon: AlertCircle,   cls: 'bg-yellow-100 text-yellow-800', bar: '#F59E0B' },
  at_risk:  { label: 'At Risk',   icon: AlertCircle,   cls: 'bg-red-100 text-red-800',       bar: '#EF4444' },
};

// ─── OKR card ─────────────────────────────────────────────

function OKRCard({ okr }: { okr: any }) {
  const [expanded, setExpanded] = useState(false);
  const hc = healthConfig[okr.health as keyof typeof healthConfig] || healthConfig.behind;
  const HIcon = hc.icon;
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">{okr.title}</h3>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', hc.cls)}>
                <HIcon className="w-3 h-3" /> {hc.label}
              </span>
              {okr.division && <Badge variant="outline" className="text-[10px]">{okr.division}</Badge>}
              <Badge variant="secondary" className="text-[10px]">{okr.level} · {okr.quarter}</Badge>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{okr.progress}%</p>
            <p className="text-[10px] text-muted-foreground">Progress</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${okr.progress}%`, backgroundColor: hc.bar }} />
        </div>

        {/* Key results (expanded) */}
        {expanded && (
          <div className="space-y-2 pt-1 border-t">
            <p className="text-xs font-semibold text-muted-foreground">Key Results</p>
            {(okr.keyResults || []).map((kr: any) => (
              <div key={kr.id} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground flex-1">{kr.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${kr.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{kr.progress}%</span>
                </div>
              </div>
            ))}
            {(okr.linkedProjects || []).length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Linked: </span>
                {okr.linkedProjects.map((p: string) => (
                  <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────

export function OKRDashboardPage() {
  const qc = useQueryClient();
  const { data: apiOKRs, isLoading } = useOKRs({ quarter: 'Q2' });
  const okrs: any[] = (apiOKRs && Array.isArray(apiOKRs) && apiOKRs.length > 0) ? apiOKRs : STATIC_OKRS;

  const healthCounts = {
    on_track: okrs.filter((o) => o.health === 'on_track').length,
    behind:   okrs.filter((o) => o.health === 'behind').length,
    at_risk:  okrs.filter((o) => o.health === 'at_risk').length,
  };

  const avgProgress = okrs.length ? Math.round(okrs.reduce((s, o) => s + (o.progress || 0), 0) / okrs.length) : 0;

  // Cascade summary: company → division → team
  const levelCounts = {
    company: okrs.filter((o) => o.level === 'company').length,
    division: okrs.filter((o) => o.level === 'division').length,
    team: okrs.filter((o) => o.level === 'team').length,
  };

  // Progress chart per OKR
  const progressChart = okrs.map((o) => ({
    name: o.title.substring(0, 22) + (o.title.length > 22 ? '…' : ''),
    progress: o.progress,
    color: healthConfig[o.health as keyof typeof healthConfig]?.bar || '#94A3B8',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> OKR & Goals Tracking
          </h1>
          <p className="text-muted-foreground text-sm">Link daily work to strategic objectives · Q2 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['okrs'] })}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" /> New OKR
          </Button>
        </div>
      </div>

      {/* Health + avg progress summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'On Track', count: healthCounts.on_track, cls: 'text-green-600',  bg: 'bg-green-50',  Icon: CheckCircle },
          { label: 'Behind',   count: healthCounts.behind,   cls: 'text-yellow-600', bg: 'bg-yellow-50', Icon: AlertCircle },
          { label: 'At Risk',  count: healthCounts.at_risk,  cls: 'text-red-600',    bg: 'bg-red-50',    Icon: AlertCircle },
          { label: 'Avg Progress', count: `${avgProgress}%`, cls: 'text-blue-600',   bg: 'bg-blue-50',   Icon: TrendingUp },
        ].map(({ label, count, cls, bg, Icon }) => (
          <Card key={label} className={cn('p-5', bg)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-3xl font-bold', cls)}>{count}</p>
              </div>
              <Icon className={cn('w-10 h-10 opacity-20', cls)} />
            </div>
          </Card>
        ))}
      </div>

      {/* Progress chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">OKR Progress Overview</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={progressChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                {progressChart.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* OKR list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Q2 2026 OKRs</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          okrs.map((okr) => <OKRCard key={okr.id} okr={okr} />)
        )}
      </div>

      {/* Goal cascade */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Goal Cascade</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Company OKRs', count: levelCounts.company, color: 'bg-blue-100 text-blue-700' },
              { label: 'Division Goals', count: levelCounts.division, color: 'bg-purple-100 text-purple-700' },
              { label: 'Team Goals', count: levelCounts.team, color: 'bg-green-100 text-green-700' },
            ].map(({ label, count, color }, i, arr) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn('rounded-xl p-4 text-center min-w-[120px]', color)}>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-3xl font-bold mt-1">{count}</p>
                </div>
                {i < arr.length - 1 && <span className="text-xl text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
