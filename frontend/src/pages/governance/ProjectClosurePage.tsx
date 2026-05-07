import { useState } from 'react';
import {
  Lock, CheckSquare, FileText, Star, AlertTriangle, CheckCircle2,
  Send, ArrowRight, Users, IndianRupee, Calendar, Paperclip, Flag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ── mock data ─────────────────────────────────────────────────────────────────

const CLOSABLE_PROJECTS = [
  {
    id: 'proj-003', key: 'SCH-002', name: 'Model School Construction — Jabalpur Block',
    division: 'Education', pm: 'Anita Joshi', budget: 22_000_000, actualSpend: 21_000_000,
    startDate: '2025-08-01', endDate: '2026-03-31',
    milestones: 6, completedMilestones: 6,
    teamSize: 12,
  },
  {
    id: 'proj-005', key: 'PWD-002', name: 'District Court Complex Renovation',
    division: 'Infrastructure', pm: 'Priya Singh', budget: 55_000_000, actualSpend: 57_200_000,
    startDate: '2025-06-01', endDate: '2026-04-30',
    milestones: 8, completedMilestones: 7,
    teamSize: 18,
  },
];

function fmtCr(n: number) {
  return n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)} Cr` : `₹${(n / 100_000).toFixed(1)} L`;
}

// ── checklist items ────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { id: 'c1', group: 'Technical', label: 'All milestones completed and signed off', required: true },
  { id: 'c2', group: 'Technical', label: 'Final quality inspection report submitted', required: true },
  { id: 'c3', group: 'Technical', label: 'As-built drawings / documentation submitted', required: true },
  { id: 'c4', group: 'Technical', label: 'Defect liability period acknowledged by client', required: false },
  { id: 'c5', group: 'Financial', label: 'Final bill submitted to client', required: true },
  { id: 'c6', group: 'Financial', label: 'Outstanding payments cleared', required: true },
  { id: 'c7', group: 'Financial', label: 'Final budget reconciliation completed', required: true },
  { id: 'c8', group: 'Financial', label: 'Performance guarantee / retention released', required: false },
  { id: 'c9', group: 'Administrative', label: 'Client acceptance certificate obtained', required: true },
  { id: 'c10', group: 'Administrative', label: 'All sub-contractor accounts closed', required: false },
  { id: 'c11', group: 'Administrative', label: 'Document repository archived', required: true },
  { id: 'c12', group: 'Administrative', label: 'Team release / re-allocation confirmed', required: false },
];

type Rating = 1 | 2 | 3 | 4 | 5;

// ── star rating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: Rating; onChange: (r: Rating) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((r) => (
        <button key={r} onClick={() => onChange(r as Rating)}
          className={cn('h-6 w-6 transition-colors', r <= value ? 'text-amber-400' : 'text-muted-foreground/30')}>
          <Star className="h-full w-full fill-current" />
        </button>
      ))}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

type ClosureStep = 'select' | 'checklist' | 'report' | 'lessons' | 'review' | 'done';

export function ProjectClosurePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ClosureStep>('select');
  const [selectedProject, setSelectedProject] = useState<typeof CLOSABLE_PROJECTS[0] | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [report, setReport] = useState({
    executiveSummary: '',
    deliverables: '',
    challenges: '',
    clientFeedback: '',
    teamRating: 4 as Rating,
    qualityRating: 4 as Rating,
    timeRating: 3 as Rating,
    budgetRating: 4 as Rating,
  });
  const [lessons, setLessons] = useState({
    whatWentWell: '',
    whatCouldImprove: '',
    recommendations: '',
    risksThatMaterialised: '',
  });

  const STEP_ORDER: ClosureStep[] = ['select', 'checklist', 'report', 'lessons', 'review', 'done'];
  const stepIdx = STEP_ORDER.indexOf(step);

  const STEP_LABELS = ['Select Project', 'Closure Checklist', 'Closure Report', 'Lessons Learned', 'Review & Submit', 'Done'];

  const mandatoryDone = CHECKLIST_ITEMS
    .filter(i => i.required)
    .every(i => checklist[i.id]);

  const groups = Array.from(new Set(CHECKLIST_ITEMS.map(i => i.group)));

  const goNext = () => {
    const next = STEP_ORDER[stepIdx + 1];
    if (next) setStep(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[stepIdx - 1];
    if (prev) setStep(prev);
  };

  // ── Step: Select ──
  if (step === 'select') {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Lock className="h-6 w-6 text-primary" /> Project Closure</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Initiate formal closure for a completed project</p>
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Project closure is irreversible. All outstanding tasks will be archived, team members will be released, and the project will be locked from further edits. Ensure all deliverables and payments are finalised before proceeding.</span>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Select project to close:</p>
          {CLOSABLE_PROJECTS.map((p) => (
            <Card
              key={p.id}
              className={cn('cursor-pointer transition-all hover:shadow-md', selectedProject?.id === p.id && 'ring-2 ring-primary')}
              onClick={() => setSelectedProject(p)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{p.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{p.key}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.pm}</span>
                      <span>{p.division}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{fmtCr(p.budget)} planned</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.endDate}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className={cn('flex items-center gap-1', p.completedMilestones === p.milestones ? 'text-emerald-600' : 'text-amber-600')}>
                        <Flag className="h-3 w-3" />{p.completedMilestones}/{p.milestones} milestones
                      </span>
                      <span className={cn(p.actualSpend > p.budget ? 'text-red-600' : 'text-emerald-600')}>
                        Actual: {fmtCr(p.actualSpend)} ({p.actualSpend > p.budget ? '+' : ''}{(((p.actualSpend - p.budget) / p.budget) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {selectedProject?.id === p.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={!selectedProject} onClick={goNext}>
            Start Closure <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Done ──
  if (step === 'done') {
    return (
      <div className="p-6 max-w-lg mx-auto text-center mt-16 space-y-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
          <Lock className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Project Closed</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{selectedProject?.name}</span> has been formally closed.
          Closure report saved to document repository. Team released. Division Head notified.
        </p>
        <div className="rounded-xl bg-muted/50 border px-4 py-3 text-xs text-muted-foreground text-left space-y-1">
          <p className="font-medium text-foreground">What happened:</p>
          <p>• Project status → CLOSED (locked)</p>
          <p>• Closure report added to document repository</p>
          <p>• Lessons learned saved to knowledge base</p>
          <p>• Team members released from project</p>
          <p>• Final budget reconciliation archived</p>
          <p>• Notification sent to stakeholders</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate('/projects')}>View Projects</Button>
          <Button onClick={() => navigate('/reports')}>View Reports</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Lock className="h-6 w-6 text-primary" /> Project Closure</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{selectedProject?.name} — {selectedProject?.key}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => {
          const isActive = i === stepIdx;
          const isDone = i < stepIdx;
          return (
            <div key={label} className="flex items-center gap-1 shrink-0">
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {isDone && <CheckCircle2 className="h-3 w-3" />}
                {label}
              </div>
              {i < STEP_LABELS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* ── Checklist ── */}
      {step === 'checklist' && (
        <div className="space-y-4">
          {!mandatoryDone && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Complete all required items (marked with *) before proceeding.
            </div>
          )}
          {groups.map((group) => (
            <Card key={group}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-primary" />{group}
              </CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {CHECKLIST_ITEMS.filter(i => i.group === group).map((item) => (
                  <label key={item.id} className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={!!checklist[item.id]}
                      onChange={e => setChecklist(p => ({ ...p, [item.id]: e.target.checked }))}
                      className="mt-0.5 rounded shrink-0"
                    />
                    <span className={cn('text-sm', checklist[item.id] && 'line-through text-muted-foreground')}>
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={goPrev}>Back</Button>
            <Button disabled={!mandatoryDone} onClick={goNext}>Next <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ── Closure Report ── */}
      {step === 'report' && (
        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-4">
            {[
              { key: 'executiveSummary', label: 'Executive Summary *', placeholder: 'Summarise the project outcome, key achievements, and overall status…' },
              { key: 'deliverables', label: 'Final Deliverables', placeholder: 'List all deliverables completed and handed over to the client…' },
              { key: 'challenges', label: 'Key Challenges & How They Were Resolved', placeholder: 'Describe major issues encountered and the resolution approach…' },
              { key: 'clientFeedback', label: 'Client Feedback', placeholder: 'Record formal client feedback or acceptance comments…' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1">{label}</label>
                <textarea
                  value={(report as any)[key]}
                  onChange={e => setReport(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border bg-background text-sm px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Project Ratings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'teamRating', label: 'Team Performance' },
                { key: 'qualityRating', label: 'Quality of Deliverables' },
                { key: 'timeRating', label: 'Timeline Adherence' },
                { key: 'budgetRating', label: 'Budget Management' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <StarRating value={(report as any)[key]} onChange={r => setReport(p => ({ ...p, [key]: r }))} />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={goPrev}>Back</Button>
            <Button disabled={!report.executiveSummary.trim()} onClick={goNext}>Next <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ── Lessons Learned ── */}
      {step === 'lessons' && (
        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-4">
            {[
              { key: 'whatWentWell', label: 'What Went Well', placeholder: 'Practices, approaches, or decisions that worked effectively…' },
              { key: 'whatCouldImprove', label: 'What Could Be Improved', placeholder: 'Areas that need a different approach in future projects…' },
              { key: 'recommendations', label: 'Recommendations for Future Projects', placeholder: 'Specific recommendations for similar projects in future…' },
              { key: 'risksThatMaterialised', label: 'Risks That Materialised', placeholder: 'Document risks that actually occurred and their impact…' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium block mb-1">{label}</label>
                <textarea
                  value={(lessons as any)[key]}
                  onChange={e => setLessons(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border bg-background text-sm px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </CardContent></Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={goPrev}>Back</Button>
            <Button onClick={goNext}>Next <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ── Review ── */}
      {step === 'review' && selectedProject && (
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="font-medium">Final confirmation required. This action cannot be undone. The project will be permanently locked.</span>
          </div>
          {[
            { label: 'Project', value: `${selectedProject.name} (${selectedProject.key})` },
            { label: 'Division', value: selectedProject.division },
            { label: 'PM', value: selectedProject.pm },
            { label: 'Budget', value: `${fmtCr(selectedProject.actualSpend)} actual / ${fmtCr(selectedProject.budget)} planned` },
            { label: 'Milestones', value: `${selectedProject.completedMilestones}/${selectedProject.milestones} completed` },
            { label: 'Checklist', value: `${Object.values(checklist).filter(Boolean).length}/${CHECKLIST_ITEMS.length} items ticked` },
            { label: 'Report', value: report.executiveSummary ? '✓ Completed' : '⚠ Incomplete' },
            { label: 'Lessons Learned', value: lessons.whatWentWell ? '✓ Completed' : 'Skipped' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm border-b pb-2">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={goPrev}>Back</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setStep('done')}>
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Confirm Closure
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
