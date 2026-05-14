import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Network, FolderKanban, Flag, CheckSquare, ChevronRight, ChevronDown, Loader2, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDivisions, useVerticals, useProjects } from '@/api/hooks';

// ─── Static fallback hierarchy ────────────────────────────

const FALLBACK: Division[] = [
  {
    id: 'div_eng', name: 'Engineering Division', code: 'ENG', color: '#3B82F6', memberCount: 12,
    verticals: [
      {
        id: 'v_fe', name: 'Frontend Team', color: '#60A5FA',
        projects: [
          { id: 'p1', name: 'Q-Flow Portal', key: 'QFP', status: 'active', milestoneCount: 5, taskCount: 38 },
          { id: 'p2', name: 'Mobile App', key: 'MOB', status: 'active', milestoneCount: 3, taskCount: 21 },
        ],
      },
      {
        id: 'v_be', name: 'Backend & DevOps', color: '#818CF8',
        projects: [
          { id: 'p3', name: 'API Platform v3', key: 'APV3', status: 'active', milestoneCount: 4, taskCount: 29 },
        ],
      },
    ],
  },
  {
    id: 'div_sales', name: 'Sales Division', code: 'SALES', color: '#10B981', memberCount: 7,
    verticals: [
      {
        id: 'v_ent', name: 'Enterprise Sales', color: '#34D399',
        projects: [
          { id: 'p4', name: 'Enterprise Rollout', key: 'ENT', status: 'active', milestoneCount: 2, taskCount: 14 },
        ],
      },
    ],
  },
  {
    id: 'div_hr', name: 'HR Division', code: 'HR', color: '#F59E0B', memberCount: 4,
    verticals: [
      {
        id: 'v_l&d', name: 'L&D', color: '#FBBF24',
        projects: [
          { id: 'p5', name: 'Training Portal 2026', key: 'TRN', status: 'active', milestoneCount: 3, taskCount: 17 },
        ],
      },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────

interface ProjectNode {
  id: string; name: string; key: string; status: string;
  milestoneCount: number; taskCount: number;
}
interface VerticalNode { id: string; name: string; color: string; projects: ProjectNode[]; }
interface Division { id: string; name: string; code: string; color: string; memberCount: number; verticals: VerticalNode[]; }

// ─── Status badge ─────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'active' ? 'bg-green-100 text-green-700' :
              status === 'completed' ? 'bg-blue-100 text-blue-700' :
              status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500';
  return <Badge className={cn('text-[10px] border-0 capitalize', cls)}>{status.replace('_', ' ')}</Badge>;
}

// ─── Project row ─────────────────────────────────────────

function ProjectRow({ p }: { p: ProjectNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-md hover:bg-muted/40 group">
      <div className="flex items-center gap-2 min-w-0">
        <FolderKanban className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <Link
          to={`/projects/${p.id}/board`}
          className="text-sm font-medium hover:text-primary hover:underline truncate"
        >
          {p.name}
        </Link>
        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{p.key}</span>
        <StatusBadge status={p.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{p.milestoneCount} milestones</span>
        <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{p.taskCount} tasks</span>
        <Link
          to={`/projects/${p.id}/milestones`}
          className="text-[10px] text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View milestones →
        </Link>
      </div>
    </div>
  );
}

// ─── Vertical section ────────────────────────────────────

function VerticalSection({ v, defaultOpen }: { v: VerticalNode; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ml-6 border-l-2 pl-4" style={{ borderColor: v.color + '60' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 w-full text-left hover:text-foreground transition-colors group"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        <Network className="h-3.5 w-3.5 flex-shrink-0" style={{ color: v.color }} />
        <span className="text-sm font-medium">{v.name}</span>
        <span className="text-xs text-muted-foreground">({v.projects.length} projects)</span>
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5">
          {v.projects.length > 0
            ? v.projects.map((p) => <ProjectRow key={p.id} p={p} />)
            : <p className="text-xs text-muted-foreground py-2 pl-2">No projects in this vertical</p>
          }
        </div>
      )}
    </div>
  );
}

// ─── Division card ───────────────────────────────────────

function DivisionCard({ d, defaultOpen }: { d: Division; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const totalProjects = d.verticals.reduce((s, v) => s + v.projects.length, 0);
  const totalTasks = d.verticals.reduce((s, v) => v.projects.reduce((ps, p) => ps + p.taskCount, s), 0);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: d.color }}>
          {d.code.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="h-4 w-4 flex-shrink-0" style={{ color: d.color }} />
            <span className="font-semibold text-sm">{d.name}</span>
            <Badge variant="outline" className="text-[10px]">{d.code}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{d.memberCount} members</span>
            <span className="flex items-center gap-1"><Network className="h-3 w-3" />{d.verticals.length} verticals</span>
            <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" />{totalProjects} projects</span>
            <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" />{totalTasks} tasks</span>
          </div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <CardContent className="pb-4 pt-0 space-y-2">
          {d.verticals.length > 0
            ? d.verticals.map((v) => <VerticalSection key={v.id} v={v} defaultOpen={d.verticals.length === 1} />)
            : <p className="text-xs text-muted-foreground pl-4 pb-2">No verticals in this division</p>
          }
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────

export function HierarchyPage() {
  const divisionsQuery = useDivisions();
  const verticalsQuery = useVerticals();
  const projectsQuery = useProjects();

  const rawDivisions: any[] = (divisionsQuery.data as any)?.items || [];
  const rawVerticals: any[] = (verticalsQuery.data as any)?.items || [];
  const rawProjects: any[] = (projectsQuery.data as any)?.items || [];

  const isLoading = divisionsQuery.isLoading || verticalsQuery.isLoading || projectsQuery.isLoading;

  // Build hierarchy from API data (if available)
  const divisions: Division[] = rawDivisions.length > 0
    ? rawDivisions.map((d: any) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        color: d.color || '#3B82F6',
        memberCount: d.member_count || d.memberCount || 0,
        verticals: rawVerticals
          .filter((v: any) => v.divisionId === d.id || v.division_id === d.id)
          .map((v: any) => ({
            id: v.id,
            name: v.name,
            color: v.color || '#3B82F6',
            projects: rawProjects
              .filter((p: any) => p.vertical_id === v.id || p.verticalId === v.id)
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                key: p.key,
                status: p.status,
                milestoneCount: 0,
                taskCount: p.task_count || p.taskCount || 0,
              })),
          })),
      }))
    : FALLBACK;

  const totalVerticals = divisions.reduce((s, d) => s + d.verticals.length, 0);
  const totalProjects = divisions.reduce((s, d) => d.verticals.reduce((vs, v) => vs + v.projects.length, s), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6 text-primary" /> Org Hierarchy
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Division → Vertical → Project → Milestone → Task
        </p>
      </div>

      {/* Breadcrumb strip */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5 overflow-x-auto">
        {[
          { icon: Building2, label: 'Division', color: 'text-blue-600' },
          { icon: Network, label: 'Vertical', color: 'text-purple-600' },
          { icon: FolderKanban, label: 'Project', color: 'text-green-600' },
          { icon: Flag, label: 'Milestone', color: 'text-orange-600' },
          { icon: CheckSquare, label: 'Task', color: 'text-gray-600' },
        ].map(({ icon: Icon, label, color }, i, arr) => (
          <span key={label} className="flex items-center gap-1.5 flex-shrink-0">
            <Icon className={cn('h-3.5 w-3.5', color)} />
            <span className={cn('font-medium', color)}>{label}</span>
            {i < arr.length - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
          </span>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Divisions', value: divisions.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Verticals', value: totalVerticals, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Projects', value: totalProjects, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Loading…', value: isLoading ? '…' : 'Live', color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-lg p-4', bg)}>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Hierarchy tree */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {divisions.map((d, i) => (
            <DivisionCard key={d.id} d={d} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg border p-4 bg-muted/20">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Hierarchy Rules</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Every <strong>Project</strong> must belong to a <strong>Vertical</strong></li>
          <li>• Every <strong>Vertical</strong> must belong to a <strong>Division</strong></li>
          <li>• Tasks can be grouped under <strong>Milestones</strong> within a project</li>
          <li>• Approval flows follow: Task → Milestone → Project → Vertical → Division</li>
        </ul>
      </div>
    </div>
  );
}
