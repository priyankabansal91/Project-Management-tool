import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, LayoutGrid, List, Calendar } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const mockProjects = [
  { id: '1', name: 'Customer Portal Redesign', key: 'CPR', description: 'Complete redesign of the customer-facing portal', status: 'active', color: '#3B82F6', due_date: '2026-06-30', task_count: 15, completed: 7, members: [{ name: 'Bob Martinez' }, { name: 'Carol Johnson' }, { name: 'David Park' }] },
  { id: '2', name: 'API Gateway Migration', key: 'AGM', description: 'Migrate from legacy REST to GraphQL', status: 'active', color: '#8B5CF6', due_date: '2026-08-31', task_count: 12, completed: 3, members: [{ name: 'Bob Martinez' }, { name: 'Carol Johnson' }] },
  { id: '3', name: 'Mobile App v2', key: 'MAV2', description: 'Complete rebuild of mobile application', status: 'active', color: '#F59E0B', due_date: '2026-12-31', task_count: 20, completed: 8, members: [{ name: 'David Park' }] },
  { id: '4', name: 'Security Audit', key: 'SEC', description: 'Annual security audit and compliance review', status: 'on_hold', color: '#EF4444', due_date: '2026-03-31', task_count: 8, completed: 8, members: [{ name: 'Alice Chen' }] },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
};

export function ProjectListPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');

  const filtered = mockProjects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">{mockProjects.length} projects total</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Project</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center rounded-md border bg-card">
          <button onClick={() => setView('grid')} className={cn('p-2 rounded-l-md', view === 'grid' && 'bg-accent')}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView('list')} className={cn('p-2 rounded-r-md', view === 'list' && 'bg-accent')}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const pct = p.task_count > 0 ? Math.round((p.completed / p.task_count) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}/board`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: p.color }} />
                      <Badge variant="outline" className="text-xs">{p.key}</Badge>
                    </div>
                    <Badge className={cn('text-xs', statusColors[p.status])}>{p.status}</Badge>
                  </div>

                  <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">{p.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{p.description}</p>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{p.completed}/{p.task_count} tasks</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {p.members.slice(0, 3).map((m, i) => (
                        <Avatar key={i} name={m.name} size="sm" className="border-2 border-card" />
                      ))}
                      {p.members.length > 3 && (
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card">
                          +{p.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(p.due_date)}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Members</th>
                  <th className="p-4 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pct = p.task_count > 0 ? Math.round((p.completed / p.task_count) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-accent/50 cursor-pointer">
                      <td className="p-4">
                        <Link to={`/projects/${p.id}/board`} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: p.color }} />
                          <span className="font-medium">{p.name}</span>
                          <Badge variant="outline" className="text-xs">{p.key}</Badge>
                        </Link>
                      </td>
                      <td className="p-4"><Badge className={cn('text-xs', statusColors[p.status])}>{p.status}</Badge></td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex -space-x-1">
                          {p.members.slice(0, 3).map((m, i) => <Avatar key={i} name={m.name} size="sm" className="border border-card" />)}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(p.due_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
