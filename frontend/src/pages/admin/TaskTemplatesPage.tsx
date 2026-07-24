import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, X, Copy, Search, BookOpen, Bug, CheckSquare, Layers, Users,
  Rocket, AlertTriangle, Sparkles, Calendar, Clock, ListChecks, GripVertical, FileText,
  Star, Tag, FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TemplateCategory = 'onboarding' | 'bug' | 'release' | 'incident' | 'sprint' | 'project' | 'meeting' | 'custom';

const categoryLabels: Record<TemplateCategory, string> = {
  onboarding: 'Onboarding',
  bug: 'Bug / QA',
  release: 'Release',
  incident: 'Incident',
  sprint: 'Sprint',
  project: 'Project Setup',
  meeting: 'Meeting',
  custom: 'Custom',
};

const categoryIcons: Record<TemplateCategory, typeof BookOpen> = {
  onboarding: Users,
  bug: Bug,
  release: Rocket,
  incident: AlertTriangle,
  sprint: Layers,
  project: FolderKanban,
  meeting: Calendar,
  custom: Sparkles,
};

const categoryColors: Record<TemplateCategory, string> = {
  onboarding: '#10B981',
  bug: '#EF4444',
  release: '#8B5CF6',
  incident: '#DC2626',
  sprint: '#3B82F6',
  project: '#F59E0B',
  meeting: '#6366F1',
  custom: '#6B7280',
};

interface ChecklistItem {
  id: string;
  text: string;
  assignee_role?: string;
  days_from_start?: number;
  is_required?: boolean;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  issue_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimate_hours?: number;
  tags: string[];
  items: ChecklistItem[];
  project_scope: 'global' | string; // project id or 'global'
  usage_count: number;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
}

const mockTemplates: TaskTemplate[] = [
  {
    id: 't1', name: 'New Employee Onboarding',
    description: 'Comprehensive onboarding checklist for new hires during first 30 days',
    category: 'onboarding', issue_type: 'Task', priority: 'high',
    estimate_hours: 16,
    tags: ['HR', 'Onboarding', '30-day'],
    project_scope: 'global',
    usage_count: 47, is_favorite: true,
    created_by: 'Alice Chen',
    created_at: '2026-01-15',
    items: [
      { id: 'i1', text: 'Create email account and access credentials', assignee_role: 'IT Admin', days_from_start: 0, is_required: true },
      { id: 'i2', text: 'Order laptop and peripherals', assignee_role: 'IT Admin', days_from_start: 0, is_required: true },
      { id: 'i3', text: 'Add to HR system and payroll', assignee_role: 'HR', days_from_start: 1, is_required: true },
      { id: 'i4', text: 'Schedule welcome orientation', assignee_role: 'HR', days_from_start: 1 },
      { id: 'i5', text: 'Assign buddy/mentor', assignee_role: 'Manager', days_from_start: 2 },
      { id: 'i6', text: 'Grant access to required tools (Slack, GitHub, Jira)', assignee_role: 'IT Admin', days_from_start: 2, is_required: true },
      { id: 'i7', text: '1:1 with direct manager', assignee_role: 'Manager', days_from_start: 3 },
      { id: 'i8', text: 'Complete security & compliance training', days_from_start: 7, is_required: true },
      { id: 'i9', text: 'Review role expectations and KPIs', assignee_role: 'Manager', days_from_start: 14 },
      { id: 'i10', text: '30-day check-in and feedback session', assignee_role: 'Manager', days_from_start: 30 },
    ],
  },
  {
    id: 't2', name: 'Bug Report Triage',
    description: 'Standard steps for investigating and resolving a production bug',
    category: 'bug', issue_type: 'Bug', priority: 'high',
    estimate_hours: 4,
    tags: ['QA', 'Bug', 'Production'],
    project_scope: 'global',
    usage_count: 203, is_favorite: true,
    created_by: 'Bob Smith',
    created_at: '2026-02-01',
    items: [
      { id: 'b1', text: 'Reproduce the bug in dev environment', is_required: true },
      { id: 'b2', text: 'Identify affected versions and environments' },
      { id: 'b3', text: 'Check error logs and monitoring tools' },
      { id: 'b4', text: 'Determine severity and impact' },
      { id: 'b5', text: 'Assign to developer for fix' },
      { id: 'b6', text: 'Write failing test case' },
      { id: 'b7', text: 'Implement fix and verify' },
      { id: 'b8', text: 'Code review', is_required: true },
      { id: 'b9', text: 'QA verification in staging', is_required: true },
      { id: 'b10', text: 'Deploy to production and monitor' },
    ],
  },
  {
    id: 't3', name: 'Release Checklist',
    description: 'Pre-release verification and deployment steps for major versions',
    category: 'release', issue_type: 'Task', priority: 'critical',
    estimate_hours: 8,
    tags: ['DevOps', 'Release', 'Production'],
    project_scope: 'global',
    usage_count: 28, is_favorite: false,
    created_by: 'Charlie Davis',
    created_at: '2026-02-10',
    items: [
      { id: 'r1', text: 'All blocker and critical tickets resolved', is_required: true },
      { id: 'r2', text: 'Full regression test suite passing', is_required: true },
      { id: 'r3', text: 'Release notes drafted and reviewed' },
      { id: 'r4', text: 'Database migration scripts tested' },
      { id: 'r5', text: 'Rollback plan documented', is_required: true },
      { id: 'r6', text: 'Stakeholders notified of release window' },
      { id: 'r7', text: 'Deploy to staging and smoke test' },
      { id: 'r8', text: 'Deploy to production' },
      { id: 'r9', text: 'Monitor error rates for 2 hours post-deploy' },
      { id: 'r10', text: 'Announce release completion' },
    ],
  },
  {
    id: 't4', name: 'Incident Response (P1)',
    description: 'Immediate actions for severity-1 production incidents',
    category: 'incident', issue_type: 'Incident', priority: 'critical',
    estimate_hours: 2,
    tags: ['Incident', 'SRE', 'P1'],
    project_scope: 'global',
    usage_count: 12, is_favorite: true,
    created_by: 'SRE Team',
    created_at: '2026-03-01',
    items: [
      { id: 'p1', text: 'Acknowledge incident within 5 min', is_required: true },
      { id: 'p2', text: 'Create war room / bridge call', is_required: true },
      { id: 'p3', text: 'Notify on-call engineer and manager' },
      { id: 'p4', text: 'Post status page update', is_required: true },
      { id: 'p5', text: 'Investigate root cause' },
      { id: 'p6', text: 'Implement mitigation (rollback/feature flag)' },
      { id: 'p7', text: 'Verify recovery' },
      { id: 'p8', text: 'Close status page incident' },
      { id: 'p9', text: 'Schedule post-mortem within 48h', is_required: true },
    ],
  },
  {
    id: 't5', name: 'Sprint Planning',
    description: 'Ceremonies and artifacts needed for a 2-week sprint kickoff',
    category: 'sprint', issue_type: 'Task', priority: 'medium',
    estimate_hours: 3,
    tags: ['Agile', 'Sprint', 'Ceremony'],
    project_scope: 'global',
    usage_count: 64, is_favorite: false,
    created_by: 'Priya Sharma',
    created_at: '2026-03-15',
    items: [
      { id: 's1', text: 'Review backlog prioritization with PO' },
      { id: 's2', text: 'Confirm team capacity and availability' },
      { id: 's3', text: 'Define sprint goal', is_required: true },
      { id: 's4', text: 'Select stories from backlog' },
      { id: 's5', text: 'Story point estimation (planning poker)' },
      { id: 's6', text: 'Break stories into tasks' },
      { id: 's7', text: 'Assign initial owners' },
      { id: 's8', text: 'Confirm DoD (Definition of Done)' },
      { id: 's9', text: 'Share sprint plan with stakeholders' },
    ],
  },
  {
    id: 't6', name: 'New Project Kickoff',
    description: 'Initial project setup and stakeholder alignment tasks',
    category: 'project', issue_type: 'Epic', priority: 'high',
    estimate_hours: 12,
    tags: ['Kickoff', 'Project', 'Setup'],
    project_scope: 'global',
    usage_count: 19, is_favorite: false,
    created_by: 'Alice Chen',
    created_at: '2026-03-20',
    items: [
      { id: 'k1', text: 'Define project charter and scope', is_required: true },
      { id: 'k2', text: 'Identify key stakeholders and RACI' },
      { id: 'k3', text: 'Create project in PM tool' },
      { id: 'k4', text: 'Configure workflow and custom fields' },
      { id: 'k5', text: 'Invite team members' },
      { id: 'k6', text: 'Set up communication channels (Slack, email DL)' },
      { id: 'k7', text: 'Draft high-level roadmap' },
      { id: 'k8', text: 'Schedule recurring ceremonies' },
      { id: 'k9', text: 'Risk register created' },
      { id: 'k10', text: 'Project kickoff meeting held', is_required: true },
    ],
  },
];

interface FormData {
  name: string;
  description: string;
  category: TemplateCategory;
  issue_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimate_hours: number;
  tags: string[];
  items: ChecklistItem[];
  project_scope: string;
}

const emptyForm: FormData = {
  name: '', description: '', category: 'custom', issue_type: 'Task', priority: 'medium',
  estimate_hours: 0, tags: [], items: [], project_scope: 'global',
};

export function TaskTemplatesPage() {
  const dialog = useDialog();
  const [templates, setTemplates] = useState<TaskTemplate[]>(mockTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [itemInput, setItemInput] = useState('');
  const [selectedTpl, setSelectedTpl] = useState<TaskTemplate | null>(mockTemplates[0]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  const filtered = templates.filter((t) => {
    if (showFavsOnly && !t.is_favorite) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.description.toLowerCase().includes(search.toLowerCase()) &&
      !t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (t: TaskTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name, description: t.description, category: t.category,
      issue_type: t.issue_type, priority: t.priority, estimate_hours: t.estimate_hours || 0,
      tags: t.tags, items: t.items, project_scope: t.project_scope,
    });
    setShowForm(true);
  };

  const handleDuplicate = (t: TaskTemplate) => {
    const copy: TaskTemplate = {
      ...t,
      id: `new-${Date.now()}`,
      name: `${t.name} (Copy)`,
      usage_count: 0,
      is_favorite: false,
      created_by: 'You',
      created_at: new Date().toISOString().slice(0, 10),
    };
    setTemplates((prev) => [copy, ...prev]);
    setSelectedTpl(copy);
  };

  const handleToggleFav = (id: string) => {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, is_favorite: !t.is_favorite } : t));
    if (selectedTpl?.id === id) setSelectedTpl((p) => p ? { ...p, is_favorite: !p.is_favorite } : p);
  };

  const handleDelete = async (id: string) => {
    if (!await dialog.danger({ title: 'Delete Template', message: 'Delete this template permanently?', confirmLabel: 'Delete' })) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTpl?.id === id) setSelectedTpl(templates[0] || null);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!form.tags.includes(tagInput.trim())) {
      setForm((p) => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
  };

  const handleAddItem = () => {
    if (!itemInput.trim()) return;
    setForm((p) => ({
      ...p,
      items: [...p.items, { id: `new-${Date.now()}`, text: itemInput.trim() }],
    }));
    setItemInput('');
  };

  const handleRemoveItem = (id: string) => {
    setForm((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
  };

  const handleItemRequired = (id: string) => {
    setForm((p) => ({
      ...p,
      items: p.items.map((i) => i.id === id ? { ...i, is_required: !i.is_required } : i),
    }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      setTemplates((prev) => prev.map((t) => t.id === editingId ? { ...t, ...form } : t));
      if (selectedTpl?.id === editingId) setSelectedTpl((p) => p ? { ...p, ...form } as TaskTemplate : p);
    } else {
      const newT: TaskTemplate = {
        id: `new-${Date.now()}`,
        ...form,
        usage_count: 0,
        is_favorite: false,
        created_by: 'You',
        created_at: new Date().toISOString().slice(0, 10),
      };
      setTemplates((prev) => [newT, ...prev]);
      setSelectedTpl(newT);
    }
    setShowForm(false);
  };

  const handleUseTemplate = (t: TaskTemplate) => {
    dialog.success({ title: 'Template Applied', message: `Applied template "${t.name}" — ${t.items.length} checklist items will be created as tasks.` });
    setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, usage_count: x.usage_count + 1 } : x));
  };

  const categoryCounts = (Object.keys(categoryLabels) as TemplateCategory[]).reduce((acc, c) => {
    acc[c] = templates.filter((t) => t.category === c).length;
    return acc;
  }, {} as Record<TemplateCategory, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task Templates</h1>
          <p className="text-muted-foreground">Reusable checklists and task structures for common workflows</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFavsOnly((v) => !v)}>
            <Star className={cn('h-4 w-4', showFavsOnly && 'fill-yellow-400 text-yellow-400')} />
            {showFavsOnly ? 'Showing Favorites' : 'Show Favorites'}
          </Button>
          <Button onClick={handleCreate}><Plus className="h-4 w-4" /> New Template</Button>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, description, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filterCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
            )}
          >
            All ({templates.length})
          </button>
          {(Object.keys(categoryLabels) as TemplateCategory[]).map((c) => {
            const Icon = categoryIcons[c];
            return (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  filterCategory === c ? 'text-white border-transparent' : 'hover:bg-accent'
                )}
                style={filterCategory === c ? { backgroundColor: categoryColors[c] } : {}}
              >
                <Icon className="h-3 w-3" />
                {categoryLabels[c]} ({categoryCounts[c]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Template Library */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Template Library ({filtered.length})
          </h3>
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-2">
            {filtered.map((t) => {
              const Icon = categoryIcons[t.category];
              const isSelected = selectedTpl?.id === t.id;
              return (
                <Card
                  key={t.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all',
                    isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                  )}
                  onClick={() => setSelectedTpl(t)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${categoryColors[t.category]}20`, color: categoryColors[t.category] }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{t.name}</h4>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFav(t.id); }}
                          className="shrink-0"
                        >
                          <Star className={cn('h-4 w-4', t.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ListChecks className="h-3 w-3" /> {t.items.length} items
                        </span>
                        {t.estimate_hours && t.estimate_hours > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {t.estimate_hours}h
                          </span>
                        )}
                        <span>Used {t.usage_count}x</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                No templates match your filters
              </div>
            )}
          </div>
        </div>

        {/* Template Detail */}
        <div className="lg:col-span-3">
          {selectedTpl ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${categoryColors[selectedTpl.category]}20`,
                        color: categoryColors[selectedTpl.category],
                      }}
                    >
                      {(() => {
                        const I = categoryIcons[selectedTpl.category];
                        return <I className="h-6 w-6" />;
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {selectedTpl.name}
                        {selectedTpl.is_favorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{selectedTpl.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUseTemplate(selectedTpl)}>
                      <FileText className="h-3.5 w-3.5" /> Use Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(selectedTpl)}>
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(selectedTpl)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(selectedTpl.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Category</div>
                    <Badge
                      className="mt-1 text-white border-transparent"
                      style={{ backgroundColor: categoryColors[selectedTpl.category] }}
                    >
                      {categoryLabels[selectedTpl.category]}
                    </Badge>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Issue Type</div>
                    <div className="mt-1 font-medium">{selectedTpl.issue_type}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Priority</div>
                    <div className="mt-1 font-medium capitalize">{selectedTpl.priority}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Est. Hours</div>
                    <div className="mt-1 font-medium">{selectedTpl.estimate_hours || '—'}h</div>
                  </div>
                </div>

                {/* Tags */}
                {selectedTpl.tags.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTpl.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Checklist ({selectedTpl.items.length})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedTpl.items.filter((i) => i.is_required).length} required
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedTpl.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className="text-sm flex-1">{item.text}</span>
                            {item.is_required && (
                              <Badge className="text-[10px] bg-orange-100 text-orange-700 shrink-0">Required</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            {item.assignee_role && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" /> {item.assignee_role}
                              </span>
                            )}
                            {item.days_from_start !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Day {item.days_from_start}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                  <span>Created by {selectedTpl.created_by} on {selectedTpl.created_at}</span>
                  <span>Used {selectedTpl.usage_count} times</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              Select a template to view details
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editingId ? 'Edit Template' : 'Create Task Template'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Code Review Checklist" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What is this template for?" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(categoryLabels) as TemplateCategory[]).map((c) => {
                      const Icon = categoryIcons[c];
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, category: c }))}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] transition-colors',
                            form.category === c ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {categoryLabels[c]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Type</label>
                    <select
                      value={form.issue_type}
                      onChange={(e) => setForm((p) => ({ ...p, issue_type: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option>Task</option>
                      <option>Story</option>
                      <option>Bug</option>
                      <option>Epic</option>
                      <option>Spike</option>
                      <option>Incident</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, priority: p }))}
                          className={cn(
                            'rounded border px-2 py-1 text-[11px] capitalize',
                            form.priority === p ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimate (hours)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.estimate_hours}
                    onChange={(e) => setForm((p) => ({ ...p, estimate_hours: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scope</label>
                  <select
                    value={form.project_scope}
                    onChange={(e) => setForm((p) => ({ ...p, project_scope: e.target.value }))}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="global">Global (all projects)</option>
                    <option value="proj1">Website Redesign only</option>
                    <option value="proj2">Mobile App only</option>
                    <option value="proj3">Platform Infrastructure only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border rounded-md">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button onClick={() => handleRemoveTag(t)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Checklist Items ({form.items.length})</label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto border rounded-md p-2">
                  {form.items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No items yet. Add your first step below.</p>
                  )}
                  {form.items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 rounded border p-2 bg-card">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                      <Input
                        value={item.text}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            items: p.items.map((i) => i.id === item.id ? { ...i, text: e.target.value } : i),
                          }))
                        }
                        className="h-7 text-xs flex-1"
                      />
                      <button
                        onClick={() => handleItemRequired(item.id)}
                        className={cn(
                          'text-[10px] rounded px-1.5 py-0.5 border',
                          item.is_required ? 'bg-orange-100 border-orange-300 text-orange-700' : 'text-muted-foreground hover:bg-accent'
                        )}
                      >
                        Req
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="Add checklist item..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddItem}>Add</Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name}>
                  {editingId ? 'Save Changes' : 'Create Template'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
