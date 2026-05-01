import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Download, ChevronDown, Activity, User, FolderKanban, CheckSquare, MessageSquare, Settings } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { useAuditLogs, type AuditLogEntry } from '@/api/hooks';

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
  const [startDate, setStartDate] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, isError } = useAuditLogs({
    page,
    page_size: 25,
    entity_type: filterEntity || undefined,
    action: filterAction || undefined,
    search: search || undefined,
    start_date: startDate || undefined,
  });

  const logs: AuditLogEntry[] = data?.items ?? [];
  const pagination = data?.pagination;

  // Derive unique values from current page for filter dropdowns
  const entityTypes = [...new Set(logs.map((l) => l.entity_type))];
  const actions     = [...new Set(logs.map((l) => l.action))];

  const todayCount  = logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const actorCount  = new Set(logs.map((l) => l.actor?.id).filter(Boolean)).size;

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Reset to page 1 whenever filters change
  function handleSearchChange(val: string) { setSearch(val); setPage(1); }
  function handleEntityChange(val: string) { setFilterEntity(val); setPage(1); }
  function handleActionChange(val: string) { setFilterAction(val); setPage(1); }
  function handleDateChange(val: string)   { setStartDate(val); setPage(1); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Immutable record of all actions in your organization</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, entity, id..."
            className="pl-9"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <select
          value={filterEntity}
          onChange={(e) => handleEntityChange(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm bg-background"
        >
          <option value="">All entities</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterAction}
          onChange={(e) => handleActionChange(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm bg-background"
        >
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <Input
          type="date"
          className="w-40"
          value={startDate}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Events</p>
          <p className="text-xl font-bold">{pagination?.total ?? logs.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">This Page / Today</p>
          <p className="text-xl font-bold">{todayCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Unique Actors</p>
          <p className="text-xl font-bold">{actorCount}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Entity Types</p>
          <p className="text-xl font-bold">{entityTypes.length}</p>
        </Card>
      </div>

      {/* Log Entries */}
      <Card>
        <div className="divide-y">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30 animate-pulse" />
              <p>Loading audit log...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Failed to load audit log. Please try again.</p>
            </div>
          )}

          {!isLoading && !isError && logs.map((log) => {
            const Icon      = entityIcons[log.entity_type] || Activity;
            const isExpanded = expanded.has(log.id);
            const actorName  = log.actor?.name ?? 'System';

            return (
              <div key={log.id} className="hover:bg-accent/30 transition-colors">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => toggleExpanded(log.id)}
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', actionColors[log.action] || 'bg-gray-100')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{actorName}</span>
                      <span className="text-muted-foreground"> {log.action.replace(/_/g, ' ')} </span>
                      <Badge variant="outline" className="text-xs font-mono">{log.entity_type}</Badge>
                      {log.entity_id && (
                        <span className="text-muted-foreground text-xs ml-1">#{log.entity_id.slice(0, 8)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.actor?.email ? `${log.actor.email} · ` : ''}
                      {log.ip_address ? `IP: ${log.ip_address}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.created_at)}</span>
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 ml-11">
                    <div className="rounded-md bg-secondary/50 p-3 text-xs space-y-1">
                      <div className="flex flex-wrap gap-6">
                        <div><span className="text-muted-foreground">Entity Type:</span> <span className="font-medium">{log.entity_type}</span></div>
                        <div><span className="text-muted-foreground">Entity ID:</span> <code className="bg-secondary px-1 rounded">{log.entity_id}</code></div>
                        <div><span className="text-muted-foreground">IP:</span> <code className="bg-secondary px-1 rounded">{log.ip_address ?? '—'}</code></div>
                      </div>
                      <div><span className="text-muted-foreground">Timestamp:</span> {new Date(log.created_at).toISOString()}</div>
                      {log.actor && (
                        <div><span className="text-muted-foreground">Actor:</span> {log.actor.name} ({log.actor.email})</div>
                      )}
                      {log.old_value !== undefined && log.old_value !== null && (
                        <div>
                          <span className="text-muted-foreground">Old value:</span>{' '}
                          <code className="bg-secondary px-1 rounded">{JSON.stringify(log.old_value)}</code>
                        </div>
                      )}
                      {log.new_value !== undefined && log.new_value !== null && (
                        <div>
                          <span className="text-muted-foreground">New value:</span>{' '}
                          <code className="bg-secondary px-1 rounded">{JSON.stringify(log.new_value)}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && !isError && logs.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No audit entries match your filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.total_pages} &nbsp;·&nbsp; {pagination.total} total events
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
