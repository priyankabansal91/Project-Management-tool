import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, LayoutGrid, List, Calendar, MoreHorizontal, Trash2, ExternalLink } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { ProjectModal, type ProjectFormData } from '@/components/shared/ProjectModal';
import { useProjects, useCreateProject, useDeleteProject, useWorkflows } from '@/api/hooks';
import type { Project } from '@/types';

function ProjectActionMenu({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirmDelete(false); } }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 rounded-md border bg-popover text-popover-foreground shadow-lg py-1">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={(e) => { e.preventDefault(); navigate(`/projects/${project.id}/board`); setOpen(false); }}
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" /> Open Board
          </button>
          <div className="my-1 border-t" />
          {!confirmDelete ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
              onClick={(e) => { e.preventDefault(); setConfirmDelete(true); }}
            >
              <Trash2 className="h-4 w-4" /> Delete Project
            </button>
          ) : (
            <div className="px-3 py-2 space-y-1">
              <p className="text-xs text-destructive font-medium">Delete "{project.name}"?</p>
              <div className="flex gap-1">
                <button className="flex-1 rounded bg-destructive text-destructive-foreground text-xs py-1" onClick={(e) => { e.preventDefault(); onDelete(project.id); setOpen(false); }}>Delete</button>
                <button className="flex-1 rounded border text-xs py-1" onClick={(e) => { e.preventDefault(); setConfirmDelete(false); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
};

export function ProjectListPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');

  const { data: projectsData, isLoading } = useProjects();
  const { data: workflowsData } = useWorkflows();
  const projects = projectsData?.items || [];
  const workflows = workflowsData || [];
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();

  const handleDeleteProject = (projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  };

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateProject = async (data: ProjectFormData) => {
    setModalError('');
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        workflow_config_id: data.workflow_config_id || undefined,
        start_date: data.start_date || undefined,
        due_date: data.due_date || undefined,
      };
      await createProjectMutation.mutateAsync(payload as unknown as Record<string, unknown>);
      setModalOpen(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        'Failed to create project. Please try again.';
      setModalError(msg);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading projects...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold">Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{projects.length} projects total</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <ProjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalError(''); }}
        onSave={handleCreateProject}
        saving={createProjectMutation.isPending}
        workflows={workflows}
        error={modalError}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9 w-full" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex items-center rounded-md border bg-card flex-shrink-0">
          <button 
            onClick={() => setView('grid')} 
            className={cn('p-2 rounded-l-md', view === 'grid' && 'bg-accent')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setView('list')} 
            className={cn('p-2 rounded-r-md', view === 'list' && 'bg-accent')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up stagger-children">
          {filtered.map((p) => {
            const pct = p.task_count > 0 ? Math.round(((p as any).completed / p.task_count) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}/board`}>
                <Card className="p-4 sm:p-5 card-hover cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-4 w-4 rounded flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <Badge variant="outline" className="text-xs truncate">{p.key}</Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge className={cn('text-xs', statusColors[p.status])}>{p.status}</Badge>
                      <ProjectActionMenu project={p} onDelete={handleDeleteProject} />
                    </div>
                  </div>

                  <h3 className="font-semibold group-hover:text-primary transition-colors mb-1 line-clamp-2 text-sm sm:text-base">{p.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4">{p.description}</p>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{(p as any).completed}/{p.task_count} tasks</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex -space-x-2 min-w-0">
                      {p.members.slice(0, 3).map((m, i) => (
                        <Avatar key={i} name={m.name} size="sm" className="border-2 border-card flex-shrink-0" />
                      ))}
                      {p.members.length > 3 && (
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs border-2 border-card flex-shrink-0">
                          +{p.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      <span className="hidden sm:inline">{formatDate(p.due_date)}</span>
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
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/50">
                  <th className="p-2 sm:p-4 font-medium">Project</th>
                  <th className="p-2 sm:p-4 font-medium hidden sm:table-cell">Status</th>
                  <th className="p-2 sm:p-4 font-medium hidden md:table-cell">Progress</th>
                  <th className="p-2 sm:p-4 font-medium hidden lg:table-cell">Members</th>
                  <th className="p-2 sm:p-4 font-medium hidden xl:table-cell">Due Date</th>
                  <th className="p-2 sm:p-4 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pct = p.task_count > 0 ? Math.round(((p as any).completed / p.task_count) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b last:border-0 row-hover cursor-pointer transition-colors">
                      <td className="p-2 sm:p-4">
                        <Link to={`/projects/${p.id}/board`} className="flex items-center gap-2 min-w-0">
                          <div className="h-3 w-3 rounded flex-shrink-0" style={{ backgroundColor: p.color }} />
                          <div className="min-w-0">
                            <span className="font-medium block truncate text-xs sm:text-sm">{p.name}</span>
                            <Badge variant="outline" className="text-xs mt-1">{p.key}</Badge>
                          </div>
                        </Link>
                      </td>
                      <td className="p-2 sm:p-4 hidden sm:table-cell"><Badge className={cn('text-xs', statusColors[p.status])}>{p.status}</Badge></td>
                      <td className="p-2 sm:p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 hidden lg:table-cell">
                        <div className="flex -space-x-1">
                          {p.members.slice(0, 3).map((m, i) => <Avatar key={i} name={m.name} size="sm" className="border border-card" />)}
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-muted-foreground hidden xl:table-cell text-xs sm:text-sm">{formatDate(p.due_date)}</td>
                      <td className="p-2 sm:p-4">
                        <ProjectActionMenu project={p} onDelete={handleDeleteProject} />
                      </td>
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
