import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  ComposedChart, Cell, ZAxis, PieChart as RPieChart, Pie,
} from 'recharts';
import {
  Download, Mail, Plus, X, Save, Calendar as CalendarIcon, Settings, Layout, GripVertical,
  FileText, TrendingUp, Activity, Gauge, Shuffle, BarChart3, Clock, Target, PieChart,
  Zap, ScatterChart as ScatterIcon, Filter, Share2, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Mock Data ────────────────────────────────────────────────

// Cumulative Flow Diagram (last 30 days)
const cfdData = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const backlog = Math.max(40 - i * 0.6 + Math.sin(i / 3) * 3, 5);
  const todo = Math.max(25 - i * 0.3 + Math.cos(i / 4) * 4, 4);
  const inProgress = 8 + Math.sin(i / 5) * 2;
  const review = 4 + Math.sin(i / 4) * 1.5;
  const done = Math.min(i * 1.5 + Math.random() * 3, 55);
  return {
    day: `Day ${day}`,
    Backlog: Math.round(backlog),
    'To Do': Math.round(todo),
    'In Progress': Math.round(inProgress),
    'In Review': Math.round(review),
    Done: Math.round(done),
  };
});

// Control Chart — cycle time per task
const controlData = Array.from({ length: 40 }, (_, i) => {
  const cycle = 3 + Math.random() * 10 + (Math.random() > 0.9 ? 8 : 0);
  return { taskId: `T-${100 + i}`, cycleTime: Number(cycle.toFixed(1)), index: i };
});
const cycleAvg = controlData.reduce((a, b) => a + b.cycleTime, 0) / controlData.length;
const cycleStdDev = Math.sqrt(controlData.reduce((a, b) => a + Math.pow(b.cycleTime - cycleAvg, 2), 0) / controlData.length);
const uclLimit = cycleAvg + 2 * cycleStdDev;
const lclLimit = Math.max(cycleAvg - 2 * cycleStdDev, 0);

// Lead Time / Throughput
const throughputData = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  throughput: 8 + Math.round(Math.random() * 10),
  leadTime: 4 + Math.random() * 6,
}));

// Cycle Time Scatter
const scatterData = Array.from({ length: 60 }, (_, i) => ({
  day: i,
  cycleTime: Math.round(2 + Math.random() * 15),
  size: 1 + Math.random() * 4,
  type: ['Bug', 'Story', 'Task'][Math.floor(Math.random() * 3)],
}));

// Monte Carlo simulation
function runMonteCarloSimulation(targetItems: number, weeklyThroughputs: number[], simulations: number) {
  const results: number[] = [];
  for (let s = 0; s < simulations; s++) {
    let completed = 0;
    let weeks = 0;
    while (completed < targetItems && weeks < 100) {
      const sample = weeklyThroughputs[Math.floor(Math.random() * weeklyThroughputs.length)];
      completed += sample;
      weeks++;
    }
    results.push(weeks);
  }
  results.sort((a, b) => a - b);
  return {
    p50: results[Math.floor(simulations * 0.5)],
    p75: results[Math.floor(simulations * 0.75)],
    p85: results[Math.floor(simulations * 0.85)],
    p95: results[Math.floor(simulations * 0.95)],
    distribution: results,
  };
}

// ─── Widget Types ─────────────────────────────────────────────
type WidgetType =
  | 'cfd' | 'control' | 'throughput' | 'leadtime' | 'scatter' | 'montecarlo'
  | 'burndown' | 'velocity' | 'distribution' | 'kpi';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  config?: Record<string, unknown>;
}

const widgetCatalog: { type: WidgetType; name: string; icon: typeof Activity; desc: string }[] = [
  { type: 'cfd', name: 'Cumulative Flow', icon: Activity, desc: 'Work items by status over time' },
  { type: 'control', name: 'Control Chart', icon: Gauge, desc: 'Cycle time with UCL/LCL' },
  { type: 'throughput', name: 'Throughput', icon: TrendingUp, desc: 'Items completed per period' },
  { type: 'leadtime', name: 'Lead Time', icon: Clock, desc: 'Time from created to done' },
  { type: 'scatter', name: 'Cycle Time Scatter', icon: ScatterIcon, desc: 'Distribution of task durations' },
  { type: 'montecarlo', name: 'Monte Carlo Forecast', icon: Shuffle, desc: 'Probabilistic completion' },
  { type: 'burndown', name: 'Sprint Burndown', icon: TrendingUp, desc: 'Remaining work vs ideal' },
  { type: 'velocity', name: 'Velocity', icon: Zap, desc: 'Story points per sprint' },
  { type: 'distribution', name: 'Status Distribution', icon: PieChart, desc: 'Current state breakdown' },
  { type: 'kpi', name: 'KPI Card', icon: Target, desc: 'Single metric with trend' },
];

const sizeClasses: Record<Widget['size'], string> = {
  sm: 'col-span-1',
  md: 'col-span-1 lg:col-span-2',
  lg: 'col-span-1 md:col-span-2 lg:col-span-3',
  xl: 'col-span-1 md:col-span-2 lg:col-span-4',
};

// Default dashboard
const defaultWidgets: Widget[] = [
  { id: 'w1', type: 'kpi', title: 'Avg Cycle Time', size: 'sm' },
  { id: 'w2', type: 'kpi', title: 'Throughput (this week)', size: 'sm' },
  { id: 'w3', type: 'kpi', title: 'Active WIP', size: 'sm' },
  { id: 'w4', type: 'kpi', title: '85% Forecast Date', size: 'sm' },
  { id: 'w5', type: 'cfd', title: 'Cumulative Flow Diagram', size: 'xl' },
  { id: 'w6', type: 'control', title: 'Control Chart — Cycle Time', size: 'md' },
  { id: 'w7', type: 'throughput', title: 'Lead Time / Throughput', size: 'md' },
  { id: 'w8', type: 'scatter', title: 'Cycle Time Scatter', size: 'md' },
  { id: 'w9', type: 'montecarlo', title: 'Monte Carlo Forecast — 40 Items', size: 'md' },
];

// ─── Component ────────────────────────────────────────────────
export function ReportsAdvancedPage() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [editMode, setEditMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [dashboardName, setDashboardName] = useState('Team Alpha — Flow Metrics');
  const [mcTarget, setMcTarget] = useState(40);

  const monteCarloResult = useMemo(() => {
    const weekly = throughputData.map((d) => d.throughput);
    return runMonteCarloSimulation(mcTarget, weekly, 10000);
  }, [mcTarget]);

  const addWidget = (type: WidgetType) => {
    const catalog = widgetCatalog.find((c) => c.type === type);
    const newW: Widget = {
      id: `w-${Date.now()}`,
      type,
      title: catalog?.name || 'Widget',
      size: type === 'kpi' ? 'sm' : 'md',
    };
    setWidgets((prev) => [...prev, newW]);
    setShowAddPanel(false);
  };

  const removeWidget = (id: string) => setWidgets((prev) => prev.filter((w) => w.id !== id));

  const resizeWidget = (id: string, size: Widget['size']) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, size } : w));
  };

  const handleExportPDF = () => {
    alert(`Exporting "${dashboardName}" as PDF (${widgets.length} widgets)...\n\nIn production: uses html2canvas + jsPDF to render the dashboard to a multi-page PDF.`);
    setShowExport(false);
  };

  const handleExportCSV = () => {
    alert(`Exporting raw data as CSV...\n\nColumns: widget, metric, value, timestamp`);
    setShowExport(false);
  };

  const handleScheduleEmail = () => {
    alert(`Email subscription created!\n\nDashboard "${dashboardName}" will be emailed weekly (Monday 9am UTC) as PDF attachment.`);
    setShowSchedule(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="text-2xl font-bold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
              disabled={!editMode}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Custom dashboard • {widgets.length} widgets • Last refreshed just now
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="inline-flex rounded-md border">
            {(['7d', '30d', '90d', '1y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  dateRange === r ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            {editMode ? <><Eye className="h-3.5 w-3.5" /> View Mode</> : <><Layout className="h-3.5 w-3.5" /> Edit Layout</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSchedule(true)}>
            <Mail className="h-3.5 w-3.5" /> Schedule
          </Button>
          <Button size="sm" onClick={() => setShowExport(true)}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="rounded-lg border border-dashed border-primary bg-primary/5 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-primary" />
            <span><strong>Edit mode active</strong> — drag widgets to reorder, click resize controls, or delete</span>
          </div>
          <Button size="sm" onClick={() => setShowAddPanel(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Widget
          </Button>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <div key={widget.id} className={cn('relative', sizeClasses[widget.size])}>
            <WidgetRenderer
              widget={widget}
              editMode={editMode}
              onRemove={() => removeWidget(widget.id)}
              onResize={(s) => resizeWidget(widget.id, s)}
              mcTarget={mcTarget}
              setMcTarget={setMcTarget}
              mcResult={monteCarloResult}
            />
          </div>
        ))}
      </div>

      {/* Add Widget Panel */}
      {showAddPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddPanel(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Widget to Dashboard</CardTitle>
                <button onClick={() => setShowAddPanel(false)}><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {widgetCatalog.map((w) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.type}
                      onClick={() => addWidget(w.type)}
                      className="flex items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{w.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{w.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExport(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Export Dashboard</CardTitle>
                <button onClick={() => setShowExport(false)}><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FileText className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <div className="font-semibold">PDF Report</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Full dashboard as multi-page PDF with charts</div>
                </div>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <div className="font-semibold">CSV Data Export</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Raw metrics for Excel / data analysis</div>
                </div>
              </button>
              <button
                onClick={() => { alert('PNG snapshot copied to clipboard'); setShowExport(false); }}
                className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Share2 className="h-6 w-6 text-blue-500 shrink-0" />
                <div>
                  <div className="font-semibold">PNG Snapshot</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Copy dashboard image to clipboard</div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Email Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSchedule(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schedule Email Report</CardTitle>
                <button onClick={() => setShowSchedule(false)}><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option>Daily (9am UTC)</option>
                  <option>Weekly (Monday 9am UTC)</option>
                  <option>Bi-weekly (Monday 9am UTC)</option>
                  <option>Monthly (1st of month, 9am UTC)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients (comma-separated emails)</label>
                <Input defaultValue="team@acme.com, exec@acme.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <div className="flex gap-2">
                  {['PDF attachment', 'Inline HTML', 'Both'].map((opt) => (
                    <button key={opt} className="flex-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent">{opt}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-200">
                Next send: <strong>Monday, 9:00 AM UTC</strong>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowSchedule(false)}>Cancel</Button>
                <Button onClick={handleScheduleEmail}><Mail className="h-3.5 w-3.5" /> Subscribe</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Widget Renderer ──────────────────────────────────────────
interface WidgetRendererProps {
  widget: Widget;
  editMode: boolean;
  onRemove: () => void;
  onResize: (s: Widget['size']) => void;
  mcTarget: number;
  setMcTarget: (n: number) => void;
  mcResult: { p50: number; p75: number; p85: number; p95: number; distribution: number[] };
}

function WidgetRenderer({ widget, editMode, onRemove, onResize, mcTarget, setMcTarget, mcResult }: WidgetRendererProps) {
  return (
    <Card className={cn('relative overflow-hidden h-full', editMode && 'ring-1 ring-dashed ring-primary/40')}>
      {editMode && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-background/90 backdrop-blur border p-1 shadow-sm">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
          <div className="inline-flex text-[10px]">
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onResize(s)}
                className={cn(
                  'px-1.5 py-0.5 rounded',
                  widget.size === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                )}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={onRemove} className="p-0.5 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <WidgetBody widget={widget} mcTarget={mcTarget} setMcTarget={setMcTarget} mcResult={mcResult} />
      </CardContent>
    </Card>
  );
}

function WidgetBody({
  widget, mcTarget, setMcTarget, mcResult,
}: {
  widget: Widget;
  mcTarget: number;
  setMcTarget: (n: number) => void;
  mcResult: { p50: number; p75: number; p85: number; p95: number; distribution: number[] };
}) {
  switch (widget.type) {
    case 'kpi':
      return <KpiWidget title={widget.title} />;
    case 'cfd':
      return <CFDWidget />;
    case 'control':
      return <ControlChartWidget />;
    case 'throughput':
      return <ThroughputWidget />;
    case 'leadtime':
      return <LeadTimeWidget />;
    case 'scatter':
      return <ScatterWidget />;
    case 'montecarlo':
      return <MonteCarloWidget target={mcTarget} setTarget={setMcTarget} result={mcResult} />;
    case 'burndown':
      return <BurndownWidget />;
    case 'velocity':
      return <VelocityWidget />;
    case 'distribution':
      return <DistributionWidget />;
    default:
      return <div className="text-sm text-muted-foreground">Unknown widget</div>;
  }
}

// ─── KPI Card ────────────────────────────────────────────────
function KpiWidget({ title }: { title: string }) {
  const data: Record<string, { value: string; delta: string; trend: 'up' | 'down' | 'flat' }> = {
    'Avg Cycle Time': { value: '5.8d', delta: '-12%', trend: 'down' },
    'Throughput (this week)': { value: '18', delta: '+22%', trend: 'up' },
    'Active WIP': { value: '12', delta: '+2', trend: 'up' },
    '85% Forecast Date': { value: 'May 8', delta: 'on track', trend: 'flat' },
  };
  const kpi = data[title] || { value: '—', delta: '', trend: 'flat' };
  const color = kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-emerald-600' : 'text-muted-foreground';
  return (
    <div className="space-y-1">
      <div className="text-3xl font-bold">{kpi.value}</div>
      <div className={cn('text-xs flex items-center gap-1', color)}>
        <TrendingUp className="h-3 w-3" /> {kpi.delta}
      </div>
    </div>
  );
}

// ─── CFD ─────────────────────────────────────────────────────
function CFDWidget() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={cfdData}>
        <defs>
          <linearGradient id="cDone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.85} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" interval={4} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="Done" stackId="1" stroke="#10B981" fill="url(#cDone)" />
        <Area type="monotone" dataKey="In Review" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.7} />
        <Area type="monotone" dataKey="In Progress" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.7} />
        <Area type="monotone" dataKey="To Do" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.7} />
        <Area type="monotone" dataKey="Backlog" stackId="1" stroke="#6B7280" fill="#6B7280" fillOpacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Control Chart ───────────────────────────────────────────
function ControlChartWidget() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-[11px]">
        <Badge variant="outline" className="gap-1"><div className="h-2 w-2 rounded-full bg-blue-500" /> Mean {cycleAvg.toFixed(1)}d</Badge>
        <Badge variant="outline" className="gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> UCL {uclLimit.toFixed(1)}d</Badge>
        <Badge variant="outline" className="gap-1"><div className="h-2 w-2 rounded-full bg-orange-400" /> LCL {lclLimit.toFixed(1)}d</Badge>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={controlData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="index" tick={{ fontSize: 10 }} label={{ value: 'Task #', position: 'insideBottom', offset: -5, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="cycleTime" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
          <ReferenceLine y={cycleAvg} stroke="#3B82F6" strokeDasharray="5 5" label={{ value: 'μ', fontSize: 10 }} />
          <ReferenceLine y={uclLimit} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'UCL', fontSize: 10, fill: '#EF4444' }} />
          <ReferenceLine y={lclLimit} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'LCL', fontSize: 10, fill: '#F59E0B' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Lead Time / Throughput ──────────────────────────────────
function ThroughputWidget() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={throughputData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} label={{ value: 'Items', angle: -90, position: 'insideLeft', fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} label={{ value: 'Days', angle: 90, position: 'insideRight', fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="left" dataKey="throughput" fill="#3B82F6" name="Throughput (items)" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="leadTime" stroke="#EF4444" strokeWidth={2} name="Lead Time (days)" dot />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function LeadTimeWidget() {
  // Show histogram of lead times
  const buckets = [
    { range: '0-2d', count: 12 },
    { range: '3-5d', count: 28 },
    { range: '6-10d', count: 35 },
    { range: '11-15d', count: 18 },
    { range: '16-20d', count: 7 },
    { range: '20d+', count: 3 },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={buckets}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Scatter ─────────────────────────────────────────────────
function ScatterWidget() {
  const typeColors: Record<string, string> = { Bug: '#EF4444', Story: '#10B981', Task: '#3B82F6' };
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" dataKey="day" name="Days ago" tick={{ fontSize: 10 }} />
        <YAxis type="number" dataKey="cycleTime" name="Cycle time" unit="d" tick={{ fontSize: 10 }} />
        <ZAxis type="number" dataKey="size" range={[40, 200]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={scatterData}>
          {scatterData.map((d, i) => (
            <Cell key={i} fill={typeColors[d.type]} />
          ))}
        </Scatter>
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          payload={[
            { value: 'Bug', type: 'circle', color: '#EF4444' },
            { value: 'Story', type: 'circle', color: '#10B981' },
            { value: 'Task', type: 'circle', color: '#3B82F6' },
          ]}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── Monte Carlo ─────────────────────────────────────────────
function MonteCarloWidget({
  target, setTarget, result,
}: {
  target: number;
  setTarget: (n: number) => void;
  result: { p50: number; p75: number; p85: number; p95: number; distribution: number[] };
}) {
  // Build histogram
  const histBuckets: Record<number, number> = {};
  result.distribution.forEach((w) => { histBuckets[w] = (histBuckets[w] || 0) + 1; });
  const histData = Object.entries(histBuckets)
    .map(([w, c]) => ({ weeks: Number(w), simulations: c }))
    .sort((a, b) => a.weeks - b.weeks);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Items to complete:</label>
        <Input
          type="number"
          value={target}
          onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
          className="h-7 w-20 text-xs"
          min={1}
        />
        <span className="text-xs text-muted-foreground">(10,000 simulations)</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2">
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">P50</div>
          <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{result.p50}w</div>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2">
          <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">P75</div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{result.p75}w</div>
        </div>
        <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-2">
          <div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium">P85</div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{result.p85}w</div>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-2">
          <div className="text-[10px] text-red-700 dark:text-red-300 font-medium">P95</div>
          <div className="text-lg font-bold text-red-700 dark:text-red-300">{result.p95}w</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={histData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="weeks" tick={{ fontSize: 10 }} label={{ value: 'Weeks to complete', position: 'insideBottom', offset: -2, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="simulations" fill="#8B5CF6" />
          <ReferenceLine x={result.p50} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'P50', fontSize: 9, fill: '#10B981' }} />
          <ReferenceLine x={result.p85} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'P85', fontSize: 9, fill: '#F59E0B' }} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-muted-foreground">
        Based on last 12 weeks of throughput. 85% of simulations complete by <strong>week {result.p85}</strong>.
      </p>
    </div>
  );
}

// ─── Burndown ────────────────────────────────────────────────
function BurndownWidget() {
  const data = Array.from({ length: 14 }, (_, i) => ({
    day: i + 1,
    ideal: 100 - (i * 100 / 13),
    actual: Math.max(100 - (i * 7.5 + Math.random() * 5), 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="ideal" stroke="#94A3B8" strokeDasharray="5 5" name="Ideal" dot={false} />
        <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Velocity ────────────────────────────────────────────────
function VelocityWidget() {
  const data = Array.from({ length: 6 }, (_, i) => ({
    sprint: `S${i + 1}`,
    committed: 30 + Math.round(Math.random() * 8),
    completed: 25 + Math.round(Math.random() * 10),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="committed" fill="#94A3B8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Distribution ────────────────────────────────────────────
function DistributionWidget() {
  const data = [
    { name: 'To Do', value: 24, color: '#3B82F6' },
    { name: 'In Progress', value: 12, color: '#F59E0B' },
    { name: 'In Review', value: 8, color: '#8B5CF6' },
    { name: 'Done', value: 56, color: '#10B981' },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RPieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={70} label={{ fontSize: 10 }}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </RPieChart>
    </ResponsiveContainer>
  );
}
