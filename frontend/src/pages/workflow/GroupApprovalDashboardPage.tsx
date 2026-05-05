import { useState } from 'react';
import { Users, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, ThumbsUp, ThumbsDown, RotateCcw, Filter } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type VoteAction = 'APPROVE' | 'REJECT' | 'PENDING';
type InstanceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

interface MemberVote {
  userId: string;
  name: string;
  title: string;
  action: VoteAction;
  comment?: string;
  at?: string;
}

interface StepSummary {
  id: string;
  name: string;
  stepOrder: number;
  groupId: string;
  groupName: string;
  approvalType: 'ANY' | 'ALL' | 'QUORUM';
  quorumCount: number | null;
  slaHours: number;
  isCurrent: boolean;
  isCompleted: boolean;
  votes: MemberVote[];
  startedAt: string | null;
  completedAt: string | null;
  slaStatus: 'on-track' | 'at-risk' | 'overdue';
}

interface WorkflowInstance {
  id: string;
  entityName: string;
  entityType: string;
  status: InstanceStatus;
  startedAt: string;
  completedAt: string | null;
  currentStepName: string;
  initiatedBy: string;
  steps: StepSummary[];
  priority: 'high' | 'medium' | 'low';
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_INSTANCES: WorkflowInstance[] = [
  {
    id: 'wfi-001', entityName: 'NH-48 Highway Widening Project', entityType: 'PRE_PROJECT',
    status: 'IN_PROGRESS', startedAt: '2025-04-30T09:00:00Z', completedAt: null,
    currentStepName: 'Core Team Review', initiatedBy: 'Anita Sharma', priority: 'high',
    steps: [
      {
        id: 'step-1', name: 'Core Team Review', stepOrder: 1, groupId: 'grp-core', groupName: 'Core Team',
        approvalType: 'QUORUM', quorumCount: 2, slaHours: 48, isCurrent: true, isCompleted: false,
        startedAt: '2025-04-30T09:00:00Z', completedAt: null, slaStatus: 'at-risk',
        votes: [
          { userId: 'dev-division_admin-id', name: 'Rajesh Kumar', title: 'Division Head', action: 'APPROVE', comment: 'Technical specs look solid.', at: '2025-04-30T11:20:00Z' },
          { userId: 'dev-project_manager-id', name: 'Anita Sharma', title: 'Senior Engineer', action: 'PENDING' },
          { userId: 'dev-member-id', name: 'Vikram Singh', title: 'Finance Officer', action: 'PENDING' },
        ],
      },
      {
        id: 'step-2', name: 'CFO Final Approval', stepOrder: 2, groupId: 'grp-cfo', groupName: 'CFO Group',
        approvalType: 'ANY', quorumCount: null, slaHours: 72, isCurrent: false, isCompleted: false,
        startedAt: null, completedAt: null, slaStatus: 'on-track',
        votes: [{ userId: 'dev-executive-id', name: 'Sunita Rao', title: 'CFO', action: 'PENDING' }],
      },
    ],
  },
  {
    id: 'wfi-002', entityName: 'Yamuna Bridge Strengthening Phase II', entityType: 'PRE_PROJECT',
    status: 'IN_PROGRESS', startedAt: '2025-04-28T10:00:00Z', completedAt: null,
    currentStepName: 'CFO Final Approval', initiatedBy: 'Rajesh Kumar', priority: 'high',
    steps: [
      {
        id: 'step-1', name: 'Core Team Review', stepOrder: 1, groupId: 'grp-core', groupName: 'Core Team',
        approvalType: 'QUORUM', quorumCount: 2, slaHours: 48, isCurrent: false, isCompleted: true,
        startedAt: '2025-04-28T10:00:00Z', completedAt: '2025-04-29T14:00:00Z', slaStatus: 'on-track',
        votes: [
          { userId: 'dev-division_admin-id', name: 'Rajesh Kumar', title: 'Division Head', action: 'APPROVE', at: '2025-04-28T15:00:00Z' },
          { userId: 'dev-project_manager-id', name: 'Anita Sharma', title: 'Senior Engineer', action: 'APPROVE', at: '2025-04-29T09:00:00Z' },
          { userId: 'dev-member-id', name: 'Vikram Singh', title: 'Finance Officer', action: 'PENDING' },
        ],
      },
      {
        id: 'step-2', name: 'CFO Final Approval', stepOrder: 2, groupId: 'grp-cfo', groupName: 'CFO Group',
        approvalType: 'ANY', quorumCount: null, slaHours: 72, isCurrent: true, isCompleted: false,
        startedAt: '2025-04-29T14:00:00Z', completedAt: null, slaStatus: 'overdue',
        votes: [{ userId: 'dev-executive-id', name: 'Sunita Rao', title: 'CFO', action: 'PENDING' }],
      },
    ],
  },
  {
    id: 'wfi-003', entityName: 'Rural Water Supply Scheme — Rajasthan', entityType: 'PRE_PROJECT',
    status: 'COMPLETED', startedAt: '2025-04-20T08:00:00Z', completedAt: '2025-04-24T16:00:00Z',
    currentStepName: 'CFO Final Approval', initiatedBy: 'Priyanka Bansal', priority: 'medium',
    steps: [
      {
        id: 'step-1', name: 'Core Team Review', stepOrder: 1, groupId: 'grp-core', groupName: 'Core Team',
        approvalType: 'QUORUM', quorumCount: 2, slaHours: 48, isCurrent: false, isCompleted: true,
        startedAt: '2025-04-20T08:00:00Z', completedAt: '2025-04-22T10:00:00Z', slaStatus: 'on-track',
        votes: [
          { userId: 'dev-division_admin-id', name: 'Rajesh Kumar', title: 'Division Head', action: 'APPROVE', at: '2025-04-21T11:00:00Z' },
          { userId: 'dev-project_manager-id', name: 'Anita Sharma', title: 'Senior Engineer', action: 'APPROVE', at: '2025-04-22T09:00:00Z' },
          { userId: 'dev-member-id', name: 'Vikram Singh', title: 'Finance Officer', action: 'APPROVE', at: '2025-04-22T10:00:00Z' },
        ],
      },
      {
        id: 'step-2', name: 'CFO Final Approval', stepOrder: 2, groupId: 'grp-cfo', groupName: 'CFO Group',
        approvalType: 'ANY', quorumCount: null, slaHours: 72, isCurrent: false, isCompleted: true,
        startedAt: '2025-04-22T10:00:00Z', completedAt: '2025-04-24T16:00:00Z', slaStatus: 'on-track',
        votes: [{ userId: 'dev-executive-id', name: 'Sunita Rao', title: 'CFO', action: 'APPROVE', at: '2025-04-24T16:00:00Z' }],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slaBar(status: 'on-track' | 'at-risk' | 'overdue', pct: number) {
  const colors = { 'on-track': 'bg-green-500', 'at-risk': 'bg-amber-500', 'overdue': 'bg-red-500' };
  const labels = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'overdue': 'Overdue' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-medium ${status === 'overdue' ? 'text-red-600' : status === 'at-risk' ? 'text-amber-600' : 'text-green-600'}`}>{labels[status]}</span>
    </div>
  );
}

function quorumBar(votes: MemberVote[], needed: number | null, type: 'ANY' | 'ALL' | 'QUORUM') {
  const total = votes.length;
  const approved = votes.filter(v => v.action === 'APPROVE').length;
  const rejected = votes.filter(v => v.action === 'REJECT').length;
  const required = type === 'ANY' ? 1 : type === 'ALL' ? total : (needed ?? Math.ceil(total / 2));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{approved} of {required} needed ({type})</span>
        <span className="text-gray-400">{rejected > 0 ? `${rejected} rejected` : ''}</span>
      </div>
      <div className="flex gap-0.5">
        {votes.map((v, i) => (
          <div key={i} className={`h-3 flex-1 rounded-sm ${v.action === 'APPROVE' ? 'bg-green-500' : v.action === 'REJECT' ? 'bg-red-500' : 'bg-gray-200'}`} title={`${v.name}: ${v.action}`} />
        ))}
      </div>
    </div>
  );
}

function VoteIcon({ action }: { action: VoteAction }) {
  if (action === 'APPROVE') return <ThumbsUp className="h-4 w-4 text-green-500" />;
  if (action === 'REJECT') return <ThumbsDown className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-gray-400" />;
}

function priorityBadge(p: 'high' | 'medium' | 'low') {
  const c = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c[p]}`}>{p.toUpperCase()}</span>;
}

// ── Instance Card ─────────────────────────────────────────────────────────────

function InstanceCard({ inst }: { inst: WorkflowInstance }) {
  const [expanded, setExpanded] = useState(false);
  const [castVotes, setCastVotes] = useState<Record<string, VoteAction>>({});
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const borderColor = inst.status === 'COMPLETED' ? 'border-l-green-500' : inst.priority === 'high' ? 'border-l-red-500' : inst.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-400';
  const statusIcon = inst.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : inst.status === 'REJECTED' ? <XCircle className="h-4 w-4 text-red-500" /> : <Clock className="h-4 w-4 text-blue-500" />;

  const currentStep = inst.steps.find(s => s.isCurrent);
  const overallPct = inst.steps.filter(s => s.isCompleted).length / inst.steps.length * 100;

  const castVote = (stepId: string, action: VoteAction) => {
    setCastVotes(v => ({ ...v, [stepId]: action }));
    setCommenting(null);
    setComment('');
  };

  return (
    <div className={`bg-white border border-l-4 ${borderColor} rounded-xl shadow-sm overflow-hidden`}>
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {statusIcon}
                <span className="font-semibold text-gray-900">{inst.entityName}</span>
                {priorityBadge(inst.priority)}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{inst.entityType.replace('_', ' ')}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Started {new Date(inst.startedAt).toLocaleDateString('en-IN')} by {inst.initiatedBy}
                {inst.completedAt && ` · Completed ${new Date(inst.completedAt).toLocaleDateString('en-IN')}`}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-500 mb-1">
              {inst.status === 'IN_PROGRESS' ? `Current: ${inst.currentStepName}` : inst.status}
            </div>
            {/* Progress bar */}
            <div className="w-40">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{inst.steps.filter(s => s.isCompleted).length}/{inst.steps.length} steps</span>
                <span>{Math.round(overallPct)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${inst.status === 'COMPLETED' ? 'bg-green-500' : inst.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SLA for current step */}
        {currentStep && inst.status === 'IN_PROGRESS' && (
          <div className="mt-3 ml-7">
            {slaBar(currentStep.slaStatus, currentStep.slaStatus === 'overdue' ? 110 : currentStep.slaStatus === 'at-risk' ? 80 : 45)}
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {inst.steps.map(step => {
            const userVote = castVotes[step.id];
            const canVote = step.isCurrent && inst.status === 'IN_PROGRESS' && !userVote;

            return (
              <div key={step.id} className={`bg-white rounded-xl border p-4 space-y-3 ${step.isCurrent ? 'border-blue-300 ring-1 ring-blue-200' : step.isCompleted ? 'border-green-200 opacity-75' : 'opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.isCompleted ? 'bg-green-100 text-green-700' : step.isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {step.isCompleted ? '✓' : step.stepOrder}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800">{step.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{step.groupName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${step.approvalType === 'ANY' ? 'bg-green-100 text-green-700' : step.approvalType === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {step.approvalType}
                    </span>
                    {step.isCurrent && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold animate-pulse">ACTIVE</span>}
                  </div>
                  {step.slaStatus && step.isCurrent && (
                    <div className="w-40">
                      {slaBar(step.slaStatus, step.slaStatus === 'overdue' ? 110 : step.slaStatus === 'at-risk' ? 80 : 45)}
                    </div>
                  )}
                </div>

                {/* Quorum progress */}
                {step.isCurrent && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    {quorumBar(step.votes, step.quorumCount, step.approvalType)}
                  </div>
                )}

                {/* Member votes */}
                <div className="space-y-2">
                  {step.votes.map(v => (
                    <div key={v.userId} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {v.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{v.name}</span>
                          <span className="text-xs text-gray-400">{v.title}</span>
                          {v.at && <span className="text-xs text-gray-400">{new Date(v.at).toLocaleDateString('en-IN')}</span>}
                        </div>
                        {v.comment && <p className="text-xs text-gray-500 italic mt-0.5">"{v.comment}"</p>}
                      </div>
                      <VoteIcon action={userVote && v.userId === 'dev-org_admin-id' ? userVote : v.action} />
                    </div>
                  ))}
                </div>

                {/* Inline vote action */}
                {canVote && (
                  <div className="pt-2 border-t">
                    {commenting !== step.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 mr-1">Your vote:</span>
                        <button onClick={() => castVote(step.id, 'APPROVE')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                          <ThumbsUp className="h-3 w-3" /> Approve
                        </button>
                        <button onClick={() => setCommenting(step.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs rounded-lg hover:bg-red-100">
                          <ThumbsDown className="h-3 w-3" /> Reject
                        </button>
                        <button onClick={() => setCommenting(step.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">
                          <RotateCcw className="h-3 w-3" /> Send Back
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea className="w-full border rounded-lg p-2 text-sm resize-none" rows={2} placeholder="Add comment (required for reject/send-back)..." value={comment} onChange={e => setComment(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={() => { setCastVotes(v => ({ ...v, [step.id]: 'REJECT' })); setCommenting(null); setComment(''); }}
                            disabled={!comment} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-40">Reject</button>
                          <button onClick={() => setCommenting(null)} className="px-3 py-1.5 border text-xs rounded-lg hover:bg-gray-100">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Voted badge */}
                {userVote && step.isCurrent && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${userVote === 'APPROVE' ? 'text-green-600' : 'text-red-600'}`}>
                    <VoteIcon action={userVote} />
                    You voted: {userVote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GroupApprovalDashboardPage() {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'rejected'>('all');

  const filtered = MOCK_INSTANCES.filter(inst => {
    if (filter === 'in-progress') return inst.status === 'IN_PROGRESS';
    if (filter === 'completed') return inst.status === 'COMPLETED';
    if (filter === 'rejected') return inst.status === 'REJECTED';
    return true;
  });

  const counts = {
    all: MOCK_INSTANCES.length,
    inProgress: MOCK_INSTANCES.filter(i => i.status === 'IN_PROGRESS').length,
    completed: MOCK_INSTANCES.filter(i => i.status === 'COMPLETED').length,
    rejected: MOCK_INSTANCES.filter(i => i.status === 'REJECTED').length,
    overdue: MOCK_INSTANCES.filter(i => i.steps.some(s => s.isCurrent && s.slaStatus === 'overdue')).length,
  };

  const filters: { key: typeof filter; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: counts.all, color: 'text-gray-700' },
    { key: 'in-progress', label: 'In Progress', count: counts.inProgress, color: 'text-blue-700' },
    { key: 'completed', label: 'Completed', count: counts.completed, color: 'text-green-700' },
    { key: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-red-700' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-7 w-7 text-indigo-600" />
          Group Approval Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track group-based voting progress, quorum status, and SLA health across all active approvals</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{counts.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><Clock className="h-3 w-3" /> Active workflows</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{counts.overdue}</div>
          <div className="text-sm text-gray-500">SLA Overdue</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-400"><AlertTriangle className="h-3 w-3" /> Need escalation</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{counts.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><CheckCircle2 className="h-3 w-3" /> All steps approved</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-700">{counts.rejected}</div>
          <div className="text-sm text-gray-500">Rejected</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400"><XCircle className="h-3 w-3" /> Sent back to draft</div>
        </div>
      </div>

      {/* Group summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Core Team', type: 'QUORUM', quorum: 2, total: 3, pending: 1, sla: 48 },
          { name: 'CFO Group', type: 'ANY', quorum: null, total: 1, pending: 1, sla: 72 },
          { name: 'Division Head', type: 'ALL', quorum: null, total: 1, pending: 0, sla: 36 },
        ].map(g => (
          <div key={g.name} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-gray-800 text-sm">{g.name}</div>
                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${g.type === 'ANY' ? 'bg-green-100 text-green-700' : g.type === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{g.type}</span>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>{g.sla}h SLA</div>
                <div>{g.total} member{g.total !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: g.total }).map((_, i) => (
                <div key={i} className={`h-2.5 flex-1 rounded-full ${i < (g.total - g.pending) ? 'bg-green-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="text-xs text-gray-500">{g.total - g.pending}/{g.type === 'ANY' ? 1 : g.quorum ?? g.total} votes received</div>
          </div>
        ))}
      </div>

      {/* Filter + instances */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f.key ? 'bg-white shadow-sm ' + f.color : 'text-gray-500 hover:text-gray-700'}`}>
              {f.label} <span className="ml-1 text-xs opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No instances found</div>
        ) : (
          filtered.map(inst => <InstanceCard key={inst.id} inst={inst} />)
        )}
      </div>
    </div>
  );
}
