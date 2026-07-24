import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type DialogVariant = 'info' | 'success' | 'warning' | 'danger' | 'error';

interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface DialogState extends DialogOptions {
  id: number;
  kind: 'alert' | 'confirm';
  resolve: (value: boolean) => void;
}

interface DialogContextValue {
  alert:   (opts: DialogOptions | string) => Promise<void>;
  confirm: (opts: DialogOptions | string) => Promise<boolean>;
  success: (opts: DialogOptions | string) => Promise<void>;
  warning: (opts: DialogOptions | string) => Promise<boolean>;
  danger:  (opts: DialogOptions | string) => Promise<boolean>;
  error:   (opts: DialogOptions | string) => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}

// ─── Variant config ──────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<DialogVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmCls: string;
  defaultTitle: string;
}> = {
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    confirmCls: 'bg-primary text-primary-foreground hover:bg-primary/90',
    defaultTitle: 'Information',
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    iconBg: 'bg-green-100 dark:bg-green-950/50',
    confirmCls: 'bg-green-600 text-white hover:bg-green-700',
    defaultTitle: 'Success',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    confirmCls: 'bg-amber-500 text-white hover:bg-amber-600',
    defaultTitle: 'Warning',
  },
  danger: {
    icon: <Trash2 className="h-6 w-6 text-red-600" />,
    iconBg: 'bg-red-100 dark:bg-red-950/50',
    confirmCls: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    defaultTitle: 'Are you sure?',
  },
  error: {
    icon: <XCircle className="h-6 w-6 text-red-600" />,
    iconBg: 'bg-red-100 dark:bg-red-950/50',
    confirmCls: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    defaultTitle: 'Error',
  },
};

// ─── Single Dialog Modal ─────────────────────────────────────────────────────

function DialogModal({ state }: { state: DialogState }) {
  const variant = state.variant ?? 'info';
  const cfg = VARIANT_CONFIG[variant];
  const isConfirm = state.kind === 'confirm';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) state.resolve(false); }}
    >
      <div className="bg-background rounded-xl border shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 pb-3">
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', cfg.iconBg)}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-base font-semibold leading-snug">
              {state.title ?? cfg.defaultTitle}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {state.message}
            </p>
          </div>
          <button
            className="shrink-0 rounded p-1 hover:bg-muted text-muted-foreground mt-0.5"
            onClick={() => state.resolve(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t mx-5" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4">
          {isConfirm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => state.resolve(false)}
            >
              {state.cancelLabel ?? 'Cancel'}
            </Button>
          )}
          <Button
            size="sm"
            className={cfg.confirmCls}
            onClick={() => state.resolve(true)}
          >
            {state.confirmLabel ?? (isConfirm ? (variant === 'danger' ? 'Delete' : 'Confirm') : 'OK')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const idRef = useRef(0);

  const push = useCallback((state: Omit<DialogState, 'id'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = ++idRef.current;
      const wrapped: DialogState = {
        ...state,
        id,
        resolve: (val) => {
          setDialogs((prev) => prev.filter((d) => d.id !== id));
          resolve(val);
        },
      };
      setDialogs((prev) => [...prev, wrapped]);
    });
  }, []);

  const normalize = (opts: DialogOptions | string): DialogOptions =>
    typeof opts === 'string' ? { message: opts } : opts;

  const value: DialogContextValue = {
    alert:   (o) => push({ ...normalize(o), kind: 'alert',   variant: normalize(o).variant ?? 'info'    }).then(() => undefined),
    success: (o) => push({ ...normalize(o), kind: 'alert',   variant: 'success'  }).then(() => undefined),
    error:   (o) => push({ ...normalize(o), kind: 'alert',   variant: 'error'    }).then(() => undefined),
    warning: (o) => push({ ...normalize(o), kind: 'confirm', variant: 'warning'  }),
    confirm: (o) => push({ ...normalize(o), kind: 'confirm', variant: normalize(o).variant ?? 'danger'  }),
    danger:  (o) => push({ ...normalize(o), kind: 'confirm', variant: 'danger'   }),
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialogs.map((d) => <DialogModal key={d.id} state={d} />)}
    </DialogContext.Provider>
  );
}
