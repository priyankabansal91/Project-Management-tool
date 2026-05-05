import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreProjectStore } from '@/store/preProjectStore';
import {
  ArrowLeft, ArrowRight, Check, FilePlus2, IndianRupee,
  FileText, Eye, Plus, Trash2, Info, Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── types ─────────────────────────────────────────────────────────────────────

interface DocEntry { name: string; type: string; required: boolean; }
interface BudgetLine { category: string; amount: string; }

interface FormState {
  tenderId: string; title: string; clientName: string; clientDeptCode: string;
  description: string; priority: string; division: string; assignedPm: string;
  estimatedBudget: string;
  budgetLines: BudgetLine[];
  documents: DocEntry[];
}

// ── constants ─────────────────────────────────────────────────────────────────

const DIVISIONS = ['Infrastructure', 'Water Resources', 'Education', 'Health', 'Energy', 'Transport'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const DOC_TYPES = ['DPR', 'EIA', 'LAP', 'FFR', 'EC', 'NOC', 'SURVEY', 'OTHER'];
const SAMPLE_PMS = ['Bob Kumar', 'Priya Singh', 'Deepak Nair', 'Anita Joshi', 'Suresh Dev'];

const DEFAULT_BUDGET_LINES: BudgetLine[] = [
  { category: 'Civil Works', amount: '' },
  { category: 'Equipment & Machinery', amount: '' },
  { category: 'Labour', amount: '' },
  { category: 'Consultancy', amount: '' },
  { category: 'Contingency (5%)', amount: '' },
];

const DEFAULT_DOCS: DocEntry[] = [
  { name: '', type: 'DPR', required: true },
  { name: '', type: 'EIA', required: true },
  { name: '', type: 'FFR', required: false },
];

const STEPS = [
  { label: 'Basic Info', icon: Info },
  { label: 'Budget', icon: IndianRupee },
  { label: 'Documents', icon: FileText },
  { label: 'Review', icon: Eye },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtLakh(val: string) {
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function totalBudget(lines: BudgetLine[]) {
  return lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
}

// ── step components ───────────────────────────────────────────────────────────

function Step1({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const f = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium mb-1 block">Tender ID <span className="text-red-500">*</span></label>
          <input value={form.tenderId} onChange={f('tenderId')}
            placeholder="e.g. TDR/2026/HWY/004"
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
          <p className="text-[10px] text-muted-foreground mt-1">Format: TDR/YEAR/DEPT/SEQ</p>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Priority <span className="text-red-500">*</span></label>
          <select value={form.priority} onChange={f('priority')}
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium mb-1 block">Project Title <span className="text-red-500">*</span></label>
          <input value={form.title} onChange={f('title')}
            placeholder="e.g. NH-46 Highway Widening Phase III"
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Client / Organisation <span className="text-red-500">*</span></label>
          <input value={form.clientName} onChange={f('clientName')}
            placeholder="e.g. MPRDC"
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Client Department Code</label>
          <input value={form.clientDeptCode} onChange={f('clientDeptCode')}
            placeholder="e.g. MPRDC/2026/BMP/HWY"
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Division <span className="text-red-500">*</span></label>
          <select value={form.division} onChange={f('division')}
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select division…</option>
            {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Assign Project Manager</label>
          <select value={form.assignedPm} onChange={f('assignedPm')}
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select PM…</option>
            {SAMPLE_PMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium mb-1 block">Project Description <span className="text-red-500">*</span></label>
          <textarea value={form.description} onChange={f('description')}
            placeholder="Describe the scope, objectives, location, and key activities of this project…"
            className="w-full rounded-lg border bg-background text-sm px-3 py-2 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
    </div>
  );
}

function Step2({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const total = totalBudget(form.budgetLines);

  const updateLine = (idx: number, field: keyof BudgetLine, val: string) =>
    setForm(p => ({ ...p, budgetLines: p.budgetLines.map((l, i) => i === idx ? { ...l, [field]: val } : l) }));

  const addLine = () => setForm(p => ({ ...p, budgetLines: [...p.budgetLines, { category: '', amount: '' }] }));
  const removeLine = (idx: number) => setForm(p => ({ ...p, budgetLines: p.budgetLines.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium mb-1 block">Total Estimated Budget (₹) <span className="text-red-500">*</span></label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={form.estimatedBudget}
            onChange={e => setForm(p => ({ ...p, estimatedBudget: e.target.value }))}
            placeholder="e.g. 84000000"
            type="number"
            className="w-full pl-8 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {form.estimatedBudget && (
          <p className="text-xs text-muted-foreground mt-1">{fmtLakh(form.estimatedBudget)}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium">Budget Breakdown by Category</label>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLine}>
            <Plus className="h-3 w-3 mr-1" /> Add Category
          </Button>
        </div>
        <div className="space-y-2">
          {form.budgetLines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={line.category}
                onChange={e => updateLine(idx, 'category', e.target.value)}
                placeholder="Category name"
                className="flex-1 rounded-lg border bg-background text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="relative w-40">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="number"
                  value={line.amount}
                  onChange={e => updateLine(idx, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="w-full pl-7 pr-2 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {form.budgetLines.length > 1 && (
                <button onClick={() => removeLine(idx)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border">
            <span className="text-xs font-semibold">Sum of breakdown</span>
            <span className={cn('text-xs font-bold', Math.abs(total - parseFloat(form.estimatedBudget || '0')) > 10000 ? 'text-amber-600' : 'text-emerald-600')}>
              {fmtLakh(String(total))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Step3({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const updateDoc = (idx: number, field: keyof DocEntry, val: string | boolean) =>
    setForm(p => ({ ...p, documents: p.documents.map((d, i) => i === idx ? { ...d, [field]: val } : d) }));

  const addDoc = () => setForm(p => ({ ...p, documents: [...p.documents, { name: '', type: 'OTHER', required: false }] }));
  const removeDoc = (idx: number) => setForm(p => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        <p className="font-semibold mb-1">Required documents for government pre-project approval:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Detailed Project Report (DPR) — mandatory</li>
          <li>Environmental Impact Assessment (EIA) — mandatory for infrastructure</li>
          <li>Financial Feasibility Report (FFR)</li>
          <li>Land Acquisition Plan (if applicable)</li>
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium">Document List</label>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addDoc}>
            <Plus className="h-3 w-3 mr-1" /> Add Document
          </Button>
        </div>
        <div className="space-y-2">
          {form.documents.map((doc, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 rounded-xl border bg-muted/20">
              <select
                value={doc.type}
                onChange={e => updateDoc(idx, 'type', e.target.value)}
                className="w-28 rounded-lg border bg-background text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                value={doc.name}
                onChange={e => updateDoc(idx, 'name', e.target.value)}
                placeholder="Document name / description"
                className="flex-1 rounded-lg border bg-background text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0">
                <input type="checkbox" checked={doc.required} onChange={e => updateDoc(idx, 'required', e.target.checked)} className="rounded" />
                Required
              </label>
              {form.documents.length > 1 && (
                <button onClick={() => removeDoc(idx)} className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Actual files can be uploaded after creation. Enter document names here to create placeholders.</p>
      </div>
    </div>
  );
}

function Step4({ form }: { form: FormState }) {
  const total = totalBudget(form.budgetLines);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
        Review all details before saving. You can still edit later while in DRAFT status.
      </div>
      {[
        {
          title: 'Basic Information',
          rows: [
            ['Tender ID', form.tenderId], ['Title', form.title], ['Client', form.clientName],
            ['Department Code', form.clientDeptCode], ['Division', form.division],
            ['PM', form.assignedPm], ['Priority', form.priority],
          ],
        },
        {
          title: 'Budget',
          rows: [
            ['Total Budget', fmtLakh(form.estimatedBudget)],
            ['Budget Lines', `${form.budgetLines.filter(l => l.category && l.amount).length} categories`],
            ['Breakdown Total', fmtLakh(String(total))],
          ],
        },
        {
          title: 'Documents',
          rows: [
            ['Total Documents', String(form.documents.length)],
            ['Required', String(form.documents.filter(d => d.required).length)],
            ['Types', [...new Set(form.documents.map(d => d.type))].join(', ')],
          ],
        },
      ].map(({ title, rows }) => (
        <div key={title} className="rounded-xl border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2 border-b">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          </div>
          <div className="divide-y">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── main form page ────────────────────────────────────────────────────────────

export function PreProjectFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [newId, setNewId] = useState('');
  const addProject = usePreProjectStore((s) => s.addProject);
  const [form, setForm] = useState<FormState>({
    tenderId: '', title: '', clientName: '', clientDeptCode: '',
    description: '', priority: 'HIGH', division: '', assignedPm: '',
    estimatedBudget: '',
    budgetLines: DEFAULT_BUDGET_LINES,
    documents: DEFAULT_DOCS,
  });

  const canNext = [
    () => !!(form.tenderId && form.title && form.clientName && form.division && form.description),
    () => !!(form.estimatedBudget),
    () => form.documents.every(d => !d.required || d.name),
    () => true,
  ];

  if (saved) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4 mt-16">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Pre-Project Saved!</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{form.title}</span> has been created in DRAFT status. Submit it for approval when ready.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate('/preproject')}>View All</Button>
          <Button onClick={() => navigate(`/preproject/${newId}`)}>Open Pre-Project</Button>
        </div>
      </div>
    );
  }

  const STEP_COMPONENTS = [
    <Step1 key="1" form={form} setForm={setForm} />,
    <Step2 key="2" form={form} setForm={setForm} />,
    <Step3 key="3" form={form} setForm={setForm} />,
    <Step4 key="4" form={form} />,
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/preproject')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FilePlus2 className="h-6 w-6 text-primary" /> New Pre-Project
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Register a tender-stage submission for pre-execution approval</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                i < step ? 'bg-emerald-500 text-white' :
                i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium whitespace-nowrap', i === step ? 'text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {STEP_COMPONENTS[step]}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/preproject')}
          className="flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext[step]()} onClick={() => setStep(s => s + 1)}>
            Next <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
            const id = `pp-${Date.now().toString(36)}`;
            addProject({
              id,
              tenderId: form.tenderId,
              title: form.title,
              clientName: form.clientName,
              division: form.division,
              assignedPm: form.assignedPm,
              estimatedBudget: parseFloat(form.estimatedBudget) || 0,
              priority: form.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
              status: 'DRAFT',
              submittedAt: null,
              stepStartedAt: null,
              slaThreshold: 48,
              docsCount: form.documents.filter(d => d.name).length,
              createdAt: new Date().toISOString(),
            });
            setNewId(id);
            setSaved(true);
          }}>
            <Check className="h-3.5 w-3.5 mr-1.5" /> Save Pre-Project
          </Button>
        )}
      </div>
    </div>
  );
}
