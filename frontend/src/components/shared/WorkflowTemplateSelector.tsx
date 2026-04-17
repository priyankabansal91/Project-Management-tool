import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import type { WorkflowConfig } from '@/types';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  statuses: Array<{
    id: string;
    name: string;
    color: string;
    is_initial: boolean;
    is_final: boolean;
    order: number;
  }>;
  transitions: Array<{ from: string; to: string[] }>;
}

const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  kanban: {
    id: 'kanban',
    name: 'Simple Kanban',
    description: 'Basic workflow for simple project management - ideal for small teams',
    statuses: [
      { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 4 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3'] },
    ],
  },
  kanbanWithReview: {
    id: 'kanbanWithReview',
    name: 'Kanban with Review',
    description: 'Kanban workflow with review stage - good for quality-focused teams',
    statuses: [
      { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'In Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3', 's5'] },
      { from: 's5', to: ['s3'] },
    ],
  },
  scrum: {
    id: 'scrum',
    name: 'Scrum',
    description: 'Scrum workflow with sprint-based development',
    statuses: [
      { id: 's1', name: 'Product Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Sprint Backlog', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Testing', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s3'] },
    ],
  },
  waterfall: {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Sequential workflow for waterfall-style projects',
    statuses: [
      { id: 's1', name: 'Requirements', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Design', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'Development', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Testing', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Deployment', color: '#EC4899', is_initial: false, is_final: false, order: 5 },
      { id: 's6', name: 'Complete', color: '#10B981', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s6'] },
    ],
  },
  bugTracking: {
    id: 'bugTracking',
    name: 'Bug Tracking',
    description: 'Workflow optimized for bug and issue tracking',
    statuses: [
      { id: 's1', name: 'New', color: '#EF4444', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Assigned', color: '#F59E0B', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'In Progress', color: '#3B82F6', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Fixed', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Verified', color: '#10B981', is_initial: false, is_final: true, order: 5 },
      { id: 's6', name: 'Closed', color: '#6B7280', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3', 's6'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s5'] },
      { from: 's5', to: ['s6'] },
    ],
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Campaign',
    description: 'Workflow for marketing campaign management',
    statuses: [
      { id: 's1', name: 'Idea', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
      { id: 's2', name: 'Planning', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
      { id: 's3', name: 'Creation', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
      { id: 's4', name: 'Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
      { id: 's5', name: 'Approved', color: '#EC4899', is_initial: false, is_final: false, order: 5 },
      { id: 's6', name: 'Live', color: '#10B981', is_initial: false, is_final: true, order: 6 },
    ],
    transitions: [
      { from: 's1', to: ['s2'] },
      { from: 's2', to: ['s3'] },
      { from: 's3', to: ['s4'] },
      { from: 's4', to: ['s3', 's5'] },
      { from: 's5', to: ['s6'] },
      { from: 's6', to: [] },
    ],
  },
};

interface WorkflowTemplateSelectorProps {
  selectedTemplate: string | null;
  onSelect: (template: WorkflowTemplate) => void;
}

export function WorkflowTemplateSelector({ selectedTemplate, onSelect }: WorkflowTemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Choose a Workflow Template
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a template to get started quickly, or create a custom workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.values(WORKFLOW_TEMPLATES).map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedTemplate === template.id ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
              {selectedTemplate === template.id && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 ml-2" />
              )}
            </div>

            {/* Status Preview */}
            <div className="flex flex-wrap gap-1 mt-3">
              {template.statuses.map((status) => (
                <span
                  key={status.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border"
                  style={{ borderColor: status.color, color: status.color }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.name}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { WORKFLOW_TEMPLATES };
