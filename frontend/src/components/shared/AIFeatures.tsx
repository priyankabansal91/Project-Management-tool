import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Sparkles, Wand2, FileText, BarChart3, UserCheck, Clock, MessageSquareText,
  Lightbulb, ChevronRight, Loader2, Check, Copy, Plus, X, Brain,
} from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';

// ─── AI Task Generator ──────────────────────────────────

interface GeneratedTask {
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  tags: string[];
}

export function AITaskGenerator({ projectId, onAddTasks }: { projectId?: string; onAddTasks?: (tasks: GeneratedTask[]) => void }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const mockGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setTasks([
        { title: 'Design WebSocket server architecture', description: 'Define connection pooling, authentication handshake, and message schema for real-time notifications.', priority: 'high', estimated_hours: 4, tags: ['backend', 'architecture'] },
        { title: 'Implement WebSocket server with Socket.io', description: 'Set up Socket.io server with namespaces for projects and rooms for task updates.', priority: 'high', estimated_hours: 8, tags: ['backend', 'websocket'] },
        { title: 'Build notification event dispatcher', description: 'Create event handlers that emit WebSocket events on task create/update/comment/assign.', priority: 'medium', estimated_hours: 6, tags: ['backend'] },
        { title: 'Add real-time UI updates in React', description: 'Integrate Socket.io client, update Kanban board and task list in real-time when events received.', priority: 'medium', estimated_hours: 6, tags: ['frontend', 'websocket'] },
        { title: 'Implement connection recovery and offline handling', description: 'Handle disconnect/reconnect gracefully, queue missed events, show connection status indicator.', priority: 'low', estimated_hours: 4, tags: ['frontend', 'reliability'] },
      ]);
      setSelected(new Set([0, 1, 2, 3, 4]));
      setLoading(false);
    }, 2000);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-100 p-2"><Wand2 className="h-5 w-5 text-purple-600" /></div>
          <div>
            <CardTitle className="text-base">AI Task Generator</CardTitle>
            <CardDescription>Describe a feature and Claude will break it into tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Build a real-time notification system with WebSockets that updates the Kanban board and sends push notifications..."
            className="flex-1 rounded-md border p-3 text-sm resize-none h-20 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['Notification system', 'User onboarding', 'Payment integration', 'Search feature'].map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <Button onClick={mockGenerate} disabled={!prompt.trim() || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Tasks</>}
          </Button>
        </div>

        {tasks.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{tasks.length} tasks generated</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set(tasks.map((_, i) => i)))}>Select All</Button>
                <Button size="sm" onClick={() => onAddTasks?.(tasks.filter((_, i) => selected.has(i)))} disabled={selected.size === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add {selected.size} Tasks
                </Button>
              </div>
            </div>
            {tasks.map((task, i) => (
              <div key={i} onClick={() => toggleSelect(i)} className={cn('flex gap-3 rounded-lg border p-3 cursor-pointer transition-all', selected.has(i) ? 'border-primary bg-primary/5' : 'hover:bg-accent/50')}>
                <div className={cn('h-5 w-5 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center', selected.has(i) ? 'bg-primary border-primary' : 'border-muted-foreground/30')}>
                  {selected.has(i) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={cn('text-[10px]', priorityColor(task.priority))}>{task.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground">{task.estimated_hours}h</span>
                    {task.tags.map((t) => <span key={t} className="text-[10px] rounded bg-secondary px-1.5 py-0.5">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Task Summary ────────────────────────────────────

export function AITaskSummary({ taskId }: { taskId?: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setSummary('The navigation component task is in progress. Carol is working on responsive layout and has fixed Safari animation issues reported by Bob. The Playwright cross-browser test suite now covers Safari. The task is estimated at 8 hours with 3.5 hours logged (44% complete). Ready for review once Carol finishes the mega-menu hover states. Expected completion: Feb 15.');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-purple-500" /> AI Summary
        </h4>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating...' : summary ? 'Refresh' : 'Generate'}
        </Button>
      </div>
      {summary && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 p-3">
          <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">{summary}</p>
          <button className="flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-800">
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AI Smart Assignee Suggestion ───────────────────────

export function AISmartAssign({ onSelect }: { onSelect?: (userId: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; reason: string; score: number }[]>([]);

  const suggest = () => {
    setLoading(true);
    setTimeout(() => {
      setSuggestions([
        { id: '3', name: 'Carol Johnson', reason: 'Has frontend expertise, completed similar nav tasks, lowest workload (4 open tasks)', score: 92 },
        { id: '4', name: 'David Park', reason: 'Strong React skills, but currently at capacity (6 open tasks)', score: 68 },
        { id: '2', name: 'Bob Martinez', reason: 'PM role, could review but not ideal for implementation', score: 35 },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={suggest} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><UserCheck className="h-3.5 w-3.5" /> AI Suggest Assignee</>}
      </Button>
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect?.(s.id)}
              className="flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left hover:bg-accent/50 transition-colors"
            >
              <Avatar name={s.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Badge variant={s.score >= 80 ? 'default' : 'secondary'} className="text-[10px]">{s.score}%</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{s.reason}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Report Generator ────────────────────────────────

export function AIReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [reportType, setReportType] = useState<'weekly' | 'executive' | 'technical'>('weekly');

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const reports: Record<string, string> = {
        weekly: `**Weekly Status Report — Customer Portal Redesign (CPR)**\nPeriod: Feb 10 - Feb 16, 2026\n\n**Completed:**\n- Customer dashboard wireframes (CPR-3) — Done\n- CI/CD pipeline moved to In Review (CPR-4)\n\n**In Progress:**\n- Navigation component 44% complete (CPR-1) — Safari issues resolved\n- Google OAuth integration started (CPR-5)\n\n**Blocked:**\n- Authentication flow (CPR-2) waiting for security review\n\n**Risks:**\n- Auth flow is on the critical path; delay may impact Feb 20 deadline\n\n**Next Week:**\n- Complete navigation component\n- Begin authentication implementation\n- Sprint 3 ends Feb 24`,

        executive: `**Executive Summary — Q1 Progress**\n\nThe Customer Portal Redesign is 47% complete (7/15 tasks done). Sprint velocity has improved 8% over the last 3 sprints. The team is on track for the June 30 deadline with one risk: the authentication module needs a security review before Feb 20. Budget utilization is at 81% (86h of 106h estimated). No blockers requiring executive action.`,

        technical: `**Technical Status — Sprint 3**\n\nArchitecture decisions:\n- Adopted JWT refresh token rotation (RFC 6749)\n- Navigation uses @dnd-kit for accessible drag-and-drop\n- Google OAuth via Passport.js strategy\n\nTech debt:\n- Need to add Playwright E2E tests (currently only unit tests)\n- CSS bundle size growing — consider CSS code splitting\n- PgBouncer connection pool at 60% capacity\n\nPerformance:\n- API p95 latency: 120ms\n- Frontend LCP: 1.8s (target: <2.5s)\n- DB query count: avg 3.2 per API call`,
      };
      setReport(reports[reportType]);
      setLoading(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-100 p-2"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
          <div>
            <CardTitle className="text-base">AI Report Generator</CardTitle>
            <CardDescription>Generate natural-language project reports with Claude</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['weekly', 'executive', 'technical'] as const).map((type) => (
            <button key={type} onClick={() => { setReportType(type); setReport(''); }}
              className={cn('rounded-md border px-3 py-1.5 text-sm capitalize', reportType === type ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-accent')}
            >{type}</button>
          ))}
        </div>

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating {reportType} report...</> : <><FileText className="h-4 w-4" /> Generate {reportType} Report</>}
        </Button>

        {report && (
          <div className="rounded-lg border bg-secondary/30 p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-1.5 ml-2 text-sm"><span>•</span><span>{line.replace('- ', '')}</span></div>;
                if (!line.trim()) return <br key={i} />;
                return <p key={i} className="text-sm">{line.replace(/\*\*/g, '')}</p>;
              })}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm"><Copy className="h-3.5 w-3.5" /> Copy</Button>
              <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5" /> Export PDF</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Features Page ───────────────────────────────────

export function AIFeaturesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" /> AI Features
        </h1>
        <p className="text-muted-foreground">Powered by Claude — generate tasks, summaries, reports, and smart suggestions</p>
      </div>

      {/* Feature cards overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Wand2, label: 'Task Generation', desc: 'Feature → task breakdown', color: 'purple' },
          { icon: Brain, label: 'Summaries', desc: 'Thread → concise summary', color: 'blue' },
          { icon: BarChart3, label: 'Reports', desc: 'Auto status reports', color: 'green' },
          { icon: UserCheck, label: 'Smart Assign', desc: 'Best-fit suggestions', color: 'orange' },
        ].map((f) => (
          <Card key={f.label} className="p-4">
            <div className={cn('rounded-lg p-2 w-fit mb-2', `bg-${f.color}-100`)}>
              <f.icon className={cn('h-5 w-5', `text-${f.color}-600`)} />
            </div>
            <p className="text-sm font-medium">{f.label}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </Card>
        ))}
      </div>

      <AITaskGenerator />
      <AIReportGenerator />
    </div>
  );
}
