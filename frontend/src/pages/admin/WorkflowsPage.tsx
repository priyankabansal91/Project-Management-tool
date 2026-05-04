import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Pencil, Check } from 'lucide-react';
import { WorkflowModal, type WorkflowFormData } from '@/components/shared/WorkflowModal';
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from '@/api/hooks';
import type { WorkflowConfig } from '@/types';

export function WorkflowsPage() {
  const [selectedWf, setSelectedWf] = useState<WorkflowConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowConfig | null>(null);

  const { data: workflows = [], isLoading } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();

  // Set first workflow as selected on load
  if (!selectedWf && workflows.length > 0) {
    setSelectedWf(workflows[0]);
  }

  const handleCreateWorkflow = async (data: WorkflowFormData) => {
    try {
      await createMutation.mutateAsync(data as unknown as Record<string, unknown>);
      setModalOpen(false);
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleUpdateWorkflow = async (data: WorkflowFormData) => {
    if (!editingWorkflow) return;
    try {
      await updateMutation.mutateAsync({ workflowId: editingWorkflow.id, ...data });
      setModalOpen(false);
      setEditingWorkflow(null);
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await deleteMutation.mutateAsync(workflowId);
      if (selectedWf?.id === workflowId) {
        setSelectedWf(workflows[0] || undefined);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingWorkflow(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (workflow: WorkflowConfig) => {
    setEditingWorkflow(workflow);
    setModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Configuration</h1>
          <p className="text-muted-foreground">Customize task statuses and transitions for your organization</p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      <WorkflowModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingWorkflow(null);
        }}
        onSave={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}
        workflow={editingWorkflow as any}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="space-y-3">
          {workflows.map((wf) => (
            <Card
              key={wf.id}
              className={`p-4 cursor-pointer transition-colors ${selectedWf?.id === wf.id ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
              onClick={() => setSelectedWf(wf)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-medium">{wf.name}</h3>
                {wf.is_default && <Badge className="text-xs bg-blue-100 text-blue-700">Default</Badge>}
              </div>
              {wf.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{wf.description}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {wf.statuses.map((s, i) => (
                  <span key={s.id} className="inline-flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border" style={{ borderColor: s.color, color: s.color }}>
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                    {i < wf.statuses.length - 1 && <span className="text-muted-foreground/40 text-xs">→</span>}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{wf.statuses.length} statuses · {wf.transitions.length} transitions</p>
            </Card>
          ))}
        </div>

        {/* Workflow Editor */}
        {selectedWf && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedWf.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(selectedWf)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {!selectedWf.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ workflowId: selectedWf.id, is_default: true })}
                    >
                      <Check className="h-3.5 w-3.5" /> Set Default
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Statuses</h4>
              <div className="space-y-2">
                {selectedWf.statuses.map((status) => (
                  <div key={status.id} className="flex items-center gap-3 rounded-lg border p-3 bg-card hover:shadow-sm transition-shadow">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="h-5 w-5 rounded-full border-2" style={{ backgroundColor: status.color, borderColor: status.color }} />
                    <span className="flex-1 font-medium text-sm">{status.name}</span>

                    <div className="flex items-center gap-2 text-xs">
                      {status.is_initial && <Badge className="bg-blue-100 text-blue-700">Initial</Badge>}
                      {status.is_final && <Badge className="bg-green-100 text-green-700">Final</Badge>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Workflow Preview */}
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
