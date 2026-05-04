import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Calendar, TrendingUp, Clock, PieChartIcon, BarChart3, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useMyDivisions } from '@/api/hooks';

// ─── Mock Chart Data ────────────────────────────────────

const burndownData = [
  { date: 'Feb 1', ideal: 20, actual: 20 },
  { date: 'Feb 3', ideal: 18, actual: 19 },
  { date: 'Feb 5', ideal: 16, actual: 18 },
  { date: 'Feb 7', ideal: 14, actual: 16 },
  { date: 'Feb 9', ideal: 12, actual: 15 },
  { date: 'Feb 11', ideal: 10, actual: 13 },
  { date: 'Feb 13', ideal: 8, actual: 11 },
  { date: 'Feb 15', ideal: 6, actual: 9 },
  { date: 'Feb 17', ideal: 4, actual: 7 },
  { date: 'Feb 19', ideal: 2, actual: 5 },
  { date: 'Feb 21', ideal: 0, actual: 3 },
];

const velocityData = [
  { sprint: 'Sprint 1', planned: 21, completed: 18 },
  { sprint: 'Sprint 2', planned: 24, completed: 22 },
  { sprint: 'Sprint 3', planned: 26, completed: 20 },
  { sprint: 'Sprint 4', planned: 23, completed: 23 },
  { sprint: 'Sprint 5', planned: 28, completed: 25 },
  { sprint: 'Sprint 6', planned: 25, completed: 27 },
];

const timeTrackingData = [
  { name: 'Carol Johnson', logged: 32, estimated: 40 },
  { name: 'David Park', logged: 28, estimated: 36 },
  { name: 'Bob Martinez', logged: 18, estimated: 20 },
  { name: 'Alice Chen', logged: 8, estimated: 10 },
];

const taskDistribution = [
  { name: 'Backlog', value: 8, color: '#6B7280' },
  { name: 'To Do', value: 5, color: '#3B82F6' },
  { name: 'In Progress', value: 7, color: '#F59E0B' },
  { name: 'In Review', value: 3, color: '#8B5CF6' },
  { name: 'Done', value: 12, color: '#10B981' },
];

const priorityDistribution = [
  { name: 'Critical', value: 3, color: '#EF4444' },
  { name: 'High', value: 8, color: '#F97316' },
  { name: 'Medium', value: 15, color: '#EAB308' },
  { name: 'Low', value: 9, color: '#22C55E' },
];

const weeklyActivity = [
  { week: 'W1', created: 8, completed: 5, comments: 12 },
  { week: 'W2', created: 12, completed: 8, comments: 18 },
  { week: 'W3', created: 6, completed: 10, comments: 15 },
  { week: 'W4', created: 10, completed: 7, comments: 20 },
  { week: 'W5', created: 9, completed: 12, comments: 22 },
  { week: 'W6', created: 7, completed: 9, comments: 16 },
];

type ReportTab = 'burndown' | 'velocity' | 'time' | 'distribution';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('burndown');
  const { currentDivisionId } = useAuthStore();
  const { data: myDivisions = [] } = useMyDivisions();
  const activeDivision = (myDivisions as any[]).find((d: any) => d.divisionId === currentDivisionId);

  const tabs: { id: ReportTab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'burndown', label: 'Burndown', icon: TrendingUp },
    { id: 'velocity', label: 'Velocity', icon: BarChart3 },
    { id: 'time', label: 'Time Tracking', icon: Clock },
    { id: 'distribution', label: 'Distribution', icon: PieChartIcon },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Project analytics and team performance insights
            {activeDivision && <span className="ml-2 text-primary font-medium">· {activeDivision.divisionName}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-md border px-3 py-2 text-sm bg-card">
            <option>Customer Portal Redesign (CPR)</option>
            <option>API Gateway Migration (AGM)</option>
            <option>All Projects</option>
          </select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </div>

      {currentDivisionId && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Division:</span>
          <span className="font-semibold text-primary">{activeDivision?.divisionName ?? 'Selected Division'}</span>
          <span className="ml-auto text-xs text-muted-foreground">Metrics filtered to this division</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Burndown Chart */}
      {activeTab === 'burndown' && (
        <div className="space-y-6">
          <Card className="stat-tile card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Sprint Burndown Chart</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Sprint 6</Badge>
                  <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Feb 1 - Feb 21</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: '#9ca3af' }} />
                  <YAxis className="text-xs" tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Ideal" dot={false} />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2.5} name="Actual" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="stat-tile card-hover">
            <CardHeader><CardTitle className="text-base">Weekly Activity</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Created" />
                  <Area type="monotone" dataKey="completed" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Completed" />
                  <Area type="monotone" dataKey="comments" stackId="3" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} name="Comments" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Velocity Chart */}
      {activeTab === 'velocity' && (
        <Card className="stat-tile card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Team Velocity (Story Points)</CardTitle>
              <Badge variant="secondary" className="text-xs">Last 6 sprints</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="sprint" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="planned" fill="#94a3b8" name="Planned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#3B82F6" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="text-center stat-tile card-hover rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">22.5</p>
                <p className="text-muted-foreground">Avg Velocity</p>
              </div>
              <div className="text-center stat-tile card-hover rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">+8%</p>
                <p className="text-muted-foreground">Trend</p>
              </div>
              <div className="text-center stat-tile card-hover rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">87%</p>
                <p className="text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Tracking */}
      {activeTab === 'time' && (
        <Card className="stat-tile card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Time Tracking by Team Member</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" defaultValue="2026-02-01" className="h-8 text-sm w-36" />
                <span className="text-muted-foreground">to</span>
                <Input type="date" defaultValue="2026-02-28" className="h-8 text-sm w-36" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeTrackingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} unit="h" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="logged" fill="#3B82F6" name="Logged Hours" radius={[0, 4, 4, 0]} />
                <Bar dataKey="estimated" fill="#E5E7EB" name="Estimated Hours" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center stat-tile card-hover rounded-lg p-3"><p className="text-2xl font-bold text-primary">86h</p><p className="text-xs text-muted-foreground">Total Logged</p></div>
              <div className="text-center stat-tile card-hover rounded-lg p-3"><p className="text-2xl font-bold text-primary">106h</p><p className="text-xs text-muted-foreground">Total Estimated</p></div>
              <div className="text-center stat-tile card-hover rounded-lg p-3"><p className="text-2xl font-bold text-orange-600">81%</p><p className="text-xs text-muted-foreground">Utilization</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="stat-tile card-hover">
            <CardHeader><CardTitle className="text-base">Tasks by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {taskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {taskDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="stat-tile card-hover">
            <CardHeader><CardTitle className="text-base">Tasks by Priority</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={priorityDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {priorityDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {priorityDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
