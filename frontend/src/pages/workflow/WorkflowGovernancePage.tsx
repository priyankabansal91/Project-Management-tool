import { useState } from 'react';
import {
  Shield, AlertTriangle, Clock, Check, X, ChevronDown, ChevronUp,
  Users, Settings, GitBranch, Bell, Save, Plus, Trash2,
  Lock, Unlock, History, FileWarning,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// ── mock data ─────────────────────────────────────────────────────────────────

const OVERRIDE_HISTORY = [
  {
    id: 'ov-001', projectKey: 'RD-009', projectName: 'Road Repair NH-47 Bypass',
    overriddenBy: 'Alice Admin', overrideRole: 'Org Admin',
    fromStatus: 'ON_HOLD', toStatus: 'ACTIVE',
    justification: 'Flood emergency — road required for relief vehicles. Government directive received. Restarting immediately.',
    at: new Date(Date.now() - 3 * 86400000).toISOString(), emergency: true,
  },
  {
    id: 'ov-002', projectKey: 'SCH-002', projectName: 'School Boundary Wall Construction',
    overriddenBy: 'Alice Admin', overrideRole: 'Org Admin',
    fromStatus: 'ACTIVE', toStatus: 'DRAFT',
    justification: 'Submitted in error — wrong project scope attached. Returned to draft for correction before re-submission.',
    at: new Date(Date.now() - 12 * 86400000).toISOString(), emergency: false,
  },
];

const ESCALATION_CHAIN = [
  { step: 'Timesheet Approval', primary: 'Project Manager', escalateTo: 'Division Admin', afterHours: 48 },
  { step: 'Project Milestone Approval', primary: 'Division Admin', escalateTo: 'Org Admin', afterHours: 72 },
];

const ACTIVE_DELEGATES = [
  {
    id: 'del-001', from: 'Ravi Sharma', fromRole: 'Division Admin',
    to: 'Sunita Rao', toRole: 'Division Admin',
    reason: 'On annual leave 5–12 May 2026',
    expires: new Date(Date.now() + 7 * 86400000).toISOString(),
    active: true,
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function relDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtExpiry(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  return `Expires in ${days}d`;
}

// ── Override Modal ────────────────────────────────────────────────────────────

function OverrideModal({ onClose }: { onClose: () => void }) {
  const [projectKey, setProjectKey] = useState('');
  const [targetStatus, setTargetStatus] = useState('ACTIVE');
  const [justification, setJustification] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const statuses = ['DRAFT', 'ACTIVE', 'ON_HOLD', 'REJECTED', 'CLOSED'];

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md p-8 z-10 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
            <Check className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Override Applied</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Status change logged to immutable audit trail. All relevant stakeholders notified.
          </p>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <Shield className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="font-semibold text-base">Admin Override</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          This action bypasses the normal approval workflow. Every override is permanently recorded in the audit trail with your identity, justification, and timestamp. Use only in genuine emergencies.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Project Key</label>
            <input
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="e.g. HWY-002"
              className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Force Status To</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Justification (required — minimum 50 characters)</label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Document the specific circumstance requiring override, verbal approvals obtained, and follow-up actions planned..."
              className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-2 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">{justification.length}/50 min characters</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="rounded" />
            <span className="text-sm">Mark as Emergency Override</span>
            <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">Flags for compliance review</Badge>
          </label>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
          <p className="font-semibold flex items-center gap-1.5 mb-1"><FileWarning className="h-3.5 w-3.5" /> Compliance Notice</p>
          <p>All overrides are subject to the QCI Governance Audit. Emergency overrides trigger a mandatory compliance review within 72 hours. All relevant stakeholders will be immediately notified.</p>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!projectKey.trim() || justification.length < 50}
            onClick={() => setConfirmed(true)}
          >
            Apply Override
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── SLA Policy Editor ─────────────────────────────────────────────────────────

function SlaPolicySection() {
  const [policies, setPolicies] = useState([
    { step: 'Timesheet Approval', warnHours: 36, escalateHours: 48, autoEscalate: true },
    { step: 'Milestone Approval', warnHours: 48, escalateHours: 72, autoEscalate: true },
    { step: 'Project Closure Review', warnHours: 72, escalateHours: 96, autoEscalate: true },
  ]);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> SLA Policy Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {policies.map((p, i) => (
          <div key={p.step} className="rounded-xl border p-4 space-y-3">
            <p className="text-sm font-semibold">{p.step}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Warn after (hours)</label>
                <input
                  type="number"
                  value={p.warnHours}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i] = { ...p, warnHours: Number(e.target.value) };
                    setPolicies(updated);
                    setSaved(false);
                  }}
                  className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Escalate after (hours)</label>
                <input
                  type="number"
                  value={p.escalateHours}
                  onChange={(e) => {
                    const updated = [...policies];
                    updated[i] = { ...p, escalateHours: Number(e.target.value) };
                    setPolicies(updated);
                    setSaved(false);
                  }}
                  className="mt-1 w-full rounded-lg border bg-background text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={p.autoEscalate}
                onChange={(e) => {
                  const updated = [...policies];
                  updated[i] = { ...p, autoEscalate: e.target.checked };
                  setPolicies(updated);
                  setSaved(false);
                }}
                className="rounded"
              />
              Auto-escalate to Org Admin when threshold exceeded
            </label>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setSaved(true)} className="h-8 text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save SLA Policy
          </Button>
          {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Saved</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type GovernanceTab = 'overview' | 'sla' | 'delegates' | 'overrides' | 'escalation';

export function WorkflowGovernancePage() {
  const { currentRole } = useAuthStore();
  const [tab, setTab] = useState<GovernanceTab>('overview');
  const [showOverride, setShowOverride] = useState(false);
  const isAdmin = currentRole === 'org_admin';

  const tabs: { key: GovernanceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: Shield },
    { key: 'sla', label: 'SLA Policy', icon: Clock },
    { key: 'escalation', label: 'Escalation Chain', icon: GitBranch },
    { key: 'delegates', label: 'Active Delegates', icon: Users },
    { key: 'overrides', label: 'Override History', icon: History },
  ];

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {showOverride && <OverrideModal onClose={() => setShowOverride(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Workflow Governance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            SLA policies, escalation chains, delegation, and compliance controls
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowOverride(true)}
          >
            <Unlock className="h-3.5 w-3.5 mr-1.5" /> Admin Override
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-0 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Governance rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Governance Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { icon: Lock, text: 'Only Org Admin can override the approval pipeline', color: 'text-red-600' },
                { icon: Shield, text: 'All overrides require minimum 50-character justification', color: 'text-orange-600' },
                { icon: History, text: 'Audit trail is immutable — no record can be deleted', color: 'text-blue-600' },
                { icon: Bell, text: 'SLA breach triggers auto-notification to Org Admin + Division Head', color: 'text-purple-600' },
                { icon: Users, text: 'Delegations expire automatically and are logged', color: 'text-emerald-600' },
                { icon: FileWarning, text: 'Emergency overrides trigger 72h compliance review', color: 'text-amber-600' },
              ].map(({ icon: Icon, text, color }, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
                  <p className="text-muted-foreground">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Total approvals (30d)', value: '28', ok: true },
                { label: 'On-time approvals', value: '24 (86%)', ok: true },
                { label: 'Overrides this month', value: '2', ok: true },
                { label: 'Emergency overrides', value: '1 ⚠', ok: false },
                { label: 'Pending compliance reviews', value: '1', ok: false },
                { label: 'Active delegations', value: String(ACTIVE_DELEGATES.filter(d => d.active).length), ok: true },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={cn('font-semibold', ok ? 'text-foreground' : 'text-amber-600')}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Who can do what */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Action</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">PM</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Div Admin</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Executive</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Org Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { action: 'Create & manage projects',      pm: true,  div: true,  exec: false, admin: true },
                      { action: 'Approve timesheets',            pm: true,  div: true,  exec: false, admin: true },
                      { action: 'Reject / request revision',     pm: true,  div: true,  exec: false, admin: true },
                      { action: 'Approve milestone sign-off',    pm: false, div: true,  exec: true,  admin: true },
                      { action: 'Delegate approval authority',   pm: false, div: true,  exec: false, admin: true },
                      { action: 'Override workflow pipeline',    pm: false, div: false, exec: false, admin: true },
                      { action: 'Configure SLA policies',       pm: false, div: false, exec: false, admin: true },
                      { action: 'Manage users & roles',         pm: false, div: false, exec: false, admin: true },
                      { action: 'View audit trail',             pm: false, div: true,  exec: true,  admin: true },
                      { action: 'View monitoring dashboard',    pm: true,  div: true,  exec: true,  admin: true },
                    ].map(({ action, pm, div, exec, admin }) => (
                      <tr key={action}>
                        <td className="py-2 pr-4 text-foreground">{action}</td>
                        {[pm, div, exec, admin].map((allowed, j) => (
                          <td key={j} className="py-2 px-3 text-center">
                            {allowed
                              ? <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                              : <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SLA Policy ── */}
      {tab === 'sla' && <SlaPolicySection />}

      {/* ── Escalation Chain ── */}
      {tab === 'escalation' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" /> Escalation Chain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ESCALATION_CHAIN.map((ec, i) => (
              <div key={ec.step} className="rounded-xl border p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                      {i + 1}
                    </div>
                    {i < ESCALATION_CHAIN.length - 1 && <div className="w-px h-6 bg-border" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-2">{ec.step}</p>
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-blue-700 dark:text-blue-300">Primary: {ec.primary}</span>
                      </div>
                      <ArrowRight />
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                        <Bell className="h-3 w-3 text-amber-600" />
                        <span className="font-medium text-amber-700 dark:text-amber-300">After {ec.afterHours}h → {ec.escalateTo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">Final escalation: Org Admin forced-assign within 24h of escalation</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Delegates ── */}
      {tab === 'delegates' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Active Delegations
              </CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Delegation
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ACTIVE_DELEGATES.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active delegations</p>
            ) : (
              <div className="space-y-3">
                {ACTIVE_DELEGATES.map((d) => (
                  <div key={d.id} className="flex items-start gap-4 p-4 rounded-xl border bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium">{d.from}</span>
                        <Badge variant="outline" className="text-[10px]">{d.fromRole.replace('_', ' ')}</Badge>
                        <span className="text-muted-foreground text-xs">→ delegated to</span>
                        <span className="text-sm font-medium">{d.to}</span>
                        <Badge variant="outline" className="text-[10px]">{d.toRole.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic">"{d.reason}"</p>
                      <p className="text-xs mt-1">
                        <span className={cn('font-medium', new Date(d.expires) > new Date() ? 'text-emerald-600' : 'text-red-600')}>
                          {fmtExpiry(d.expires)}
                        </span>
                        {' — '}{new Date(d.expires).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200">
                        <Trash2 className="h-3 w-3 mr-1" /> Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Override History ── */}
      {tab === 'overrides' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Override History
              <Badge variant="outline" className="text-[10px]">{OVERRIDE_HISTORY.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {OVERRIDE_HISTORY.map((ov) => (
                <div key={ov.id} className={cn(
                  'rounded-xl border p-4 space-y-2',
                  ov.emergency && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{ov.projectName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{ov.projectKey}</Badge>
                        {ov.emergency && (
                          <Badge className="text-[10px] bg-red-500 text-white">EMERGENCY</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By {ov.overriddenBy} ({ov.overrideRole}) · {relDate(ov.at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
                      <Badge variant="outline" className="text-[10px]">{ov.fromStatus.replace(/_/g, ' ')}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{ov.toStatus.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground italic">
                    "{ov.justification}"
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// local arrow helper to avoid import clash
function ArrowRight() {
  return <span className="text-muted-foreground text-xs">→</span>;
}
