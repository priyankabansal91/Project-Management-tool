import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Search, Filter, Download, ChevronDown, Activity, User, FolderKanban, CheckSquare, MessageSquare, Settings, Shield } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  detail: string;
  ip_address: string;
  created_at: string;
}

const mockLogs: AuditEntry[] = [
  { id: '1', actor: 'Carol Johnson', action: 'status_changed', entity_type: 'task', entity_id: 't1', entity_label: 'CPR-1', detail: 'In Progress → In Review', ip_address: '192.168.1.45', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: '2', actor: 'David Park', action: 'created', entity_type: 'task', entity_id: 't7', entity_label: 'CPR-7', detail: 'Created "Implement full-text search"', ip_address: '192.168.1.52', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '3', actor: 'Bob Martinez', action: 'commented', entity_type: 'comment', entity_id: 'c5', entity_label: 'CPR-1', detail: 'Added comment on navigation component task', ip_address: '192.168.1.30', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', actor: 'Alice Chen', action: 'assigned', entity_type: 'task', entity_id: 't2', entity_label: 'CPR-2', detail: 'Assigned to David Park', ip_address: '192.168.1.10', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '5', actor: 'Alice Chen', action: 'role_changed', entity_type: 'member', entity_id: 'm3', entity_label: 'Carol Johnson', detail: 'member → project_manager', ip_address: '192.168.1.10', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '6', actor: 'Bob Martinez', action: 'created', entity_type: 'project', entity_id: 'p3', entity_label: 'MAV2', detail: 'Created project "Mobile App v2"', ip_address: '192.168.1.30', created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: '7', actor: 'System', action: 'config_changed', entity_type: 'config', entity_id: 'wf1', entity_label: 'Default Kanban', detail: 'Added "Cancelled" status to workflow', ip_address: '—', created_at: new Date(Date.now() - 43200000).toISOString() },
  { id: '8', actor: 'Alice Chen', action: 'deleted', entity_type: 'task', entity_id: 't10', entity_label: 'CPR-10', detail: 'Soft-deleted "Legacy migration cleanup"', ip_address: '192.168.1.10', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '9', actor: 'David Park', action: 'updated', entity_type: 'task', entity_id: 't4', entity_label: 'CPR-4', detail: 'Changed priority: medium → high', ip_address: '192.168.1.52', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '10', actor: 'Alice Chen', action: 'member_added', entity_type: 'member', entity_id: 'm5', entity_label: 'Eve Wilson', detail: 'Invited as member', ip_address: '192.168.1.10', created_at: new Date(Date.now() - 259200000).toISOString() },
];

const actionColors: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  status_changed: 'bg-purple-100 text-purple-700',
  assigned: 'bg-orange-100 text-orange-700',
  commented: 'bg-cyan-100 text-cyan-700',
  role_changed: 'bg-yellow-100 text-yellow-700',
  config_changed: 'bg-gray-100 text-gray-700',
  member_added: 'bg-indigo-100 text-indigo-700',
};

const entityIcons: Record<string, typeof Activity> = {
  task: CheckSquare, project: FolderKanban, comment: MessageSquare,
  member: User, config: Settings,
};

export function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = mockLogs.filter((l) => {
    if (search && !`${l.actor} ${l.entity_label} ${l.detail}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterEntity && l.entity_type !== filterEntity) return false;
    if (filterAction && l.action !== filterAction) return false;
    return true;
  });

  const actions = [...new Set(mockLogs.map((l) => l.action))];
  const entityTypes = [...new Set(mockLogs.map((l) => l.entity_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Immutable record of all actions in your organization</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by actor, entity, detail..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="rounded-md border px-3 py-2 text-sm bg-background">
          <option value="">All entities</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="rounded-md border px-3 py-2 text-sm bg-background">
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>
        <Input type="date" className="w-40" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">Total Events</p><p className="text-xl font-bold">{mockLogs.length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Today</p><p className="text-xl font-bold">{mockLogs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Unique Actors</p><p className="text-xl font-bold">{new Set(mockLogs.map((l) => l.actor)).size}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">Entity Types</p><p className="text-xl font-bold">{entityTypes.length}</p></Card>
      </div>

      {/* Log Entries */}
      <Card>
        <div className="divide-y">
          {filtered.map((log) => {
            const Icon = entityIcons[log.entity_type] || Activity;
            const isExpanded = expanded.has(log.id);
            return (
              <div key={log.id} className="hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded((prev) => { const n = new Set(prev); n.has(log.id) ? n.delete(log.id) : n.add(log.id); return n; })}>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', actionColors[log.action] || 'bg-gray-100')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.actor}</span>
                      <span className="text-muted-foreground"> {log.action.replace('_', ' ')} </span>
                      <Badge variant="outline" className="text-xs font-mono">{log.entity_label}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{log.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.created_at)}</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 ml-11">
                    <div className="rounded-md bg-secondary/50 p-3 text-xs space-y-1">
                      <div className="flex gap-8">
                        <div><span className="text-muted-foreground">Entity Type:</span> <span className="font-medium">{log.entity_type}</span></div>
                        <div><span className="text-muted-foreground">Entity ID:</span> <code className="bg-secondary px-1 rounded">{log.entity_id}</code></div>
                        <div><span className="text-muted-foreground">IP:</span> <code className="bg-secondary px-1 rounded">{log.ip_address}</code></div>
                      </div>
                      <div><span className="text-muted-foreground">Timestamp:</span> {new Date(log.created_at).toISOString()}</div>
                      <div><span className="text-muted-foreground">Detail:</span> {log.detail}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No audit entries match your filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
