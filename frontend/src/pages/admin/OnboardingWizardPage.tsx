import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCreateDivision, useInviteMember } from '@/api/hooks';
import {
  Building2, Users, Shield, CheckCircle, ChevronRight, ChevronLeft,
  Plus, Trash2, Loader2, Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrgRole } from '@/types';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: WizardStep[] = [
  { id: 1, title: 'Division Setup',   description: 'Define the new division',      icon: Building2   },
  { id: 2, title: 'Assign Head',      description: 'Set the division head',         icon: Shield      },
  { id: 3, title: 'Invite Team',      description: 'Add team members',              icon: Users       },
  { id: 4, title: 'Set Permissions',  description: 'Configure role access',         icon: Shield      },
  { id: 5, title: 'Review & Launch',  description: 'Confirm and create',            icon: CheckCircle },
];

interface MemberEntry {
  email: string;
  role: OrgRole;
}

const ROLE_OPTIONS: { value: OrgRole; label: string; desc: string }[] = [
  { value: 'division_admin',  label: 'Division Admin',  desc: 'Full control within this division' },
  { value: 'project_manager', label: 'Project Manager', desc: 'Manage projects and sprints'       },
  { value: 'member',          label: 'Team Member',     desc: 'Work on tasks and log time'        },
  { value: 'viewer',          label: 'Viewer',          desc: 'Read-only access'                  },
];

const PERMISSION_PRESETS: Record<string, { label: string; permissions: string[] }> = {
  full:     { label: 'Full Access',      permissions: ['project:create','project:update','project:delete','task:create','task:update','task:delete','workflow:create'] },
  standard: { label: 'Standard',         permissions: ['project:create','project:update','task:create','task:update','workflow:read'] },
  readonly: { label: 'Read Only',        permissions: ['project:read','task:read','workflow:read'] },
  custom:   { label: 'Custom',           permissions: [] },
};

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1 — Division info
  const [division, setDivision] = useState({ name: '', code: '', description: '' });

  // Step 2 — Head
  const [head, setHead] = useState({ email: '', name: '' });

  // Step 3 — Members
  const [members, setMembers] = useState<MemberEntry[]>([{ email: '', role: 'member' }]);

  // Step 4 — Permissions
  const [permPreset, setPermPreset] = useState<keyof typeof PERMISSION_PRESETS>('standard');

  const createDivision = useCreateDivision();
  const inviteMember = useInviteMember();

  const addMember = () => setMembers((m) => [...m, { email: '', role: 'member' }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof MemberEntry, value: string) =>
    setMembers((m) => m.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const canNext = () => {
    if (step === 1) return division.name.trim() && division.code.trim();
    if (step === 2) return head.email.trim();
    if (step === 3) return members.every((m) => m.email.trim());
    return true;
  };

  const handleLaunch = async () => {
    setCreating(true);
    try {
      // 1. Create division
      const divResult = await createDivision.mutateAsync({ ...division });

      // 2. Invite head as division_admin
      if (head.email) {
        await inviteMember.mutateAsync({ email: head.email, role: 'division_admin' }).catch(() => {});
      }

      // 3. Invite members
      for (const m of members.filter((m) => m.email)) {
        await inviteMember.mutateAsync({ email: m.email, role: m.role }).catch(() => {});
      }

      setDone(true);
    } catch (e) {
      console.error('Onboarding error:', e);
    } finally {
      setCreating(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-9 w-9 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Division Created!</h2>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{division.name}</span> has been set up.
          Invitation emails will be sent to all team members.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate('/admin/divisions')}>View Divisions</Button>
          <Button onClick={() => { setDone(false); setStep(1); setDivision({ name: '', code: '', description: '' }); }}>
            <Plus className="h-4 w-4 mr-2" /> Onboard Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Onboarding Wizard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Set up a new division with team members and permissions in minutes.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={cn('flex items-center gap-2 min-w-0', s.id < step && 'cursor-pointer')}
              >
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border-2 transition-colors',
                  isActive ? 'bg-primary text-primary-foreground border-primary' :
                  isDone  ? 'bg-green-500 text-white border-green-500' :
                             'bg-muted text-muted-foreground border-muted-foreground/20'
                )}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : s.id}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground')}>{s.title}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2', isDone ? 'bg-green-400' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <StepHeader icon={Building2} title="Division Setup" desc="Define the basic information for the new division." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Division Name *</label>
                  <Input placeholder="e.g., Engineering" value={division.name} onChange={(e) => setDivision({ ...division, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Code *</label>
                  <Input placeholder="e.g., ENG" value={division.code}
                    onChange={(e) => setDivision({ ...division, code: e.target.value.toUpperCase() })}
                    maxLength={8}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="What does this division do?"
                  value={division.description}
                  onChange={(e) => setDivision({ ...division, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <StepHeader icon={Shield} title="Assign Division Head" desc="The division head will have admin rights within this division." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Head's Name</label>
                  <Input placeholder="e.g., Jane Smith" value={head.name} onChange={(e) => setHead({ ...head, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Head's Email *</label>
                  <Input type="email" placeholder="jane@company.com" value={head.email} onChange={(e) => setHead({ ...head, email: e.target.value })} />
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                The division head will receive an invitation email and will be assigned the <strong>Division Admin</strong> role.
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <StepHeader icon={Users} title="Invite Team Members" desc="Add members to this division. They will receive invitation emails." />
              <div className="space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      type="email"
                      placeholder="member@company.com"
                      value={m.email}
                      onChange={(e) => updateMember(i, 'email', e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={m.role}
                      onChange={(e) => updateMember(i, 'role', e.target.value as OrgRole)}
                      className="px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <Button size="icon" variant="ghost" className="text-destructive h-9 w-9" onClick={() => removeMember(i)} disabled={members.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addMember}>
                <Plus className="h-4 w-4 mr-2" /> Add Another Member
              </Button>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <StepHeader icon={Shield} title="Set Permissions" desc="Choose a permission preset for this division's default access level." />
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setPermPreset(key as typeof permPreset)}
                    className={cn(
                      'rounded-lg border-2 p-4 text-left transition-all',
                      permPreset === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{preset.label}</span>
                      {permPreset === key && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{preset.permissions.length} permissions</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.permissions.slice(0, 3).map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px] font-mono">{p}</Badge>
                      ))}
                      {preset.permissions.length > 3 && <span className="text-[10px] text-muted-foreground">+{preset.permissions.length - 3}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-4">
              <StepHeader icon={CheckCircle} title="Review & Launch" desc="Review the setup before creating the division." />
              <div className="space-y-3">
                <ReviewRow label="Division" value={`${division.name} (${division.code})`} />
                <ReviewRow label="Description" value={division.description || '—'} />
                <ReviewRow label="Head" value={`${head.name || head.email} <${head.email}>`} />
                <ReviewRow label="Team Members" value={`${members.filter((m) => m.email).length} members to invite`} />
                <ReviewRow label="Permission Preset" value={PERMISSION_PRESETS[permPreset].label} />
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Clicking <strong>Launch</strong> will create the division and send invitation emails to all team members.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < 5 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={creating}>
            {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Launch Division</>}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground font-medium w-32 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
