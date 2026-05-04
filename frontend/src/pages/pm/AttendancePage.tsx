import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore, STAKEHOLDER_PERSONAS } from '@/store/authStore';
import { useAttendanceStore, type LeaveType, type AttendanceStatus } from '@/store/attendanceStore';
import { Avatar } from '@/components/ui/avatar';
import {
  Clock, LogIn, LogOut, Calendar, CheckCircle, XCircle, Home, Umbrella,
  ChevronLeft, ChevronRight, BarChart3, Users, AlertCircle, Sun,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  present:  { label: 'Present',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  absent:   { label: 'Absent',   color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle     },
  leave:    { label: 'On Leave', color: 'text-orange-700', bg: 'bg-orange-100', icon: Umbrella    },
  wfh:      { label: 'WFH',      color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Home        },
  half_day: { label: 'Half Day', color: 'text-purple-700', bg: 'bg-purple-100', icon: Sun         },
  holiday:  { label: 'Holiday',  color: 'text-gray-700',   bg: 'bg-gray-100',   icon: Calendar    },
};

const LEAVE_TYPES: { value: LeaveType; label: string; color: string }[] = [
  { value: 'sick',     label: 'Sick Leave',     color: 'text-red-600'    },
  { value: 'casual',   label: 'Casual Leave',   color: 'text-blue-600'   },
  { value: 'earned',   label: 'Earned Leave',   color: 'text-green-600'  },
  { value: 'wfh',      label: 'Work From Home', color: 'text-purple-600' },
  { value: 'half_day', label: 'Half Day',       color: 'text-orange-600' },
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Live clock hook ──────────────────────────────────────

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ─── Main Page ────────────────────────────────────────────

type Tab = 'today' | 'weekly' | 'monthly' | 'team' | 'leave';

export function AttendancePage() {
  const { user, currentRole } = useAuthStore();
  const userId = user?.id || 'dev-member-id';
  const isManager = ['org_admin', 'division_admin', 'project_manager'].includes(currentRole || '');

  const {
    clockIn, clockOut, markLeave, markWFH,
    getRecord, getWeekRecords, getMonthRecords,
    getTodayStatus, getTeamAttendance, clockInTime, leaveBalance,
  } = useAttendanceStore();

  const now = useLiveClock();
  const today = todayStr();
  const todayRecord = getRecord(userId, today);
  const isClocked = !!clockInTime;

  // Duration of current session
  const currentSessionSecs = isClocked && clockInTime
    ? Math.floor((now.getTime() - new Date(clockInTime).getTime()) / 1000)
    : 0;

  const [tab, setTab] = useState<Tab>('today');
  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  // Leave form
  const [leaveForm, setLeaveForm] = useState({ date: today, leaveType: 'casual' as LeaveType, reason: '' });
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Weekly data
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekRecords = getWeekRecords(userId, weekStart);
  const totalHrsWeek = weekRecords.reduce((s, r) => s + (r.hoursWorked || 0), 0);
  const presentDays = weekRecords.filter((r) => r.status === 'present' || r.status === 'wfh').length;

  // Month data
  const monthRecords = getMonthRecords(userId, calYear, calMonth);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const monthPresent = monthRecords.filter((r) => r.status === 'present' || r.status === 'wfh').length;
  const monthLeave = monthRecords.filter((r) => r.status === 'leave').length;

  // Team attendance
  const teamAttendance = getTeamAttendance(today);
  const myBalance = leaveBalance[userId] || { sick: 10, casual: 12, earned: 15 };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim() && leaveForm.leaveType !== 'wfh') return;
    if (leaveForm.leaveType === 'wfh') {
      markWFH(userId, leaveForm.date);
    } else {
      markLeave(userId, leaveForm.date, leaveForm.leaveType, leaveForm.reason);
    }
    setLeaveSubmitted(true);
    setTimeout(() => setLeaveSubmitted(false), 3000);
    setLeaveForm({ date: today, leaveType: 'casual', reason: '' });
  };

  const ALL_TABS: { id: Tab; label: string; icon: React.ElementType; managerOnly?: boolean }[] = [
    { id: 'today',   label: 'Today',         icon: Clock    },
    { id: 'weekly',  label: 'This Week',     icon: BarChart3 },
    { id: 'monthly', label: 'Monthly',       icon: Calendar },
    { id: 'leave',   label: 'Leave Request', icon: Umbrella },
    { id: 'team',    label: 'Team View',     icon: Users, managerOnly: true },
  ];
  const TABS = ALL_TABS.filter((t) => !t.managerOnly || isManager);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Attendance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Live clock */}
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-primary">
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          {isClocked && (
            <p className="text-xs text-muted-foreground">Session: {formatDuration(currentSessionSecs)}</p>
          )}
          {todayRecord?.clockOut && (
            <p className="text-xs text-muted-foreground">
              {formatTime(todayRecord.clockIn)} – {formatTime(todayRecord.clockOut)}
            </p>
          )}
        </div>
      </div>

      {/* Today status strip */}
      {todayRecord && (
        <div className={cn('rounded-lg px-4 py-3 flex items-center gap-3 text-sm', STATUS_CONFIG[todayRecord.status].bg)}>
          {(() => { const Icon = STATUS_CONFIG[todayRecord.status].icon; return <Icon className={cn('h-5 w-5', STATUS_CONFIG[todayRecord.status].color)} />; })()}
          <span className={cn('font-semibold', STATUS_CONFIG[todayRecord.status].color)}>
            {STATUS_CONFIG[todayRecord.status].label}
          </span>
          {todayRecord.clockIn && <span className="text-muted-foreground">· In: {formatTime(todayRecord.clockIn)}</span>}
          {todayRecord.clockOut && <span className="text-muted-foreground">· Out: {formatTime(todayRecord.clockOut)}</span>}
          {todayRecord.hoursWorked > 0 && <span className="text-muted-foreground">· {todayRecord.hoursWorked}h worked</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === 'today' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today summary card */}
          <Card className="md:col-span-2 p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Today's Summary</h3>

            {/* ── Primary action buttons ── */}
            <div className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-muted/40 border">
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {isClocked
                    ? 'You are currently clocked in'
                    : todayRecord?.clockOut
                    ? 'You have completed today\'s session'
                    : 'Mark your attendance for today'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isClocked
                    ? `Session running: ${formatDuration(currentSessionSecs)}`
                    : todayRecord?.clockIn
                    ? `Clocked in at ${formatTime(todayRecord.clockIn)}${todayRecord.clockOut ? ` · Out at ${formatTime(todayRecord.clockOut)}` : ''}`
                    : 'Click Check In to start your work session'}
                </p>
              </div>
              {!isClocked ? (
                <Button
                  size="lg"
                  className="gap-2 min-w-[130px]"
                  onClick={() => clockIn(userId)}
                  disabled={!!todayRecord?.clockOut}
                >
                  <LogIn className="h-5 w-5" />
                  {todayRecord?.clockOut ? 'Checked Out' : 'Check In'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="gap-2 min-w-[130px]"
                  onClick={() => clockOut(userId)}
                >
                  <LogOut className="h-5 w-5" /> Check Out
                </Button>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Check In',  value: formatTime(todayRecord?.clockIn || null),  color: 'text-green-600' },
                { label: 'Check Out', value: formatTime(todayRecord?.clockOut || null),  color: 'text-red-600'   },
                { label: 'Hours',     value: `${((todayRecord?.hoursWorked || 0) + (isClocked ? currentSessionSecs / 3600 : 0)).toFixed(1)}h`, color: 'text-blue-600' },
                { label: 'Status',    value: todayRecord ? STATUS_CONFIG[todayRecord.status].label : 'Not marked', color: 'text-foreground' },
              ].map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

            {isClocked && (
              <div className="mt-4 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Session active
                  <span className="font-mono ml-auto text-green-700 dark:text-green-400">{formatDuration(currentSessionSecs)}</span>
                </p>
              </div>
            )}
          </Card>

          {/* Leave balance */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Umbrella className="h-4 w-4 text-primary" /> Leave Balance</h3>
            <div className="space-y-3">
              {[
                { key: 'sick' as const,   label: 'Sick',   total: 10, color: 'bg-red-500'    },
                { key: 'casual' as const, label: 'Casual', total: 12, color: 'bg-blue-500'   },
                { key: 'earned' as const, label: 'Earned', total: 15, color: 'bg-green-500'  },
              ].map(({ key, label, total, color }) => {
                const remaining = myBalance[key] ?? total;
                const used = total - remaining;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{remaining} left / {total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${(used / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* WEEKLY TAB */}
      {tab === 'weekly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {new Date(weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(addDays(weekStart, 6)).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} disabled={weekStart === getMondayOfWeek(today)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Days Present', value: presentDays,                          color: 'text-green-600' },
              { label: 'Hours Worked', value: `${totalHrsWeek.toFixed(1)}h`,        color: 'text-blue-600'  },
              { label: 'Attendance',   value: `${Math.round((presentDays/5)*100)}%`, color: 'text-primary'   },
            ].map((s) => (
              <Card key={s.label} className="p-4 text-center">
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Day-by-day grid */}
          <Card>
            <div className="grid grid-cols-7 divide-x">
              {weekDates.map((date) => {
                const rec = weekRecords.find((r) => r.date === date);
                const d = new Date(date);
                const dow = d.getDay();
                const isWeekend = dow === 0 || dow === 6;
                const isToday2 = date === today;
                const cfg = rec ? STATUS_CONFIG[rec.status] : null;
                const Icon = cfg?.icon;

                return (
                  <div key={date} className={cn('p-3 text-center', isWeekend && 'bg-muted/30', isToday2 && 'ring-2 ring-primary ring-inset')}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{DAYS_SHORT[dow]}</p>
                    <p className={cn('text-lg font-bold mt-0.5', isToday2 ? 'text-primary' : 'text-foreground')}>{d.getDate()}</p>
                    {isWeekend ? (
                      <p className="text-[10px] text-muted-foreground mt-2">Weekend</p>
                    ) : cfg && Icon ? (
                      <div className={cn('mt-2 rounded-full p-1.5 mx-auto w-fit', cfg.bg)}>
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                      </div>
                    ) : (
                      <div className="mt-2 h-7 w-7 rounded-full bg-muted mx-auto" />
                    )}
                    {rec?.hoursWorked ? (
                      <p className="text-[10px] text-muted-foreground mt-1">{rec.hoursWorked}h</p>
                    ) : null}
                    {rec?.clockIn && (
                      <p className="text-[9px] text-muted-foreground">{formatTime(rec.clockIn)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* MONTHLY TAB */}
      {tab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
              else setCalMonth(m => m - 1);
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold">{MONTHS[calMonth]} {calYear}</span>
            <Button variant="outline" size="sm" onClick={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
              else setCalMonth(m => m + 1);
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Working Days', value: daysInMonth - 8,    color: 'text-muted-foreground' },
              { label: 'Present',      value: monthPresent,       color: 'text-green-600' },
              { label: 'On Leave',     value: monthLeave,         color: 'text-orange-600' },
              { label: 'Attendance %', value: `${Math.round((monthPresent / Math.max(daysInMonth - 8, 1)) * 100)}%`, color: 'text-primary' },
            ].map((s) => (
              <Card key={s.label} className="p-3 text-center">
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Calendar */}
          <Card className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((d) => <p key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</p>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const rec = monthRecords.find((r) => r.date === dateStr);
                const d = new Date(dateStr);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const isToday2 = dateStr === today;
                const cfg = rec ? STATUS_CONFIG[rec.status] : null;

                return (
                  <div key={day} className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative transition-all',
                    isWeekend ? 'bg-muted/20 text-muted-foreground' :
                    cfg ? cn(cfg.bg, cfg.color) : 'hover:bg-muted/40 text-foreground',
                    isToday2 && 'ring-2 ring-primary',
                  )}>
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs">
              {Object.entries(STATUS_CONFIG).slice(0, 5).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={cn('h-4 w-4 rounded flex items-center justify-center', cfg.bg)}>
                      <Icon className={cn('h-2.5 w-2.5', cfg.color)} />
                    </span>
                    <span className="text-muted-foreground">{cfg.label}</span>
                  </span>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* LEAVE REQUEST TAB */}
      {tab === 'leave' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Umbrella className="h-4 w-4 text-primary" /> Apply for Leave / WFH</h3>
            {leaveSubmitted && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Leave request submitted successfully.
              </div>
            )}
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Date *</label>
                <Input type="date" value={leaveForm.date} min={today}
                  onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Leave Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map((lt) => (
                    <button
                      key={lt.value} type="button"
                      onClick={() => setLeaveForm({ ...leaveForm, leaveType: lt.value })}
                      className={cn('rounded-lg border-2 px-3 py-2 text-sm text-left transition-colors',
                        leaveForm.leaveType === lt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
                    >
                      <span className={cn('font-medium', lt.color)}>{lt.label}</span>
                      {lt.value !== 'wfh' && lt.value !== 'half_day' && (
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {myBalance[lt.value as keyof typeof myBalance] ?? 0} days remaining
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {leaveForm.leaveType !== 'wfh' && (
                <div>
                  <label className="text-sm font-medium block mb-1">Reason *</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder="Briefly describe the reason for leave..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </Card>

          {/* Leave history */}
          <Card className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Recent Leave History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getMonthRecords(userId, calYear, calMonth)
                .filter((r) => r.status === 'leave' || r.status === 'wfh' || r.status === 'half_day')
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 10)
                .map((rec) => {
                  const cfg = STATUS_CONFIG[rec.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={rec.date} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {rec.leaveReason && ` · ${rec.leaveReason}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              {getMonthRecords(userId, calYear, calMonth).filter((r) => ['leave','wfh','half_day'].includes(r.status)).length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">No leave records this month.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TEAM VIEW TAB (manager only) */}
      {tab === 'team' && isManager && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Team Attendance — {new Date(today).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Clock In</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Clock Out</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Hours</th>
                </tr>
              </thead>
              <tbody>
                {STAKEHOLDER_PERSONAS.map((persona) => {
                  const rec = teamAttendance[persona.devUserId];
                  const cfg = rec ? STATUS_CONFIG[rec.status] : null;
                  const Icon = cfg?.icon;
                  const isCurrentUser = persona.devUserId === userId;

                  return (
                    <tr key={persona.role} className={cn('border-b last:border-0 hover:bg-muted/20 transition-colors', isCurrentUser && 'bg-primary/5')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={persona.name} size="sm" />
                          <div>
                            <p className="font-medium text-sm">{persona.name}</p>
                            <p className={cn('text-[10px] font-semibold rounded px-1 py-0.5 w-fit', persona.color)}>{persona.label}</p>
                          </div>
                          {isCurrentUser && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cfg && Icon ? (
                          <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded-full', cfg.bg, cfg.color)}>
                            <Icon className="h-3 w-3" /> {cfg.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Not marked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{formatTime(rec?.clockIn || null)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{formatTime(rec?.clockOut || null)}</td>
                      <td className="px-4 py-3 text-xs hidden md:table-cell">
                        {rec?.hoursWorked ? <span className="font-medium">{rec.hoursWorked}h</span> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Team stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const recs = Object.values(teamAttendance);
              return [
                { label: 'Present', value: recs.filter((r) => r.status === 'present').length, color: 'text-green-600' },
                { label: 'WFH',     value: recs.filter((r) => r.status === 'wfh').length,     color: 'text-blue-600'  },
                { label: 'On Leave',value: recs.filter((r) => r.status === 'leave').length,   color: 'text-orange-600'},
                { label: 'Absent',  value: STAKEHOLDER_PERSONAS.length - recs.length,         color: 'text-red-600'   },
              ].map((s) => (
                <Card key={s.label} className="p-4 text-center">
                  <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </Card>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
