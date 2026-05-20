import * as React from 'react';
import { SlidersHorizontal, X, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDashboardCustomizer,
  WIDGET_DEFINITIONS,
  type Density,
  type WidgetId,
} from '@/store/dashboardCustomizerStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardCustomizerProps {
  currentRole: string;
}

// ---------------------------------------------------------------------------
// Density options metadata
// ---------------------------------------------------------------------------

const DENSITY_OPTIONS: { value: Density; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'Smaller cards, more info at once' },
  { value: 'comfortable', label: 'Normal', description: 'Balanced spacing (default)' },
  { value: 'spacious', label: 'Spacious', description: 'Larger cards, easier to read' },
];

// ---------------------------------------------------------------------------
// Auto-refresh options
// ---------------------------------------------------------------------------

const REFRESH_OPTIONS: { label: string; seconds: number }[] = [
  { label: 'Off', seconds: 0 },
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
];

// ---------------------------------------------------------------------------
// DashboardCustomizer
// ---------------------------------------------------------------------------

export function DashboardCustomizer({ currentRole }: DashboardCustomizerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewName, setViewName] = React.useState('');

  const {
    hiddenWidgets,
    density,
    autoRefreshSeconds,
    savedViews,
    activeViewId,
    toggleWidget,
    setDensity,
    setAutoRefreshSeconds,
    saveView,
    loadView,
    deleteView,
    resetToDefault,
    isWidgetVisible,
  } = useDashboardCustomizer();

  // Filter widgets visible to the current role
  const roleWidgets = WIDGET_DEFINITIONS.filter(
    (w) => w.roles.includes('all') || w.roles.includes(currentRole)
  );
  const visibleCount = roleWidgets.filter((w) => isWidgetVisible(w.id)).length;

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Prevent body scroll when panel is open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    saveView(viewName);
    setViewName('');
  };

  const handleViewNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveView();
  };

  const handleWidgetKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, id: WidgetId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleWidget(id);
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Trigger button                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Customize dashboard"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Customize</span>
      </Button>

      {/* ------------------------------------------------------------------ */}
      {/* Backdrop                                                             */}
      {/* ------------------------------------------------------------------ */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Slide-over panel                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard customization panel"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm',
          'bg-background border-l border-border shadow-xl',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Customize Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose widgets and layout preferences
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close customization panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* ---------------------------------------------------------------- */}
          {/* A. Display Density                                                */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="density-heading">
            <h3
              id="density-heading"
              className="text-sm font-medium text-foreground mb-3"
            >
              Display Density
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {DENSITY_OPTIONS.map((opt) => {
                const isActive = density === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setDensity(opt.value)}
                    aria-pressed={isActive}
                    className={cn(
                      'relative flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {/* Active indicator dot */}
                    <span
                      className={cn(
                        'mb-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2',
                        isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40'
                      )}
                      aria-hidden="true"
                    >
                      {isActive && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-medium leading-none">{opt.label}</span>
                    <span className="mt-1 text-[10px] leading-snug opacity-70">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* B. Auto-Refresh                                                   */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="refresh-heading">
            <h3
              id="refresh-heading"
              className="text-sm font-medium text-foreground mb-1"
            >
              Auto-Refresh
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Automatically reload dashboard data
            </p>
            <div className="flex flex-wrap gap-2">
              {REFRESH_OPTIONS.map((opt) => {
                const isActive = autoRefreshSeconds === opt.seconds;
                return (
                  <button
                    key={opt.seconds}
                    onClick={() => setAutoRefreshSeconds(opt.seconds)}
                    aria-pressed={isActive}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {autoRefreshSeconds > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Dashboard refreshes every{' '}
                {autoRefreshSeconds < 60
                  ? `${autoRefreshSeconds} seconds`
                  : `${autoRefreshSeconds / 60} minute${autoRefreshSeconds > 60 ? 's' : ''}`}
                .
              </p>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* C. Widgets                                                        */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="widgets-heading">
            <div className="flex items-center justify-between mb-3">
              <h3
                id="widgets-heading"
                className="text-sm font-medium text-foreground"
              >
                Widgets
              </h3>
              <span className="text-xs text-muted-foreground">
                {visibleCount} / {roleWidgets.length} shown
              </span>
            </div>
            <div className="space-y-2">
              {roleWidgets.map((widget) => {
                const visible = isWidgetVisible(widget.id);
                return (
                  <div
                    key={widget.id}
                    role="checkbox"
                    aria-checked={visible}
                    tabIndex={0}
                    onClick={() => toggleWidget(widget.id)}
                    onKeyDown={(e) => handleWidgetKeyDown(e, widget.id)}
                    className={cn(
                      'flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 cursor-pointer',
                      'transition-colors select-none',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      visible
                        ? 'border-border bg-background hover:bg-accent/50'
                        : 'border-border/50 bg-muted/30 hover:bg-muted/60'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-medium leading-none truncate',
                          visible ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {widget.label}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
                        {widget.description}
                      </p>
                    </div>
                    {/* Toggle pill */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                        visible
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {visible ? 'On' : 'Off'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* D. Saved Views                                                    */}
          {/* ---------------------------------------------------------------- */}
          <section aria-labelledby="views-heading">
            <h3
              id="views-heading"
              className="text-sm font-medium text-foreground mb-3"
            >
              Saved Views
            </h3>

            {/* Save current config */}
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Name this view…"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={handleViewNameKeyDown}
                className="h-8 text-xs"
                aria-label="Saved view name"
                maxLength={40}
              />
              <Button
                size="sm"
                onClick={handleSaveView}
                disabled={!viewName.trim()}
                className="h-8 px-3 text-xs shrink-0"
              >
                Save
              </Button>
            </div>

            {/* View list */}
            {savedViews.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No saved views yet. Configure and save your first view above.
              </p>
            ) : (
              <ul className="space-y-1.5" role="list" aria-label="Saved dashboard views">
                {savedViews.map((view) => {
                  const isActive = activeViewId === view.id;
                  return (
                    <li key={view.id}>
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <button
                          onClick={() => loadView(view.id)}
                          className={cn(
                            'flex-1 text-left text-xs leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                            isActive ? 'font-semibold text-primary' : 'text-foreground'
                          )}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <span className="block font-medium">{view.name}</span>
                          <span className="block mt-0.5 text-[10px] text-muted-foreground">
                            {view.hiddenWidgets.length === 0
                              ? 'All widgets visible'
                              : `${view.hiddenWidgets.length} widget${view.hiddenWidgets.length !== 1 ? 's' : ''} hidden`}
                            {' · '}
                            {view.density}
                          </span>
                        </button>
                        <button
                          onClick={() => deleteView(view.id)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                          aria-label={`Delete view "${view.name}"`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {savedViews.length >= 8 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Maximum of 8 saved views reached. Delete one to add more.
              </p>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* E. Accessibility tips                                             */}
          {/* ---------------------------------------------------------------- */}
          <section aria-label="Keyboard navigation shortcuts">
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <p className="text-[11px] font-medium text-foreground mb-1.5">
                Keyboard navigation
              </p>
              <ul className="space-y-1 text-[11px] text-muted-foreground">
                <li>
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Tab</kbd>
                  {' '}— move between controls
                </li>
                <li>
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
                  {' '}/ {' '}
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Space</kbd>
                  {' '}— toggle widget or activate button
                </li>
                <li>
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                  {' '}— close this panel
                </li>
              </ul>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={resetToDefault}
          >
            Reset to Default
          </Button>
        </div>
      </div>
    </>
  );
}

export default DashboardCustomizer;
