import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Clock, Plus, X, Calendar, BarChart3, Timer } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface TimeEntry {
  id: string;
  task_key: string;
  task_title: string;
  project: { key: string; color: string };
  user: string;
  hours: number;
  description: string;
  logged_date: string;
}

const mockEntries: TimeEntry[] = [
  { id: '1', task_key: 'CPR-1', task_title: 'Design new navigation component', project: { key: 'CPR', color: '#3B82F6' }, user: 'Carol Johnson', hours: 2.5, description: 'Worked on responsive drawer layout', logged_date: '2026-02-12' },
  { id: '2', task_key: 'CPR-1', task_title: 'Design new navigation component', project: { key: 'CPR', color: '#3B82F6' }, user: 'Carol Johnson', hours: 1.0, description: 'Fixed Safari animation issues', logged_date: '2026-02-11' },
  { id: '3', task_key: 'CPR-4', task_title: 'Set up CI/CD pipeline', project: { key: 'CPR', color: '#3B82F6' }, user: 'David Park', hours: 3.0, description: 'GitHub Actions workflow + Docker build', logged_date: '2026-02-12' },
  { id: '4', task_key: 'CPR-5', task_title: 'Add Google OAuth provider', project: { key: 'CPR', color: '#3B82F6' }, user: 'David Park', hours: 1.0, description: 'Passport.js Google strategy setup', logged_date: '2026-02-12' },
  { id: '5', task_key: 'CPR-2', task_title: 'Implement authentication flow', project: { key: 'CPR', color: '#3B82F6' }, user: 'David Park', hours: 4.0, description: 'JWT refresh token rotation logic', logged_date: '2026-02-10' },
  { id: '6', task_key: 'AGM-1', task_title: 'GraphQL schema design', project: { key: 'AGM', color: '#8B5CF6' }, user: 'Carol Johnson', hours: 3.0, description: 'Type definitions for user and project', logged_date: '2026-02-10' },
];

interface LogTimeForm {
  task_key: string;
  hours: string;
  description: string;
  logged_date: string;
}

export function TimeLoggingPage() {
  const [entries, setEntries] = useState(mockEntries);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<LogTimeForm>({ task_key: '', hours: '', description: '', logged_date: new Date().toISOString().split('T')[0] });
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const todayHours = entries.filter((e) => e.logged_date === new Date().toISOString().split('T')[0]).reduce((s, e) => s + e.hours, 0);
  const uniqueUsers = [...new Set(entries.map((e) => e.user))];

  // Group by date
  const grouped = entries
    .filter((e) => (!filterDate || e.logged_date === filterDate) && (!filterUser || e.user === filterUser))
    .sort((a, b) => b.logged_date.localeCompare(a.logged_date))
    .reduce<Record<string, TimeEntry[]>>((acc, e) => {
      (acc[e.logged_date] = acc[e.logged_date] || []).push(e);
      return acc;
    }, {});

  const handleLog = () => {
    if (!form.task_key || !form.hours) return;
    setEntries((prev) => [{
      id: `new-${Date.now()}`, task_key: form.task_key, task_title: 'New task', project: { key: form.task_key.split('-')[0], color: '#3B82F6' },
      user: 'Alice Chen', hours: parseFloat(form.hours), description: form.description, logged_date: form.logged_date,
    }, ...prev]);
    setShowModal(false);
    setForm({ task_key: '', hours: '', description: '', logged_date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">Log and review time spent on tasks</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Log Time</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5"><Timer className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{todayHours}h</p><p className="text-xs text-muted-foreground">Logged Today</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5"><Clock className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{totalHours}h</p><p className="text-xs text-muted-foreground">Total This Period</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{(totalHours / Math.max(uniqueUsers.length, 1)).toFixed(1)}h</p><p className="text-xs text-muted-foreground">Avg per Member</p></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-40" placeholder="Filter by date" />
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="rounded-md border p-2 text-sm bg-background">
          <option value="">All members</option>
          {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        {(filterDate || filterUser) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterDate(''); setFilterUser(''); }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Time Entries grouped by date */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, dateEntries]) => {
          const dayTotal = dateEntries.reduce((s, e) => s + e.hours, 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{dayTotal}h total</Badge>
              </div>

              <Card>
                <div className="divide-y">
                  {dateEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
                      <Avatar name={entry.user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded" style={{ backgroundColor: entry.project.color }} />
                          <span className="text-xs font-mono text-muted-foreground">{entry.task_key}</span>
                          <span className="text-sm font-medium truncate">{entry.task_title}</span>
                        </div>
                        {entry.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.description}</p>}
                      </div>
                      <span className="text-sm text-muted-foreground">{entry.user}</span>
                      <Badge variant="outline" className="text-sm font-semibold shrink-0">
                        <Clock className="h-3 w-3 mr-1" />{entry.hours}h
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No time entries found for the selected filters.</p>
          </div>
        )}
      </div>

      {/* Log Time Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Log Time</h2>
                <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Task</label>
                <Input value={form.task_key} onChange={(e) => setForm((p) => ({ ...p, task_key: e.target.value }))} placeholder="e.g. CPR-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hours</label>
                  <Input type="number" step="0.25" min="0.25" value={form.hours} onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))} placeholder="2.5" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={form.logged_date} onChange={(e) => setForm((p) => ({ ...p, logged_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea className="w-full rounded-md border p-2 text-sm resize-none h-16" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What did you work on?" />
              </div>
              {/* Quick hour buttons */}
              <div className="flex gap-2">
                {['0.5', '1', '2', '4', '8'].map((h) => (
                  <button key={h} type="button" onClick={() => setForm((p) => ({ ...p, hours: h }))}
                    className={cn('flex-1 rounded-md border py-1.5 text-sm', form.hours === h ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-accent')}
                  >{h}h</button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleLog} disabled={!form.task_key || !form.hours}>
                  <Clock className="h-4 w-4" /> Log Time
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
