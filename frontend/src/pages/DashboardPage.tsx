import { FolderKanban, CheckSquare, AlertTriangle, ListTodo, Users, Clock } from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo, priorityColor } from '@/lib/utils';

// Mock data for demo
const mockStats = {
  total_projects: 5, active_projects: 3, total_tasks: 47, completed_tasks: 18, overdue_tasks: 3, my_open_tasks: 8,
};

const mockProjectProgress = [
  { project_id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6', total_tasks: 15, completed_tasks: 7, completion_pct: 46.7 },
  { project_id: '2', name: 'API Gateway Migration', key: 'AGM', color: '#8B5CF6', total_tasks: 12, completed_tasks: 3, completion_pct: 25.0 },
  { project_id: '3', name: 'Mobile App v2', key: 'MAV2', color: '#F59E0B', total_tasks: 20, completed_tasks: 8, completion_pct: 40.0 },
];

const mockActivity = [
  { actor: 'Carol Johnson', action: 'status_changed', entity: 'CPR-1', detail: 'In Progress → In Review', at: new Date(Date.now() - 3600000).toISOString() },
  { actor: 'David Park', action: 'created', entity: 'AGM-5', detail: 'Created new task', at: new Date(Date.now() - 7200000).toISOString() },
  { actor: 'Bob Martinez', action: 'commented', entity: 'CPR-3', detail: 'Left a comment', at: new Date(Date.now() - 14400000).toISOString() },
  { actor: 'Alice Chen', action: 'assigned', entity: 'MAV2-2', detail: 'Assigned to Carol', at: new Date(Date.now() - 28800000).toISOString() },
];

const mockTeamWorkload = [
  { user_id: '1', name: 'Carol Johnson', role: 'member', open_tasks: 6, high_priority: 2, overdue_tasks: 1, estimated_hours: 24 },
  { user_id: '2', name: 'David Park', role: 'member', open_tasks: 5, high_priority: 1, overdue_tasks: 0, estimated_hours: 18 },
  { user_id: '3', name: 'Bob Martinez', role: 'project_manager', open_tasks: 3, high_priority: 1, overdue_tasks: 1, estimated_hours: 12 },
];

export function DashboardPage() {
  const { user, currentRole } = useAuthStore();
  const firstName = user?.first_name || user?.firstName || 'User';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground">Here's what's happening across your projects</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value={mockStats.active_projects} icon={FolderKanban} trend={{ value: 12, label: 'vs last month' }} />
        <StatCard title="Total Tasks" value={mockStats.total_tasks} icon={ListTodo} subtitle={`${mockStats.completed_tasks} completed`} />
        <StatCard title="My Open Tasks" value={mockStats.my_open_tasks} icon={CheckSquare} iconColor="text-blue-600" />
        <StatCard title="Overdue" value={mockStats.overdue_tasks} icon={AlertTriangle} iconColor="text-red-600" className={mockStats.overdue_tasks > 0 ? 'border-red-200' : ''} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockProjectProgress.map((p) => (
              <div key={p.project_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-medium">{p.name}</span>
                    <Badge variant="outline" className="text-xs">{p.key}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{p.completion_pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.completion_pct}%`, backgroundColor: p.color }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.completed_tasks} of {p.total_tasks} tasks</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar name={a.actor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">{a.actor}</span> {a.detail}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{a.entity}</Badge>
                      <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Workload (Admin / PM only) */}
      {(currentRole === 'org_admin' || currentRole === 'project_manager') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium text-center">Open Tasks</th>
                    <th className="pb-3 font-medium text-center">High Priority</th>
                    <th className="pb-3 font-medium text-center">Overdue</th>
                    <th className="pb-3 font-medium text-right">Est. Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTeamWorkload.map((m) => (
                    <tr key={m.user_id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="text-xs">{m.role.replace('_', ' ')}</Badge>
                      </td>
                      <td className="py-3 text-center">{m.open_tasks}</td>
                      <td className="py-3 text-center">
                        <span className={cn(m.high_priority > 0 && 'text-orange-600 font-medium')}>{m.high_priority}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn(m.overdue_tasks > 0 && 'text-red-600 font-medium')}>{m.overdue_tasks}</span>
                      </td>
                      <td className="py-3 text-right">{m.estimated_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
