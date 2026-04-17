import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, Users, Hash, ArrowRight, Command } from 'lucide-react';
import { cn, priorityColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'member';
  title: string;
  subtitle: string;
  url: string;
  meta?: { priority?: string; status?: string; color?: string };
}

const mockResults: SearchResult[] = [
  { id: 't1', type: 'task', title: 'Design new navigation component', subtitle: 'CPR-1 • In Progress', url: '/tasks/t1', meta: { priority: 'high', status: 'In Progress' } },
  { id: 't2', type: 'task', title: 'Implement authentication flow', subtitle: 'CPR-2 • To Do', url: '/tasks/t2', meta: { priority: 'critical', status: 'To Do' } },
  { id: 't3', type: 'task', title: 'Customer dashboard wireframes', subtitle: 'CPR-3 • Done', url: '/tasks/t3', meta: { priority: 'medium', status: 'Done' } },
  { id: 't4', type: 'task', title: 'Set up CI/CD pipeline', subtitle: 'CPR-4 • In Review', url: '/tasks/t4', meta: { priority: 'high', status: 'In Review' } },
  { id: 't5', type: 'task', title: 'Add Google OAuth provider', subtitle: 'CPR-5 • In Progress', url: '/tasks/t5', meta: { priority: 'high', status: 'In Progress' } },
  { id: 'p1', type: 'project', title: 'Customer Portal Redesign', subtitle: 'CPR • 5 tasks', url: '/projects/1/board', meta: { color: '#3B82F6' } },
  { id: 'p2', type: 'project', title: 'API Gateway Migration', subtitle: 'AGM • 3 tasks', url: '/projects/2/board', meta: { color: '#8B5CF6' } },
  { id: 'p3', type: 'project', title: 'Mobile App v2', subtitle: 'MAV2 • 8 tasks', url: '/projects/3/board', meta: { color: '#F59E0B' } },
  { id: 'm1', type: 'member', title: 'Carol Johnson', subtitle: 'carol.dev@acme.com • Member', url: '/admin/users' },
  { id: 'm2', type: 'member', title: 'David Park', subtitle: 'david.dev@acme.com • Member', url: '/admin/users' },
  { id: 'm3', type: 'member', title: 'Bob Martinez', subtitle: 'bob.pm@acme.com • Project Manager', url: '/admin/users' },
];

const typeIcons = { task: CheckSquare, project: FolderKanban, member: Users };
const typeLabels = { task: 'Tasks', project: 'Projects', member: 'People' };

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setSelectedIdx(0);
  }, [open]);

  const filtered = query.length > 0
    ? mockResults.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.subtitle.toLowerCase().includes(query.toLowerCase()))
    : mockResults.slice(0, 6); // Show recent when empty

  // Group results by type
  const grouped = filtered.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  const flatResults = Object.values(grouped).flat();

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onOpenChange(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIdx]) {
      handleSelect(flatResults[selectedIdx]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => { onOpenChange(false); setQuery(''); }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Search Panel */}
      <div className="relative w-full max-w-xl mx-4 rounded-xl border bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, people..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(grouped).map(([type, results]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            return (
              <div key={type} className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Icon className="h-3 w-3" />
                  {typeLabels[type as keyof typeof typeLabels]}
                </div>
                {results.map((result) => {
                  const globalIdx = flatResults.indexOf(result);
                  const ResultIcon = typeIcons[result.type];
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        globalIdx === selectedIdx ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                    >
                      {result.type === 'project' && result.meta?.color ? (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: result.meta.color + '20' }}>
                          <FolderKanban className="h-4 w-4" style={{ color: result.meta.color }} />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <ResultIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      {result.meta?.priority && (
                        <Badge className={cn('text-[10px] shrink-0', priorityColor(result.meta.priority))}>{result.meta.priority}</Badge>
                      )}
                      {globalIdx === selectedIdx && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && query && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No results for "{query}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-secondary/30 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="rounded border px-1 py-0.5">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border px-1 py-0.5">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="rounded border px-1 py-0.5">esc</kbd> Close</span>
          </div>
          <span className="flex items-center gap-1"><Command className="h-3 w-3" />K to search</span>
        </div>
      </div>
    </div>
  );
}

// Trigger button for header
export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors w-full max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search tasks, projects...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-mono bg-card">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
      {open && <GlobalSearch open={open} onOpenChange={setOpen} />}
    </>
  );
}
