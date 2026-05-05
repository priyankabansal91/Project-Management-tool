import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Plus, X, Calendar, Timer, Play, Square,
  CheckCircle2, XCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, FileText, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMyTimeLogs, useWeeklySummary, useLogTime, useDeleteTimeLog,
  useSubmitTimesheet, useTimesheets, useApproveTimesheet, useRejectTimesheet,
  useProjects,
} from '@/api/hooks';
import { PermissionGate } from '@/components/shared/PermissionGate';

// ─── Helpers ──────────────────────────────────────────────

type Tab = 'timer' | 'timesheet' | 'log' | 'approvals';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  draft:     'bg-gray-100 text-gray-700',
};

function getMostRecentMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatWeek(start: string): string {
  const end = addDays(start, 6);
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ─── Main page ────────────────────────────────────────────

export function TimeLoggingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('timesheet');

  // ── Timer state ────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerDesc, setTimerDesc] = useState('');
  const [timerSaved, setTimerSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  // ── Week navigation ────────────────────────────────────
  const [weekStart, setWeekStart] = useState(getMostRecentMonday);
  const currentWeek = getMostRecentMonday();
  const isCurrentWeek = weekStart === currentWeek;

  // ── API hooks ──────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading } = useWeeklySummary(weekStart);
  const { data: _myLogsRaw = [], isLoading: logsLoading } = useMyTimeLogs({ weekStart });
  const myLogs: any[] = Array.isArray(_myLogsRaw) ? _myLogsRaw : (_myLogsRaw as any)?.items ?? [];
  const { data: _timesheetsRaw = [], isLoading: tsLoading } = useTimesheets();
  const timesheets: any[] = Array.isArray(_timesheetsRaw) ? _timesheetsRaw : (_timesheetsRaw as any)?.items ?? [];
  const { data: projectsData } = useProjects();
  const projects: any[] = (projectsData as any)?.items ?? [];

  const logTimeMutation     = useLogTime();
  const deleteLogMutation   = useDeleteTimeLog();
  const submitTsMutation    = useSubmitTimesheet();
  const approveTsMutation   = useApproveTimesheet();
  const rejectTsMutation    = useRejectTimesheet();

  // ── Log form ───────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const [logForm, setLogForm] = useState({ projectId: '', hours: '', description: '', loggedDate: today });
  const [logError, setLogError] = useState('');

  // ── Review modal ───────────────────────────────────────
  const [reviewModal, setReviewModal] = useState<{ tsId: string; action: 'approve' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // ── Timer: stop & auto-log ─────────────────────────────
  const handleTimerStop = () => {
    setTimerRunning(false);
    if (timerSeconds < 60) { setTimerSeconds(0); return; }
    const hours = Math.round((timerSeconds / 3600) * 4) / 4; // nearest 0.25h
    if (hours > 0) {
      logTimeMutation.mutate(
        { projectId: timerProjectId || undefined, hours, description: timerDesc || 'Timer log', loggedDate: today },
        { onSuccess: () => { setTimerSaved(true); setTimeout(() => setTimerSaved(false), 3000); } },
      );
    }
    setTimerSeconds(0);
    setTimerDesc('');
  };

  // ── Manual log submit ──────────────────────────────────
  const handleLogSubmit = () => {
    const h = parseFloat(logForm.hours);
    if (!logForm.hours || isNaN(h) || h <= 0) { setLogError('Enter valid hours (e.g. 2.5)'); return; }
    setLogError('');
    logTimeMutation.mutate(
      { projectId: logForm.projectId || undefined, hours: h, description: logForm.description, loggedDate: logForm.loggedDate },
      { onSuccess: () => setLogForm({ projectId: '', hours: '', description: '', loggedDate: today }) },
    );
  };

  // ── Approve/Reject submit ──────────────────────────────
  const handleReview = () => {
    if (!reviewModal) return;
    if (reviewModal.action === 'approve') {
      approveTsMutation.mutate({ timesheetId: reviewModal.tsId, note: reviewNote || undefined });
    } else {
      if (!reviewNote.trim()) return;
      rejectTsMutation.mutate({ timesheetId: reviewModal.tsId, note: reviewNote });
    }
    setReviewModal(null);
    setReviewNote('');
  };

  // ── Derived weekly stats ───────────────────────────────
  const totalHrs  = summary?.totalHours ?? 0;
  const targetHrs = summary?.targetHours ?? 40;
  const pct       = Math.min(Math.round((totalHrs / targetHrs) * 100), 100);
  const tsStatus  = summary?.timesheetStatus;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'timer',     label: 'Timer',       icon: Timer    },
    { id: 'timesheet', label: 'Timesheet',   icon: Calendar },
    { id: 'log',       label: 'Log Entries', icon: Clock    },
    { id: 'approvals', label: 'Approvals',   icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Time Tracking
          </h1>
          <p className="text-muted-foreground text-sm">Log time, submit timesheets, and review approvals</p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['myTimeLogs'] });
            qc.invalidateQueries({ queryKey: ['weeklySummary'] });
            qc.invalidateQueries({ queryKey: ['timesheets'] });
          }}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40',
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── TIMER TAB ──────────────────────────────────────── */}
      {activeTab === 'timer' && (
        <div className="max-w-md mx-auto space-y-5">
          <Card className={cn('p-8 text-center transition-colors', timerRunning && 'border-primary/60 shadow-md')}>
            <p className={cn(
              'font-mono text-6xl font-bold tabular-nums tracking-widest transition-colors',
              timerRunning ? 'text-primary' : 'text-muted-foreground',
            )}>
              {fmtSeconds(timerSeconds)}
            </p>
            {timerRunning && <p className="text-xs text-primary/70 mt-2 animate-pulse">Timer running…</p>}
            {timerSaved && <p className="text-xs text-green-600 mt-2">Time logged successfully</p>}
          </Card>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Project (optional)</label>
              <select
                value={timerProjectId}
                onChange={(e) => setTimerProjectId(e.target.value)}
                disabled={timerRunning}
                className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
              >
                <option value="">No project</option>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.key} – {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={timerDesc}
                onChange={(e) => setTimerDesc(e.target.value)}
                placeholder="What are you working on?"
                disabled={timerRunning}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {!timerRunning ? (
              <Button className="flex-1 h-12 text-base" onClick={() => { setTimerRunning(true); setTimerSeconds(0); }}>
                <Play className="h-5 w-5 mr-2" /> Start Timer
              </Button>
            ) : (
              <Button variant="destructive" className="flex-1 h-12 text-base" onClick={handleTimerStop}>
                <Square className="h-5 w-5 mr-2" /> Stop & Log
              </Button>
            )}
            {!timerRunning && timerSeconds > 0 && (
              <Button variant="outline" onClick={() => setTimerSeconds(0)}>Reset</Button>
            )}
          </div>

          {timerRunning && (
            <p className="text-center text-xs text-muted-foreground">
              Timer is running. Click <strong>Stop & Log</strong> to save the entry.
            </p>
          )}
        </div>
      )}

      {/* ── TIMESHEET TAB ──────────────────────────────────── */}
      {activeTab === 'timesheet' && (
        <div className="space-y-4">
          {/* Week navigator */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addDays(w, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold">{formatWeek(weekStart)}</p>
              {isCurrentWeek && <span className="text-xs text-primary">Current Week</span>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setWeekStart((w) => addDays(w, 7))} disabled={isCurrentWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {summaryLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {/* Hours progress */}
              <Card className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">{totalHrs}h logged</span>
                  <span className="text-muted-foreground">Target: {targetHrs}h</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={cn('h-3 rounded-full transition-all', totalHrs >= targetHrs ? 'bg-green-500' : 'bg-primary')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{pct}% of weekly target</p>
              </Card>

              {/* Daily breakdown grid */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, idx) => {
                      const _dayVal = summary?.byDay?.[day];
                      const hrs: number = typeof _dayVal === 'number' ? _dayVal : ((_dayVal as any)?.hours ?? 0);
                      const dayDate = addDays(weekStart, idx);
                      const isToday = dayDate === today;
                      return (
                        <div
                          key={day}
                          className={cn(
                            'text-center p-2 rounded-lg border',
                            isToday ? 'border-primary bg-primary/5' : 'border-border',
                          )}
                        >
                          <p className="text-[10px] font-medium text-muted-foreground">{day}</p>
                          <p className={cn(
                            'text-lg font-bold',
                            hrs === 0 ? 'text-muted-foreground/30' : hrs >= 8 ? 'text-green-600' : 'text-foreground',
                          )}>
                            {hrs > 0 ? hrs : '–'}
                          </p>
                          {hrs > 0 && <p className="text-[9px] text-muted-foreground">hrs</p>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Per-project breakdown */}
              {(summary?.byProject ?? []).length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">By Project</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {summary!.byProject.map((p: any) => (
                      <div key={p.projectKey} className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs w-20 justify-center shrink-0">{p.projectKey}</Badge>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.min((p.hours / Math.max(totalHrs, 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right shrink-0">{p.hours}h</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Timesheet submit / status */}
              <Card className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold">Timesheet Status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tsStatus ? 'Submitted for review' : 'Not yet submitted'}
                    </p>
                  </div>
                  {tsStatus ? (
                    <span className={cn('px-3 py-1 rounded-full text-xs font-semibold capitalize', STATUS_STYLES[tsStatus] || STATUS_STYLES.draft)}>
                      {tsStatus}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={totalHrs === 0 || submitTsMutation.isPending}
                      onClick={() => submitTsMutation.mutate({ weekStart })}
                    >
                      {submitTsMutation.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        : <FileText className="h-3.5 w-3.5 mr-1" />}
                      Submit Timesheet
                    </Button>
                  )}
                </div>
                {tsStatus === 'rejected' && (
                  <div className="mt-3 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    This timesheet was rejected. Make any corrections and resubmit.
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => submitTsMutation.mutate({ weekStart })}>
                        Resubmit
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── LOG ENTRIES TAB ────────────────────────────────── */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Add log form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Log Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Project</label>
                  <select
                    value={logForm.projectId}
                    onChange={(e) => setLogForm((p) => ({ ...p, projectId: e.target.value }))}
                    className="mt-1 w-full rounded-md border p-2 text-sm bg-background"
                  >
                    <option value="">No project</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.key} – {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input
                    type="date"
                    value={logForm.loggedDate}
                    onChange={(e) => setLogForm((p) => ({ ...p, loggedDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Hours</label>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Input
                    type="number" step="0.25" min="0.25" max="24"
                    value={logForm.hours}
                    onChange={(e) => setLogForm((p) => ({ ...p, hours: e.target.value }))}
                    placeholder="e.g. 2.5"
                    className="w-28"
                  />
                  <div className="flex gap-1">
                    {['0.5', '1', '2', '4', '8'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setLogForm((p) => ({ ...p, hours: h }))}
                        className={cn(
                          'rounded border px-2.5 py-1.5 text-xs transition-colors',
                          logForm.hours === h ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-accent',
                        )}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  className="mt-1 w-full rounded-md border p-2 text-sm resize-none h-16 bg-background"
                  value={logForm.description}
                  onChange={(e) => setLogForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What did you work on?"
                />
              </div>

              {logError && <p className="text-xs text-red-600">{logError}</p>}

              <Button onClick={handleLogSubmit} disabled={logTimeMutation.isPending} size="sm">
                {logTimeMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  : <Plus className="h-3.5 w-3.5 mr-1" />}
                Add Entry
              </Button>
            </CardContent>
          </Card>

          {/* Log list */}
          {logsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (myLogs as any[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No time entries for this week. Start logging above!</p>
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {(myLogs as any[]).map((log: any) => (
                  <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 group transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.projectKey && (
                          <Badge variant="outline" className="font-mono text-[10px] shrink-0">{log.projectKey}</Badge>
                        )}
                        <span className="text-sm truncate">{log.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.loggedDate).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-semibold">
                      <Clock className="h-3 w-3 mr-1" />{log.hours}h
                    </Badge>
                    <button
                      onClick={() => deleteLogMutation.mutate(log.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                      title="Delete entry"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── APPROVALS TAB ──────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <PermissionGate
          permission="approval:approve"
          fallback={
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>You need manager or admin access to review timesheets.</p>
            </div>
          }
        >
          {tsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (timesheets as any[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No timesheets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(timesheets as any[]).map((ts: any) => (
                <Card key={ts.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{ts.userName || ts.userId}</p>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[ts.status] || STATUS_STYLES.draft)}>
                          {ts.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Week of {new Date(ts.weekStart).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} · {ts.totalHours}h total
                      </p>
                      {ts.reviewNote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Note: {ts.reviewNote}</p>
                      )}
                    </div>
                    {ts.status === 'submitted' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm" variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => { setReviewModal({ tsId: ts.id, action: 'approve' }); setReviewNote(''); }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => { setReviewModal({ tsId: ts.id, action: 'reject' }); setReviewNote(''); }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </PermissionGate>
      )}

      {/* ── Review modal ───────────────────────────────────── */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setReviewModal(null)}>
          <Card className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold capitalize">{reviewModal.action} Timesheet</h2>
                <button onClick={() => setReviewModal(null)}><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {reviewModal.action === 'reject' ? 'Reason (required)' : 'Note (optional)'}
                </label>
                <textarea
                  className="w-full rounded-md border p-2 text-sm resize-none h-20 bg-background"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewModal.action === 'reject'
                      ? 'Explain why this timesheet is being rejected…'
                      : 'Optional note for the submitter…'
                  }
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
                <Button
                  variant={reviewModal.action === 'reject' ? 'destructive' : 'default'}
                  onClick={handleReview}
                  disabled={reviewModal.action === 'reject' && !reviewNote.trim()}
                >
                  {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
