import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useCreateDivision, useAddDivisionMember, useCreateVertical,
  useCreateProject, useWorkflows, useMembers,
  useDivisions, useVerticals, useProjects, useMilestones,
  useCreateMemberDirect, useInviteMember,
} from '@/api/hooks';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import type { OrgRole } from '@/types';
import {
  Building2, Network, FolderKanban, Flag, CheckSquare2,
  CheckCircle, ChevronRight, ChevronLeft, Plus, Loader2,
  Sparkles, ArrowRight, LayoutDashboard, Kanban, UserCheck,
  AlertCircle, Users, Crown, Shield, X, Upload, Download,
  UserPlus, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Step config ────────────────────────────────────────────────────────────

type StepType = 'division' | 'vertical' | 'project' | 'milestone' | 'task';

const ROLE_STEPS: Record<string, StepType[]> = {
  org_admin:       ['division', 'vertical', 'project', 'milestone', 'task'],
  hod:             ['vertical', 'project', 'milestone', 'task'],
  division_admin:  ['vertical', 'project', 'milestone', 'task'],
  vertical_head:   ['project', 'milestone', 'task'],
  project_manager: ['milestone', 'task'],
  team_lead:       ['task'],
  member:          ['task'],
  executive:       [],
  viewer:          [],
};

const STEP_META: Record<StepType, { title: string; subtitle: string; icon: React.ElementType; color: string }> = {
  division: { title: 'Division',  subtitle: 'Create a division & assign Division Admin', icon: Building2,    color: 'text-indigo-600'  },
  vertical: { title: 'Vertical',  subtitle: 'Create a vertical & assign Vertical Head',  icon: Network,      color: 'text-purple-600'  },
  project:  { title: 'Project',   subtitle: 'Create a project & assign Project Manager', icon: FolderKanban, color: 'text-blue-600'    },
  milestone:{ title: 'Milestone', subtitle: 'Define a delivery phase with timeline',     icon: Flag,         color: 'text-orange-600'  },
  task:     { title: 'Task',      subtitle: 'Create a task & assign to a team member',   icon: CheckSquare2, color: 'text-green-600'   },
};

const COLORS = ['#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#06B6D4','#EC4899','#6366F1'];

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardCtx {
  divisionId: string; divisionName: string;
  verticalId:  string; verticalName:  string;
  projectId:   string; projectName:   string;
  milestoneId: string; milestoneName: string;
}

interface MemberOpt { id: string; label: string; }

// ─── Main component ─────────────────────────────────────────────────────────

export function OnboardingWizardPage() {
  const navigate  = useNavigate();
  const { currentRole, currentDivisionId } = useAuthStore();

  const activeSteps: StepType[] = ROLE_STEPS[currentRole || ''] ?? ['task'];
  const totalSteps = activeSteps.length;

  const [stepIdx,    setStepIdx]    = useState(0);
  const [isDone,     setIsDone]     = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const [stepError,  setStepError]  = useState('');

  // Context flows forward through steps
  const [ctx, setCtx] = useState<WizardCtx>({
    divisionId: currentDivisionId || '', divisionName: '',
    verticalId: '',  verticalName:  '',
    projectId:  '',  projectName:   '',
    milestoneId:'',  milestoneName: '',
  });

  // Mode per step: 'create' | 'select'
  const [modes, setModes] = useState<Partial<Record<StepType, 'create' | 'select'>>>({});
  const getMode  = (s: StepType) => modes[s] ?? 'create';
  const setMode  = (s: StepType, m: 'create' | 'select') => setModes(prev => ({ ...prev, [s]: m }));

  // ── Form states ──────────────────────────────────────────────────────────

  const [divForm, setDivForm] = useState({
    name: '', code: '', description: '', budget: '', head_count: '',
    adminId: '', selectedId: '',
  });

  const [vertForm, setVertForm] = useState({
    name: '', description: '', divisionId: '',
    headId: '', memberIds: [] as string[], selectedId: '',
  });

  const [projForm, setProjForm] = useState({
    name: '', key: '', description: '', visibility: 'org_wide',
    color: '#3B82F6', workflow_config_id: '', verticalId: '',
    managerId: '', teamLeadId: '', memberIds: [] as string[], selectedId: '',
  });

  const [msForm, setMsForm] = useState({
    title: '', description: '', due_date: '', status: 'upcoming', selectedId: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium', due_date: '',
    assigneeId: '', milestoneId: '',
  });

  // ── API hooks ────────────────────────────────────────────────────────────

  const createDivision   = useCreateDivision();
  const addDivMember     = useAddDivisionMember();
  const createVertical   = useCreateVertical();
  const createProject    = useCreateProject();
  const { data: wfList } = useWorkflows();
  const workflows = (wfList ?? []) as any[];

  // Data for dropdowns
  const { data: membersData } = useMembers({ page_size: 200 });
  const allMembers: MemberOpt[] = useMemo(() =>
    (membersData?.items ?? []).map((m: any) => ({
      id: m.id,
      label: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || m.id,
    })), [membersData]);

  const { data: divisionsData } = useDivisions();
  const allDivisions: any[] = useMemo(() =>
    (divisionsData as any)?.items ?? (Array.isArray(divisionsData) ? divisionsData : []),
    [divisionsData]);

  const { data: verticalsData } = useVerticals(ctx.divisionId ? { divisionId: ctx.divisionId } : undefined);
  const allVerticals: any[] = useMemo(() =>
    Array.isArray(verticalsData) ? verticalsData : (verticalsData as any)?.items ?? [],
    [verticalsData]);

  const { data: projectsData } = useProjects();
  const allProjects: any[] = useMemo(() => projectsData?.items ?? [], [projectsData]);

  const { data: milestonesRaw } = useMilestones(ctx.projectId || '_none_');
  const allMilestones: any[] = useMemo(() =>
    Array.isArray(milestonesRaw) ? milestonesRaw : (milestonesRaw as any)?.items ?? [],
    [milestonesRaw]);

  // ── Step processing ──────────────────────────────────────────────────────

  const currentStepType = activeSteps[stepIdx];
  const isLastStep      = stepIdx === totalSteps - 1;
  const isFirstStep     = stepIdx === 0;

  const processStep = async () => {
    const mode = getMode(currentStepType);

    if (currentStepType === 'division') {
      if (mode === 'create') {
        if (!divForm.name.trim() || !divForm.code.trim()) throw new Error('Division name and code are required');
        if (!divForm.adminId) throw new Error('Division Admin must be assigned');
        const result: any = await createDivision.mutateAsync({
          name: divForm.name.trim(),
          code: divForm.code.trim().toUpperCase(),
          description: divForm.description || undefined,
          budget:      divForm.budget || undefined,
          head_count:  divForm.head_count || undefined,
          manager_id:  divForm.adminId,
        });
        const divId = result?.id || result?.data?.id;
        if (divId) {
          // Also add the admin as a division member with division_admin role
          await addDivMember.mutateAsync({ divisionId: divId, userId: divForm.adminId, role: 'division_admin' }).catch(() => {});
          setCtx(c => ({ ...c, divisionId: divId, divisionName: divForm.name }));
        }
      } else {
        if (!divForm.selectedId) throw new Error('Please select a division');
        const div = allDivisions.find((d: any) => d.id === divForm.selectedId);
        setCtx(c => ({ ...c, divisionId: divForm.selectedId, divisionName: div?.name || '' }));
      }
    }

    else if (currentStepType === 'vertical') {
      const divId = ctx.divisionId || vertForm.divisionId;
      if (mode === 'create') {
        if (!vertForm.name.trim()) throw new Error('Vertical name is required');
        if (!divId) throw new Error('Division must be selected');
        if (!vertForm.headId) throw new Error('Vertical Head must be assigned');
        const result: any = await createVertical.mutateAsync({
          name:        vertForm.name.trim(),
          description: vertForm.description || undefined,
          divisionId:  divId,
          headId:      vertForm.headId,
        });
        const vertId = result?.data?.data?.id || result?.data?.id || result?.id;
        setCtx(c => ({ ...c, verticalId: vertId || '', verticalName: vertForm.name }));
      } else {
        if (!vertForm.selectedId) throw new Error('Please select a vertical');
        const vert = allVerticals.find((v: any) => v.id === vertForm.selectedId);
        setCtx(c => ({ ...c, verticalId: vertForm.selectedId, verticalName: vert?.name || '' }));
      }
    }

    else if (currentStepType === 'project') {
      const vertId = ctx.verticalId || projForm.verticalId;
      if (mode === 'create') {
        if (!projForm.name.trim() || !projForm.key.trim()) throw new Error('Project name and key are required');
        if (!projForm.managerId) throw new Error('Project Manager must be assigned');
        const wfId = projForm.workflow_config_id || workflows[0]?.id;
        const result: any = await createProject.mutateAsync({
          name:        projForm.name.trim(),
          key:         projForm.key.trim().toUpperCase(),
          description: projForm.description || undefined,
          visibility:  projForm.visibility,
          color:       projForm.color,
          ...(vertId ? { verticalId: vertId } : {}),
          ...(wfId   ? { workflow_config_id: wfId } : {}),
        });
        const projId = result?.id;
        if (projId) {
          const addMember = (userId: string, role: string) =>
            api.post(`/projects/${projId}/members`, { userId, role }).catch(() => {});
          await addMember(projForm.managerId, 'project_manager');
          if (projForm.teamLeadId) await addMember(projForm.teamLeadId, 'team_lead');
          for (const uid of projForm.memberIds) await addMember(uid, 'member');
        }
        setCtx(c => ({ ...c, projectId: projId || '', projectName: projForm.name }));
      } else {
        if (!projForm.selectedId) throw new Error('Please select a project');
        const proj = allProjects.find((p: any) => p.id === projForm.selectedId);
        setCtx(c => ({ ...c, projectId: projForm.selectedId, projectName: proj?.name || '' }));
      }
    }

    else if (currentStepType === 'milestone') {
      const projId = ctx.projectId;
      if (!projId) throw new Error('A project must be set before creating a milestone. Go back and create/select a project.');
      if (mode === 'create') {
        if (!msForm.title.trim()) throw new Error('Milestone title is required');
        const result: any = await api.post(`/projects/${projId}/milestones`, {
          title:       msForm.title.trim(),
          description: msForm.description || undefined,
          due_date:    msForm.due_date || undefined,
          status:      msForm.status || 'upcoming',
        });
        const msId = result?.data?.data?.id || result?.data?.id;
        setCtx(c => ({ ...c, milestoneId: msId || '', milestoneName: msForm.title }));
      } else {
        if (!msForm.selectedId) throw new Error('Please select a milestone');
        const ms = allMilestones.find((m: any) => m.id === msForm.selectedId);
        setCtx(c => ({ ...c, milestoneId: msForm.selectedId, milestoneName: ms?.title || '' }));
      }
    }

    else if (currentStepType === 'task') {
      const projId = ctx.projectId;
      if (!projId) throw new Error('A project must be set before creating a task. Go back and create/select a project.');
      if (!taskForm.title.trim()) throw new Error('Task title is required');
      await api.post(`/tasks/project/${projId}`, {
        title:        taskForm.title.trim(),
        description:  taskForm.description || undefined,
        priority:     taskForm.priority,
        due_date:     taskForm.due_date || undefined,
        assignee_id:  taskForm.assigneeId || undefined,
        milestone_id: ctx.milestoneId || taskForm.milestoneId || undefined,
      });
    }
  };

  const handleNext = async () => {
    setStepError('');
    setIsLoading(true);
    try {
      await processStep();
      if (isLastStep) {
        setIsDone(true);
      } else {
        setStepIdx(i => i + 1);
      }
    } catch (e: any) {
      setStepError(e?.response?.data?.error?.message || e?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate project key from name
  const handleProjectName = (name: string) => {
    const autoKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setProjForm(p => ({ ...p, name, key: p.key || autoKey }));
  };

  // ── No steps available ───────────────────────────────────────────────────

  if (totalSteps === 0) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">Onboarding not available for your role</h2>
        <p className="text-muted-foreground text-sm">The onboarding wizard is available for Division Admins and above.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────────────────

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
              <CheckCircle className="h-11 w-11 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Onboarding complete!</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {[ctx.divisionName, ctx.verticalName, ctx.projectName, ctx.milestoneName]
              .filter(Boolean).join(' → ')} has been set up and all user mappings are in place.
          </p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
            {[
              { label: 'Division',  value: ctx.divisionName,  show: !!ctx.divisionName  },
              { label: 'Vertical',  value: ctx.verticalName,  show: !!ctx.verticalName  },
              { label: 'Project',   value: ctx.projectName,   show: !!ctx.projectName   },
              { label: 'Milestone', value: ctx.milestoneName, show: !!ctx.milestoneName },
            ].filter(r => r.show).map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Kanban,          label: 'Project Board',   onClick: () => navigate(ctx.projectId ? `/projects/${ctx.projectId}/board` : '/projects'), primary: true },
            { icon: LayoutDashboard, label: 'Dashboard',       onClick: () => navigate('/dashboard'),          primary: false },
            { icon: Users,           label: 'Team Management', onClick: () => navigate('/team'),               primary: false },
            { icon: Flag,            label: 'Milestones',      onClick: () => navigate(ctx.projectId ? `/projects/${ctx.projectId}/milestones` : '/projects'), primary: false },
          ].map(({ icon: Icon, label, onClick, primary }) => (
            <button key={label} onClick={onClick}
              className={cn('flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md',
                primary ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent')}>
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                primary ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <p className={cn('text-sm font-semibold', primary && 'text-primary')}>{label}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { setIsDone(false); setStepIdx(0); setCtx({ divisionId: currentDivisionId || '', divisionName: '', verticalId: '', verticalName: '', projectId: '', projectName: '', milestoneId: '', milestoneName: '' }); }}>
            <Plus className="h-4 w-4 mr-2" /> Start Another
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Wizard shell ─────────────────────────────────────────────────────────

  const meta = STEP_META[currentStepType];
  const Icon = meta.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Onboarding Wizard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your hierarchy step by step — each level must be mapped before proceeding.
        </p>
      </div>

      {/* Role badge + context breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="capitalize">
          {(currentRole || 'unknown').replace(/_/g, ' ')}
        </Badge>
        {[ctx.divisionName, ctx.verticalName, ctx.projectName, ctx.milestoneName]
          .filter(Boolean).map((name, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{name}</span>
          </span>
        ))}
      </div>

      {/* Step progress */}
      <div className="flex items-center">
        {activeSteps.map((sType, i) => {
          const SMeta  = STEP_META[sType];
          const SIcon  = SMeta.icon;
          const isActive = i === stepIdx;
          const isDoneS  = i < stepIdx;
          return (
            <div key={sType} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => isDoneS && setStepIdx(i)}
                className={cn('flex flex-col items-center gap-1 flex-shrink-0', isDoneS && 'cursor-pointer')}
                title={SMeta.subtitle}
              >
                <div className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  isActive ? 'bg-primary text-primary-foreground border-primary scale-110' :
                  isDoneS  ? 'bg-green-500 text-white border-green-500' :
                             'bg-muted text-muted-foreground border-muted-foreground/20',
                )}>
                  {isDoneS ? <CheckCircle className="h-4 w-4" /> : <SIcon className="h-4 w-4" />}
                </div>
                <p className={cn('hidden sm:block text-[10px] font-medium whitespace-nowrap',
                  isActive ? 'text-primary' : isDoneS ? 'text-green-600' : 'text-muted-foreground',
                )}>
                  {SMeta.title}
                </p>
              </button>
              {i < activeSteps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1 mb-4', isDoneS ? 'bg-green-400' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step card */}
      <Card>
        <CardContent className="p-6 space-y-5">

          {/* Step header */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className={cn('h-5 w-5', meta.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                Step {stepIdx + 1} of {totalSteps}: {meta.title}
              </h3>
              <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
            </div>
          </div>

          {/* Mode toggle (not for task — always create) */}
          {currentStepType !== 'task' && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              {(['create', 'select'] as const).map(m => (
                <button key={m}
                  onClick={() => setMode(currentStepType, m)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                    getMode(currentStepType) === m
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'create' ? '+ Create New' : '← Use Existing'}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {stepError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* ── DIVISION STEP ── */}
          {currentStepType === 'division' && (
            <div className="space-y-4">
              {getMode('division') === 'create' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Division Name *">
                      <Input placeholder="e.g., Engineering" value={divForm.name}
                        onChange={e => setDivForm(f => ({ ...f, name: e.target.value }))} />
                    </FieldWrap>
                    <FieldWrap label="Short Code *">
                      <Input placeholder="e.g., ENG" maxLength={8} value={divForm.code}
                        onChange={e => setDivForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                    </FieldWrap>
                  </div>
                  <FieldWrap label="Description">
                    <textarea rows={2} placeholder="What does this division do?"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={divForm.description}
                      onChange={e => setDivForm(f => ({ ...f, description: e.target.value }))} />
                  </FieldWrap>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Budget">
                      <Input type="number" placeholder="e.g., 500000" value={divForm.budget}
                        onChange={e => setDivForm(f => ({ ...f, budget: e.target.value }))} />
                    </FieldWrap>
                    <FieldWrap label="Head Count">
                      <Input type="number" placeholder="e.g., 25" value={divForm.head_count}
                        onChange={e => setDivForm(f => ({ ...f, head_count: e.target.value }))} />
                    </FieldWrap>
                  </div>

                  <UserMapSection
                    icon={Crown} color="border-indigo-200 dark:border-indigo-800"
                    bgColor="bg-indigo-100 dark:bg-indigo-950/40" iconColor="text-indigo-600"
                    title="Division Admin *" desc="Has full control within this division"
                    value={divForm.adminId} members={allMembers}
                    onChange={v => setDivForm(f => ({ ...f, adminId: v }))}
                    placeholder="Select Division Admin"
                  />
                </>
              ) : (
                <FieldWrap label="Select an existing division">
                  <Select value={divForm.selectedId}
                    onChange={v => setDivForm(f => ({ ...f, selectedId: v }))}
                    placeholder="— Choose Division —"
                    options={allDivisions.map((d: any) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                  />
                </FieldWrap>
              )}
            </div>
          )}

          {/* ── VERTICAL STEP ── */}
          {currentStepType === 'vertical' && (
            <div className="space-y-4">
              {getMode('vertical') === 'create' ? (
                <>
                  <FieldWrap label="Vertical Name *">
                    <Input placeholder="e.g., Software Development" value={vertForm.name}
                      onChange={e => setVertForm(f => ({ ...f, name: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Description">
                    <textarea rows={2} placeholder="What does this vertical focus on?"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={vertForm.description}
                      onChange={e => setVertForm(f => ({ ...f, description: e.target.value }))} />
                  </FieldWrap>

                  {/* Division selector — only if not already set from context */}
                  {!ctx.divisionId && (
                    <FieldWrap label="Division *">
                      <Select value={vertForm.divisionId}
                        onChange={v => setVertForm(f => ({ ...f, divisionId: v }))}
                        placeholder="— Select Division —"
                        options={allDivisions.map((d: any) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                      />
                    </FieldWrap>
                  )}
                  {ctx.divisionId && (
                    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Division:</span>
                      <span className="font-medium">{ctx.divisionName || ctx.divisionId}</span>
                    </div>
                  )}

                  <UserMapSection
                    icon={Network} color="border-purple-200 dark:border-purple-800"
                    bgColor="bg-purple-100 dark:bg-purple-950/40" iconColor="text-purple-600"
                    title="Vertical Head *" desc="Manages all projects within this vertical"
                    value={vertForm.headId} members={allMembers}
                    onChange={v => setVertForm(f => ({ ...f, headId: v }))}
                    placeholder="Select Vertical Head"
                  />

                  <MultiUserSection
                    title="Team Members" desc="Members who will work within this vertical (optional)"
                    members={allMembers} selected={vertForm.memberIds}
                    onChange={ids => setVertForm(f => ({ ...f, memberIds: ids }))}
                  />
                </>
              ) : (
                <FieldWrap label="Select an existing vertical">
                  <Select value={vertForm.selectedId}
                    onChange={v => setVertForm(f => ({ ...f, selectedId: v }))}
                    placeholder="— Choose Vertical —"
                    options={allVerticals.map((v: any) => ({ value: v.id, label: v.name }))}
                  />
                </FieldWrap>
              )}
            </div>
          )}

          {/* ── PROJECT STEP ── */}
          {currentStepType === 'project' && (
            <div className="space-y-4">
              {getMode('project') === 'create' ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FieldWrap label="Project Name *">
                        <Input placeholder="e.g., Customer Portal Q3" value={projForm.name}
                          onChange={e => handleProjectName(e.target.value)} />
                      </FieldWrap>
                    </div>
                    <FieldWrap label="Key *">
                      <Input placeholder="CPQ3" maxLength={10} value={projForm.key}
                        onChange={e => setProjForm(f => ({ ...f, key: e.target.value.toUpperCase() }))} />
                    </FieldWrap>
                  </div>

                  <FieldWrap label="Description">
                    <textarea rows={2} placeholder="What is this project about?"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={projForm.description}
                      onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))} />
                  </FieldWrap>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Visibility">
                      <Select value={projForm.visibility}
                        onChange={v => setProjForm(f => ({ ...f, visibility: v }))}
                        options={[
                          { value: 'org_wide', label: 'Organisation Wide' },
                          { value: 'private',  label: 'Private' },
                          { value: 'public',   label: 'Public' },
                        ]}
                      />
                    </FieldWrap>
                    {workflows.length > 0 && (
                      <FieldWrap label="Workflow">
                        <Select value={projForm.workflow_config_id || workflows[0]?.id || ''}
                          onChange={v => setProjForm(f => ({ ...f, workflow_config_id: v }))}
                          options={workflows.map((w: any) => ({ value: w.id, label: w.name }))}
                        />
                      </FieldWrap>
                    )}
                  </div>

                  {/* Vertical context or selector */}
                  {ctx.verticalId ? (
                    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Vertical:</span>
                      <span className="font-medium">{ctx.verticalName || ctx.verticalId}</span>
                    </div>
                  ) : (
                    <FieldWrap label="Vertical (optional)">
                      <Select value={projForm.verticalId}
                        onChange={v => setProjForm(f => ({ ...f, verticalId: v }))}
                        placeholder="— Select Vertical (optional) —"
                        options={allVerticals.map((v: any) => ({ value: v.id, label: v.name }))}
                      />
                    </FieldWrap>
                  )}

                  <FieldWrap label="Project Color">
                    <div className="flex gap-2 mt-1">
                      {COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setProjForm(f => ({ ...f, color: c }))}
                          className={cn('h-7 w-7 rounded-full border-2 transition-transform',
                            projForm.color === c ? 'border-foreground scale-110' : 'border-border')}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </FieldWrap>

                  <UserMapSection
                    icon={FolderKanban} color="border-blue-200 dark:border-blue-800"
                    bgColor="bg-blue-100 dark:bg-blue-950/40" iconColor="text-blue-600"
                    title="Project Manager *" desc="Manages sprints, assigns tasks, and leads the team"
                    value={projForm.managerId} members={allMembers}
                    onChange={v => setProjForm(f => ({ ...f, managerId: v }))}
                    placeholder="Select Project Manager"
                  />

                  <UserMapSection
                    icon={Shield} color="border-emerald-200 dark:border-emerald-800"
                    bgColor="bg-emerald-100 dark:bg-emerald-950/40" iconColor="text-emerald-600"
                    title="Team Lead" desc="Leads the development team within this project"
                    value={projForm.teamLeadId} members={allMembers}
                    onChange={v => setProjForm(f => ({ ...f, teamLeadId: v }))}
                    placeholder="Select Team Lead (optional)"
                  />

                  <MultiUserSection
                    title="Team Members" desc="Add members who will work on this project"
                    members={allMembers} selected={projForm.memberIds}
                    onChange={ids => setProjForm(f => ({ ...f, memberIds: ids }))}
                  />
                </>
              ) : (
                <FieldWrap label="Select an existing project">
                  <Select value={projForm.selectedId}
                    onChange={v => setProjForm(f => ({ ...f, selectedId: v }))}
                    placeholder="— Choose Project —"
                    options={allProjects.map((p: any) => ({ value: p.id, label: `${p.name} [${p.key}]` }))}
                  />
                </FieldWrap>
              )}
            </div>
          )}

          {/* ── MILESTONE STEP ── */}
          {currentStepType === 'milestone' && (
            <div className="space-y-4">
              {/* Project context */}
              {ctx.projectName && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-medium">{ctx.projectName}</span>
                </div>
              )}

              {getMode('milestone') === 'create' ? (
                <>
                  <FieldWrap label="Milestone Title *">
                    <Input placeholder="e.g., Phase 1 — Core Features" value={msForm.title}
                      onChange={e => setMsForm(f => ({ ...f, title: e.target.value }))} />
                  </FieldWrap>
                  <FieldWrap label="Description">
                    <textarea rows={2} placeholder="What will be delivered in this milestone?"
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      value={msForm.description}
                      onChange={e => setMsForm(f => ({ ...f, description: e.target.value }))} />
                  </FieldWrap>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Due Date">
                      <Input type="date" value={msForm.due_date}
                        onChange={e => setMsForm(f => ({ ...f, due_date: e.target.value }))} />
                    </FieldWrap>
                    <FieldWrap label="Status">
                      <Select value={msForm.status}
                        onChange={v => setMsForm(f => ({ ...f, status: v }))}
                        options={[
                          { value: 'upcoming',    label: 'Upcoming'    },
                          { value: 'in_progress', label: 'In Progress' },
                          { value: 'completed',   label: 'Completed'   },
                          { value: 'at_risk',     label: 'At Risk'     },
                        ]}
                      />
                    </FieldWrap>
                  </div>
                </>
              ) : (
                <FieldWrap label="Select an existing milestone">
                  {allMilestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                      No milestones found for this project. Switch to "Create New" to add one.
                    </p>
                  ) : (
                    <Select value={msForm.selectedId}
                      onChange={v => setMsForm(f => ({ ...f, selectedId: v }))}
                      placeholder="— Choose Milestone —"
                      options={allMilestones.map((m: any) => ({ value: m.id, label: m.title }))}
                    />
                  )}
                </FieldWrap>
              )}
            </div>
          )}

          {/* ── TASK STEP ── */}
          {currentStepType === 'task' && (
            <div className="space-y-4">
              {/* Context breadcrumb */}
              {(ctx.projectName || ctx.milestoneName) && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm flex-wrap">
                  {ctx.projectName && <><FolderKanban className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{ctx.projectName}</span></>}
                  {ctx.milestoneName && <><ChevronRight className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{ctx.milestoneName}</span></>}
                </div>
              )}

              <FieldWrap label="Task Title *">
                <Input placeholder="e.g., Implement user authentication" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Description">
                <textarea rows={2} placeholder="What needs to be done?"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
              </FieldWrap>

              <div className="grid grid-cols-2 gap-4">
                <FieldWrap label="Priority">
                  <Select value={taskForm.priority}
                    onChange={v => setTaskForm(f => ({ ...f, priority: v }))}
                    options={[
                      { value: 'low',      label: 'Low'      },
                      { value: 'medium',   label: 'Medium'   },
                      { value: 'high',     label: 'High'     },
                      { value: 'critical', label: 'Critical' },
                    ]}
                  />
                </FieldWrap>
                <FieldWrap label="Due Date">
                  <Input type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
                </FieldWrap>
              </div>

              <UserMapSection
                icon={UserCheck} color="border-green-200 dark:border-green-800"
                bgColor="bg-green-100 dark:bg-green-950/40" iconColor="text-green-600"
                title="Assign To" desc="Team member responsible for this task"
                value={taskForm.assigneeId} members={allMembers}
                onChange={v => setTaskForm(f => ({ ...f, assigneeId: v }))}
                placeholder="Select Assignee (optional)"
              />

              {/* Milestone link — if not set from context, allow selection */}
              {!ctx.milestoneId && allMilestones.length > 0 && (
                <FieldWrap label="Milestone (optional)">
                  <Select value={taskForm.milestoneId}
                    onChange={v => setTaskForm(f => ({ ...f, milestoneId: v }))}
                    placeholder="— Link to Milestone —"
                    options={allMilestones.map((m: any) => ({ value: m.id, label: m.title }))}
                  />
                </FieldWrap>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={isFirstStep || isLoading}
          onClick={() => setStepIdx(i => i - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <span className="text-xs text-muted-foreground">Step {stepIdx + 1} of {totalSteps}</span>

        <Button onClick={handleNext} disabled={isLoading} size="lg">
          {isLoading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            : isLastStep
            ? <><CheckCircle className="h-4 w-4 mr-2" /> Finish</>
            : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── UserMapSection: select existing | create manually ───────────────────────

function UserMapSection({ icon: Icon, color, bgColor, iconColor, title, desc, value, members, onChange, placeholder, suggestedRole }: {
  icon: React.ElementType;
  color: string; bgColor: string; iconColor: string;
  title: string; desc: string;
  value: string;
  members: MemberOpt[];
  onChange: (id: string) => void;
  placeholder: string;
  suggestedRole?: OrgRole;
}) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const createUser = useCreateMemberDirect();

  const handleCreate = async () => {
    setFormError('');
    if (!form.first_name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('First name, email and password are required');
      return;
    }
    try {
      const result = await createUser.mutateAsync({
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
        role: suggestedRole || 'member',
      });
      onChange(result.id);
      setMode('select');
      setForm({ first_name: '', last_name: '', email: '', password: '' });
    } catch (e: any) {
      setFormError(e?.response?.data?.error?.message || 'Failed to create user');
    }
  };

  const selected = members.find(m => m.id === value);

  return (
    <div className={cn('rounded-xl border-2 p-4 space-y-3', color)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', bgColor)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        {/* Mode tabs */}
        <div className="flex gap-1 text-xs">
          <button onClick={() => setMode('select')}
            className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors',
              mode === 'select' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
            <List className="h-3 w-3" /> Existing
          </button>
          <button onClick={() => setMode('create')}
            className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors',
              mode === 'create' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
            <UserPlus className="h-3 w-3" /> New User
          </button>
        </div>
      </div>

      {/* Select existing */}
      {mode === 'select' && (
        <div className="space-y-1">
          <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">{placeholder}</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          {selected && (
            <p className="text-xs text-muted-foreground pl-1">Selected: <span className="font-medium text-foreground">{selected.label}</span></p>
          )}
        </div>
      )}

      {/* Create new user */}
      {mode === 'create' && (
        <div className="space-y-2 pt-1">
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name *" value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <Input placeholder="Last name" value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
          <Input type="email" placeholder="Email address *" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input type="password" placeholder="Password *" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          {suggestedRole && (
            <p className="text-xs text-muted-foreground">
              Will be created with role: <Badge variant="secondary" className="text-[10px] ml-1">{suggestedRole.replace(/_/g, ' ')}</Badge>
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createUser.isPending} className="flex-1">
              {createUser.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
              Create & Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('select')}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MultiUserSection: select existing | add manually | CSV import ────────────

interface NewMemberRow { first_name: string; last_name: string; email: string; password: string; role: OrgRole; }

function MultiUserSection({ title, desc, members, selected, onChange }: {
  title: string; desc: string;
  members: MemberOpt[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [mode, setMode] = useState<'select' | 'manual' | 'csv'>('select');
  const [pickedId,  setPickedId]  = useState('');
  const [manualForm, setManualForm] = useState<NewMemberRow>({ first_name: '', last_name: '', email: '', password: '', role: 'member' });
  const [manualError, setManualError] = useState('');
  const [csvRows, setCsvRows]     = useState<NewMemberRow[]>([]);
  const [csvError, setCsvError]   = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvDone, setCsvDone]     = useState(false);

  const createUser  = useCreateMemberDirect();
  const inviteMember = useInviteMember();

  const remove = (id: string) => onChange(selected.filter(s => s !== id));

  // Select existing
  const addExisting = () => {
    if (!pickedId || selected.includes(pickedId)) return;
    onChange([...selected, pickedId]);
    setPickedId('');
  };
  const available = members.filter(m => !selected.includes(m.id));

  // Manual create
  const handleManualAdd = async () => {
    setManualError('');
    if (!manualForm.first_name.trim() || !manualForm.email.trim() || !manualForm.password.trim()) {
      setManualError('First name, email and password are required');
      return;
    }
    try {
      const result = await createUser.mutateAsync({ ...manualForm, first_name: manualForm.first_name.trim(), last_name: manualForm.last_name.trim(), email: manualForm.email.trim() });
      onChange([...selected, result.id]);
      setManualForm({ first_name: '', last_name: '', email: '', password: '', role: 'member' });
    } catch (e: any) {
      setManualError(e?.response?.data?.error?.message || 'Failed to create user');
    }
  };

  // CSV parsing
  const downloadTemplate = () => {
    const csv = 'first_name,last_name,email,password,role\nJohn,Doe,john@example.com,Pass@123,member\nJane,Smith,jane@example.com,Pass@123,team_lead\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'members-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(''); setCsvRows([]); setCsvDone(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { setCsvError('CSV must have a header row and at least one data row'); return; }
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const emailIdx     = header.indexOf('email');
      const fnIdx        = header.indexOf('first_name');
      const lnIdx        = header.indexOf('last_name');
      const passIdx      = header.indexOf('password');
      const roleIdx      = header.indexOf('role');
      if (emailIdx === -1) { setCsvError('CSV must have an "email" column'); return; }
      const validRoles: OrgRole[] = ['org_admin','division_admin','vertical_head','project_manager','team_lead','member','viewer'];
      const rows: NewMemberRow[] = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const rawRole = cols[roleIdx]?.toLowerCase() || 'member';
        return {
          first_name: cols[fnIdx]   || '',
          last_name:  cols[lnIdx]   || '',
          email:      cols[emailIdx] || '',
          password:   cols[passIdx] || 'Welcome@123',
          role:       (validRoles.includes(rawRole as OrgRole) ? rawRole : 'member') as OrgRole,
        };
      }).filter(r => r.email.includes('@'));
      if (rows.length === 0) { setCsvError('No valid rows found — check the email column'); return; }
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    setCsvImporting(true);
    const newIds: string[] = [];
    for (const row of csvRows) {
      try {
        if (row.password) {
          const r = await createUser.mutateAsync(row);
          newIds.push(r.id);
        } else {
          await inviteMember.mutateAsync({ email: row.email, role: row.role });
        }
      } catch { /* skip duplicates */ }
    }
    if (newIds.length > 0) onChange([...selected, ...newIds]);
    setCsvImporting(false);
    setCsvDone(true);
    setCsvRows([]);
  };

  const ROLE_OPTIONS: OrgRole[] = ['member','team_lead','project_manager','vertical_head','division_admin'];

  return (
    <div className="rounded-xl border border-dashed p-4 space-y-3">
      {/* Header + mode tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg text-xs">
          {([['select','List', List], ['manual','Add', UserPlus], ['csv','CSV', Upload]] as const).map(([m, label, MIcon]) => (
            <button key={m} onClick={() => setMode(m as any)}
              className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors',
                mode === m ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}>
              <MIcon className="h-3 w-3" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(id => {
            const m = members.find(x => x.id === id);
            return (
              <span key={id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1">
                {m?.label || id}
                <button onClick={() => remove(id)} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Select existing ── */}
      {mode === 'select' && (
        <div className="flex gap-2">
          <select value={pickedId} onChange={e => setPickedId(e.target.value)}
            className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Select a team member —</option>
            {available.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={addExisting} disabled={!pickedId}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Add manually ── */}
      {mode === 'manual' && (
        <div className="space-y-2">
          {manualError && <p className="text-xs text-destructive">{manualError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="First name *" value={manualForm.first_name}
              onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))} />
            <Input placeholder="Last name" value={manualForm.last_name}
              onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))} />
          </div>
          <Input type="email" placeholder="Email *" value={manualForm.email}
            onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="password" placeholder="Password *" value={manualForm.password}
              onChange={e => setManualForm(f => ({ ...f, password: e.target.value }))} />
            <select value={manualForm.role} onChange={e => setManualForm(f => ({ ...f, role: e.target.value as OrgRole }))}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <Button size="sm" className="w-full" onClick={handleManualAdd} disabled={createUser.isPending}>
            {createUser.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
            Create & Add to Team
          </Button>
        </div>
      )}

      {/* ── CSV import ── */}
      {mode === 'csv' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Upload CSV with columns: <code className="bg-muted px-1 rounded">first_name, last_name, email, password, role</code></p>
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Template
            </Button>
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl py-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all group">
            <Upload className="h-7 w-7 text-muted-foreground/50 group-hover:text-primary mb-2" />
            <p className="text-sm font-medium">Click to upload CSV</p>
            <p className="text-xs text-muted-foreground mt-0.5">first_name, last_name, email, password, role</p>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
          </label>

          {csvError && <p className="text-xs text-destructive">{csvError}</p>}

          {csvDone && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 rounded-md px-3 py-2">
              <CheckCircle className="h-4 w-4" /> Users imported successfully
            </div>
          )}

          {csvRows.length > 0 && !csvDone && (
            <div className="space-y-2">
              <p className="text-xs font-medium">{csvRows.length} user{csvRows.length !== 1 ? 's' : ''} found:</p>
              <div className="max-h-36 overflow-y-auto border rounded-lg divide-y text-xs">
                {csvRows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5">
                    <span className="font-medium">{r.first_name} {r.last_name}</span>
                    <span className="text-muted-foreground">{r.email}</span>
                    <Badge variant="secondary" className="text-[10px]">{r.role.replace(/_/g,' ')}</Badge>
                  </div>
                ))}
              </div>
              <Button size="sm" className="w-full" onClick={handleCsvImport} disabled={csvImporting}>
                {csvImporting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Importing...</>
                  : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Import {csvRows.length} Users</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
