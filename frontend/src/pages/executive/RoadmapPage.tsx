import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft, ChevronRight, Download, Filter, ZoomIn, ZoomOut, Target,
  Calendar, Users, AlertTriangle, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RAG = 'green' | 'amber' | 'red';

interface RoadmapProject {
  id: string;
  name: string;
  key: string;
  color: string;
  division: string;
  pm: string;
  health: RAG;
  pct: number;
  start: string; // YYYY-MM-DD
  end: string;
  milestones: { name: string; date: string; done: boolean }[];
  dependencies: string[]; // project ids this depends on
}

const projects: RoadmapProject[] = [
  { id: 'p1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6', division: 'Product Engineering', pm: 'Emily Zhang', health: 'green', pct: 56, start: '2026-01-15', end: '2026-06-30', milestones: [{ name: 'Design', date: '2026-02-28', done: true }, { name: 'Beta', date: '2026-04-30', done: false }, { name: 'GA', date: '2026-06-30', done: false }], dependencies: [] },
  { id: 'p2', name: 'API Gateway Migration', key: 'AGM', color: '#8B5CF6', division: 'Platform Engineering', pm: 'David Park', health: 'red', pct: 33, start: '2026-02-01', end: '2026-05-31', milestones: [{ name: 'Auth', date: '2026-03-15', done: true }, { name: 'Payments', date: '2026-04-15', done: false }, { name: 'Cutover', date: '2026-05-31', done: false }], dependencies: [] },
  { id: 'p3', name: 'Mobile App v2', key: 'MAV2', color: '#F59E0B', division: 'Product Engineering', pm: 'James Wright', health: 'amber', pct: 41, start: '2026-01-01', end: '2026-07-31', milestones: [{ name: 'Nav', date: '2026-02-15', done: true }, { name: 'Offline', date: '2026-04-30', done: false }, { name: 'Submit', date: '2026-07-01', done: false }], dependencies: ['p2'] },
  { id: 'p4', name: 'HR Onboarding Platform', key: 'HROP', color: '#10B981', division: 'Human Resources', pm: 'Kate Adams', health: 'green', pct: 27, start: '2026-03-01', end: '2026-08-31', milestones: [{ name: 'Prototype', date: '2026-04-15', done: true }, { name: 'Workday', date: '2026-06-30', done: false }, { name: 'Go-live', date: '2026-08-31', done: false }], dependencies: [] },
  { id: 'p5', name: 'Data Analytics Dashboard', key: 'DAD', color: '#EF4444', division: 'Data Engineering', pm: 'Marco Silva', health: 'green', pct: 55, start: '2026-02-15', end: '2026-06-15', milestones: [{ name: 'Charts', date: '2026-03-31', done: true }, { name: 'Streaming', date: '2026-05-15', done: false }, { name: 'Power BI', date: '2026-06-15', done: false }], dependencies: ['p2'] },
  { id: 'p6', name: 'SOC 2 Compliance', key: 'SOC2', color: '#6366F1', division: 'Legal & Compliance', pm: 'George Hayes', health: 'green', pct: 71, start: '2026-01-01', end: '2026-12-31', milestones: [{ name: 'Gap', date: '2026-03-01', done: true }, { name: 'Controls', date: '2026-06-30', done: false }, { name: 'Audit', date: '2026-12-31', done: false }], dependencies: [] },
  { id: 'p7', name: 'CRM Integration', key: 'CRM', color: '#EC4899', division: 'Sales & Marketing', pm: 'Lisa Chang', health: 'amber', pct: 38, start: '2026-03-15', end: '2026-07-15', milestones: [{ name: 'API Connect', date: '2026-04-30', done: false }, { name: 'Data Sync', date: '2026-06-15', done: false }, { name: 'Launch', date: '2026-07-15', done: false }], dependencies: ['p2'] },
  { id: 'p8', name: 'Cloud Migration Phase 2', key: 'CMP2', color: '#14B8A6', division: 'IT Operations', pm: 'Bob Martinez', health: 'green', pct: 62, start: '2026-01-01', end: '2026-09-30', milestones: [{ name: 'Staging', date: '2026-04-25', done: false }, { name: 'Prod', date: '2026-07-31', done: false }, { name: 'Decom', date: '2026-09-30', done: false }], dependencies: [] },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ragLabels: Record<RAG, string> = { green: 'On Track', amber: 'At Risk', red: 'Off Track' };
const ragDotColor: Record<RAG, string> = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };

function monthDiff(d1: string, d2: string): number {
  const a = new Date(d1), b = new Date(d2);
  return (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
}

export function RoadmapPage() {
  const dialog = useDialog();
  const [filterDivision, setFilterDivision] = useState('all');
  const [showDeps, setShowDeps] = useState(true);

  const timelineStart = '2026-01-01';
  const timelineMonths = 12;

  const divisions = [...new Set(projects.map((p) => p.division))];

  const filtered = projects.filter((p) => filterDivision === 'all' || p.division === filterDivision);

  const today = new Date();
  const todayOffset = monthDiff(timelineStart, today.toISOString().slice(0, 10));
  const todayPct = Math.min(Math.max((todayOffset / timelineMonths) * 100, 0), 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Strategic Roadmap</h1>
          <p className="text-muted-foreground">{filtered.length} projects &middot; {timelineMonths}-month view &middot; 2026</p>
        </div>
        <div className="flex gap-2">
          <select value={filterDivision} onChange={(e) => setFilterDivision(e.target.value)} className="rounded-md border bg-background px-2 py-1.5 text-xs">
            <option value="all">All Divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowDeps(!showDeps)}>
            {showDeps ? 'Hide' : 'Show'} Dependencies
          </Button>
          <Button size="sm" onClick={() => dialog.alert({ title: 'Exporting', message: 'Exporting roadmap as PowerPoint...', variant: 'info' })}><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />On Track</span>
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" />At Risk</span>
        <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500" />Off Track</span>
        <span className="flex items-center gap-1.5"><div className="h-4 w-4 rounded-sm border-2 border-dashed border-primary" />Today</span>
        <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />Milestone</span>
        {showDeps && <span className="flex items-center gap-1.5 text-orange-500"><ArrowRight className="h-3.5 w-3.5" />Dependency</span>}
      </div>

      {/* Gantt */}
      <Card className="overflow-x-auto">
        <CardContent className="p-0 min-w-[900px]">
          {/* Month Headers */}
          <div className="flex border-b sticky top-0 bg-card z-10">
            <div className="w-56 shrink-0 border-r px-3 py-2 text-xs font-semibold text-muted-foreground">Project</div>
            <div className="flex-1 flex relative">
              {MONTHS.map((m, i) => (
                <div key={m} className="flex-1 text-center text-[11px] font-medium text-muted-foreground py-2 border-r last:border-r-0">{m}</div>
              ))}
              {/* Today line */}
              <div className="absolute top-0 bottom-0 w-px bg-primary z-20" style={{ left: `${todayPct}%` }}>
                <div className="absolute -top-0 -left-3 bg-primary text-primary-foreground text-[9px] px-1 rounded-b">Today</div>
              </div>
            </div>
          </div>

          {/* Project Rows */}
          {filtered.map((p) => {
            const startOff = monthDiff(timelineStart, p.start);
            const duration = monthDiff(p.start, p.end);
            const leftPct = (startOff / timelineMonths) * 100;
            const widthPct = (duration / timelineMonths) * 100;
            const barColor = p.health === 'green' ? p.color : p.health === 'amber' ? '#F59E0B' : '#EF4444';

            return (
              <div key={p.id} className="flex border-b last:border-b-0 hover:bg-accent/30 transition-colors group">
                {/* Label */}
                <div className="w-56 shrink-0 border-r px-3 py-3 flex items-center gap-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', ragDotColor[p.health])} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{p.key}</span>
                      <span className="text-xs truncate">{p.name}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{p.division} &middot; {p.pm}</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative py-2 px-0">
                  {/* Month grid lines */}
                  <div className="absolute inset-0 flex">
                    {MONTHS.map((_, i) => <div key={i} className="flex-1 border-r last:border-r-0 border-dashed opacity-20" />)}
                  </div>

                  {/* Bar */}
                  <div
                    className="absolute top-3 h-7 rounded-md flex items-center px-2 transition-all group-hover:shadow-md"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: barColor, opacity: 0.85 }}
                  >
                    {/* Progress fill */}
                    <div className="absolute inset-0 rounded-md overflow-hidden">
                      <div className="h-full bg-white/20" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="relative text-[10px] font-bold text-white z-10">{p.pct}%</span>
                  </div>

                  {/* Milestones */}
                  {p.milestones.map((m, mi) => {
                    const mOff = monthDiff(timelineStart, m.date);
                    const mPct = (mOff / timelineMonths) * 100;
                    return (
                      <div key={mi} className="absolute top-1" style={{ left: `${mPct}%` }} title={`${m.name} — ${m.date}${m.done ? ' (Done)' : ''}`}>
                        <div className={cn(
                          'h-4 w-4 rounded-full border-2 flex items-center justify-center -ml-2',
                          m.done ? 'bg-emerald-500 border-emerald-600' : 'bg-white dark:bg-gray-800 border-muted-foreground'
                        )}>
                          {m.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    );
                  })}

                  {/* Dependency arrows */}
                  {showDeps && p.dependencies.map((depId) => {
                    const dep = projects.find((x) => x.id === depId);
                    if (!dep) return null;
                    const depEnd = monthDiff(timelineStart, dep.end);
                    const depEndPct = (depEnd / timelineMonths) * 100;
                    return (
                      <div key={depId} className="absolute top-6" style={{ left: `${Math.min(depEndPct, leftPct)}%`, width: `${Math.abs(leftPct - depEndPct)}%` }}>
                        <div className="h-px bg-orange-400 w-full relative">
                          <div className="absolute right-0 -top-1 text-orange-400">▸</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Upcoming Milestones (30 days)</h4>
          <div className="space-y-2">
            {projects.flatMap((p) => p.milestones.filter((m) => !m.done).map((m) => ({ ...m, project: p.key, color: p.color, health: p.health }))).filter((m) => { const d = new Date(m.date); const now = new Date(); return d >= now && d <= new Date(now.getTime() + 30 * 86400000); }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={cn('h-2.5 w-2.5 rounded-full', ragDotColor[m.health])} />
                <Badge variant="outline" className="text-[10px] font-mono">{m.project}</Badge>
                <span className="flex-1 truncate">{m.name}</span>
                <span className="text-muted-foreground">{m.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Projects at Risk</h4>
          <div className="space-y-2">
            {projects.filter((p) => p.health !== 'green').map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <div className={cn('h-2.5 w-2.5 rounded-full', ragDotColor[p.health])} />
                <span className="font-bold">{p.key}</span>
                <span className="flex-1 truncate">{p.name}</span>
                <Badge className={cn('text-[10px]', p.health === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{ragLabels[p.health]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><ArrowRight className="h-3.5 w-3.5 text-orange-500" /> Cross-Project Dependencies</h4>
          <div className="space-y-2">
            {projects.filter((p) => p.dependencies.length > 0).map((p) => (
              <div key={p.id} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">{p.key}</Badge>
                  <span className="text-muted-foreground">depends on</span>
                  {p.dependencies.map((d) => {
                    const dep = projects.find((x) => x.id === d);
                    return <Badge key={d} variant="outline" className="text-[10px] font-mono">{dep?.key}</Badge>;
                  })}
                </div>
              </div>
            ))}
            {projects.filter((p) => p.dependencies.length > 0).length === 0 && (
              <p className="text-xs text-muted-foreground">No dependencies configured</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
