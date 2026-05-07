import { useState, useMemo } from 'react';
import {
  CheckCircle2, XCircle, CornerUpLeft, Users2, Clock,
  AlertTriangle, MessageSquare, ChevronDown, ChevronUp,
  ArrowRight, Send, UserMinus, Building2, Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

// ── helpers ──────────────────────────────────────────────────────────────────

function getSlaInfo(stepStartedAt: string, thresholdHours: number) {
  const elapsed = (Date.now() - new Date(stepStartedAt).getTime()) / 3_600_000;
  const remaining = thresholdHours - elapsed;
  const pct = Math.min(100, (elapsed / thresholdHours) * 100);
  if (remaining < 0) return { status: 'overdue' as const, remaining, pct: 100, elapsed };
  if (remaining < thresholdHours * 0.25) return { status: 'at-risk' as const, remaining, pct, elapsed };
  return { status: 'on-track' as const, remaining, pct, elapsed };
}

function fmtHours(h: number) {
  const abs = Math.abs(h);
  if (abs < 1) return `${Math.round(abs * 60)}m`;
  if (abs < 24) return `${abs.toFixed(1)}h`;
  return `${(abs / 24).toFixed(1)}d`;
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

// ── mock data ─────────────────────────────────────────────────────────────────

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

const ALL_APPROVALS = [
  {
    id: 'wfi-001', projectKey: 'HWY-002',
    projectName: 'Highway Widening Phase II',
    description: 'Budget revision request: additional ₹40 Lac for soil stabilisation works discovered during ground survey. PM seeking approval before issuing work order amendment.',
    division: 'Infrastructure', submittedBy: 'Bob Kumar', submittedByRole: 'PM',
    currentStep: 1, currentStepName: 'Division Review', requiredRole: 'division_admin',
    totalSteps: 2, stepStartedAt: hoursAgo(30), slaThreshold: 48, priority: 'high',
    budget: '₹4.2 Cr', timeline: '18 months',
    previousActions: [
      { actor: 'Bob Kumar', role: 'Project Manager', action: 'SUBMITTED', comment: 'Revised cost estimate attached. Soil report justifies the additional scope.', at: hoursAgo(30) },
    ],
    canDelegate: true, delegatedTo: null,
  },
  {
    id: 'wfi-002', projectKey: 'BDG-001',
    projectName: 'Bridge Rehabilitation — Narmada Crossing',
    description: 'Milestone sign-off request: Phase 1 structural works complete. Requesting executive approval to release next tranche of funds per financial schedule.',
    division: 'Infrastructure', submittedBy: 'Priya Singh', submittedByRole: 'PM',
    currentStep: 2, currentStepName: 'Executive Approval', requiredRole: 'executive',
    totalSteps: 2, stepStartedAt: hoursAgo(78), slaThreshold: 72, priority: 'critical',
    budget: '₹12.8 Cr', timeline: '24 months',
    previousActions: [
      { actor: 'Priya Singh', role: 'PM', action: 'SUBMITTED', comment: 'Phase 1 completion report and inspection certificate attached.', at: hoursAgo(80) },
      { actor: 'Ravi Sharma', role: 'Division Head', action: 'APPROVED', comment: 'Site verified. Quality report satisfactory. Forwarded for executive release.', at: hoursAgo(78) },
    ],
    canDelegate: false, delegatedTo: null,
  },
  {
    id: 'wfi-003', projectKey: 'SCH-005',
    projectName: 'District School Renovation Block C',
    description: 'Scope change approval: additional WASH block required as per new state government directive. Cost impact ₹8 Lac. Seeking Division Head sign-off.',
    division: 'Education', submittedBy: 'Anita Joshi', submittedByRole: 'PM',
    currentStep: 1, currentStepName: 'Division Review', requiredRole: 'division_admin',
    totalSteps: 2, stepStartedAt: hoursAgo(12), slaThreshold: 48, priority: 'medium',
    budget: '₹85 Lac', timeline: '6 months',
    previousActions: [
      { actor: 'Anita Joshi', role: 'PM', action: 'SUBMITTED', comment: 'State directive reference attached. Pre-monsoon deadline at risk if delayed.', at: hoursAgo(12) },
    ],
    canDelegate: true, delegatedTo: null,
  },
  {
    id: 'wfi-004', projectKey: 'WTR-010',
    projectName: 'Rural Water Supply Pipeline Extension',
    description: 'Vendor change approval: original contractor abandoned site. PM requesting emergency approval to engage alternate vendor from approved panel.',
    division: 'Water Resources', submittedBy: 'Deepak Nair', submittedByRole: 'PM',
    currentStep: 2, currentStepName: 'Executive Approval', requiredRole: 'executive',
    totalSteps: 2, stepStartedAt: hoursAgo(40), slaThreshold: 72, priority: 'high',
    budget: '₹6.4 Cr', timeline: '12 months',
    previousActions: [
      { actor: 'Deepak Nair', role: 'PM', action: 'SUBMITTED', comment: 'Contractor abandonment notice attached. Alternate vendor quote ready.', at: hoursAgo(100) },
      { actor: 'Meera Patel', role: 'Division Head', action: 'APPROVED', comment: 'Alternate vendor verified on approved panel. Recommending executive clearance.', at: hoursAgo(40) },
    ],
    canDelegate: false, delegatedTo: null,
  },
];

type Tab = 'mine' | 'all' | 'overdue' | 'completed';

const SAMPLE_MEMBERS = [
  { id: 'u1', name: 'Ravi Sharma', role: 'division_admin', division: 'Infrastructure' },
  { id: 'u2', name: 'Meera Patel', role: 'division_admin', division: 'Water Resources' },
  { id: 'u3', name: 'Sunita Rao', role: 'division_admin', division: 'Education' },
];

// ── SLA Strip ─────────────────────────────────────────────────────────────────

function SlaBadge({ stepStartedAt, threshold }: { stepStartedAt: string; threshold: number }) {
  const sla = getSlaInfo(stepStartedAt, threshold);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          'font-semibold flex items-center gap-1',
          sla.status === 'overdue' ? 'text-red-600' :
          sla.status === 'at-risk' ? 'text-amber-600' : 'text-emerald-600'
        )}>
          {sla.status === 'overdue' && <AlertTriangle className="h-3 w-3" />}
          {sla.status === 'overdue'
            ? `SLA exceeded by ${fmtHours(-sla.remaining)}`
            : sla.status === 'at-risk'
            ? `⚠ ${fmtHours(sla.remaining)} left — at risk`
            : `${fmtHours(sla.remaining)} remaining`}
        </span>
        <span className="text-muted-foreground">{fmtHours(sla.elapsed)} / {threshold}h SLA</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            sla.status === 'overdue' ? 'bg-red-500' :
            sla.status === 'at-risk' ? 'bg-amber-400' : 'bg-emerald-500'
          )}
          style={{ width: `${sla.pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Delegate Modal ────────────────────────────────────────────────────────────

function DelegateModal({
  onClose, onDelegate,
}: {
  onClose: () => void;
  onDelegate: (memberId: string, reason: string) => void;
}) {
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="font-semibold text-base mb-1">Delegate Approval</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Assign this approval to another Division Head temporarily. Audit trail will record the delegation.
        </p>
        <div className="space-y-3">
          <label className="text-xs font-medium">Delegate to</label>
          <div className="space-y-2">
            {SAMPLE_MEMBERS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors',
                  selected === m.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                )}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{m.role.replace('_', ' ')} · {m.division}</p>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium">Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. On leave until 10 May. Delegating to cover during absence."
              className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!selected || !reason.trim()}
            onClick={() => onDelegate(selected, reason)}
          >
            Delegate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────

function ApprovalCard({ approval, canAct }: { approval: typeof ALL_APPROVALS[0]; canAct: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'send_back' | null>(null);
  const [comment, setComment] = useState('');
  const [showDelegate, setShowDelegate] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const sla = getSlaInfo(approval.stepStartedAt, approval.slaThreshold);

  const handleSubmit = () => {
    if (!action) return;
    const label = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Sent Back';
    setDone(label);
    setAction(null);
    setComment('');
  };

  const priorityStyles: Record<string, string> = {
    critical: 'border-l-4 border-l-red-500',
    high: 'border-l-4 border-l-orange-400',
    medium: 'border-l-4 border-l-blue-400',
  };

  if (done) {
    return (
      <Card className={cn('overflow-hidden', priorityStyles[approval.priority])}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold">{approval.projectName} — {done}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Action recorded in audit trail. Relevant stakeholders notified.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showDelegate && (
        <DelegateModal
          onClose={() => setShowDelegate(false)}
          onDelegate={(id, reason) => {
            console.log('delegate to', id, reason);
            setShowDelegate(false);
            setDone('Delegated');
          }}
        />
      )}
      <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', priorityStyles[approval.priority])}>
        <CardContent className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-semibold text-base leading-tight">{approval.projectName}</h3>
                <Badge variant="outline" className="text-[10px] font-mono">{approval.projectKey}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    approval.priority === 'critical' ? 'text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30' :
                    approval.priority === 'high' ? 'text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30' :
                    'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30'
                  )}
                >
                  {approval.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{approval.division}</span>
                <span className="flex items-center gap-1"><Users2 className="h-3 w-3" />By {approval.submittedBy} ({approval.submittedByRole})</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{relativeTime(approval.previousActions[0].at)}</span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  Step {approval.currentStep}/{approval.totalSteps}: {approval.currentStepName}
                </span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground flex-shrink-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* SLA */}
          <SlaBadge stepStartedAt={approval.stepStartedAt} threshold={approval.slaThreshold} />

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{approval.description}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-1"><span className="font-medium text-foreground">Budget:</span> {approval.budget}</span>
            <span className="flex items-center gap-1"><span className="font-medium text-foreground">Timeline:</span> {approval.timeline}</span>
          </div>

          {/* Audit trail (expanded) */}
          {expanded && (
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Audit Trail</p>
              <div className="relative pl-4 space-y-3">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                {approval.previousActions.map((a, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[11px] top-1 h-2 w-2 rounded-full bg-primary border-2 border-background" />
                    <p className="text-xs font-medium">
                      {a.actor} <span className="text-muted-foreground font-normal">({a.role})</span>
                      <span className={cn(
                        'ml-2 font-semibold',
                        a.action === 'APPROVED' ? 'text-emerald-600' :
                        a.action === 'REJECTED' ? 'text-red-600' : 'text-blue-600'
                      )}>
                        {a.action === 'SUBMITTED' ? '→ Submitted' : a.action === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                      </span>
                      <span className="text-muted-foreground font-normal ml-2">{relativeTime(a.at)}</span>
                    </p>
                    {a.comment && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{a.comment}"</p>
                    )}
                  </div>
                ))}
                <div className="relative">
                  <div className="absolute -left-[11px] top-1 h-2 w-2 rounded-full bg-amber-400 border-2 border-background animate-pulse" />
                  <p className="text-xs font-medium text-amber-600">Awaiting {approval.currentStepName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Panel */}
          {canAct && !action && (
            <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                onClick={() => setAction('approve')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => setAction('send_back')}
              >
                <CornerUpLeft className="h-3.5 w-3.5 mr-1.5" /> Send Back
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setAction('reject')}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
              </Button>
              {approval.canDelegate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs ml-auto"
                  onClick={() => setShowDelegate(true)}
                >
                  <UserMinus className="h-3.5 w-3.5 mr-1.5" /> Delegate
                </Button>
              )}
            </div>
          )}

          {/* Inline comment + confirm */}
          {canAct && action && (
            <div className="pt-3 border-t space-y-3">
              <div className={cn(
                'rounded-lg p-3 text-sm font-medium flex items-center gap-2',
                action === 'approve' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                action === 'reject' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              )}>
                {action === 'approve' && <CheckCircle2 className="h-4 w-4" />}
                {action === 'reject' && <XCircle className="h-4 w-4" />}
                {action === 'send_back' && <CornerUpLeft className="h-4 w-4" />}
                {action === 'approve' ? 'Approving — add optional note' :
                 action === 'reject' ? 'Rejecting — reason required' :
                 'Sending back for revision — reason required'}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Optional: add approval note or conditions...'
                    : 'Required: explain reason for rejection / what needs revision...'
                }
                className="w-full rounded-lg border bg-background text-sm px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setAction(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    'flex-1 h-8 text-xs',
                    action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                    action === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-amber-500 hover:bg-amber-600 text-white'
                  )}
                  disabled={action !== 'approve' && !comment.trim()}
                  onClick={handleSubmit}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Confirm {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Send Back'}
                </Button>
              </div>
            </div>
          )}

          {!canAct && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                This step requires <span className="font-medium capitalize">{approval.requiredRole.replace('_', ' ')}</span> role to act.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ApprovalInboxPage() {
  const { currentRole } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('mine');

  const displayed = useMemo(() => {
    if (tab === 'mine') return ALL_APPROVALS.filter((a) => a.requiredRole === currentRole);
    if (tab === 'overdue') return ALL_APPROVALS.filter(
      (a) => getSlaInfo(a.stepStartedAt, a.slaThreshold).status === 'overdue'
    );
    return ALL_APPROVALS;
  }, [tab, currentRole]);

  const counts = {
    mine: ALL_APPROVALS.filter((a) => a.requiredRole === currentRole).length,
    all: ALL_APPROVALS.length,
    overdue: ALL_APPROVALS.filter((a) => getSlaInfo(a.stepStartedAt, a.slaThreshold).status === 'overdue').length,
  };

  const tabs: { key: Tab; label: string; count?: number; color?: string }[] = [
    { key: 'mine', label: 'My Queue', count: counts.mine, color: counts.mine > 0 ? 'bg-primary text-primary-foreground' : undefined },
    { key: 'all', label: 'All Pending', count: counts.all },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, color: counts.overdue > 0 ? 'bg-red-500 text-white' : undefined },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Approval Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, approve, or escalate pending workflow approvals
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/workflow/monitor')}>
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Monitor
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn('text-[10px] rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center', t.color || 'bg-muted text-muted-foreground')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Role info banner */}
      {tab === 'mine' && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center gap-3">
          <Users2 className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm text-primary">
            Showing approvals where your role <span className="font-semibold capitalize">({currentRole?.replace(/_/g, ' ')})</span> is the required approver.
          </p>
        </div>
      )}

      {/* Content */}
      {tab === 'completed' ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold text-lg">Completed approvals</p>
          <p className="text-sm text-muted-foreground mt-1">
            View the full audit trail in{' '}
            <button onClick={() => navigate('/admin/audit-log')} className="text-primary underline underline-offset-2">
              Audit Log
            </button>
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold text-lg">
            {tab === 'mine' ? "You're all caught up!" : 'No items in this view'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'mine'
              ? 'No approvals are waiting for your action right now.'
              : 'Try switching to a different tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((a) => (
            <ApprovalCard
              key={a.id}
              approval={a}
              canAct={a.requiredRole === currentRole}
            />
          ))}
        </div>
      )}

      {/* Info strip */}
      <div className="rounded-xl bg-muted/50 border px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How this works</p>
        <p>• <span className="font-medium">Division Review</span> (step 1) is handled by Division Admin. Covers budget revisions, scope changes, and milestone sign-offs.</p>
        <p>• <span className="font-medium">Executive Approval</span> (step 2) is required for high-value or cross-division items and fund release decisions.</p>
        <p>• All actions are permanently recorded in the audit trail. Rejections return the request to <span className="font-medium">DRAFT</span>. Send Back returns to the previous step.</p>
        <p>• SLA: 48h per step. Red = overdue, Amber = &lt;25% time left, Green = on track.</p>
      </div>
    </div>
  );
}
