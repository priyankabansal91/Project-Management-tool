import { useState } from 'react';
import {
  BookOpen, CheckCircle2, ArrowRight, AlertCircle, Users, Crown,
  Briefcase, ChevronDown, ChevronUp, HelpCircle, PlayCircle,
  FileText, Clock, Send, CornerUpLeft, XCircle, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── data ──────────────────────────────────────────────────────────────────────

type RoleKey = 'project_manager' | 'division_admin' | 'executive' | 'org_admin';

const ROLES: { key: RoleKey; label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }[] = [
  { key: 'project_manager', label: 'Project Manager', icon: Briefcase, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', desc: 'Initiates the project approval lifecycle' },
  { key: 'division_admin', label: 'Division Head', icon: Users, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', desc: 'Reviews and approves at Step 1' },
  { key: 'executive', label: 'CFO / Executive', icon: Crown, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', desc: 'Final financial sanction at Step 2' },
  { key: 'org_admin', label: 'Org Admin', icon: Shield, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', desc: 'Governance, oversight, and override capability' },
];

const GUIDES: Record<RoleKey, {
  steps: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string; tip?: string; warning?: string }[];
  dos: string[]; donts: string[]; faq: { q: string; a: string }[];
}> = {
  project_manager: {
    steps: [
      { icon: FileText, title: 'Prepare your project', detail: 'Before submitting, ensure the project has a complete description, budget estimate, timeline, and DPR attached. Incomplete submissions will be sent back at Core Review.', tip: 'Use the Task Templates section to pre-populate standard DPR checklist tasks.' },
      { icon: Send, title: 'Submit for Approval', detail: 'From the Projects list, open your project and click "Submit for Approval". The project status changes to PENDING_CORE_REVIEW instantly.', tip: 'You will receive an in-app notification confirming submission.' },
      { icon: Clock, title: 'Wait for Core Review (Step 1)', detail: 'The Division Head has 48 hours to complete Step 1. You can track progress on the Workflow Monitor page.', tip: 'If the Division Head sends it back, you\'ll see a notification with their specific comments. Address those before re-submitting.' },
      { icon: Clock, title: 'Wait for CFO Approval (Step 2)', detail: 'After Division Head approval, the CFO/Executive has 72 hours to review. Watch your notification panel.', warning: 'Do NOT contact the CFO directly. All communications happen through the system comment thread.' },
      { icon: CheckCircle2, title: 'Project goes ACTIVE', detail: 'Once CFO approves, status becomes ACTIVE automatically. You\'ll receive a notification. Teams can now be assigned, sprints started, and tasks created.', tip: 'Immediately assign the team, set the first sprint, and hold a kickoff meeting.' },
    ],
    dos: [
      'Attach all DPR documents before submitting',
      'Add a clear project description with scope boundaries',
      'Include budget line items (not just total)',
      'Set priority (Critical / High / Medium) accurately',
      'Monitor your notification panel daily during review',
    ],
    donts: [
      "Don't submit without budget approval from your division",
      "Don't re-submit the same project if it's already PENDING — edit and resend instead",
      "Don't mark priority as Critical unless it's genuinely time-critical",
      "Don't reach out to reviewers outside the system",
    ],
    faq: [
      { q: 'My project was sent back. What should I do?', a: 'Open the project, read the reviewer\'s comment in the Audit Trail section, make the required changes, and click Re-Submit. The previous review cycle is fully logged.' },
      { q: 'How long does the full approval take?', a: 'Maximum 120 hours (48h Core + 72h CFO). If either step goes overdue, an automatic escalation is sent to the Org Admin.' },
      { q: 'Can I cancel an in-progress approval?', a: 'No. Contact your Division Admin or Org Admin to recall the submission.' },
      { q: 'What\'s the difference between Rejected and Sent Back?', a: 'Sent Back returns the project to PENDING_CORE_REVIEW for revision. Rejected returns it to DRAFT with reasons — you can correct and resubmit a rejected project.' },
    ],
  },
  division_admin: {
    steps: [
      { icon: PlayCircle, title: 'Open Approval Inbox', detail: 'Navigate to Admin → Approvals. Your queue shows projects pending Core Team Review filtered to your role.', tip: 'Sort by SLA remaining — overdue items appear first in red.' },
      { icon: FileText, title: 'Review the submission', detail: 'Click on a project card to expand the full detail: description, budget, timeline, and any attached documents. Check the PM\'s submission comment.', warning: 'You are responsible for verifying technical feasibility, resource availability within your division, and budget compatibility.' },
      { icon: CheckCircle2, title: 'Approve if satisfactory', detail: 'Click Approve and add a brief approval note (optional but recommended). The project moves to PENDING_CFO_APPROVAL and the CFO is notified.', tip: 'A good approval note might say: "Scope verified, team available, budget within Q3 allocation."' },
      { icon: CornerUpLeft, title: 'Send Back if revisions needed', detail: 'Click Send Back and specify exactly what needs to change. The PM is notified with your comment and can re-submit after making corrections.', tip: 'Be specific: "Budget line item 3 (equipment) needs vendor quotes" is more useful than "Budget incomplete".' },
      { icon: XCircle, title: 'Reject if project should not proceed', detail: 'Use Reject only when the project fundamentally cannot or should not proceed (wrong scope, duplicate project, etc.). This returns it to DRAFT with your reason.', warning: 'Rejection is a strong action. Prefer Send Back for fixable issues.' },
    ],
    dos: [
      'Review within 24 hours — aim well within the 48h SLA',
      'Leave a specific, actionable comment with every decision',
      'Cross-check budget against division allocation before approving',
      'Use Delegate if you will be unavailable for more than 24 hours',
    ],
    donts: [
      "Don't approve without reading the full project description",
      "Don't leave comments vague — PMs need clear direction",
      "Don't let approvals sit in your queue past the 36h warning",
      "Don't approve projects outside your division scope",
    ],
    faq: [
      { q: 'I\'m going on leave. What happens to pending approvals?', a: 'Use the Delegate function (visible on each approval card). Select a colleague with Division Admin role and specify the period. The delegation is logged in the audit trail.' },
      { q: 'Can I reverse my approval?', a: 'No — once approved, contact the Org Admin to use the governance override if necessary.' },
      { q: 'How do I know if a project is urgent?', a: 'Priority badge on the card (Critical = red, High = orange). Also check if the SLA countdown is in amber or red.' },
      { q: 'What if the PM re-submits without addressing my comments?', a: 'You can Send Back again with the same or updated comments. Repeated cycles are visible to the Org Admin in the audit trail.' },
    ],
  },
  executive: {
    steps: [
      { icon: PlayCircle, title: 'Open Approval Inbox', detail: 'Go to Admin → Approvals. Your queue shows projects at Step 2 (CFO Approval) only. These have already passed Core Review by the Division Head.', tip: 'Filter to "My Queue" to see only items requiring your action.' },
      { icon: FileText, title: 'Review the full audit trail', detail: 'Expand the project card to see the complete history: who submitted, the Division Head\'s approval note, and any previous cycles. Focus on budget accuracy and financial risk.', tip: 'The audit trail shows if the project was sent back previously — a sign of prior issues.' },
      { icon: CheckCircle2, title: 'Approve to activate project', detail: 'Click Approve with an optional financial note. The project status changes to ACTIVE immediately. PM and Division Head are notified and execution can begin.', warning: 'This is the final financial sanction. Verify budget aligns with organizational finance plan before approving.' },
      { icon: CornerUpLeft, title: 'Send Back to Core Review', detail: 'If the financial details need revision, Send Back returns the project to Division Head (Step 1) for correction. Add specific financial concerns.', tip: 'Example: "Revenue model unclear. Return for corrected financial projections."' },
      { icon: XCircle, title: 'Reject for financial non-approval', detail: 'If the project cannot be financially sanctioned, Reject returns it to DRAFT. The PM can make corrections and restart the full approval cycle.', warning: 'Provide clear financial reasons so the PM can make accurate corrections.' },
    ],
    dos: [
      'Review all CFO Approval items within 48h of receiving them',
      'Verify budget against organizational finance plan',
      'Check for duplicate projects or conflicting allocations',
      'Note the Division Head\'s approval rationale before deciding',
    ],
    donts: [
      "Don't approve without checking budget line items",
      "Don't let projects sit in queue past 60h (SLA is 72h)",
      "Don't discuss project details outside the system",
    ],
    faq: [
      { q: 'Can two projects compete for the same budget allocation?', a: 'Yes — check Financial Dashboard before approving. If there\'s a conflict, reject or send back the lower-priority project with a note to resubmit next budget cycle.' },
      { q: 'What if I need more information before deciding?', a: 'Use Send Back with a specific information request. The PM will address it and the Division Head will re-review before it reaches you again.' },
      { q: 'Is verbal approval sufficient to approve here?', a: 'No — all approvals must be done in-system. Verbal approvals have no audit standing for government compliance. Document everything in the comment field.' },
    ],
  },
  org_admin: {
    steps: [
      { icon: Shield, title: 'Monitor the pipeline daily', detail: 'Use Workflow Monitor (/workflow/monitor) to see all pending approvals, SLA statuses, and overdue items across all divisions.', tip: 'Set your notification preferences to alert you when any approval goes overdue.' },
      { icon: Clock, title: 'Handle escalations', detail: 'When SLA thresholds are exceeded, you receive an automatic notification. Check the Governance page to see escalated items and assign or force-approve if necessary.', warning: 'Escalation does not auto-approve. You must take an explicit action.' },
      { icon: Users, title: 'Manage delegations', detail: 'In Governance → Active Delegates, you can view, add, or revoke delegations. Always verify the delegate is in the correct role before granting.', tip: 'Add a delegation proactively when you see an approver is on leave in the attendance system.' },
      { icon: FileWarning, title: 'Use Override sparingly', detail: 'Admin Override bypasses all approval steps. Use only for genuine emergencies (natural disasters, court orders, urgent government directives). Every override requires a 50+ character justification and triggers a compliance review.', warning: 'Overrides are the highest-risk action in the system. They are permanently logged and reviewed by QCI compliance team.' },
      { icon: CheckCircle2, title: 'Configure SLA policies', detail: 'In Governance → SLA Policy, adjust warning and escalation thresholds per step. Changes take effect for all new workflow instances immediately.', tip: 'Start conservative (48h/72h). Tighten after 3 months of operational data.' },
    ],
    dos: [
      'Review the monitoring dashboard every morning',
      'Resolve escalations within 4 hours of notification',
      'Keep audit log exports quarterly for compliance records',
      'Configure SLA policies before go-live',
      'Train each role using this guide before giving them access',
    ],
    donts: [
      "Don't use Override as a workaround for slow approvers — fix the root cause",
      "Don't grant Org Admin to users without explicit need",
      "Don't revoke delegations without notifying affected parties",
    ],
    faq: [
      { q: 'A reviewer left the organization. What happens to their pending approvals?', a: 'Their approvals will hit SLA and escalate to you. Deactivate their account in User Management first, then use Admin Override or create a delegation to the replacement.' },
      { q: 'Can I change the workflow steps?', a: 'Yes — via Admin → Workflows. You can add steps, change required roles, or modify SLA thresholds. Changes only affect new submissions, not in-progress instances.' },
      { q: 'How do I prepare for a government audit?', a: 'Export the full Audit Log (Admin → Exports). Every approval, rejection, override, and delegation is logged with user identity, timestamp, and full comment. This is audit-ready by design.' },
    ],
  },
};

// ── FAQ Item ──────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function WorkflowTrainingPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('project_manager');
  const guide = GUIDES[activeRole];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Workflow Training Guide
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Role-specific guidance for Q-Flow's Pre-Execution Approval Workflow
        </p>
      </div>

      {/* Process overview strip */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Approval Flow</p>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { label: 'Project Created', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
            { label: 'PM Submits', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
            { label: 'Core Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
            { label: 'CFO Approval', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
            { label: 'ACTIVE', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold', s.color)}>{s.label}</span>
              {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveRole(r.key)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center',
              activeRole === r.key
                ? 'border-primary shadow-md'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', r.color)}>
              <r.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">{r.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{r.desc}</p>
            </div>
            {activeRole === r.key && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Viewing</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Role guide */}
      <div className="space-y-4">
        {/* Step-by-step */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Step-by-Step Guide — {ROLES.find(r => r.key === activeRole)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-6">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[22px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                      {idx + 1}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.detail}</p>
                        {step.tip && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Tip:</span> {step.tip}</span>
                          </div>
                        )}
                        {step.warning && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Important:</span> {step.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Do's
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {guide.dos.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <XCircle className="h-4 w-4" /> Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {guide.donts.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guide.faq.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// inline helper
function FileWarning({ className }: { className?: string }) {
  return <AlertCircle className={className} />;
}
