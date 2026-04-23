import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllDivisionConfigs, useDivisionMembers, useWorkflows } from '@/api/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, CheckCircle2, XCircle, Workflow, Users, Shield, Zap,
  Loader2, ClipboardList, Trophy, AlertCircle, LayoutGrid, SendHorizonal,
  Check, ArrowRight, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowConfig } from '@/types';

// ─── Checks definition ────────────────────────────────────

const HANDOFF_CHECKS = [
  { key: 'hasWorkflow',        label: 'Workflow template assigned', icon: Workflow,     fix: '/admin/division-config' },
  { key: 'hasDivisionAdmin',   label: 'Division admin designated',  icon: Shield,       fix: '/admin/division-config' },
  { key: 'hasMembers',         label: 'Team members added (2+)',    icon: Users,        fix: '/admin/division-config' },
  { key: 'featuresConfigured', label: 'Features configured (3+)',   icon: Zap,          fix: '/admin/division-config' },
  { key: 'roleOverridesSet',   label: 'Role permissions customized',icon: ClipboardList,fix: '/admin/division-config' },
] as const;

type CheckKey = (typeof HANDOFF_CHECKS)[number]['key'];

function computeChecks(division: any, members: any[]): Record<CheckKey, boolean> {
  const config    = division.config || {};
  const ml        = members || [];
  return {
    hasWorkflow:        !!config.workflowTemplate,
    hasDivisionAdmin:   ml.some((m: any) => m.role === 'division_admin'),
    hasMembers:         ml.length >= 2,
    featuresConfigured: Object.values(config.features || {}).filter(Boolean).length >= 3,
    roleOverridesSet:   Object.keys(config.roleOverrides || {}).some(
                          (r) => Object.keys((config.roleOverrides as any)[r] || {}).length > 0
                        ),
  };
}

// ─── Readiness ring ───────────────────────────────────────

function ReadinessRing({ score, total }: { score: number; total: number }) {
  const pct = score / total;
  const color = pct === 1 ? 'text-green-600' : pct >= 0.6 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className={cn('flex flex-col items-center leading-none', color)}>
      <span className="text-2xl font-bold">{score}</span>
      <span className="text-[11px] text-muted-foreground">/{total}</span>
    </div>
  );
}

// ─── Division handoff card ────────────────────────────────

const DIV_ACCENT: Record<string, string> = {
  div_engineering: 'border-l-blue-400',
  div_sales:       'border-l-green-400',
  div_hr:          'border-l-yellow-400',
};

function DivisionHandoffCard({ division, workflows }: { division: any; workflows: WorkflowConfig[] }) {
  const { data: members } = useDivisionMembers(division.id);
  const [finalized, setFinalized] = useState(false);

  const checks   = computeChecks(division, members || []);
  const score    = Object.values(checks).filter(Boolean).length;
  const total    = HANDOFF_CHECKS.length;
  const isReady  = score === total;

  const assignedWorkflow = workflows.find((w) => w.id === division.config?.workflowTemplate);
  const accentBorder     = DIV_ACCENT[division.id] || 'border-l-primary';

  return (
    <Card className={cn('overflow-hidden border-l-4', isReady ? 'border-l-green-400' : accentBorder)}>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{division.name}</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{division.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <ReadinessRing score={score} total={total} />
          <p className="text-[10px] text-muted-foreground mt-0.5">checks</p>
        </div>
      </div>

      <CardContent className="pt-3 pb-4 space-y-3">
        {/* Checklist */}
        <div className="space-y-1">
          {HANDOFF_CHECKS.map(({ key, label, icon: Icon }) => {
            const passed = checks[key];
            return (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs',
                  passed ? 'bg-green-50 text-green-800' : 'bg-muted/30 text-muted-foreground'
                )}
              >
                {passed
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  : <XCircle     className="h-3.5 w-3.5 opacity-40 flex-shrink-0" />}
                <Icon className="h-3 w-3 flex-shrink-0 opacity-60" />
                <span className={cn(!passed && 'opacity-60')}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Workflow preview */}
        {assignedWorkflow ? (
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Workflow className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">{assignedWorkflow.name}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(assignedWorkflow.statuses || []).map((s) => (
                <span
                  key={s.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-2.5 text-center">
            <p className="text-xs text-muted-foreground">No workflow assigned</p>
            <Link to="/admin/division-config" className="text-[11px] text-primary hover:underline">
              Assign in Division Config →
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
            <Link to="/admin/division-config">
              <LayoutGrid className="h-3 w-3 mr-1" /> Configure
            </Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            disabled={!isReady || finalized}
            onClick={() => setFinalized(true)}
          >
            {finalized
              ? <><Check className="h-3 w-3 mr-1" /> Handed Off</>
              : <><SendHorizonal className="h-3 w-3 mr-1" /> Finalize</>}
          </Button>
        </div>

        {finalized && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <Trophy className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-green-800">Handed off successfully</p>
            <p className="text-[11px] text-green-700">Division admin has been notified.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Org summary banner ───────────────────────────────────

function OrgSummaryBanner({ divisions, workflows }: { divisions: any[]; workflows: WorkflowConfig[] }) {
  const divSummaries = divisions.map((d) => {
    const config = d.config || {};
    return {
      hasWorkflow:        !!config.workflowTemplate,
      featuresConfigured: Object.values(config.features || {}).filter(Boolean).length >= 3,
      roleOverridesSet:   Object.keys(config.roleOverrides || {}).some(
                            (r) => Object.keys((config.roleOverrides as any)[r] || {}).length > 0
                          ),
    };
  });

  const orgChecks = [
    { label: 'Workflows Assigned',  done: divSummaries.every((d) => d.hasWorkflow),        icon: Workflow },
    { label: 'Features Configured', done: divSummaries.every((d) => d.featuresConfigured),  icon: Zap },
    { label: 'Permissions Set',     done: divSummaries.every((d) => d.roleOverridesSet),    icon: Shield },
  ];
  const metCount = orgChecks.filter((c) => c.done).length;

  return (
    <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-primary/5 to-background p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-base">Org-wide Readiness</p>
          <p className="text-xs text-muted-foreground">{divisions.length} divisions · {workflows.length} workflow templates available</p>
        </div>
        <Badge
          variant={metCount === 3 ? 'default' : 'secondary'}
          className="text-sm px-3 py-1"
        >
          {metCount}/3 org checks passed
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {orgChecks.map(({ label, done, icon: Icon }) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5',
              done ? 'bg-green-50 border-green-200' : 'bg-background border-border'
            )}
          >
            {done
              ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              : <AlertCircle  className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workflow library panel ───────────────────────────────

function WorkflowLibrary({ workflows }: { workflows: WorkflowConfig[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Available Workflow Templates</p>
      <p className="text-xs text-muted-foreground mb-3">
        These templates can be assigned to any division. Go to Division Config → Workflow tab to assign.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
            className="text-left rounded-lg border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium">{wf.name}</p>
              {wf.is_default && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">{wf.description}</p>
            <div className="flex flex-wrap gap-1">
              {(wf.statuses || []).map((s) => (
                <span
                  key={s.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export function AdminHandoffPage() {
  const { data: divisions, isLoading: divLoading } = useAllDivisionConfigs();
  const { data: workflows, isLoading: wfLoading }  = useWorkflows();
  const [showLibrary, setShowLibrary] = useState(false);

  const allDivisions = divisions || [];
  const allWorkflows = (workflows || []) as WorkflowConfig[];

  if (divLoading || wfLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Admin Handoff Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete each division's configuration checklist, then finalize the handoff to Division Admins.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}>
            <Workflow className="h-3.5 w-3.5 mr-1.5" /> {showLibrary ? 'Hide' : 'Workflow'} Library
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/division-config">
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Division Config
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-blue-50/50 border-blue-200 px-4 py-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-800 text-xs">
          Each division must pass all 5 checks before it can be handed off. Assign a workflow template, designate a Division Admin, add at least 2 team members, enable features, and set role permission overrides.
        </p>
      </div>

      {/* Org summary */}
      <OrgSummaryBanner divisions={allDivisions} workflows={allWorkflows} />

      {/* Workflow library (collapsible) */}
      {showLibrary && (
        <div className="rounded-xl border p-5 bg-muted/20">
          <WorkflowLibrary workflows={allWorkflows} />
        </div>
      )}

      {/* Division handoff cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Division Readiness — {allDivisions.filter((d: any) => {
            const c = d.config || {};
            return !!c.workflowTemplate && Object.values(c.features || {}).filter(Boolean).length >= 3;
          }).length}/{allDivisions.length} ready
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allDivisions.map((division: any) => (
            <DivisionHandoffCard key={division.id} division={division} workflows={allWorkflows} />
          ))}
        </div>
      </div>

      {allDivisions.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No divisions found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create divisions first via <Link to="/admin/divisions" className="underline">Divisions page</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
