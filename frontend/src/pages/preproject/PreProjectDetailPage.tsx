import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, IndianRupee, FileText, Users, Clock,
  CheckCircle2, XCircle, CornerUpLeft, ArrowRightCircle, AlertTriangle,
  Download, Upload, Send, Calendar, Layers, Info, BarChart3,
  History, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// ── types / helpers ───────────────────────────────────────────────────────────

const HA = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function fmtCr(n: number) {
  return n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)} Cr`
       : n >= 100_000    ? `₹${(n / 100_000).toFixed(1)} L`
       : `₹${n.toLocaleString('en-IN')}`;
}

function relDate(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 60)   return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSla(startedAt: string | null, threshold: number) {
  if (!startedAt) return null;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 3_600_000;
  const remaining = threshold - elapsed;
  const pct = Math.min(100, (elapsed / threshold) * 100);
  if (remaining < 0) return { status: 'overdue' as const, remaining, pct: 100, elapsed };
  if (remaining < threshold * 0.25) return { status: 'at-risk' as const, remaining, pct, elapsed };
  return { status: 'on-track' as const, remaining, pct, elapsed };
}

// ── mock data ─────────────────────────────────────────────────────────────────

const MOCK: Record<string, any> = {
  'pp-001': {
    id: 'pp-001', tenderId: 'TDR/2026/HWY/003',
    title: 'NH-46 Highway Widening Phase III',
    description: 'Widening of NH-46 from 2-lane to 4-lane — 45km stretch from Bhopal to Sehore. Includes construction of service roads, median, drainage channels, pedestrian paths, and installation of solar-powered street lighting every 50m. Project is part of Bharatmala Phase II.',
    clientName: 'MPRDC', clientDeptCode: 'MPRDC/2026/BMP/HWY',
    division: 'Infrastructure', assignedPm: 'Bob Kumar', priority: 'CRITICAL',
    status: 'PENDING_CFO_APPROVAL',
    estimatedBudget: 84_000_000,
    submittedAt: HA(30), stepStartedAt: HA(30), slaThreshold: 72,
    createdAt: HA(72), createdBy: 'Bob Kumar',
    budgetBreakdown: [
      { category: 'Civil Works', planned: 52_000_000, pct: 62 },
      { category: 'Equipment & Machinery', planned: 12_600_000, pct: 15 },
      { category: 'Labour', planned: 10_080_000, pct: 12 },
      { category: 'Consultancy', planned: 5_040_000, pct: 6 },
      { category: 'Contingency (5%)', planned: 4_200_000, pct: 5 },
    ],
    documents: [
      { name: 'Detailed Project Report (DPR)', type: 'DPR', size: '4.2 MB', uploadedAt: HA(70), required: true, verified: true },
      { name: 'Environmental Impact Assessment', type: 'EIA', size: '2.1 MB', uploadedAt: HA(70), required: true, verified: true },
      { name: 'Land Acquisition Plan', type: 'LAP', size: '1.8 MB', uploadedAt: HA(68), required: true, verified: false },
      { name: 'Financial Feasibility Report', type: 'FFR', size: '0.9 MB', uploadedAt: HA(66), required: true, verified: true },
    ],
    milestones: [
      { title: 'Mobilisation & Site Setup', dueMonths: 1 },
      { title: 'Earthwork & Sub-grade', dueMonths: 4 },
      { title: 'Base Course & WBM', dueMonths: 9 },
      { title: 'Bituminous Layers', dueMonths: 14 },
      { title: 'Structures & Drainage', dueMonths: 16 },
      { title: 'Finishing & Handover', dueMonths: 18 },
    ],
    auditTrail: [
      { actor: 'Bob Kumar', role: 'Project Manager', action: 'CREATED', status: 'DRAFT', comment: 'Pre-project registered against MPRDC tender notice.', at: HA(72) },
      { actor: 'Bob Kumar', role: 'Project Manager', action: 'SUBMITTED', status: 'PENDING_CORE_REVIEW', comment: 'All DPR and EIA documents attached. Requesting Core Review.', at: HA(36) },
      { actor: 'Ravi Sharma', role: 'Division Head', action: 'APPROVED', status: 'PENDING_CFO_APPROVAL', comment: 'Technical scope verified. Resource availability confirmed for Q3 mobilisation. Budget within Division envelope.', at: HA(30) },
    ],
  },
};

// ── workflow stepper ──────────────────────────────────────────────────────────

type WfStep = { key: string; label: string; role: string };

const WORKFLOW_STEPS: WfStep[] = [
  { key: 'DRAFT',                label: 'Created',           role: 'Project Manager' },
  { key: 'PENDING_CORE_REVIEW',  label: 'Core Review',       role: 'Division Head' },
  { key: 'CORE_APPROVED',        label: 'Core Approved',     role: 'Division Head' },
  { key: 'PENDING_CFO_APPROVAL', label: 'CFO Review',        role: 'Executive (CFO)' },
  { key: 'APPROVED',             label: 'Approved',          role: 'Executive (CFO)' },
  { key: 'CONVERTED',            label: 'Project Live',      role: 'System' },
];

const STATUS_ORDER = ['DRAFT','PENDING_CORE_REVIEW','CORE_APPROVED','PENDING_CFO_APPROVAL','APPROVED','CONVERTED'];

function WorkflowStepper({ currentStatus, auditTrail }: { currentStatus: string; auditTrail: any[] }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isActive = STATUS_ORDER[idx] === currentStatus;
          const isPending = idx > currentIdx;
          const trailEntry = auditTrail.find(a => a.status === step.key);

          return (
            <div key={step.key} className="relative pl-10">
              <div className={cn(
                'absolute left-2 top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background',
                isDone ? 'bg-emerald-500' :
                isActive ? 'bg-primary animate-pulse' :
                'bg-muted'
              )}>
                {isDone && <CheckCircle2 className="h-3 w-3 text-white" />}
                {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                {isPending && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
              </div>

              <div className={cn('pb-2', isPending && 'opacity-40')}>
                <p className={cn(
                  'text-sm font-semibold',
                  isDone ? 'text-emerald-600 dark:text-emerald-400' :
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.role}</p>
                {trailEntry && (
                  <div className="mt-1.5 rounded-lg bg-muted/50 px-3 py-2 space-y-0.5">
                    <p className="text-xs font-medium">{trailEntry.actor}
                      <span className={cn(
                        'ml-2 font-semibold',
                        trailEntry.action === 'APPROVED' ? 'text-emerald-600' :
                        trailEntry.action === 'REJECTED' ? 'text-red-600' : 'text-blue-600'
                      )}>
                        — {trailEntry.action}
                      </span>
                      <span className="ml-2 text-muted-foreground font-normal">{relDate(trailEntry.at)}</span>
                    </p>
                    {trailEntry.comment && (
                      <p className="text-xs text-muted-foreground italic">"{trailEntry.comment}"</p>
                    )}
                  </div>
                )}
                {isActive && (
                  <div className="mt-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5">
                    <p className="text-xs text-primary font-medium animate-pulse">Awaiting action…</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── convert modal ─────────────────────────────────────────────────────────────

function ConvertModal({ pp, onClose }: { pp: any; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    projectKey: pp.tenderId.replace(/\//g, '-').slice(-8),
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    endDate: '',
    autoMilestones: true,
    autoTasks: true,
  });

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md p-8 z-10 text-center">
          <div className="h-14 w-14 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-7 w-7 text-teal-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Project Created!</h3>
          <p className="text-sm text-muted-foreground mb-1">
            Pre-project converted to <span className="font-semibold text-foreground">{form.projectKey}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Default milestones, tasks, and team roles have been configured. Division Head and PM have been notified.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
            <Button className="flex-1" onClick={() => { onClose(); navigate('/projects'); }}>
              Open Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
          <ArrowRightCircle className="h-5 w-5 text-teal-600" /> Convert to Live Project
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          This will create a new Project linked to <span className="font-medium">{pp.tenderId}</span> and archive the pre-project.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Project Key</label>
              <input value={form.projectKey} onChange={e => setForm(f => ({ ...f, projectKey: e.target.value }))}
                className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-semibold">Auto-generate on creation:</p>
            {[
              { key: 'autoMilestones', label: `${pp.milestones.length} default milestones from pre-project plan` },
              { key: 'autoTasks', label: 'Onboarding tasks: team setup, kickoff meeting, resource allocation' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 px-3 py-2 text-xs text-teal-700 dark:text-teal-300">
            Budget of <span className="font-bold">{fmtCr(pp.estimatedBudget)}</span> will be set as the project's planned budget. Budget tracker activated automatically.
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setStep(1)}>
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'workflow' | 'documents' | 'budget' | 'audit';

export function PreProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRole } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [showConvert, setShowConvert] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'send_back' | null>(null);
  const [comment, setComment] = useState('');
  const [actionDone, setActionDone] = useState<string | null>(null);

  const pp = MOCK[id || ''];

  if (!pp) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Pre-project not found.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate('/preproject')}>Go back</Button>
      </div>
    );
  }

  const sla = getSla(pp.stepStartedAt, pp.slaThreshold);
  const canApprove = (pp.status === 'PENDING_CORE_REVIEW' && currentRole === 'division_admin') ||
                     (pp.status === 'PENDING_CFO_APPROVAL' && currentRole === 'executive') ||
                     currentRole === 'org_admin';

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{className?:string}> }[] = [
    { key: 'overview', label: 'Overview', icon: Info },
    { key: 'workflow', label: 'Workflow', icon: CheckCircle2 },
    { key: 'documents', label: `Documents (${pp.documents.length})`, icon: FileText },
    { key: 'budget', label: 'Budget', icon: IndianRupee },
    { key: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {showConvert && <ConvertModal pp={pp} onClose={() => setShowConvert(false)} />}

      {/* Back + Header */}
      <div>
        <button onClick={() => navigate('/preproject')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Pre-Projects
        </button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold">{pp.title}</h1>
              <Badge variant="outline" className="font-mono text-xs">{pp.tenderId}</Badge>
              <Badge className="text-xs bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-0">
                {pp.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{pp.clientName} · {pp.clientDeptCode}</span>
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{pp.division}</span>
              <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{fmtCr(pp.estimatedBudget)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pp.status === 'DRAFT' && (
              <Button size="sm" onClick={() => setActionDone('Submitted for Core Review')}>
                <Send className="h-3.5 w-3.5 mr-1.5" /> Submit for Approval
              </Button>
            )}
            {pp.status === 'APPROVED' && (
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setShowConvert(true)}>
                <ArrowRightCircle className="h-3.5 w-3.5 mr-1.5" /> Convert to Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* SLA banner */}
      {sla && (
        <div className={cn(
          'rounded-xl border px-4 py-3 flex items-center justify-between gap-3',
          sla.status === 'overdue' ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900' :
          sla.status === 'at-risk' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900' :
          'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
        )}>
          <div className="flex items-center gap-2">
            {sla.status === 'overdue' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-emerald-600" />}
            <p className={cn('text-sm font-medium',
              sla.status === 'overdue' ? 'text-red-700 dark:text-red-300' :
              sla.status === 'at-risk' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
            )}>
              {sla.status === 'overdue' ? `SLA exceeded by ${Math.abs(sla.remaining).toFixed(0)}h` :
               sla.status === 'at-risk' ? `At risk — ${sla.remaining.toFixed(0)}h remaining` :
               `On track — ${sla.remaining.toFixed(0)}h remaining`}
            </p>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', sla.status === 'overdue' ? 'bg-red-500' : sla.status === 'at-risk' ? 'bg-amber-400' : 'bg-emerald-500')}
                style={{ width: `${sla.pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Action done banner */}
      {actionDone && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{actionDone} — all stakeholders notified</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <Card><CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Project Description</p>
              <p className="text-sm leading-relaxed">{pp.description}</p>
            </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Proposed Milestones</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pp.milestones.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i+1}</div>
                      <span className="flex-1">{m.title}</span>
                      <span className="text-xs text-muted-foreground">Month {m.dueMonths}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card><CardContent className="p-4 space-y-3">
              {[
                { label: 'Client', value: pp.clientName },
                { label: 'Dept Code', value: pp.clientDeptCode },
                { label: 'Division', value: pp.division },
                { label: 'Assigned PM', value: pp.assignedPm },
                { label: 'Priority', value: pp.priority },
                { label: 'Submitted', value: pp.submittedAt ? relDate(pp.submittedAt) : '—' },
                { label: 'Total Budget', value: fmtCr(pp.estimatedBudget) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* ── Workflow ── */}
      {tab === 'workflow' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Approval Pipeline</CardTitle></CardHeader>
              <CardContent><WorkflowStepper currentStatus={pp.status} auditTrail={pp.auditTrail} /></CardContent>
            </Card>
          </div>
          <div>
            {canApprove && !actionDone && (
              <Card className="border-primary/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-primary">Your Action Required</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!action ? (
                    <>
                      <p className="text-xs text-muted-foreground">Current step awaits your decision.</p>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction('approve')}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs text-amber-600 border-amber-300" onClick={() => setAction('send_back')}>
                          <CornerUpLeft className="h-3.5 w-3.5 mr-1.5" /> Send Back
                        </Button>
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs text-red-600 border-red-300" onClick={() => setAction('reject')}>
                          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium capitalize">{action.replace('_', ' ')} — add comment</p>
                      <textarea value={comment} onChange={e => setComment(e.target.value)}
                        placeholder={action === 'approve' ? 'Optional note…' : 'Reason required…'}
                        className="w-full rounded-lg border bg-background text-xs px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setAction(null)}>Cancel</Button>
                        <Button size="sm" disabled={action !== 'approve' && !comment.trim()}
                          className={cn('flex-1 h-7 text-xs', action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : action === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white')}
                          onClick={() => { setActionDone(`${action.replace('_',' ')} recorded`); setAction(null); setComment(''); }}>
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {tab === 'documents' && (
        <Card><CardHeader className="pb-3"><div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Document Repository</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs"><Upload className="h-3 w-3 mr-1" /> Upload</Button>
        </div></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pp.documents.map((doc: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} · {doc.size} · {relDate(doc.uploadedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.verified
                      ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-0">Verified</Badge>
                      : <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-0">Pending Review</Badge>}
                    {doc.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Budget ── */}
      {tab === 'budget' && (
        <div className="space-y-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Budget Breakdown — {fmtCr(pp.estimatedBudget)} Total</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pp.budgetBreakdown.map((b: any) => (
                <div key={b.category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{b.category}</span>
                    <span className="font-medium">{fmtCr(b.planned)} ({b.pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1 flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-primary" /> Budget Tracker</p>
            <p>Full planned vs. actual tracking activates once this pre-project is converted to a live project. Budget categories will be imported automatically.</p>
          </div>
        </div>
      )}

      {/* ── Audit Trail ── */}
      {tab === 'audit' && (
        <Card><CardHeader className="pb-3"><div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Immutable Audit Trail</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" /> Export</Button>
        </div></CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              {pp.auditTrail.map((entry: any, i: number) => (
                <div key={i} className="relative">
                  <div className={cn('absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 border-background',
                    entry.action === 'APPROVED' ? 'bg-emerald-500' :
                    entry.action === 'REJECTED' ? 'bg-red-500' : 'bg-primary')} />
                  <p className="text-sm font-medium">
                    {entry.actor} <span className="text-muted-foreground font-normal text-xs">({entry.role})</span>
                    <span className={cn('ml-2 font-semibold text-xs',
                      entry.action === 'APPROVED' ? 'text-emerald-600' :
                      entry.action === 'REJECTED' ? 'text-red-600' : 'text-blue-600')}>
                      {entry.action}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">{relDate(entry.at)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Status → <span className="font-medium">{entry.status.replace(/_/g,' ')}</span></p>
                  {entry.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{entry.comment}"</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
