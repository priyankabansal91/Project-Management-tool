import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Download, Mail, Calendar, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, Sparkles, Eye, Send, Copy, Printer, Building2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RAG = 'green' | 'amber' | 'red';
const ragColors: Record<RAG, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'On Track' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'At Risk' },
  red: { bg: 'bg-red-100', text: 'text-red-700', label: 'Off Track' },
};

interface WeeklyReport {
  id: string;
  week_ending: string;
  generated_at: string;
  generated_by: 'ai' | 'manual';
  project: string;
  project_key: string;
  division: string;
  health: RAG;
  prev_health: RAG;
  highlights: string[];
  risks: string[];
  blockers: string[];
  next_steps: string[];
  metrics: { tasks_completed: number; tasks_added: number; velocity: number; burn_pct: number };
  ai_summary: string;
  sent_to: string[];
  status: 'draft' | 'sent' | 'viewed';
}

const mockReports: WeeklyReport[] = [
  {
    id: 'r1', week_ending: '2026-04-19', generated_at: '2026-04-19T09:00:00Z', generated_by: 'ai',
    project: 'Customer Portal Redesign', project_key: 'CPR', division: 'Product Engineering',
    health: 'green', prev_health: 'green',
    highlights: ['Completed authentication module — all 12 stories accepted', 'Settings page design approved by stakeholders', 'Performance testing shows 200ms P95 response time'],
    risks: ['Beta deadline Apr 30 is achievable but tight — 8 stories remaining'],
    blockers: [],
    next_steps: ['Begin beta deployment to staging', 'Schedule UAT sessions with pilot customers', 'Finalize accessibility audit remediations'],
    metrics: { tasks_completed: 14, tasks_added: 3, velocity: 28, burn_pct: 56 },
    ai_summary: 'CPR remains on track with strong velocity. The authentication module is complete and settings page approved. The team needs to maintain current pace to hit the April 30 beta target — 8 stories remain. No blockers. Budget burn (56%) aligns well with scope completion.',
    sent_to: ['emily.zhang@acme.com', 'vp-engineering@acme.com'],
    status: 'sent',
  },
  {
    id: 'r2', week_ending: '2026-04-19', generated_at: '2026-04-19T09:00:00Z', generated_by: 'ai',
    project: 'API Gateway Migration', project_key: 'AGM', division: 'Platform Engineering',
    health: 'red', prev_health: 'amber',
    highlights: ['Auth endpoints migration verified in staging'],
    risks: ['Key developer (Raj) on medical leave until May — no backfill identified', 'Payment endpoint migration blocked by vendor API changes', '8 overdue tasks creating downstream delays for MAV2 and DAD'],
    blockers: ['Vendor API v3 documentation delayed — blocking payment migration', 'No replacement dev for Raj identified'],
    next_steps: ['Escalate vendor API issue to VP level', 'Evaluate contractor backfill for Raj', 'Rebaseline schedule with 2-week buffer'],
    metrics: { tasks_completed: 4, tasks_added: 2, velocity: 12, burn_pct: 62 },
    ai_summary: 'AGM has degraded from Amber to Red. While auth migration is verified, the payment endpoint work is blocked by vendor delays and a key developer absence. Budget burn (62%) significantly exceeds scope completion (33%) — this project needs immediate leadership attention. Recommend escalating vendor issue and securing contractor backfill.',
    sent_to: ['david.park@acme.com', 'vp-engineering@acme.com', 'cto@acme.com'],
    status: 'viewed',
  },
  {
    id: 'r3', week_ending: '2026-04-19', generated_at: '2026-04-19T09:00:00Z', generated_by: 'ai',
    project: 'Mobile App v2', project_key: 'MAV2', division: 'Product Engineering',
    health: 'amber', prev_health: 'green',
    highlights: ['Core navigation module fully tested', 'Push notification POC successful on both iOS and Android'],
    risks: ['Offline sync module has 5 overdue tasks — dependency on AGM API migration', 'App Store review process may take 2+ weeks — need buffer'],
    blockers: ['Offline data sync requires new AGM endpoints (blocked by AGM delays)'],
    next_steps: ['Implement offline queue with fallback mode', 'Begin App Store pre-submission checklist', 'Schedule design review for offline UX'],
    metrics: { tasks_completed: 9, tasks_added: 4, velocity: 22, burn_pct: 42 },
    ai_summary: 'MAV2 moved from Green to Amber due to AGM dependency. Push notifications are working but the offline module is blocked. Team is exploring a fallback queue approach. Budget is healthy (42% spent at 41% completion). Key risk is App Store review timeline.',
    sent_to: ['james.wright@acme.com', 'vp-engineering@acme.com'],
    status: 'sent',
  },
  {
    id: 'r4', week_ending: '2026-04-12', generated_at: '2026-04-12T09:00:00Z', generated_by: 'ai',
    project: 'Customer Portal Redesign', project_key: 'CPR', division: 'Product Engineering',
    health: 'green', prev_health: 'green',
    highlights: ['Login/registration flow complete', '10 stories closed this sprint'],
    risks: [],
    blockers: [],
    next_steps: ['Start auth module integration testing', 'Begin settings page wireframes'],
    metrics: { tasks_completed: 10, tasks_added: 2, velocity: 26, burn_pct: 48 },
    ai_summary: 'Solid week for CPR. Login flow delivered, velocity steady at 26 SP. No risks or blockers.',
    sent_to: ['emily.zhang@acme.com'],
    status: 'viewed',
  },
];

export function StatusReportsPage() {
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(mockReports[0]);
  const [filterWeek, setFilterWeek] = useState('2026-04-19');
  const [filterProject, setFilterProject] = useState('all');

  const weeks = [...new Set(mockReports.map((r) => r.week_ending))].sort().reverse();
  const projectKeys = [...new Set(mockReports.map((r) => r.project_key))];

  const filtered = mockReports.filter((r) => {
    if (r.week_ending !== filterWeek) return false;
    if (filterProject !== 'all' && r.project_key !== filterProject) return false;
    return true;
  });

  const handleGenerate = () => alert('Generating AI-powered status reports for all active projects...\n\nClaude AI analyzes: tasks completed, velocity, overdue items, health changes, and risks to auto-write executive summaries.');
  const handleEmailAll = () => alert(`Sending ${filtered.length} reports to configured stakeholders...`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Status Reports</h1>
          <p className="text-muted-foreground">AI-generated weekly status reports for stakeholders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            <Sparkles className="h-3.5 w-3.5" /> Generate This Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmailAll}>
            <Send className="h-3.5 w-3.5" /> Email All
          </Button>
          <Button size="sm" onClick={() => alert('Exporting all reports as PDF bundle...')}>
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterWeek} onChange={(e) => { setFilterWeek(e.target.value); setSelectedReport(null); }} className="rounded-md border bg-background px-3 py-1.5 text-sm">
          {weeks.map((w) => <option key={w} value={w}>Week ending {w}</option>)}
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="rounded-md border bg-background px-3 py-1.5 text-sm">
          <option value="all">All Projects</option>
          {projectKeys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Report List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((r) => {
            const rag = ragColors[r.health];
            const changed = r.health !== r.prev_health;
            const isSelected = selectedReport?.id === r.id;
            return (
              <Card key={r.id} className={cn('p-4 cursor-pointer transition-all', isSelected && 'ring-2 ring-primary')} onClick={() => setSelectedReport(r)}>
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', rag.bg)}>
                    <FileText className={cn('h-5 w-5', rag.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{r.project_key}</Badge>
                      <span className="text-sm font-semibold truncate">{r.project}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn('text-[10px]', rag.bg, rag.text)}>{rag.label}</Badge>
                      {changed && (
                        <span className="text-[10px] text-red-600 font-medium">
                          Changed from {ragColors[r.prev_health].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Sparkles className="h-3 w-3" />AI generated</span>
                      <span className="flex items-center gap-0.5">{r.status === 'sent' ? <Send className="h-3 w-3" /> : r.status === 'viewed' ? <Eye className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{r.status}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground text-sm">No reports for selected filters</Card>}
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-3">
          {selectedReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{selectedReport.project_key}</Badge>
                      Weekly Status Report
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReport.project} &middot; {selectedReport.division} &middot; Week ending {selectedReport.week_ending}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => alert('Copied to clipboard')}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => alert('Opening print view...')}><Printer className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" onClick={() => alert(`Re-sending to: ${selectedReport.sent_to.join(', ')}`)}><Mail className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Health + Metrics */}
                <div className="grid grid-cols-5 gap-3">
                  <div className={cn('rounded-lg p-3 text-center', ragColors[selectedReport.health].bg)}>
                    <div className={cn('text-lg font-bold', ragColors[selectedReport.health].text)}>{ragColors[selectedReport.health].label}</div>
                    <div className="text-[10px] text-muted-foreground">Health</div>
                    {selectedReport.health !== selectedReport.prev_health && (
                      <div className="text-[10px] text-red-600 mt-0.5">was {ragColors[selectedReport.prev_health].label}</div>
                    )}
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-bold">{selectedReport.metrics.tasks_completed}</div>
                    <div className="text-[10px] text-muted-foreground">Completed</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-bold">{selectedReport.metrics.velocity} SP</div>
                    <div className="text-[10px] text-muted-foreground">Velocity</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-bold">+{selectedReport.metrics.tasks_added}</div>
                    <div className="text-[10px] text-muted-foreground">New Tasks</div>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-bold">{selectedReport.metrics.burn_pct}%</div>
                    <div className="text-[10px] text-muted-foreground">Budget Burn</div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">AI Executive Summary</span>
                  </div>
                  <p className="text-sm leading-relaxed">{selectedReport.ai_summary}</p>
                </div>

                {/* Sections */}
                <ReportSection icon={CheckCircle2} title="Highlights" items={selectedReport.highlights} color="text-emerald-600" />
                {selectedReport.risks.length > 0 && <ReportSection icon={AlertTriangle} title="Risks" items={selectedReport.risks} color="text-amber-600" />}
                {selectedReport.blockers.length > 0 && <ReportSection icon={Clock} title="Blockers" items={selectedReport.blockers} color="text-red-600" />}
                <ReportSection icon={ChevronRight} title="Next Steps" items={selectedReport.next_steps} color="text-blue-600" />

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t text-[11px] text-muted-foreground">
                  <span>Sent to: {selectedReport.sent_to.join(', ')}</span>
                  <span>Generated {new Date(selectedReport.generated_at).toLocaleDateString('en-GB')}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">Select a report to view details</Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportSection({ icon: Icon, title, items, color }: { icon: typeof CheckCircle2; title: string; items: string[]; color: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
        <Icon className={cn('h-4 w-4', color)} /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', color.replace('text-', 'bg-'))} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
