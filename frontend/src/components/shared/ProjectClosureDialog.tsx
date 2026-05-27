import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import type { Project } from '@/types';

interface Props {
  project: Project;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BUDGET_THRESHOLD = 5_000_000; // ₹50L

function fmtCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export function ProjectClosureDialog({ project, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const budget = Number((project as any).budget ?? 0);
  const highBudget = budget >= BUDGET_THRESHOLD;

  const steps = [
    { order: 1, label: 'Vertical Head', role: 'vertical_head', highlight: false },
    { order: 2, label: 'HOD / Division Admin', role: 'division_admin', highlight: false },
    ...(highBudget ? [{ order: 3, label: 'CEO / Org Admin', role: 'org_admin', highlight: true }] : []),
  ];

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post(`/v1/projects/${project.id}/close`, { reason });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit closure request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Close Project
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Closing <span className="font-semibold text-foreground">{project.name}</span> will start an approval
            chain. The project will be marked{' '}
            <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-700 bg-rose-50">
              Pending Closure
            </Badge>{' '}
            until all approvers sign off.
          </p>

          {/* Approval chain */}
          <div className="rounded-md border bg-muted/40 p-3 space-y-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Approval Chain</p>
            {steps.map((step, i) => (
              <div key={step.order}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                    step.highlight
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  )}>
                    {step.order}
                  </div>
                  <span className={cn('text-sm flex-1', step.highlight && 'font-medium text-orange-700')}>
                    {step.label}
                  </span>
                  {step.highlight && (
                    <Badge variant="outline" className="text-[9px] border-orange-300 text-orange-600 bg-orange-50">
                      Budget ≥ {fmtCurrency(BUDGET_THRESHOLD)}
                    </Badge>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-2.5 h-3 border-l border-dashed border-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>

          {highBudget && (
            <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                Budget of <strong>{fmtCurrency(budget)}</strong> exceeds the {fmtCurrency(BUDGET_THRESHOLD)} threshold.
                CEO / Org Admin approval is required.
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Closure Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="Describe why this project is being closed…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit for Closure'}
          </Button>
        </div>
      </div>
    </div>
  );
}
