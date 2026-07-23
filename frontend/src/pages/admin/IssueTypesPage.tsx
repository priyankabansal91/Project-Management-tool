import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, X, Bug, BookOpen, CheckSquare, Layers, Lightbulb, AlertTriangle,
  Shield, Rocket, Flag, Star, Package, GripVertical, ArrowRight, Workflow, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type IconKey = 'bug' | 'story' | 'task' | 'epic' | 'spike' | 'incident' | 'shield' | 'rocket' | 'flag' | 'star' | 'package';

const iconMap: Record<IconKey, typeof Bug> = {
  bug: Bug, story: BookOpen, task: CheckSquare, epic: Layers, spike: Lightbulb,
  incident: AlertTriangle, shield: Shield, rocket: Rocket, flag: Flag, star: Star, package: Package,
};

interface IssueType {
  id: string;
  name: string;
  key: string;
  description: string;
  icon: IconKey;
  color: string;
  hierarchy_level: number; // 0 = sub-task, 1 = task/story, 2 = epic, 3 = initiative
  workflow_id: string;
  field_ids: string[];
  is_default: boolean;
  is_archived: boolean;
}

const availableWorkflows = [
  { id: 'wf1', name: 'Default Kanban', statuses: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'] },
  { id: 'wf2', name: 'Agile Scrum', statuses: ['Product Backlog', 'Sprint Backlog', 'In Sprint', 'Testing', 'Accepted'] },
  { id: 'wf3', name: 'Bug Triage', statuses: ['New', 'Triaged', 'In Fix', 'Verify', 'Closed', 'Won\'t Fix'] },
  { id: 'wf4', name: 'Incident Response', statuses: ['Reported', 'Investigating', 'Identified', 'Monitoring', 'Resolved', 'Post-mortem'] },
];

const availableFields = [
  { id: 'f1', name: 'Story Points', type: 'number' },
  { id: 'f2', name: 'Epic Link', type: 'select' },
  { id: 'f3', name: 'Severity', type: 'select' },
  { id: 'f4', name: 'Steps to Reproduce', type: 'text' },
  { id: 'f5', name: 'Environment', type: 'select' },
  { id: 'f6', name: 'Acceptance Criteria', type: 'text' },
  { id: 'f7', name: 'Business Value', type: 'number' },
  { id: 'f8', name: 'Time to Research', type: 'number' },
  { id: 'f9', name: 'Impact', type: 'select' },
  { id: 'f10', name: 'Affected Users', type: 'number' },
  { id: 'f11', name: 'Root Cause', type: 'text' },
  { id: 'f12', name: 'Resolution Notes', type: 'text' },
];

const defaultIssueTypes: IssueType[] = [
  {
    id: 'it1', name: 'Epic', key: 'EPIC', description: 'A large body of work that can be broken down into stories',
    icon: 'epic', color: '#8B5CF6', hierarchy_level: 2, workflow_id: 'wf1',
    field_ids: ['f2', 'f7'], is_default: true, is_archived: false,
  },
  {
    id: 'it2', name: 'Story', key: 'STORY', description: 'User-focused feature described from end-user perspective',
    icon: 'story', color: '#10B981', hierarchy_level: 1, workflow_id: 'wf2',
    field_ids: ['f1', 'f2', 'f6', 'f7'], is_default: true, is_archived: false,
  },
  {
    id: 'it3', name: 'Task', key: 'TASK', description: 'Generic unit of work',
    icon: 'task', color: '#3B82F6', hierarchy_level: 1, workflow_id: 'wf1',
    field_ids: ['f1', 'f2'], is_default: true, is_archived: false,
  },
  {
    id: 'it4', name: 'Bug', key: 'BUG', description: 'Defect or issue that needs fixing',
    icon: 'bug', color: '#EF4444', hierarchy_level: 1, workflow_id: 'wf3',
    field_ids: ['f3', 'f4', 'f5', 'f11', 'f12'], is_default: true, is_archived: false,
  },
  {
    id: 'it5', name: 'Spike', key: 'SPIKE', description: 'Research task to investigate unknowns or reduce risk',
    icon: 'spike', color: '#F59E0B', hierarchy_level: 1, workflow_id: 'wf2',
    field_ids: ['f8'], is_default: true, is_archived: false,
  },
  {
    id: 'it6', name: 'Incident', key: 'INC', description: 'Production issue requiring immediate attention',
    icon: 'incident', color: '#DC2626', hierarchy_level: 1, workflow_id: 'wf4',
    field_ids: ['f3', 'f9', 'f10', 'f11', 'f12'], is_default: true, is_archived: false,
  },
];

interface FormData {
  name: string;
  key: string;
  description: string;
  icon: IconKey;
  color: string;
  hierarchy_level: number;
  workflow_id: string;
  field_ids: string[];
}

const emptyForm: FormData = {
  name: '', key: '', description: '', icon: 'task', color: '#3B82F6',
  hierarchy_level: 1, workflow_id: 'wf1', field_ids: [],
};

const hierarchyLabels: Record<number, string> = {
  0: 'Sub-task',
  1: 'Standard',
  2: 'Epic',
  3: 'Initiative',
};

export function IssueTypesPage() {
  const dialog = useDialog();
  const [types, setTypes] = useState<IssueType[]>(defaultIssueTypes);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [selectedType, setSelectedType] = useState<IssueType>(defaultIssueTypes[0]);

  const activeTypes = types.filter((t) => !t.is_archived);

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (t: IssueType) => {
    setEditingId(t.id);
    setForm({
      name: t.name, key: t.key, description: t.description, icon: t.icon,
      color: t.color, hierarchy_level: t.hierarchy_level, workflow_id: t.workflow_id,
      field_ids: t.field_ids,
    });
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    const key = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setForm((p) => ({ ...p, name, key: editingId ? p.key : key }));
  };

  const toggleField = (fid: string) => {
    setForm((p) => ({
      ...p,
      field_ids: p.field_ids.includes(fid)
        ? p.field_ids.filter((x) => x !== fid)
        : [...p.field_ids, fid],
    }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      setTypes((prev) => prev.map((t) => t.id === editingId ? { ...t, ...form } : t));
      if (selectedType.id === editingId) {
        setSelectedType((prev) => ({ ...prev, ...form } as IssueType));
      }
    } else {
      const newType: IssueType = {
        id: `new-${Date.now()}`,
        ...form,
        is_default: false,
        is_archived: false,
      };
      setTypes((prev) => [...prev, newType]);
    }
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!await dialog.warning({ title: 'Archive Issue Type', message: "Archive this issue type? Existing items will keep their type but you can't create new ones.", confirmLabel: 'Archive' })) return;
    setTypes((prev) => prev.map((t) => t.id === id ? { ...t, is_archived: true } : t));
    if (selectedType.id === id && activeTypes.length > 1) {
      setSelectedType(activeTypes.find((t) => t.id !== id) || activeTypes[0]);
    }
  };

  const selectedWorkflow = availableWorkflows.find((w) => w.id === selectedType.workflow_id);
  const selectedFields = availableFields.filter((f) => selectedType.field_ids.includes(f.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issue Types</h1>
          <p className="text-muted-foreground">Configure work item types, each with its own workflow and fields</p>
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4" /> New Issue Type</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Type List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Configured Types ({activeTypes.length})</h3>
          {activeTypes.map((t) => {
            const Icon = iconMap[t.icon];
            const isSelected = selectedType.id === t.id;
            return (
              <Card
                key={t.id}
                className={cn(
                  'p-4 cursor-pointer transition-all',
                  isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent/50'
                )}
                onClick={() => setSelectedType(t)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: `${t.color}20`, color: t.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{t.name}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono">{t.key}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{hierarchyLabels[t.hierarchy_level]}</Badge>
                      {t.is_default && <Badge className="text-[10px] bg-blue-100 text-blue-700">System</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detail / Editor Pane */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${selectedType.color}20`, color: selectedType.color }}
                >
                  {(() => {
                    const I = iconMap[selectedType.icon];
                    return <I className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {selectedType.name}
                    <Badge variant="outline" className="font-mono text-xs">{selectedType.key}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedType.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(selectedType)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                {!selectedType.is_default && (
                  <Button variant="outline" size="sm" onClick={() => handleDelete(selectedType.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Archive
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border bg-secondary/30 p-4">
              <div>
                <div className="text-xs text-muted-foreground">Hierarchy</div>
                <div className="text-sm font-medium mt-1">{hierarchyLabels[selectedType.hierarchy_level]}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Workflow</div>
                <div className="text-sm font-medium mt-1">{selectedWorkflow?.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Fields</div>
                <div className="text-sm font-medium mt-1">{selectedFields.length} configured</div>
              </div>
            </div>

            {/* Workflow */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Workflow className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Workflow — {selectedWorkflow?.name}</h4>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {selectedWorkflow?.statuses.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 whitespace-nowrap"
                      style={{ borderColor: selectedType.color }}
                    >
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedType.color }} />
                      <span className="text-xs font-medium">{s}</span>
                    </div>
                    {i < (selectedWorkflow?.statuses.length ?? 0) - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Custom Fields ({selectedFields.length})</h4>
              </div>
              {selectedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
                  No custom fields assigned to this type. Click <strong>Edit</strong> to add some.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedFields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/30">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedType.color }} />
                        <span className="font-medium text-sm">{f.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{f.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editingId ? 'Edit Issue Type' : 'Create Issue Type'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Feature Request" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key</label>
                  <Input value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value.toUpperCase() }))} placeholder="AUTO" className="font-mono" maxLength={6} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What is this type used for?" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {(Object.keys(iconMap) as IconKey[]).map((key) => {
                      const Icon = iconMap[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, icon: key }))}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                            form.icon === key ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                      className="h-9 w-16 rounded cursor-pointer border-0"
                    />
                    <Input value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="font-mono text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hierarchy Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {([0, 1, 2, 3] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, hierarchy_level: lvl }))}
                      className={cn(
                        'rounded-md border px-3 py-2 text-xs font-medium',
                        form.hierarchy_level === lvl ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
                      )}
                    >
                      {hierarchyLabels[lvl]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Workflow</label>
                <div className="space-y-2">
                  {availableWorkflows.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, workflow_id: wf.id }))}
                      className={cn(
                        'w-full rounded-md border p-3 text-left transition-colors',
                        form.workflow_id === wf.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{wf.name}</span>
                        <Badge variant="outline" className="text-[10px]">{wf.statuses.length} statuses</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{wf.statuses.join(' → ')}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Fields ({form.field_ids.length} selected)</label>
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {availableFields.map((f) => (
                    <label
                      key={f.id}
                      className={cn(
                        'flex items-center gap-2 rounded p-2 text-sm cursor-pointer transition-colors',
                        form.field_ids.includes(f.id) ? 'bg-primary/10' : 'hover:bg-accent'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.field_ids.includes(f.id)}
                        onChange={() => toggleField(f.id)}
                        className="rounded"
                      />
                      <span className="flex-1">{f.name}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{f.type}</Badge>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name}>
                  {editingId ? 'Save Changes' : 'Create Type'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
