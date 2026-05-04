import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useCreateDivision,
  useInviteMember,
  useCreateProject,
  useWorkflows,
} from '@/api/hooks';
import { WorkflowPicker } from '@/components/shared/WorkflowPicker';
import {
  Building2, Users, FolderKanban, Shield, ClipboardList,
  CheckCircle, ChevronRight, ChevronLeft, Plus, Trash2, Loader2,
  Sparkles, ArrowRight, BarChart3, LayoutDashboard, Kanban, Star,
  UserCheck, AlertCircle, Upload, Download, Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrgRole } from '@/types';

// ─── Step definitions ──────────────────────────────────────────────────────

interface WizardStep { id: number; title: string; description: string; icon: React.ElementType }

const STEPS: WizardStep[] = [
  { id: 1, title: 'Division',     description: 'Define your division',       icon: Building2     },
  { id: 2, title: 'Team',         description: 'Invite members',             icon: Users         },
  { id: 3, title: 'Project',      description: 'Create first project',       icon: FolderKanban  },
  { id: 4, title: 'Assign Roles', description: 'Set PM & heads',             icon: Shield        },
  { id: 5, title: 'Tasks',        description: 'Seed initial tasks',         icon: ClipboardList },
  { id: 6, title: 'Launch',       description: 'Review & go live',           icon: CheckCircle   },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface MemberEntry { email: string; role: OrgRole }
interface TaskEntry   { title: string; priority: 'low' | 'medium' | 'high'; assigneeEmail: string }

const ROLE_OPTIONS: { value: OrgRole; label: string; desc: string; color: string }[] = [
  { value: 'division_admin',  label: 'Division Admin',  desc: 'Full control within division', color: 'text-purple-600' },
  { value: 'project_manager', label: 'Project Manager', desc: 'Manage projects & sprints',    color: 'text-blue-600'   },
  { value: 'member',          label: 'Team Member',     desc: 'Work on tasks & log time',     color: 'text-green-600'  },
  { value: 'viewer',          label: 'Viewer',          desc: 'Read-only access',             color: 'text-gray-500'   },
];

const COLORS = ['#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#06B6D4','#EC4899','#6366F1'];
const PRIORITY_COLORS = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-red-600' };

// ─── Main component ─────────────────────────────────────────────────────────

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [creating, setCreating] = useState(false);
  const [done, setDone]       = useState(false);
  const [launchError, setLaunchError] = useState('');
  const [createdProject, setCreatedProject] = useState<{ id: string; name: string } | null>(null);

  // Step 1 — Division
  const [division, setDivision] = useState({ name: '', code: '', description: '' });

  // Step 2 — Team members
  const [members, setMembers] = useState<MemberEntry[]>([{ email: '', role: 'project_manager' }]);
  const [csvMode, setCsvMode] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvPreview, setCsvPreview] = useState<MemberEntry[]>([]);

  // Step 3 — Project
  const [project, setProject] = useState({
    name: '', key: '', description: '', visibility: 'org_wide' as const, color: '#3B82F6',
    workflow_config_id: '',
  });

  // Step 4 — Roles
  const [pmEmail, setPmEmail]         = useState('');
  const [divHeadEmail, setDivHeadEmail] = useState('');

  // Step 5 — Tasks
  const [tasks, setTasks] = useState<TaskEntry[]>([
    { title: '', priority: 'medium', assigneeEmail: '' },
  ]);

  const createDivision = useCreateDivision();
  const inviteMember   = useInviteMember();
  const createProject  = useCreateProject();
  const { data: workflows } = useWorkflows();

  // ── helpers ──────────────────────────────────────────────────────────────

  const validEmails = members.filter((m) => m.email.trim());

  const addMember    = () => setMembers((m) => [...m, { email: '', role: 'member' }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof MemberEntry, value: string) =>
    setMembers((m) => m.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const downloadCsvTemplate = () => {
    const csv = 'email,role\nmember1@company.com,member\npm@company.com,project_manager\nhead@company.com,division_admin\nviewer@company.com,viewer\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'team-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(''); setCsvPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const header = lines[0]?.toLowerCase().replace(/\s/g, '');
      if (!header?.includes('email')) { setCsvError('CSV must have an "email" column header.'); return; }
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
        const email = parts[0] ?? '';
        const rawRole = (parts[1] ?? 'member').toLowerCase();
        const validRoles: OrgRole[] = ['division_admin', 'project_manager', 'member', 'viewer'];
        const role: OrgRole = validRoles.includes(rawRole as OrgRole) ? rawRole as OrgRole : 'member';
        return { email, role };
      }).filter((r) => r.email && r.email.includes('@'));
      if (rows.length === 0) { setCsvError('No valid rows found. Check the email column.'); return; }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const applyCSV = () => {
    setMembers(csvPreview.length > 0 ? csvPreview : [{ email: '', role: 'member' }]);
    setCsvMode(false); setCsvPreview([]); setCsvError('');
  };

  const addTask    = () => setTasks((t) => [...t, { title: '', priority: 'medium', assigneeEmail: '' }]);
  const removeTask = (i: number) => setTasks((t) => t.filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: keyof TaskEntry, value: string) =>
    setTasks((t) => t.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const canNext = () => {
    if (step === 1) return division.name.trim() && division.code.trim();
    if (step === 2) return members.some((m) => m.email.trim());
    if (step === 3) return project.name.trim() && project.key.trim();
    return true;
  };

  // auto-generate project key from name
  const handleProjectName = (name: string) => {
    const autoKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setProject((p) => ({ ...p, name, key: p.key || autoKey }));
  };

  // ── launch ───────────────────────────────────────────────────────────────

  const handleLaunch = async () => {
    setCreating(true);
    setLaunchError('');
    try {
      // 1. Create division
      await createDivision.mutateAsync(division);

      // 2. Invite all members
      const invitePromises = validEmails.map((m) =>
        inviteMember.mutateAsync({ email: m.email, role: m.role }).catch(() => null)
      );
      await Promise.all(invitePromises);

      // 3. Invite PM explicitly if not already in members list
      if (pmEmail && !validEmails.find((m) => m.email === pmEmail)) {
        await inviteMember.mutateAsync({ email: pmEmail, role: 'project_manager' }).catch(() => null);
      }

      // 4. Create project
      const wfId = project.workflow_config_id || workflows?.[0]?.id;
      const projResult = await createProject.mutateAsync({
        name: project.name,
        key: project.key.toUpperCase(),
        description: project.description,
        visibility: project.visibility,
        color: project.color,
        ...(wfId ? { workflow_config_id: wfId } : {}),
      });

      const projectId = projResult?.id as string | undefined;
      if (projectId) {
        setCreatedProject({ id: projectId, name: project.name });
      }

      setDone(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Setup failed. Please try again.';
      setLaunchError(msg);
    } finally {
      setCreating(false);
    }
  };

  // ── done screen ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        {/* Success header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
              <CheckCircle className="h-11 w-11 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">You're all set!</h2>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{division.name}</span> division,{' '}
            <span className="font-semibold text-foreground">{project.name}</span> project, and{' '}
            <span className="font-semibold text-foreground">{validEmails.length}</span> team member invitation{validEmails.length !== 1 ? 's' : ''} are ready.
          </p>
        </div>

        {/* Workflow summary */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">What happens next</h3>
            {[
              { icon: Users,        label: 'Team members receive invite emails and can join the platform' },
              { icon: FolderKanban, label: 'Your project board is ready — create sprints and assign tasks' },
              { icon: UserCheck,    label: 'Project Manager can manage workflows, sprints, and reports' },
              { icon: BarChart3,    label: 'Reports and MIS update automatically as work progresses' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick-launch links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Kanban,         label: 'Project Board',         desc: 'View & manage tasks',       onClick: () => navigate(createdProject ? `/projects/${createdProject.id}/board` : '/projects'), primary: true },
            { icon: Users,          label: 'Team Management',       desc: 'Manage members & roles',    onClick: () => navigate('/team'),              primary: false },
            { icon: BarChart3,      label: 'Reports',               desc: 'Track progress & velocity', onClick: () => navigate('/reports'),           primary: false },
            { icon: LayoutDashboard,label: 'Division MIS',          desc: 'KPIs, attendance & output', onClick: () => navigate('/admin/division-mis'),primary: false },
            { icon: Star,           label: 'Executive Dashboard',   desc: 'Portfolio-level view',      onClick: () => navigate('/executive'),         primary: false },
            { icon: Sparkles,       label: 'AI Assistant',          desc: 'Smart summaries & help',    onClick: () => navigate('/ai'),                primary: false },
          ].map(({ icon: Icon, label, desc, onClick, primary }) => (
            <button
              key={label}
              onClick={onClick}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md',
                primary ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'
              )}
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', primary ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <div>
                <p className={cn('text-sm font-semibold', primary && 'text-primary')}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { setDone(false); setStep(1); setDivision({ name: '', code: '', description: '' }); setMembers([{ email: '', role: 'project_manager' }]); setProject({ name: '', key: '', description: '', visibility: 'org_wide', color: '#3B82F6', workflow_config_id: '' }); setTasks([{ title: '', priority: 'medium', assigneeEmail: '' }]); }}>
            <Plus className="h-4 w-4 mr-2" /> Onboard Another Division
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── wizard shell ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Org Admin Setup Wizard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your division, team, project, roles, and initial tasks — all in one flow.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone   = s.id < step;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <button
                onClick={() => isDone && setStep(s.id)}
                className={cn('flex flex-col items-center gap-1', isDone && 'cursor-pointer')}
                title={s.description}
              >
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  isActive ? 'bg-primary text-primary-foreground border-primary scale-110' :
                  isDone   ? 'bg-green-500 text-white border-green-500' :
                             'bg-muted text-muted-foreground border-muted-foreground/20'
                )}>
                  {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <p className={cn('hidden sm:block text-[10px] font-medium whitespace-nowrap',
                  isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {s.title}
                </p>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1 mb-4', isDone ? 'bg-green-400' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step card */}
      <Card>
        <CardContent className="p-6 space-y-5">

          {/* ── Step 1: Division ── */}
          {step === 1 && (
            <div className="space-y-4">
              <StepHeader icon={Building2} title="Division Setup" desc="A division represents a department or business unit (e.g., Engineering, HR, Operations)." />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Division Name *</label>
                  <Input placeholder="e.g., Engineering" value={division.name}
                    onChange={(e) => setDivision({ ...division, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Short Code *</label>
                  <Input placeholder="e.g., ENG" value={division.code} maxLength={8}
                    onChange={(e) => setDivision({ ...division, code: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3} placeholder="What does this division do?"
                  value={division.description}
                  onChange={(e) => setDivision({ ...division, description: e.target.value })}
                />
              </div>
              <InfoBox>
                The division will appear in reports, MIS dashboards, and capacity planning. You can configure it further from <strong>Admin → Division Config</strong>.
              </InfoBox>
            </div>
          )}

          {/* ── Step 2: Team ── */}
          {step === 2 && (
            <div className="space-y-4">
              <StepHeader icon={Users} title="Build Your Team" desc="Invite members by email and assign their roles. They'll receive invitation links." />

              {/* Role reference */}
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <div key={r.value} className="flex items-start gap-2 rounded-lg border p-2.5">
                    <Shield className={cn('h-4 w-4 mt-0.5 flex-shrink-0', r.color)} />
                    <div>
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import toggle */}
              <div className="flex items-center gap-2 border-b pb-3">
                <button
                  onClick={() => { setCsvMode(false); setCsvPreview([]); setCsvError(''); }}
                  className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors', !csvMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >
                  Manual Entry
                </button>
                <button
                  onClick={() => setCsvMode(true)}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', csvMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >
                  <Upload className="h-3.5 w-3.5" /> Bulk Import (CSV)
                </button>
              </div>

              {/* Manual entry */}
              {!csvMode && (
                <>
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input type="email" placeholder="member@company.com" value={m.email} className="flex-1"
                          onChange={(e) => updateMember(i, 'email', e.target.value)} />
                        <select
                          value={m.role}
                          onChange={(e) => updateMember(i, 'role', e.target.value as OrgRole)}
                          className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <Button size="icon" variant="ghost" className="text-destructive h-9 w-9 flex-shrink-0"
                          onClick={() => removeMember(i)} disabled={members.length === 1}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addMember}>
                    <Plus className="h-4 w-4 mr-2" /> Add Another Member
                  </Button>
                </>
              )}

              {/* CSV import */}
              {csvMode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Upload a CSV with <code className="bg-muted px-1 rounded text-xs">email</code> and <code className="bg-muted px-1 rounded text-xs">role</code> columns.</p>
                    <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template
                    </Button>
                  </div>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl py-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group">
                    <Upload className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary mb-2" />
                    <p className="text-sm font-medium">Click to upload CSV</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Supported: email, role columns</p>
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
                  </label>

                  {csvError && (
                    <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
                      {csvError}
                    </div>
                  )}

                  {csvPreview.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{csvPreview.length} member{csvPreview.length !== 1 ? 's' : ''} found in CSV:</p>
                      <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                        {csvPreview.map((m, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-mono text-xs">{m.email}</span>
                            <Badge variant="secondary" className="text-[10px]">{ROLE_OPTIONS.find((r) => r.value === m.role)?.label}</Badge>
                          </div>
                        ))}
                      </div>
                      <Button onClick={applyCSV} className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" /> Apply {csvPreview.length} Members
                      </Button>
                    </div>
                  )}

                  {/* Third-party API note */}
                  <div className="flex items-start gap-2.5 rounded-lg border border-muted p-3 bg-muted/30">
                    <Link2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-semibold text-foreground">API / Third-Party Integration</p>
                      <p>Use the REST API <code className="bg-background px-1 rounded">POST /v1/members/invite</code> to bulk-onboard members from HRMS, Active Directory, Google Workspace, or any HR system. Supports batch payloads with email + role.</p>
                      <p className="mt-1">Coming soon: Azure AD sync, Okta SSO provisioning, Slack workspace import.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Project ── */}
          {step === 3 && (
            <div className="space-y-4">
              <StepHeader icon={FolderKanban} title="Create First Project" desc="Every project gets a Kanban board, sprint management, reports, and a Gantt chart." />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium block mb-1">Project Name *</label>
                  <Input placeholder="e.g., Customer Portal Q3" value={project.name}
                    onChange={(e) => handleProjectName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Key *</label>
                  <Input placeholder="e.g., CPQ3" value={project.key} maxLength={10}
                    onChange={(e) => setProject({ ...project, key: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2} placeholder="What is this project about?"
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Visibility</label>
                  <select
                    value={project.visibility}
                    onChange={(e) => setProject({ ...project, visibility: e.target.value as typeof project.visibility })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="private">Private</option>
                    <option value="org_wide">Organization Wide</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                {workflows && workflows.length > 0 && (
                  <div>
                    <label className="text-sm font-medium block mb-1">Workflow</label>
                    <WorkflowPicker
                      workflows={workflows}
                      value={project.workflow_config_id || workflows[0]?.id || ''}
                      onChange={(id) => setProject({ ...project, workflow_config_id: id })}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Project Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setProject({ ...project, color: c })}
                      className={cn('h-8 w-8 rounded-full border-2 transition-transform', project.color === c ? 'border-foreground scale-110' : 'border-border')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Assign Roles ── */}
          {step === 4 && (
            <div className="space-y-5">
              <StepHeader icon={Shield} title="Assign Head Roles" desc="Designate who leads this project and division. These people get elevated permissions." />

              <div className="space-y-4">
                {/* Project Manager */}
                <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Project Manager (PM)</p>
                      <p className="text-xs text-muted-foreground">Manages sprints, assigns tasks, views all reports</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1 text-muted-foreground">Select from invited members or enter email</label>
                    <select
                      value={pmEmail}
                      onChange={(e) => setPmEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Choose PM —</option>
                      {validEmails.map((m) => (
                        <option key={m.email} value={m.email}>{m.email}</option>
                      ))}
                      <option value="__custom__">Enter a different email...</option>
                    </select>
                    {pmEmail === '__custom__' && (
                      <Input className="mt-2" type="email" placeholder="pm@company.com"
                        onChange={(e) => setPmEmail(e.target.value)} />
                    )}
                  </div>
                </div>

                {/* Division Head */}
                <div className="rounded-xl border-2 border-purple-200 dark:border-purple-900 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Division Head</p>
                      <p className="text-xs text-muted-foreground">Admin rights within this division, approves handoffs</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1 text-muted-foreground">Select from invited members or enter email</label>
                    <select
                      value={divHeadEmail}
                      onChange={(e) => setDivHeadEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">— Choose Division Head —</option>
                      {validEmails.map((m) => (
                        <option key={m.email} value={m.email}>{m.email}</option>
                      ))}
                      <option value="__custom__">Enter a different email...</option>
                    </select>
                    {divHeadEmail === '__custom__' && (
                      <Input className="mt-2" type="email" placeholder="head@company.com"
                        onChange={(e) => setDivHeadEmail(e.target.value)} />
                    )}
                  </div>
                </div>
              </div>

              <InfoBox icon={AlertCircle}>
                Role assignments take effect once invitees accept. You can also change roles anytime from <strong>Admin → Users</strong>.
              </InfoBox>
            </div>
          )}

          {/* ── Step 5: Tasks ── */}
          {step === 5 && (
            <div className="space-y-4">
              <StepHeader icon={ClipboardList} title="Seed Initial Tasks" desc={`Add the first tasks for ${project.name || 'your project'}. You can add more from the Kanban board.`} />

              {/* Team member capabilities info */}
              <div className="rounded-xl bg-muted/40 border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Member Capabilities</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    'View & update assigned tasks',
                    'Log time on tasks',
                    'Add comments & attachments',
                    'Mark tasks complete',
                    'Join sprint ceremonies',
                    'View personal reports',
                  ].map((cap) => (
                    <div key={cap} className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {tasks.map((t, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder={`Task ${i + 1} title...`} value={t.title} className="flex-1"
                      onChange={(e) => updateTask(i, 'title', e.target.value)} />
                    <select
                      value={t.priority}
                      onChange={(e) => updateTask(i, 'priority', e.target.value as TaskEntry['priority'])}
                      className="px-2 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select
                      value={t.assigneeEmail}
                      onChange={(e) => updateTask(i, 'assigneeEmail', e.target.value)}
                      className="px-2 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      {validEmails.map((m) => (
                        <option key={m.email} value={m.email}>{m.email.split('@')[0]}</option>
                      ))}
                    </select>
                    <Button size="icon" variant="ghost" className="text-destructive h-9 w-9 flex-shrink-0"
                      onClick={() => removeTask(i)} disabled={tasks.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
              <p className="text-xs text-muted-foreground">Tasks will be created in the project backlog. Assign to sprints from the board.</p>
            </div>
          )}

          {/* ── Step 6: Review & Launch ── */}
          {step === 6 && (
            <div className="space-y-5">
              <StepHeader icon={CheckCircle} title="Review & Launch" desc="Everything looks good? Hit Launch to create your division and project." />

              {launchError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
                  {launchError}
                </div>
              )}

              <div className="space-y-3">
                {/* Division */}
                <ReviewSection title="Division" icon={Building2} color="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600">
                  <ReviewRow label="Name" value={`${division.name} (${division.code})`} />
                  {division.description && <ReviewRow label="Description" value={division.description} />}
                </ReviewSection>

                {/* Team */}
                <ReviewSection title="Team" icon={Users} color="bg-green-100 dark:bg-green-950/40 text-green-600">
                  <ReviewRow label="Members" value={`${validEmails.length} invitation${validEmails.length !== 1 ? 's' : ''}`} />
                  {pmEmail && pmEmail !== '__custom__' && <ReviewRow label="Project Manager" value={pmEmail} />}
                  {divHeadEmail && divHeadEmail !== '__custom__' && <ReviewRow label="Division Head" value={divHeadEmail} />}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {validEmails.map((m) => (
                      <Badge key={m.email} variant="secondary" className="text-[10px]">
                        {m.email.split('@')[0]} · {ROLE_OPTIONS.find((r) => r.value === m.role)?.label}
                      </Badge>
                    ))}
                  </div>
                </ReviewSection>

                {/* Project */}
                <ReviewSection title="Project" icon={FolderKanban} color="bg-blue-100 dark:bg-blue-950/40 text-blue-600">
                  <ReviewRow label="Name" value={`${project.name} [${project.key.toUpperCase()}]`} />
                  <ReviewRow label="Visibility" value={project.visibility.replace('_', ' ')} />
                </ReviewSection>

                {/* Tasks */}
                {tasks.some((t) => t.title.trim()) && (
                  <ReviewSection title="Initial Tasks" icon={ClipboardList} color="bg-orange-100 dark:bg-orange-950/40 text-orange-600">
                    {tasks.filter((t) => t.title.trim()).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={cn('text-[10px] font-semibold uppercase', PRIORITY_COLORS[t.priority])}>{t.priority}</span>
                        <span className="flex-1">{t.title}</span>
                        {t.assigneeEmail && <span className="text-xs text-muted-foreground">{t.assigneeEmail.split('@')[0]}</span>}
                      </div>
                    ))}
                  </ReviewSection>
                )}
              </div>

              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-800 dark:text-green-300">
                <strong>Ready to launch!</strong> Clicking Launch creates the division, sends invite emails, and sets up your project board. Task creation happens after members accept invites.
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <span className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</span>

        {step < 6 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleLaunch} disabled={creating} size="lg">
            {creating
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Launching...</>
              : <><Sparkles className="h-4 w-4 mr-2" /> Launch</>}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b">
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

function InfoBox({ children, icon: Icon = AlertCircle }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-800 dark:text-blue-300">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function ReviewSection({ title, icon: Icon, color, children }: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0', color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
