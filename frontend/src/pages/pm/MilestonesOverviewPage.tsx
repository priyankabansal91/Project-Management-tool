import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Flag, Search, CheckCircle2, Clock, Circle, AlertCircle,
  Calendar, ChevronRight, Lock, Wallet, Activity, Filter,
  Ban, PlayCircle, ShieldCheck, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects, useMilestones } from '@/api/hooks';

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'review';

const WATERFALL_CFG: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  NOT_STARTED:      { label: 'Not Started',      cls: 'bg-gray-100 text-gray-500',         Icon: Circle },
  BLOCKED:          { label: 'Blocked',           cls: 'bg-red-100 text-red-700',            Icon: Ban },
  IN_PROGRESS:      { label: 'In Progress',       cls: 'bg-blue-100 text-blue-700',          Icon: PlayCircle },
  PENDING_APPROVAL: { label: 'Awaiting Approval', cls: 'bg-purple-100 text-purple-700',      Icon: Clock },
  APPROVED:         { label: 'Approved',          cls: 'bg-teal-100 text-teal-700',           Icon: ShieldCheck },
  COMPLETED:        { label: 'Completed',         cls: 'bg-emerald-100 text-emerald-700',     Icon: CheckCircle2 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeClass: string; Icon: React.ComponentType<{ className?: string }> }> = {
  completed:   { label: 'Completed',       color: 'bg-green-500',  badgeClass: 'bg-green-100 text-green-700',   Icon: CheckCircle2 },
  in_progress: { label: 'In Progress',     color: 'bg-blue-500',   badgeClass: 'bg-blue-100 text-blue-700',     Icon: Clock },
  on_hold:     { label: 'On Hold',         color: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700', Icon: AlertCircle },
  review:      { label: 'Pending Approval',color: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-700', Icon: Lock },
  pending:     { label: 'Pending',         color: 'bg-gray-400',   badgeClass: 'bg-gray-100 text-gray-500',     Icon: Circle },
};

function fmtDate(ds?: string) {
  if (!ds) return '—';
  return new Date(ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProjectMilestones({ project }: { project: any }) {
  const navigate = useNavigate();
  const q = useMilestones(project.id);
  const milestones: any[] = q.data ?? [];

  if (!q.isLoading && milestones.length === 0) return null;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color || '#3B82F6' }} />
          <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
          <Badge variant="outline" className="text-[10px]">{project.key}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
          onClick={() => navigate(`/projects/${project.id}/milestones`)}>
          Manage <ChevronRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pt-1 space-y-2">
        {q.isLoading ? (
          <p className="text-xs text-muted-foreground py-2">Loading…</p>
        ) : (
          milestones.map((m: any) => {
            const status: MilestoneStatus = m.status || 'pending';
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.Icon;
            const dueDate = m.dueDate || m.due_date;
            const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed';
            const burn = m.burnRate ?? m.progress ?? 0;

            const wfStatus: string = m.waterfallStatus || m.waterfall_status || 'NOT_STARTED';
            const wfCfg = WATERFALL_CFG[wfStatus] || WATERFALL_CFG.NOT_STARTED;
            const WfIcon = wfCfg.Icon;

            return (
              <div key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors',
                  wfStatus === 'BLOCKED' && 'bg-red-50/50 border-red-200'
                )}
                onClick={() => navigate(`/projects/${project.id}/milestones`)}>
                <StatusIcon className={cn('h-4 w-4 shrink-0', cfg.color.replace('bg-', 'text-'))} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.sequenceOrder != null && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-mono">
                        <Hash className="h-2.5 w-2.5" />{m.sequenceOrder}
                      </span>
                    )}
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    {m.approvalRequired && <Lock className="h-3 w-3 text-purple-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    {dueDate && (
                      <span className={cn('flex items-center gap-1', isOverdue && 'text-red-600 font-medium')}>
                        <Calendar className="h-3 w-3" /> {fmtDate(dueDate)}
                        {isOverdue && ' — Overdue'}
                      </span>
                    )}
                    {m.budget != null && (
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: m.currency || 'INR', maximumFractionDigits: 0 }).format(m.budget)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {/* Waterfall status badge */}
                  <Badge className={cn('text-[10px] border-0 flex items-center gap-1', wfCfg.cls)}>
                    <WfIcon className="h-2.5 w-2.5" />
                    <span className="hidden md:inline">{wfCfg.label}</span>
                  </Badge>
                  {/* Progress pill */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={cn('h-full rounded-full', cfg.color)} style={{ width: `${burn}%` }} />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{burn}%</span>
                  </div>
                  <Badge className={cn('text-[10px] border-0 hidden sm:flex', cfg.badgeClass)}>{cfg.label}</Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function MilestonesOverviewPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const projectsQ = useProjects();
  const projects: any[] = projectsQ.data?.items ?? [];

  const filtered = projects.filter((p: any) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.key?.toLowerCase().includes(search.toLowerCase())
  );

  const statusFilters = [
    { value: 'all',         label: 'All' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending',     label: 'Pending' },
    { value: 'completed',   label: 'Completed' },
    { value: 'review',      label: 'Pending Approval' },
    { value: 'BLOCKED',     label: 'Blocked' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" /> Milestones
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track milestones and delivery phases across all your projects
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects…" className="pl-9" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {statusFilters.map((f) => (
            <button key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filterStatus === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project milestone groups */}
      {projectsQ.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24 bg-muted/30 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No projects found</p>
          <Button className="mt-4" onClick={() => navigate('/projects')}>Go to Projects</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((p: any) => (
            <ProjectMilestones key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
