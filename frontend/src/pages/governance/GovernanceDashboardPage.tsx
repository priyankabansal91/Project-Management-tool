import { useState } from 'react';
import {
  IndianRupee, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  BarChart3, Flag, Clock, Target, ChevronRight, Building2,
  Calendar, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


// ── helpers ──────────────────────────────────────────────────────────────────

function fmtCr(n: number) {
  return n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)} Cr`
       : n >= 100_000    ? `₹${(n / 100_000).toFixed(1)} L`
       : `₹${n.toLocaleString('en-IN')}`;
}

function variance(planned: number, actual: number) {
  if (planned === 0) return 0;
  return ((actual - planned) / planned) * 100;
}

const HA = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const DA = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().split('T')[0];
const DB = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().split('T')[0];

// ── mock data ─────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: 'proj-001', key: 'BDG-001', name: 'Bridge Rehabilitation — Narmada',
    division: 'Infrastructure', pm: 'Priya Singh',
    budget: { planned: 128_000_000, actual: 142_000_000 },
    categories: [
      { name: 'Civil Works',  planned: 80_000_000, actual: 92_000_000 },
      { name: 'Equipment',    planned: 28_000_000, actual: 31_000_000 },
      { name: 'Labour',       planned: 15_000_000, actual: 14_000_000 },
      { name: 'Consultancy',  planned: 5_000_000,  actual: 5_000_000  },
    ],
  },
  {
    id: 'proj-002', key: 'WTR-010', name: 'Rural Water Supply Pipeline',
    division: 'Water Resources', pm: 'Deepak Nair',
    budget: { planned: 64_000_000, actual: 58_000_000 },
    categories: [
      { name: 'Pipeline Materials', planned: 35_000_000, actual: 32_000_000 },
      { name: 'Civil Works',        planned: 16_000_000, actual: 15_000_000 },
      { name: 'Equipment',          planned: 8_000_000,  actual: 7_500_000  },
      { name: 'Labour',             planned: 5_000_000,  actual: 3_500_000  },
    ],
  },
  {
    id: 'proj-003', key: 'SCH-002', name: 'Model School Construction',
    division: 'Education', pm: 'Anita Joshi',
    budget: { planned: 22_000_000, actual: 21_000_000 },
    categories: [
      { name: 'Civil Works',  planned: 15_000_000, actual: 14_500_000 },
      { name: 'Furniture',    planned: 3_000_000,  actual: 3_000_000  },
      { name: 'Equipment',    planned: 2_500_000,  actual: 2_000_000  },
      { name: 'Labour',       planned: 1_500_000,  actual: 1_500_000  },
    ],
  },
];

const MILESTONES = [
  { id: 'm-001', project: 'BDG-001', projectName: 'Bridge Rehabilitation', title: 'Sub-structure Completion', dueDate: DB(2), status: 'overdue', approvalRequired: true, completedAt: null },
  { id: 'm-002', project: 'BDG-001', projectName: 'Bridge Rehabilitation', title: 'Super-structure & Deck Slab', dueDate: DA(15), status: 'in-progress', approvalRequired: true, completedAt: null },
  { id: 'm-003', project: 'WTR-010', projectName: 'Rural Water Supply', title: 'Pipeline Laying Phase 1 (10km)', dueDate: DA(8), status: 'in-progress', approvalRequired: false, completedAt: null },
  { id: 'm-004', project: 'WTR-010', projectName: 'Rural Water Supply', title: 'Pump House Construction', dueDate: DA(45), status: 'pending', approvalRequired: true, completedAt: null },
  { id: 'm-005', project: 'SCH-002', projectName: 'Model School', title: 'Foundation & Plinth', dueDate: DB(20), status: 'completed', approvalRequired: true, completedAt: DB(22) },
  { id: 'm-006', project: 'SCH-002', projectName: 'Model School', title: 'Superstructure (RCC)', dueDate: DA(30), status: 'in-progress', approvalRequired: false, completedAt: null },
];

// ── Budget card ──────────────────────────────────────────────────────────────

function BudgetCard({ project }: { project: typeof PROJECTS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const v = variance(project.budget.planned, project.budget.actual);
  const isOver = v > 0;
  const isAlert = Math.abs(v) > 5;

  return (
    <Card className={cn('overflow-hidden border-l-4', isAlert && isOver ? 'border-l-red-500' : isAlert ? 'border-l-amber-400' : 'border-l-emerald-500')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{project.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">{project.key}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Building2 className="h-3 w-3" />{project.division} · {project.pm}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={cn('text-sm font-bold flex items-center gap-1', isOver ? 'text-red-600' : 'text-emerald-600')}>
              {isOver ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {v > 0 ? '+' : ''}{v.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{isOver ? 'over budget' : 'under budget'}</p>
          </div>
        </div>

        {/* Overall bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Planned: <span className="font-medium text-foreground">{fmtCr(project.budget.planned)}</span></span>
            <span className="text-muted-foreground">Actual: <span className={cn('font-medium', isOver ? 'text-red-600' : 'text-emerald-600')}>{fmtCr(project.budget.actual)}</span></span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden relative">
            <div className="h-full bg-primary/30 rounded-full" style={{ width: '100%' }} />
            <div className={cn('absolute top-0 left-0 h-full rounded-full', isOver ? 'bg-red-400' : 'bg-emerald-500')}
              style={{ width: `${Math.min(100, (project.budget.actual / project.budget.planned) * 100)}%` }} />
          </div>
        </div>

        {/* Category breakdown (expanded) */}
        {expanded && (
          <div className="pt-2 border-t space-y-2">
            {project.categories.map((cat) => {
              const cv = variance(cat.planned, cat.actual);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{cat.name}</span>
                    <span className={cn('font-medium', cv > 5 ? 'text-red-600' : cv < -5 ? 'text-emerald-600' : 'text-foreground')}>
                      {fmtCr(cat.actual)} / {fmtCr(cat.planned)}
                      <span className="text-muted-foreground ml-1">({cv > 0 ? '+' : ''}{cv.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', cv > 5 ? 'bg-red-400' : cv < -5 ? 'bg-emerald-500' : 'bg-primary')}
                      style={{ width: `${Math.min(100, (cat.actual / cat.planned) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary flex items-center gap-1 hover:underline">
          {expanded ? 'Hide' : 'Show'} category breakdown
          <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
        </button>
      </CardContent>
    </Card>
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({ m }: { m: typeof MILESTONES[0] }) {
  const [approved, setApproved] = useState(m.status === 'completed');
  const due = new Date(m.dueDate);
  const overdue = due < new Date() && m.status !== 'completed';
  const daysLabel = (() => {
    const diff = Math.round((due.getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `Due in ${diff}d`;
  })();

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl border',
      m.status === 'completed' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' :
      overdue ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : '')}>
      <div className={cn('h-2.5 w-2.5 rounded-full shrink-0 mt-0.5',
        m.status === 'completed' ? 'bg-emerald-500' :
        overdue ? 'bg-red-500' : m.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-muted-foreground/30')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{m.title}</p>
        <p className="text-xs text-muted-foreground">{m.projectName} · {m.project}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-xs font-medium', overdue ? 'text-red-600' : m.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground')}>
          {daysLabel}
        </p>
        {m.approvalRequired && m.status === 'in-progress' && !approved && (
          <Button size="sm" variant="outline" className="h-6 text-[10px] mt-1" onClick={() => setApproved(true)}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
          </Button>
        )}
        {(approved || m.status === 'completed') && m.approvalRequired && (
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0">Approved</Badge>
        )}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

type GovTab = 'budget' | 'milestones';

export function GovernanceDashboardPage() {
  const [tab, setTab] = useState<GovTab>('budget');
  const [divFilter, setDivFilter] = useState('all');

  const totalPlanned = PROJECTS.reduce((s, p) => s + p.budget.planned, 0);
  const totalActual  = PROJECTS.reduce((s, p) => s + p.budget.actual, 0);
  const overBudget   = PROJECTS.filter(p => variance(p.budget.planned, p.budget.actual) > 5).length;
  const overdueMile  = MILESTONES.filter(m => new Date(m.dueDate) < new Date() && m.status !== 'completed').length;

  const divisions = ['all', ...Array.from(new Set(PROJECTS.map(p => p.division)))];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Governance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Budget tracking, milestone approvals, and project compliance
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Planned Budget', value: fmtCr(totalPlanned), sub: `${PROJECTS.length} active projects`, icon: IndianRupee, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
          { label: 'Total Actual Spend', value: fmtCr(totalActual), sub: `${variance(totalPlanned, totalActual) > 0 ? '+' : ''}${variance(totalPlanned, totalActual).toFixed(1)}% overall variance`, icon: BarChart3, color: variance(totalPlanned, totalActual) > 5 ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
          { label: 'Budget Alerts', value: overBudget, sub: 'projects >5% over', icon: AlertTriangle, color: overBudget > 0 ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-muted text-muted-foreground' },
          { label: 'Overdue Milestones', value: overdueMile, sub: 'past due date', icon: Flag, color: overdueMile > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-muted text-muted-foreground' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className={cn('p-2.5 rounded-xl', color)}><Icon className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {[
          { key: 'budget', label: 'Budget Tracker', icon: IndianRupee },
          { key: 'milestones', label: 'Milestone Approvals', icon: Flag },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as GovTab)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Budget tab */}
      {tab === 'budget' && (
        <div className="space-y-4">
          {/* Division filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Division:</span>
            {divisions.map((d) => (
              <button key={d} onClick={() => setDivFilter(d)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  divFilter === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}>
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>

          {/* Aggregate bar */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Portfolio Total</span>
              <span className={cn('font-bold', totalActual > totalPlanned ? 'text-red-600' : 'text-emerald-600')}>
                {fmtCr(totalActual)} / {fmtCr(totalPlanned)}
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden relative">
              <div className="h-full bg-primary/20 rounded-full w-full" />
              <div className={cn('absolute top-0 left-0 h-full rounded-full', totalActual > totalPlanned ? 'bg-red-400' : 'bg-emerald-500')}
                style={{ width: `${Math.min(100, (totalActual / totalPlanned) * 100)}%` }} />
            </div>
          </div>

          {/* Per-project cards */}
          <div className="space-y-3">
            {PROJECTS
              .filter(p => divFilter === 'all' || p.division === divFilter)
              .map(p => <BudgetCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {/* Milestones tab */}
      {tab === 'milestones' && (
        <div className="space-y-4">
          {[
            { key: 'overdue', label: 'Overdue', color: 'text-red-600', items: MILESTONES.filter(m => new Date(m.dueDate) < new Date() && m.status !== 'completed') },
            { key: 'pending-approval', label: 'Pending Approval', color: 'text-amber-600', items: MILESTONES.filter(m => m.approvalRequired && m.status === 'in-progress' && new Date(m.dueDate) >= new Date()) },
            { key: 'upcoming', label: 'Upcoming (14 days)', color: 'text-blue-600', items: MILESTONES.filter(m => { const d = (new Date(m.dueDate).getTime() - Date.now()) / 86400000; return d >= 0 && d <= 14 && m.status !== 'completed'; }) },
            { key: 'completed', label: 'Recently Completed', color: 'text-emerald-600', items: MILESTONES.filter(m => m.status === 'completed') },
          ].map(({ key, label, color, items }) => items.length > 0 && (
            <div key={key}>
              <p className={cn('text-xs font-semibold uppercase tracking-wide mb-2', color)}>{label} ({items.length})</p>
              <div className="space-y-2">{items.map(m => <MilestoneRow key={m.id} m={m} />)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
