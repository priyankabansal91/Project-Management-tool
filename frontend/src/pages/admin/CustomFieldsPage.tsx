import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Archive, X, GripVertical, Type, Hash, CalendarDays, ListFilter, Users, Link2, CheckSquare2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type FieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'user' | 'url' | 'checkbox';

interface CustomField {
  id: string;
  name: string;
  field_key: string;
  field_type: FieldType;
  options: Record<string, unknown>;
  is_required: boolean;
  is_archived: boolean;
  applies_to: 'task' | 'project' | 'both';
  display_order: number;
}

const fieldTypeIcons: Record<FieldType, typeof Type> = {
  text: Type, number: Hash, date: CalendarDays, select: ListFilter,
  multi_select: ListFilter, user: Users, url: Link2, checkbox: CheckSquare2,
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Text', number: 'Number', date: 'Date', select: 'Single Select',
  multi_select: 'Multi Select', user: 'User', url: 'URL', checkbox: 'Checkbox',
};

const mockFields: CustomField[] = [
  { id: '1', name: 'Story Points', field_key: 'story_points', field_type: 'number', options: { min: 0, max: 100 }, is_required: false, is_archived: false, applies_to: 'task', display_order: 1 },
  { id: '2', name: 'Epic', field_key: 'epic', field_type: 'select', options: { choices: ['Authentication', 'Dashboard', 'Reporting', 'API', 'Mobile'] }, is_required: false, is_archived: false, applies_to: 'task', display_order: 2 },
  { id: '3', name: 'Risk Level', field_key: 'risk_level', field_type: 'select', options: { choices: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' }, is_required: true, is_archived: false, applies_to: 'project', display_order: 3 },
  { id: '4', name: 'External Link', field_key: 'external_link', field_type: 'url', options: {}, is_required: false, is_archived: false, applies_to: 'task', display_order: 4 },
  { id: '5', name: 'Sprint Ready', field_key: 'sprint_ready', field_type: 'checkbox', options: {}, is_required: false, is_archived: false, applies_to: 'task', display_order: 5 },
];

interface FieldFormData {
  name: string;
  field_key: string;
  field_type: FieldType;
  is_required: boolean;
  applies_to: 'task' | 'project' | 'both';
  options: { choices?: string[]; min?: number; max?: number; default?: string };
}

const emptyForm: FieldFormData = { name: '', field_key: '', field_type: 'text', is_required: false, applies_to: 'task', options: {} };

export function CustomFieldsPage() {
  const dialog = useDialog();
  const [fields, setFields] = useState(mockFields);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldFormData>(emptyForm);
  const [choiceInput, setChoiceInput] = useState('');

  const activeFields = fields.filter((f) => !f.is_archived);
  const archivedFields = fields.filter((f) => f.is_archived);

  const handleEdit = (field: CustomField) => {
    setEditingId(field.id);
    setForm({
      name: field.name,
      field_key: field.field_key,
      field_type: field.field_type,
      is_required: field.is_required,
      applies_to: field.applies_to,
      options: field.options as any,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    setForm((prev) => ({ ...prev, name, field_key: editingId ? prev.field_key : key }));
  };

  const handleAddChoice = () => {
    if (!choiceInput.trim()) return;
    const choices = form.options.choices || [];
    if (!choices.includes(choiceInput.trim())) {
      setForm((prev) => ({ ...prev, options: { ...prev.options, choices: [...choices, choiceInput.trim()] } }));
    }
    setChoiceInput('');
  };

  const handleRemoveChoice = (choice: string) => {
    setForm((prev) => ({
      ...prev,
      options: { ...prev.options, choices: (prev.options.choices || []).filter((c) => c !== choice) },
    }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      setFields((prev) => prev.map((f) => f.id === editingId ? { ...f, ...form, options: form.options } : f));
    } else {
      setFields((prev) => [...prev, {
        id: `new-${Date.now()}`,
        ...form,
        options: form.options,
        is_archived: false,
        display_order: prev.length + 1,
      }]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleArchive = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, is_archived: true } : f));
  };

  const handleDelete = async (id: string) => {
    if (!await dialog.danger({ title: 'Delete Field', message: 'Delete this field permanently? Data in existing tasks will be lost.', confirmLabel: 'Delete' })) return;
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">Define dynamic fields for tasks and projects across your organization</p>
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4" /> New Field</Button>
      </div>

      {/* Field Type Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(fieldTypeLabels) as [FieldType, string][]).map(([type, label]) => {
          const Icon = fieldTypeIcons[type];
          return (
            <div key={type} className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              <Icon className="h-3 w-3" />{label}
            </div>
          );
        })}
      </div>

      {/* Active Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Fields ({activeFields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium w-8"></th>
                  <th className="pb-3 font-medium">Field Name</th>
                  <th className="pb-3 font-medium">Key</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Applies To</th>
                  <th className="pb-3 font-medium">Required</th>
                  <th className="pb-3 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeFields.map((field) => {
                  const Icon = fieldTypeIcons[field.field_type];
                  return (
                    <tr key={field.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-3"><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></td>
                      <td className="py-3 font-medium">{field.name}</td>
                      <td className="py-3"><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{field.field_key}</code></td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{fieldTypeLabels[field.field_type]}</span>
                        </div>
                      </td>
                      <td className="py-3"><Badge variant="outline" className="text-xs capitalize">{field.applies_to}</Badge></td>
                      <td className="py-3">{field.is_required ? <Badge className="text-xs bg-orange-100 text-orange-700">Required</Badge> : <span className="text-muted-foreground">No</span>}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(field)} className="p-1.5 rounded hover:bg-accent"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button onClick={() => handleArchive(field.id)} className="p-1.5 rounded hover:bg-accent"><Archive className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activeFields.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No custom fields defined yet. Click "New Field" to create one.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Archived Fields */}
      {archivedFields.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-muted-foreground">Archived Fields ({archivedFields.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {archivedFields.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded border p-3 opacity-60">
                  <div className="flex items-center gap-2">
                    <span>{f.name}</span>
                    <code className="text-xs bg-secondary px-1 rounded">{f.field_key}</code>
                  </div>
                  <button onClick={() => handleDelete(f.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <Card className="w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editingId ? 'Edit Field' : 'Create Custom Field'}</h2>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Field Name</label>
                <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Story Points" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Key</label>
                <Input value={form.field_key} onChange={(e) => setForm((p) => ({ ...p, field_key: e.target.value }))} placeholder="Auto-generated" disabled={!!editingId} className="font-mono text-sm" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(fieldTypeLabels) as [FieldType, string][]).map(([type, label]) => {
                    const Icon = fieldTypeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, field_type: type, options: {} }))}
                        className={cn('flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-all',
                          form.field_type === type ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'hover:bg-accent'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type-specific options */}
              {(form.field_type === 'select' || form.field_type === 'multi_select') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choices</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 border rounded-md">
                    {(form.options.choices || []).map((c) => (
                      <Badge key={c} variant="secondary" className="gap-1">
                        {c}
                        <button onClick={() => handleRemoveChoice(c)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={choiceInput} onChange={(e) => setChoiceInput(e.target.value)} placeholder="Add choice..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChoice())} />
                    <Button type="button" variant="outline" onClick={handleAddChoice}>Add</Button>
                  </div>
                </div>
              )}

              {form.field_type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Value</label>
                    <Input type="number" value={form.options.min ?? ''} onChange={(e) => setForm((p) => ({ ...p, options: { ...p.options, min: Number(e.target.value) } }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Value</label>
                    <Input type="number" value={form.options.max ?? ''} onChange={(e) => setForm((p) => ({ ...p, options: { ...p.options, max: Number(e.target.value) } }))} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Applies To</label>
                <div className="flex gap-2">
                  {(['task', 'project', 'both'] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, applies_to: v }))}
                      className={cn('rounded-md border px-3 py-1.5 text-sm capitalize', form.applies_to === v ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent')}
                    >{v}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="required" checked={form.is_required} onChange={(e) => setForm((p) => ({ ...p, is_required: e.target.checked }))} className="rounded" />
                <label htmlFor="required" className="text-sm">Required field</label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={!form.name}>{editingId ? 'Save Changes' : 'Create Field'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
