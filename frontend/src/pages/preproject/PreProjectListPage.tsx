import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2, Search, Filter, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, Building2, IndianRupee, Calendar, ArrowRightCircle,
  FileText, Users, TrendingUp, Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePreProjectStore, type PreProject, type Priority, type PPStatus } from '@/store/preProjectStore';

// types are imported from preProjectStore

// ── helpers ──────────────────────────────────────────────────────────────────

const HA = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function getSla(startedAt: string | null, threshold: number) {
  if (!startedAt) return null;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 3_600_000;
  const remaining = threshold - elapsed;
  const pct = Math.min(100, (elapsed / threshold) * 100);
  if (remaining < 0) return { status: 'overdue' as const, remaining, pct: 100 };
  if (remaining < threshold * 0.25) return { status: 'at-risk' as const, remaining, pct };
  return { status: 'on-track' as const, remaining, pct };
}

function fmtH(h: number) {
  const a = Math.abs(h);
  return a < 24 ? `${a.toFixed(0)}h` : `${(a / 24).toFixed(1)}d`;
}

function fmtCr(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// data is seeded in preProjectStore

// ── status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PPStatus, { label: string; color: string; bg: string }> = {
  DRAFT:                { label: 'Draft',            color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800/60' },
  PENDING_CORE_REVIEW:  { label: 'Core Review',      color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-950/40' },
  CORE_APPROVED:        { label: 'Core ✓ → CFO',     color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40' },
  PENDING_CFO_APPROVAL: { label: 'CFO Review',       color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  APPROVED:             { label: 'Approved',         color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  REJECTED:             { label: 'Rejected',         color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-950/40' },
  CONVERTED:            { label: 'Live Project',     color: 'text-teal-700 dark:text-teal-300',     bg: 'bg-teal-50 dark:bg-teal-950/40' },
};

const PRIORITY_DOT: Record<Priority, string> = {
  LOW: 'bg-slate-400', MEDIUM: 'bg-blue-400', HIGH: 'bg-orange-400', CRITICAL: 'bg-red-500',
};

type FilterStatus = 'all' | PPStatus;
const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_CORE_REVIEW', label: 'Core Review' },
  { key: 'PENDING_CFO_APPROVAL', label: 'CFO Approval' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'REJECTED', label: 'Rejected' },
];

// ── components ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className={cn('text-3xl font-bold', color)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function PreProjectCard({ pp, onView }: { pp: PreProject; onView: () => void }) {
  const sla = getSla(pp.stepStartedAt, pp.slaThreshold);
  const sc = STATUS_CONFIG[pp.status];

  return (
    <Card className={cn(
      'group hover:shadow-md transition-all cursor-pointer border-l-4',
      pp.priority === 'CRITICAL' ? 'border-l-red-500' :
      pp.priority === 'HIGH' ? 'border-l-orange-400' :
      pp.priority === 'MEDIUM' ? 'border-l-blue-400' : 'border-l-slate-300'
    )} onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-base leading-tight">{pp.title}</h3>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">{pp.tenderId}</Badge>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-3">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{pp.clientName}</span>
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{pp.division}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pp.assignedPm}</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <IndianRupee className="h-3 w-3" />{fmtCr(pp.estimatedBudget)}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />{pp.docsCount} docs
              </span>
            </div>

            {/* Status + SLA */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', sc.bg, sc.color)}>
                {sc.label}
              </span>
              <div className="flex items-center gap-1">
                <div className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[pp.priority])} />
                <span className="text-xs text-muted-foreground capitalize">{pp.priority.toLowerCase()}</span>
              </div>
              {sla && (
                <span className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  sla.status === 'overdue' ? 'text-red-600' :
                  sla.status === 'at-risk' ? 'text-amber-600' : 'text-emerald-600'
                )}>
                  <Clock className="h-3 w-3" />
                  {sla.status === 'overdue' ? `Overdue ${fmtH(-sla.remaining)}` : `${fmtH(sla.remaining)} left`}
                </span>
              )}
              {pp.status === 'REJECTED' && pp.rejectionReason && (
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {pp.rejectionReason.slice(0, 60)}…
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pp.status === 'APPROVED' && (
              <Button size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                onClick={(e) => { e.stopPropagation(); onView(); }}>
                <ArrowRightCircle className="h-3.5 w-3.5 mr-1" /> Convert
              </Button>
            )}
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function PreProjectListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const projects = usePreProjectStore((s) => s.projects);

  const filtered = useMemo(() =>
    projects.filter((p) => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.tenderId.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    }), [projects, statusFilter, search]);

  const stats = {
    total: projects.length,
    pending: projects.filter(p => ['PENDING_CORE_REVIEW', 'PENDING_CFO_APPROVAL', 'CORE_APPROVED'].includes(p.status)).length,
    approved: projects.filter(p => p.status === 'APPROVED').length,
    converted: projects.filter(p => p.status === 'CONVERTED').length,
    overdue: projects.filter(p => {
      const s = getSla(p.stepStartedAt, p.slaThreshold);
      return s?.status === 'overdue';
    }).length,
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Pre-Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tender-stage submissions awaiting pre-execution approval before project activation
          </p>
        </div>
        <Button onClick={() => navigate('/preproject/new')}>
          <FilePlus2 className="h-4 w-4 mr-1.5" /> New Pre-Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} sub="all time" color="text-foreground" />
        <StatCard label="In Review" value={stats.pending} sub="pending action" color="text-blue-600" />
        <StatCard label="Approved" value={stats.approved} sub="ready to convert" color="text-emerald-600" />
        <StatCard label="Converted" value={stats.converted} sub="live projects" color="text-teal-600" />
        <StatCard label="Overdue" value={stats.overdue} sub="past SLA" color="text-red-600" />
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, tender ID, client…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_TABS.map((t) => {
            const count = t.key === 'all' ? projects.length : projects.filter(p => p.status === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5',
                  statusFilter === t.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                )}
              >
                {t.label}
                {count > 0 && <span className={cn('text-[10px] font-bold', statusFilter === t.key ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lifecycle pipeline visual */}
      <div className="rounded-xl border bg-card px-5 py-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Approval Pipeline</p>
        <div className="flex items-center gap-0.5 flex-wrap">
          {[
            { label: 'Draft', status: 'DRAFT', count: projects.filter(p=>p.status==='DRAFT').length },
            { label: 'Core Review', status: 'PENDING_CORE_REVIEW', count: projects.filter(p=>p.status==='PENDING_CORE_REVIEW').length },
            { label: 'Core ✓', status: 'CORE_APPROVED', count: projects.filter(p=>p.status==='CORE_APPROVED').length },
            { label: 'CFO Review', status: 'PENDING_CFO_APPROVAL', count: projects.filter(p=>p.status==='PENDING_CFO_APPROVAL').length },
            { label: 'Approved', status: 'APPROVED', count: projects.filter(p=>p.status==='APPROVED').length },
            { label: 'Live', status: 'CONVERTED', count: projects.filter(p=>p.status==='CONVERTED').length },
          ].map((s, i, arr) => (
            <div key={s.status} className="flex items-center gap-0.5">
              <button
                onClick={() => setStatusFilter(s.status as FilterStatus)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  STATUS_CONFIG[s.status as PPStatus].bg,
                  STATUS_CONFIG[s.status as PPStatus].color,
                  statusFilter === s.status && 'ring-2 ring-primary'
                )}
              >
                {s.label}
                <span className="font-bold">{s.count}</span>
              </button>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold">No pre-projects found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new one</p>
          <Button className="mt-4" onClick={() => navigate('/preproject/new')}>
            <FilePlus2 className="h-4 w-4 mr-1.5" /> Create Pre-Project
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pp) => (
            <PreProjectCard key={pp.id} pp={pp} onView={() => navigate(`/preproject/${pp.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
