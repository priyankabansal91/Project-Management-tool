import { useState } from 'react';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Wand2, FileText, BarChart3, UserCheck,
  Lightbulb, ChevronRight, Loader2, Check, Copy, Plus, Brain,
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
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setTasks([]);
    try {
      const { data } = await api.post('/ai/generate-tasks', { prompt });
      const generated: GeneratedTask[] = data.data.tasks;
      setTasks(generated);
      setSelected(new Set(generated.map((_, i) => i)));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate tasks. Check your API key.');
    } finally {
      setLoading(false);
    }
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
          <div className="flex gap-2 flex-wrap">
            {['Notification system', 'User onboarding', 'Payment integration', 'Search feature'].map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)} className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent transition-colors">
                {ex}
              </button>
            ))}
          </div>
          <Button onClick={generate} disabled={!prompt.trim() || loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Tasks</>}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

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

export function AITaskSummary({ task }: { task?: { title: string; description?: string; status?: string; priority?: string; comments?: any[]; timeLogged?: number; estimatedHours?: number } }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    if (!task) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/summarize-task', { task });
      setSummary(data.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => navigator.clipboard.writeText(summary);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Brain className="h-4 w-4 text-purple-500" /> AI Summary
        </h4>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading || !task}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating...' : summary ? 'Refresh' : 'Generate'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {summary && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 p-3">
          <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">{summary}</p>
          <button onClick={copy} className="flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-800">
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AI Smart Assignee Suggestion ───────────────────────

interface Member {
  id: string;
  name: string;
  role?: string;
  openTaskCount?: number;
  skills?: string[];
}

export function AISmartAssign({ taskDescription, members, onSelect }: { taskDescription?: string; members?: Member[]; onSelect?: (userId: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; reason: string; score: number }[]>([]);
  const [error, setError] = useState('');

  const suggest = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/suggest-assignee', {
        taskDescription: taskDescription || 'General development task',
        members: members || [],
      });
      setSuggestions(data.data.suggestions);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to get suggestions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={suggest} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</> : <><UserCheck className="h-3.5 w-3.5" /> AI Suggest Assignee</>}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect?.(s.id)}
              className="flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left hover:bg-accent/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                {s.name.charAt(0)}
              </div>
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

export function AIReportGenerator({ projectData }: { projectData?: { projectName?: string; tasks?: any[]; sprint?: any; team?: any[] } }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [reportType, setReportType] = useState<'weekly' | 'executive' | 'technical'>('weekly');
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setReport('');
    try {
      const { data } = await api.post('/ai/generate-report', {
        type: reportType,
        projectData: projectData || {},
      });
      setReport(data.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => navigator.clipboard.writeText(report);

  const renderMarkdown = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h5 key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace('### ', '')}</h5>;
      if (line.startsWith('## ')) return <h4 key={i} className="font-bold text-sm mt-3 mb-1">{line.replace('## ', '')}</h4>;
      if (line.startsWith('**') && line.endsWith('**')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
      if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-1.5 ml-2 text-sm"><span>•</span><span>{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</span></div>;
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="text-sm">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
    });

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
            <button key={type} onClick={() => { setReportType(type); setReport(''); setError(''); }}
              className={cn('rounded-md border px-3 py-1.5 text-sm capitalize', reportType === type ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-accent')}
            >{type}</button>
          ))}
        </div>

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating {reportType} report...</> : <><FileText className="h-4 w-4" /> Generate {reportType} Report</>}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {report && (
          <div className="rounded-lg border bg-secondary/30 p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {renderMarkdown(report)}
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI Task Review ─────────────────────────────────────

export function AITaskReview({ task }: { task?: { title: string; description?: string; acceptanceCriteria?: string[]; comments?: any[] } }) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
  const [error, setError] = useState('');

  const runReview = async () => {
    if (!task) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/review-task', { task });
      setReview(data.data.review);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to review task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-yellow-500" /> AI Task Review
        </h4>
        <Button variant="outline" size="sm" onClick={runReview} disabled={loading || !task}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Reviewing...' : 'Review Task'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {review && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 p-3 text-sm whitespace-pre-wrap leading-relaxed">
          {review}
        </div>
      )}
    </div>
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
