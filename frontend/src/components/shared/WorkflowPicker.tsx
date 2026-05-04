import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, CheckCircle2, ArrowRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowConfig } from '@/types';

interface WorkflowPickerProps {
  workflows: WorkflowConfig[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function WorkflowPicker({ workflows, value, onChange, className }: WorkflowPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const selected = workflows.find((w) => w.id === value) ?? workflows[0];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (!workflows.length) return null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <div className="flex gap-0.5">
                {selected.statuses.slice(0, 4).map((s) => (
                  <div key={s.id} className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                ))}
                {selected.statuses.length > 4 && (
                  <span className="text-[9px] text-muted-foreground ml-0.5">+{selected.statuses.length - 4}</span>
                )}
              </div>
              <span className="font-medium truncate">{selected.name}</span>
              {selected.is_default && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Default</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Select workflow</span>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border bg-popover shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {workflows.map((wf) => {
              const isSelected = wf.id === value || (!value && wf.id === workflows[0]?.id);
              return (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => { onChange(wf.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/60',
                    isSelected && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Name row */}
                      <div className="flex items-center gap-2 mb-1">
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                        <span className={cn('font-medium text-sm', isSelected && 'text-primary')}>{wf.name}</span>
                        {wf.is_default && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Default</span>
                        )}
                      </div>

                      {/* Description */}
                      {wf.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{wf.description}</p>
                      )}

                      {/* Status flow preview */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {wf.statuses.map((s, i) => (
                          <div key={s.id} className="flex items-center gap-1">
                            <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
                              style={{ borderColor: s.color + '60', backgroundColor: s.color + '15', color: s.color }}>
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
                            </div>
                            {i < wf.statuses.length - 1 && (
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1.5">{wf.statuses.length} statuses · {wf.transitions.length} transitions</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer link */}
          <div className="border-t px-4 py-2.5 bg-muted/30">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/admin/workflows'); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              <Settings className="h-3 w-3" />
              Manage Workflows
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
