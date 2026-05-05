import { useState } from 'react';
import { Users, Plus, Trash2, Pencil, ChevronDown, ChevronRight, Shield, Workflow, Clock, AlertTriangle, CheckCircle2, X, Save, ArrowUpDown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ApprovalType = 'ANY' | 'ALL' | 'QUORUM';

interface GroupMember {
  id: string;
  userId: string;
  title: string;
  orgRole: string;
  addedAt: string;
}

interface ApprovalGroup {
  id: string;
  name: string;
  description: string;
  approvalType: ApprovalType;
  quorumCount: number | null;
  slaHours: number;
  isActive: boolean;
  members: GroupMember[];
  stepCount: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  stepOrder: number;
  groupId: string;
  groupName?: string;
  onApproveStatus: string;
  onRejectStatus: string;
  onApproveNextStep: string | null;
  slaHours: number;
  escalateAfterHours: number | null;
  escalateToGroupId: string | null;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_GROUPS: ApprovalGroup[] = [
  {
    id: 'grp-core', name: 'Core Team', description: 'Technical + administrative review before CFO escalation',
    approvalType: 'QUORUM', quorumCount: 2, slaHours: 48, isActive: true, stepCount: 1,
    members: [
      { id: 'm1', userId: 'dev-division_admin-id', title: 'Division Head', orgRole: 'division_admin', addedAt: '2025-01-15' },
      { id: 'm2', userId: 'dev-project_manager-id', title: 'Senior Engineer', orgRole: 'project_manager', addedAt: '2025-01-15' },
      { id: 'm3', userId: 'dev-member-id', title: 'Finance Officer', orgRole: 'member', addedAt: '2025-01-16' },
    ],
  },
  {
    id: 'grp-cfo', name: 'CFO Group', description: 'Financial sanction — any one CFO-level executive can approve',
    approvalType: 'ANY', quorumCount: null, slaHours: 72, isActive: true, stepCount: 1,
    members: [
      { id: 'm4', userId: 'dev-executive-id', title: 'CFO', orgRole: 'executive', addedAt: '2025-01-15' },
    ],
  },
  {
    id: 'grp-divhead', name: 'Division Head', description: 'Unanimous divisional approval required',
    approvalType: 'ALL', quorumCount: null, slaHours: 36, isActive: true, stepCount: 0,
    members: [
      { id: 'm5', userId: 'dev-division_admin-id', title: 'Division Head — Infrastructure', orgRole: 'division_admin', addedAt: '2025-01-15' },
    ],
  },
];

const MOCK_STEPS: WorkflowStep[] = [
  { id: 'step-1', name: 'Core Team Review', stepOrder: 1, groupId: 'grp-core', groupName: 'Core Team', onApproveStatus: 'PENDING_CFO_APPROVAL', onRejectStatus: 'DRAFT', onApproveNextStep: 'step-2', slaHours: 48, escalateAfterHours: 60, escalateToGroupId: null },
  { id: 'step-2', name: 'CFO Final Approval', stepOrder: 2, groupId: 'grp-cfo', groupName: 'CFO Group', onApproveStatus: 'ACTIVE', onRejectStatus: 'REJECTED', onApproveNextStep: null, slaHours: 72, escalateAfterHours: 84, escalateToGroupId: 'grp-divhead' },
];

const AVAILABLE_USERS = [
  { userId: 'dev-org_admin-id', name: 'Priyanka Bansal', orgRole: 'org_admin', title: 'Org Administrator' },
  { userId: 'dev-division_admin-id', name: 'Rajesh Kumar', orgRole: 'division_admin', title: 'Division Head' },
  { userId: 'dev-project_manager-id', name: 'Anita Sharma', orgRole: 'project_manager', title: 'Senior Engineer' },
  { userId: 'dev-member-id', name: 'Vikram Singh', orgRole: 'member', title: 'Finance Officer' },
  { userId: 'dev-executive-id', name: 'Sunita Rao', orgRole: 'executive', title: 'CFO' },
];

const APPROVAL_STATUSES = ['DRAFT', 'PENDING_CORE_REVIEW', 'CORE_APPROVED', 'PENDING_CFO_APPROVAL', 'APPROVED', 'ACTIVE', 'REJECTED'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ type, label }: { type: ApprovalType; label: string }) {
  const colors: Record<ApprovalType, string> = {
    ANY: 'bg-green-100 text-green-700',
    ALL: 'bg-blue-100 text-blue-700',
    QUORUM: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[type]}`}>{label}</span>;
}

// ── Group Form Modal ───────────────────────────────────────────────────────────

function GroupFormModal({ group, onSave, onClose }: {
  group?: Partial<ApprovalGroup>;
  onSave: (g: Partial<ApprovalGroup>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: group?.name ?? '',
    description: group?.description ?? '',
    approvalType: group?.approvalType ?? 'ANY' as ApprovalType,
    quorumCount: group?.quorumCount ?? 2,
    slaHours: group?.slaHours ?? 48,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">{group?.id ? 'Edit Group' : 'New Approval Group'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. CFO Group" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this group review?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Approval Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ANY', 'ALL', 'QUORUM'] as ApprovalType[]).map(t => (
                <button key={t} onClick={() => set('approvalType', t)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${form.approvalType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="font-bold">{t}</div>
                  <div className="text-xs font-normal text-gray-500 mt-0.5">
                    {t === 'ANY' ? 'Any 1 member' : t === 'ALL' ? 'All must approve' : 'Configurable count'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          {form.approvalType === 'QUORUM' && (
            <div>
              <label className="block text-sm font-medium mb-1">Quorum Count (minimum approvals needed)</label>
              <input type="number" min={1} className="w-32 border rounded-lg px-3 py-2 text-sm" value={form.quorumCount} onChange={e => set('quorumCount', parseInt(e.target.value) || 1)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">SLA Hours (decision deadline)</label>
            <div className="flex items-center gap-2">
              <input type="number" min={1} className="w-32 border rounded-lg px-3 py-2 text-sm" value={form.slaHours} onChange={e => set('slaHours', parseInt(e.target.value) || 24)} />
              <span className="text-sm text-gray-500">hours</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={() => { if (form.name) onSave(form); }} disabled={!form.name}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Group
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Member Modal ───────────────────────────────────────────────────────────

function AddMemberModal({ group, existingUserIds, onAdd, onClose }: {
  group: ApprovalGroup;
  existingUserIds: string[];
  onAdd: (userId: string, title: string, orgRole: string) => void;
  onClose: () => void;
}) {
  const available = AVAILABLE_USERS.filter(u => !existingUserIds.includes(u.userId));
  const [selected, setSelected] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');

  const user = AVAILABLE_USERS.find(u => u.userId === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Add Member to {group.name}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {available.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">All available users are already members.</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Select User</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={selected} onChange={e => { setSelected(e.target.value); setCustomTitle(AVAILABLE_USERS.find(u => u.userId === e.target.value)?.title || ''); }}>
                  <option value="">— choose —</option>
                  {available.map(u => <option key={u.userId} value={u.userId}>{u.name} ({u.orgRole})</option>)}
                </select>
              </div>
              {selected && (
                <div>
                  <label className="block text-sm font-medium mb-1">Role Title in this Group</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={user?.title} />
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={() => { if (selected && user) onAdd(selected, customTitle || user.title, user.orgRole); }}
            disabled={!selected}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step Form Modal ───────────────────────────────────────────────────────────

function StepFormModal({ step, groups, allSteps, onSave, onClose }: {
  step?: Partial<WorkflowStep>;
  groups: ApprovalGroup[];
  allSteps: WorkflowStep[];
  onSave: (s: Partial<WorkflowStep>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: step?.id ?? '',
    name: step?.name ?? '',
    stepOrder: step?.stepOrder ?? (allSteps.length + 1),
    groupId: step?.groupId ?? '',
    onApproveStatus: step?.onApproveStatus ?? 'APPROVED',
    onRejectStatus: step?.onRejectStatus ?? 'DRAFT',
    onApproveNextStep: step?.onApproveNextStep ?? '',
    slaHours: step?.slaHours ?? 48,
    escalateAfterHours: step?.escalateAfterHours ?? '',
    escalateToGroupId: step?.escalateToGroupId ?? '',
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const otherSteps = allSteps.filter(s => s.id !== form.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{form.id ? 'Edit Step' : 'New Workflow Step'}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Step Name *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. CFO Final Approval" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Step Order</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.stepOrder} onChange={e => set('stepOrder', parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SLA Hours</label>
              <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm" value={form.slaHours} onChange={e => set('slaHours', parseInt(e.target.value) || 48)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assigned Group *</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.groupId} onChange={e => set('groupId', e.target.value)}>
              <option value="">— select group —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.approvalType})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">On Approve → Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.onApproveStatus} onChange={e => set('onApproveStatus', e.target.value)}>
                {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">On Reject → Status</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.onRejectStatus} onChange={e => set('onRejectStatus', e.target.value)}>
                {APPROVAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">On Approve → Next Step</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.onApproveNextStep} onChange={e => set('onApproveNextStep', e.target.value)}>
              <option value="">(Final step — no next step)</option>
              {otherSteps.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-gray-700">Escalation (optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Escalate after (hours)</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.escalateAfterHours} onChange={e => set('escalateAfterHours', e.target.value)} placeholder="e.g. 60" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Escalate to Group</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.escalateToGroupId} onChange={e => set('escalateToGroupId', e.target.value)}>
                  <option value="">(none)</option>
                  {groups.filter(g => g.id !== form.groupId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-gray-50 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={() => { if (form.name && form.groupId) onSave({ ...form, escalateAfterHours: form.escalateAfterHours !== '' ? Number(form.escalateAfterHours) : null, escalateToGroupId: form.escalateToGroupId || null, onApproveNextStep: form.onApproveNextStep || null }); }} disabled={!form.name || !form.groupId}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Step
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Groups Tab ────────────────────────────────────────────────────────────────

function GroupsTab() {
  const [groups, setGroups] = useState<ApprovalGroup[]>(MOCK_GROUPS);
  const [expanded, setExpanded] = useState<string | null>('grp-core');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApprovalGroup | null>(null);
  const [addMemberFor, setAddMemberFor] = useState<ApprovalGroup | null>(null);

  const saveGroup = (data: Partial<ApprovalGroup>) => {
    if (editingGroup) {
      setGroups(gs => gs.map(g => g.id === editingGroup.id ? { ...g, ...data } : g));
    } else {
      const newGroup: ApprovalGroup = { id: `grp-${Date.now()}`, members: [], stepCount: 0, isActive: true, ...data } as ApprovalGroup;
      setGroups(gs => [...gs, newGroup]);
    }
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const deleteGroup = (id: string) => {
    const g = groups.find(gr => gr.id === id);
    if (g?.stepCount) { alert('Cannot delete: this group is assigned to active workflow steps.'); return; }
    if (confirm('Delete this group?')) setGroups(gs => gs.filter(g => g.id !== id));
  };

  const removeMember = (groupId: string, memberId: string) => {
    setGroups(gs => gs.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g));
  };

  const addMember = (groupId: string, userId: string, title: string, orgRole: string) => {
    const member: GroupMember = { id: `m-${Date.now()}`, userId, title, orgRole, addedAt: new Date().toISOString().slice(0, 10) };
    setGroups(gs => gs.map(g => g.id === groupId ? { ...g, members: [...g.members, member] } : g));
    setAddMemberFor(null);
  };

  const typeInfo: Record<ApprovalType, { color: string; desc: string }> = {
    ANY: { color: 'text-green-600', desc: 'Any 1 member can approve' },
    ALL: { color: 'text-blue-600', desc: 'All members must approve' },
    QUORUM: { color: 'text-purple-600', desc: 'Configurable quorum count' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{groups.length} approval group{groups.length !== 1 ? 's' : ''} configured</p>
        <button onClick={() => { setEditingGroup(null); setShowGroupModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New Group
        </button>
      </div>

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
              <div className="flex items-center gap-3">
                {expanded === g.id ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{g.name}</span>
                    <Badge type={g.approvalType} label={g.approvalType} />
                    {g.approvalType === 'QUORUM' && <span className="text-xs text-purple-600 font-medium">({g.quorumCount} needed)</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mr-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500">{g.members.length} members</div>
                  <div className="text-xs text-gray-400">{g.slaHours}h SLA · {g.stepCount} step{g.stepCount !== 1 ? 's' : ''}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); setEditingGroup(g); setShowGroupModal(true); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteGroup(g.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {expanded === g.id && (
              <div className="border-t bg-gray-50 p-4 space-y-4">
                {/* Approval logic info */}
                <div className={`flex items-start gap-2 p-3 rounded-lg bg-white border text-sm ${typeInfo[g.approvalType].color}`}>
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">{g.approvalType} logic: </span>
                    {typeInfo[g.approvalType].desc}
                    {g.approvalType === 'QUORUM' && <span> — at least <strong>{g.quorumCount}</strong> of {g.members.length} members must approve.</span>}
                    {g.approvalType === 'ANY' && <span> — first approval resolves the step immediately.</span>}
                    {g.approvalType === 'ALL' && <span> — any rejection immediately rejects the step.</span>}
                  </div>
                </div>

                {/* Members list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Members ({g.members.length})</h4>
                    <button onClick={() => setAddMemberFor(g)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-white text-blue-600 border-blue-200">
                      <Plus className="h-3 w-3" /> Add Member
                    </button>
                  </div>
                  {g.members.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No members yet. Add members to make this group functional.</p>
                  ) : (
                    <div className="space-y-2">
                      {g.members.map(m => {
                        const user = AVAILABLE_USERS.find(u => u.userId === m.userId);
                        return (
                          <div key={m.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {(user?.name || m.title).charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{user?.name || m.userId}</div>
                                <div className="text-xs text-gray-500">{m.title} · <span className="font-mono text-gray-400">{m.orgRole}</span></div>
                              </div>
                            </div>
                            <button onClick={() => removeMember(g.id, m.id)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showGroupModal && (
        <GroupFormModal
          group={editingGroup ?? undefined}
          onSave={saveGroup}
          onClose={() => { setShowGroupModal(false); setEditingGroup(null); }}
        />
      )}

      {addMemberFor && (
        <AddMemberModal
          group={addMemberFor}
          existingUserIds={addMemberFor.members.map(m => m.userId)}
          onAdd={(userId, title, orgRole) => addMember(addMemberFor.id, userId, title, orgRole)}
          onClose={() => setAddMemberFor(null)}
        />
      )}
    </div>
  );
}

// ── Workflow Steps Tab ────────────────────────────────────────────────────────

function WorkflowStepsTab({ groups }: { groups: ApprovalGroup[] }) {
  const [steps, setSteps] = useState<WorkflowStep[]>(MOCK_STEPS);
  const [showModal, setShowModal] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  const saveStep = (data: Partial<WorkflowStep>) => {
    if (editingStep) {
      setSteps(ss => ss.map(s => s.id === editingStep.id ? { ...s, ...data, groupName: groups.find(g => g.id === data.groupId)?.name } : s));
    } else {
      const newStep: WorkflowStep = { id: `step-${Date.now()}`, groupName: groups.find(g => g.id === data.groupId)?.name, ...data } as WorkflowStep;
      setSteps(ss => [...ss, newStep].sort((a, b) => a.stepOrder - b.stepOrder));
    }
    setShowModal(false);
    setEditingStep(null);
  };

  const deleteStep = (id: string) => {
    if (confirm('Delete this workflow step? This may break existing instances.')) setSteps(ss => ss.filter(s => s.id !== id));
  };

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Pipeline: {sorted.length} step{sorted.length !== 1 ? 's' : ''} in sequence</p>
        <button onClick={() => { setEditingStep(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Step
        </button>
      </div>

      {/* Visual pipeline */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-4">Approval Pipeline</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {sorted.map((s, i) => {
            const group = groups.find(g => g.id === s.groupId);
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="bg-white border-2 border-blue-200 rounded-lg px-3 py-2 text-sm shadow-sm">
                  <div className="font-semibold text-gray-800 text-xs">{s.stepOrder}. {s.name}</div>
                  <div className="text-xs text-blue-600 mt-0.5">{group?.name || s.groupId}</div>
                  {group && <Badge type={group.approvalType} label={group.approvalType} />}
                </div>
                {i < sorted.length - 1 && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="h-px w-6 bg-gray-300" />
                    <span className="text-xs">→</span>
                    <div className="h-px w-6 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && <span className="text-sm text-gray-400">No steps configured yet</span>}
          {sorted.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-gray-400">
                <div className="h-px w-6 bg-gray-300" />
                <span className="text-xs">→</span>
              </div>
              <div className="bg-green-100 border-2 border-green-300 rounded-lg px-3 py-2 text-xs font-semibold text-green-700">
                ✓ ACTIVE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps table */}
      <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Step Name</th>
              <th className="px-4 py-3 text-left">Assigned Group</th>
              <th className="px-4 py-3 text-left">On Approve</th>
              <th className="px-4 py-3 text-left">On Reject</th>
              <th className="px-4 py-3 text-left">SLA</th>
              <th className="px-4 py-3 text-left">Escalation</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map(s => {
              const group = groups.find(g => g.id === s.groupId);
              const escalateGroup = groups.find(g => g.id === s.escalateToGroupId);
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{s.stepOrder}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{group?.name || s.groupId}</div>
                    {group && <Badge type={group.approvalType} label={group.approvalType} />}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">{s.onApproveStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">{s.onRejectStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.slaHours}h</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.escalateAfterHours ? `After ${s.escalateAfterHours}h → ${escalateGroup?.name || 'n/a'}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditingStep(s); setShowModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteStep(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No workflow steps configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <StepFormModal
          step={editingStep ?? undefined}
          groups={groups}
          allSteps={steps}
          onSave={saveStep}
          onClose={() => { setShowModal(false); setEditingStep(null); }}
        />
      )}
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────────────────

const MOCK_AUDIT = [
  { id: 'a1', action: 'GROUP_CREATED', actorId: 'dev-org_admin-id', comment: 'Group "Core Team" created', meta: { approvalType: 'QUORUM' }, at: '2025-01-15T09:00:00Z', groupId: 'grp-core' },
  { id: 'a2', action: 'MEMBER_ADDED', actorId: 'dev-org_admin-id', comment: null, meta: { userId: 'dev-division_admin-id', title: 'Division Head' }, at: '2025-01-15T09:05:00Z', groupId: 'grp-core' },
  { id: 'a3', action: 'GROUP_CREATED', actorId: 'dev-org_admin-id', comment: 'Group "CFO Group" created', meta: { approvalType: 'ANY' }, at: '2025-01-15T09:10:00Z', groupId: 'grp-cfo' },
  { id: 'a4', action: 'STEP_UPSERTED', actorId: 'dev-org_admin-id', comment: null, meta: { name: 'Core Team Review', stepOrder: 1 }, at: '2025-01-15T09:20:00Z', groupId: 'grp-core' },
  { id: 'a5', action: 'GROUP_UPDATED', actorId: 'dev-org_admin-id', comment: null, meta: { slaHours: 48 }, at: '2025-01-16T14:30:00Z', groupId: 'grp-core' },
];

function AuditTab() {
  const actionColor: Record<string, string> = {
    GROUP_CREATED: 'bg-green-100 text-green-700',
    GROUP_UPDATED: 'bg-blue-100 text-blue-700',
    GROUP_DELETED: 'bg-red-100 text-red-700',
    MEMBER_ADDED: 'bg-purple-100 text-purple-700',
    MEMBER_REMOVED: 'bg-orange-100 text-orange-700',
    STEP_UPSERTED: 'bg-indigo-100 text-indigo-700',
    STEP_DELETED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Configuration changes made by administrators</p>
      {MOCK_AUDIT.map(a => {
        const user = AVAILABLE_USERS.find(u => u.userId === a.actorId);
        return (
          <div key={a.id} className="flex items-start gap-3 bg-white border rounded-xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
              {(user?.name || a.actorId).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{user?.name || a.actorId}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColor[a.action] || 'bg-gray-100 text-gray-600'}`}>{a.action}</span>
                {a.comment && <span className="text-sm text-gray-600">{a.comment}</span>}
              </div>
              {a.meta && (
                <div className="mt-1 text-xs text-gray-400 font-mono">{JSON.stringify(a.meta)}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">{new Date(a.at).toLocaleString('en-IN')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ApprovalGroupsPage() {
  const [tab, setTab] = useState<'groups' | 'steps' | 'audit'>('groups');
  const [groups] = useState<ApprovalGroup[]>(MOCK_GROUPS);

  const tabs = [
    { key: 'groups' as const, label: 'Approval Groups', icon: Users },
    { key: 'steps' as const, label: 'Workflow Steps', icon: Workflow },
    { key: 'audit' as const, label: 'Config Audit', icon: Clock },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-600" />
            Approval Group Configuration
          </h1>
          <p className="text-gray-500 text-sm mt-1">Org Admin · Configure groups, approval logic, and workflow pipeline</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Workflow Active</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{MOCK_GROUPS.length}</div>
          <div className="text-sm text-gray-500 mt-0.5">Approval Groups</div>
          <div className="text-xs text-gray-400 mt-1">{MOCK_GROUPS.reduce((n, g) => n + g.members.length, 0)} total members</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-indigo-600">{MOCK_STEPS.length}</div>
          <div className="text-sm text-gray-500 mt-0.5">Workflow Steps</div>
          <div className="text-xs text-gray-400 mt-1">2-step approval pipeline</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">3</div>
          <div className="text-sm text-gray-500 mt-0.5">Approval Types</div>
          <div className="text-xs text-gray-400 mt-1">ANY · ALL · QUORUM</div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
        <span>Changes to groups and steps take effect immediately for new workflow instances. Existing instances continue on the configuration at their start time.</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'groups' && <GroupsTab />}
      {tab === 'steps' && <WorkflowStepsTab groups={groups} />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}
