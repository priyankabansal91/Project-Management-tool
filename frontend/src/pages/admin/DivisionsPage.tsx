import { useState } from 'react';
import { useDivisionHierarchy, useCreateDivision, useUpdateDivision, useDeleteDivision } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2, Plus, Edit2, Trash2, ChevronRight, ChevronDown, Users,
  FolderKanban, Crown, Loader2, Network, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DIV_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];

function getColor(index: number) { return DIV_COLORS[index % DIV_COLORS.length]; }

interface DivisionFormData { name: string; code: string; description: string; budget: string; head_count: string; [key: string]: unknown; }

function DivisionNode({
  division, depth, index, onEdit, onDelete,
}: {
  division: any; depth: number; index: number;
  onEdit: (d: any) => void; onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = division.children && division.children.length > 0;
  const color = getColor(index);

  return (
    <div className={cn('relative', depth > 0 && 'ml-8')}>
      {/* Vertical connector */}
      {depth > 0 && (
        <div className="absolute -left-4 top-0 bottom-0 w-px bg-border" />
      )}
      {depth > 0 && (
        <div className="absolute -left-4 top-6 w-4 h-px bg-border" />
      )}

      <Card className={cn('mb-2 border-l-4 hover:shadow-md transition-shadow', `border-l-[${color}]`)} style={{ borderLeftColor: color }}>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {hasChildren && (
                <button onClick={() => setExpanded((e) => !e)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <div className="w-4 flex-shrink-0" />}

              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                {division.code?.slice(0, 2) || division.name?.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-base">{division.name}</h3>
                  <Badge variant="outline" className="text-xs">{division.code}</Badge>
                  {depth === 0 && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Root</Badge>}
                </div>
                {division.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{division.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  {division.member_count !== undefined && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {division.member_count} members</span>
                  )}
                  {division.project_count !== undefined && (
                    <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {division.project_count} projects</span>
                  )}
                  {division.budget && (
                    <span className="font-medium text-green-600">₹{Number(division.budget).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(division)} title="Edit">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(division.id)} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative ml-4">
          <div className="absolute left-0 top-0 bottom-4 w-px bg-border" />
          {division.children.map((child: any, i: number) => (
            <DivisionNode key={child.id} division={child} depth={depth + 1} index={index + i + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DivisionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [formData, setFormData] = useState<DivisionFormData>({ name: '', code: '', description: '', budget: '', head_count: '' });

  const { data: hierarchy, isLoading } = useDivisionHierarchy();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();

  const handleEdit = (division: any) => {
    setEditingId(division.id);
    setFormData({ name: division.name, code: division.code, description: division.description || '', budget: division.budget || '', head_count: division.head_count || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this division and all sub-divisions? This cannot be undone.')) {
      await deleteDivision.mutateAsync(id).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await updateDivision.mutateAsync({ divisionId: editingId, ...formData });
      else await createDivision.mutateAsync(formData);
      setFormData({ name: '', code: '', description: '', budget: '', head_count: '' });
      setShowForm(false);
      setEditingId(null);
    } catch {}
  };

  const flatList = (divisions: any[], out: any[] = []): any[] => {
    for (const d of divisions) { out.push(d); if (d.children?.length) flatList(d.children, out); }
    return out;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const divisions = hierarchy || [];
  const allDivisions = flatList(divisions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" /> Divisions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allDivisions.length} divisions across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-card">
            <button onClick={() => setViewMode('tree')} className={cn('p-2 rounded-l-md', viewMode === 'tree' && 'bg-accent')} title="Tree view">
              <Network className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-r-md', viewMode === 'list' && 'bg-accent')} title="List view">
              <List className="h-4 w-4" />
            </button>
          </div>
          <Link to="/admin/onboarding">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Onboarding Wizard
            </Button>
          </Link>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', code: '', description: '', budget: '', head_count: '' }); }}>
            <Plus className="h-4 w-4 mr-2" /> New Division
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Divisions', value: allDivisions.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Members', value: allDivisions.reduce((s: number, d: any) => s + (d.member_count || 0), 0), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Projects', value: allDivisions.reduce((s: number, d: any) => s + (d.project_count || 0), 0), icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Root Divisions', value: divisions.length, icon: Crown, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={cn('p-4', stat.bg)}>
              <div className="flex items-center gap-3">
                <Icon className={cn('h-5 w-5', stat.color)} />
                <div>
                  <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/40 p-5">
          <h2 className="text-base font-semibold mb-4">{editingId ? 'Edit Division' : 'Create Division'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Division Name *</label>
                <Input placeholder="e.g., Engineering" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Code *</label>
                <Input placeholder="e.g., ENG" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} maxLength={8} required />
              </div>
            </div>
            <textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
              <Input placeholder="Head Count" type="number" value={formData.head_count} onChange={(e) => setFormData({ ...formData, head_count: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createDivision.isPending || updateDivision.isPending}>
                {(createDivision.isPending || updateDivision.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Update Division' : 'Create Division'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Divisions display */}
      {divisions.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No divisions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Use the Onboarding Wizard to set up your first division.</p>
          <Link to="/admin/onboarding">
            <Button className="mt-4"><Plus className="h-4 w-4 mr-2" /> Start Onboarding Wizard</Button>
          </Link>
        </Card>
      ) : viewMode === 'tree' ? (
        <div className="space-y-1">
          {divisions.map((div: any, i: number) => (
            <DivisionNode key={div.id} division={div} depth={0} index={i} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground font-semibold">
                <th className="px-4 py-3 text-left">Division</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Members</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Projects</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDivisions.map((div: any, i: number) => (
                <tr key={div.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: getColor(i) }}>
                        {div.code?.slice(0, 2)}
                      </div>
                      <span className="font-medium">{div.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{div.code}</Badge></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{div.member_count || 0}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{div.project_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(div)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(div.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
