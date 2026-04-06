import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, GripVertical, Pencil, Trash2, Check } from 'lucide-react';

const mockWorkflows = [
  {
    id: 'wf1', name: 'Default Kanban', is_default: true,
    statuses: [
      { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'In Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
      { id: 's6', name: 'Cancelled', color: '#EF4444', is_initial: false, is_final: true, order: 6 },
    ],
  },
  {
    id: 'wf2', name: 'Agile Scrum', is_default: false,
    statuses: [
      { id: 'a1', name: 'Product Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 'a2', name: 'Sprint Backlog', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 'a3', name: 'In Sprint', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 'a4', name: 'Testing', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 'a5', name: 'Accepted', color: '#10B981', is_initial: false, is_final: true, order: 5 },
    ],
  },
];

export function WorkflowsPage() {
  const [selectedWf, setSelectedWf] = useState(mockWorkflows[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Configuration</h1>
          <p className="text-muted-foreground">Customize task statuses and transitions for your organization</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Workflow</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="space-y-3">
          {mockWorkflows.map((wf) => (
            <Card
              key={wf.id}
              className={`p-4 cursor-pointer transition-colors ${selectedWf.id === wf.id ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
              onClick={() => setSelectedWf(wf)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{wf.name}</h3>
                {wf.is_default && <Badge className="text-xs bg-blue-100 text-blue-700">Default</Badge>}
              </div>
              <div className="flex flex-wrap gap-1">
                {wf.statuses.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border" style={{ borderColor: s.color, color: s.color }}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{wf.statuses.length} statuses</p>
            </Card>
          ))}
        </div>

        {/* Workflow Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedWf.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /> Rename</Button>
                {!selectedWf.is_default && <Button variant="outline" size="sm"><Check className="h-3.5 w-3.5" /> Set Default</Button>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Statuses (drag to reorder)</h4>
            <div className="space-y-2">
              {selectedWf.statuses.map((status) => (
                <div key={status.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card hover:shadow-sm transition-shadow">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="h-5 w-5 rounded-full border-2" style={{ backgroundColor: status.color, borderColor: status.color }} />
                  <Input defaultValue={status.name} className="flex-1 h-8 text-sm" />

                  <div className="flex items-center gap-2 text-xs">
                    {status.is_initial && <Badge className="bg-blue-100 text-blue-700">Initial</Badge>}
                    {status.is_final && <Badge className="bg-green-100 text-green-700">Final</Badge>}
                  </div>

                  <input type="color" defaultValue={status.color} className="h-8 w-8 rounded cursor-pointer border-0" />
                  <button className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full border-dashed">
              <Plus className="h-4 w-4" /> Add Status
            </Button>

            {/* Transition Preview */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Workflow Preview</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {selectedWf.statuses.map((status, i) => (
                  <div key={status.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 border whitespace-nowrap" style={{ borderColor: status.color }}>
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs font-medium">{status.name}</span>
                    </div>
                    {i < selectedWf.statuses.length - 1 && (
                      <span className="text-muted-foreground text-lg">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
