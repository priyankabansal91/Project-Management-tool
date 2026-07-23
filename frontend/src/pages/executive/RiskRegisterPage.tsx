import { useState, useMemo } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, Plus, Search, Filter, X, ChevronRight, Calendar, Users,
  Shield, TrendingUp, TrendingDown, Minus, Download, Eye, ArrowUpRight, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type RiskStatus = 'open' | 'mitigating' | 'accepted' | 'closed';
type Probability = 1 | 2 | 3 | 4 | 5;
type Impact = 1 | 2 | 3 | 4 | 5;

interface Risk {
  id: string;
  title: string;
  description: string;
  project_key: string;
  project_name: string;
  division: string;
  category: 'schedule' | 'budget' | 'scope' | 'resource' | 'technical' | 'vendor' | 'compliance';
  probability: Probability;
  impact: Impact;
  score: number;
  severity: Severity;
  status: RiskStatus;
  owner: string;
  escalated_to: string | null;
  mitigation_plan: string;
  contingency: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  trend: 'up' | 'down' | 'flat';
}

const mockRisks: Risk[] = [
  { id: 'rk1', title: 'Key developer absence blocks AGM payment migration', description: 'Raj Patel on medical leave until May. No backfill identified. 8 tasks blocked.', project_key: 'AGM', project_name: 'API Gateway Migration', division: 'Platform Engineering', category: 'resource', probability: 5, impact: 5, score: 25, severity: 'critical', status: 'open', owner: 'David Park', escalated_to: 'CTO', mitigation_plan: 'Evaluate contractor backfill from preferred vendor list. Transfer knowledge from Raj via recorded walkthroughs.', contingency: 'Descope payment migration to Phase 2 and extend AGM timeline by 4 weeks.', due_date: '2026-04-25', created_at: '2026-04-10', updated_at: '2026-04-19', trend: 'up' },
  { id: 'rk2', title: 'Vendor API v3 documentation delayed', description: 'Payment gateway vendor has not delivered v3 API docs. Originally promised March 31.', project_key: 'AGM', project_name: 'API Gateway Migration', division: 'Platform Engineering', category: 'vendor', probability: 4, impact: 5, score: 20, severity: 'critical', status: 'mitigating', owner: 'David Park', escalated_to: 'VP Engineering', mitigation_plan: 'Escalated to vendor account manager. Weekly follow-up calls scheduled. Exploring v2 API compatibility layer as interim solution.', contingency: 'Use v2 API with adapter pattern. 2 week additional effort.', due_date: '2026-04-22', created_at: '2026-04-01', updated_at: '2026-04-18', trend: 'flat' },
  { id: 'rk3', title: 'Offline sync module behind schedule', description: '5 tasks overdue in MAV2 offline module. Depends on AGM API endpoints.', project_key: 'MAV2', project_name: 'Mobile App v2', division: 'Product Engineering', category: 'schedule', probability: 4, impact: 4, score: 16, severity: 'high', status: 'open', owner: 'James Wright', escalated_to: 'VP Engineering', mitigation_plan: 'Implement local queue fallback that works offline without AGM dependency. Decouple offline sync from real-time sync.', contingency: 'Ship v2.0 without full offline mode. Add in v2.1 patch.', due_date: '2026-04-30', created_at: '2026-04-08', updated_at: '2026-04-19', trend: 'up' },
  { id: 'rk4', title: 'Salesforce API rate limits during peak hours', description: 'CRM sync hitting rate limits during business hours. Causes partial data sync failures.', project_key: 'CRM', project_name: 'CRM Integration', division: 'Sales & Marketing', category: 'technical', probability: 3, impact: 4, score: 12, severity: 'high', status: 'mitigating', owner: 'Lisa Chang', escalated_to: null, mitigation_plan: 'Implement exponential backoff with jitter. Move bulk syncs to off-peak hours (midnight batch). Request rate limit increase from Salesforce.', contingency: 'Fall back to daily batch sync instead of real-time.', due_date: '2026-05-01', created_at: '2026-04-05', updated_at: '2026-04-17', trend: 'down' },
  { id: 'rk5', title: 'Budget overrun risk on DAD', description: 'Data Analytics Dashboard at 59% budget with 55% completion. Margin tight.', project_key: 'DAD', project_name: 'Data Analytics Dashboard', division: 'Data Engineering', category: 'budget', probability: 3, impact: 3, score: 9, severity: 'medium', status: 'open', owner: 'Marco Silva', escalated_to: null, mitigation_plan: 'Optimize remaining stories — cut nice-to-have features from scope. Negotiate fixed-price with ML vendor.', contingency: 'Request additional $30k budget allocation from reserve.', due_date: '2026-05-15', created_at: '2026-04-12', updated_at: '2026-04-19', trend: 'flat' },
  { id: 'rk6', title: 'App Store review timeline uncertainty', description: 'Apple review process may take 2+ weeks. No buffer in current schedule.', project_key: 'MAV2', project_name: 'Mobile App v2', division: 'Product Engineering', category: 'schedule', probability: 3, impact: 3, score: 9, severity: 'medium', status: 'accepted', owner: 'James Wright', escalated_to: null, mitigation_plan: 'Submit app for review 3 weeks early. Use TestFlight for pre-release testing. Engage Apple Developer Relations for expedited review.', contingency: 'Adjust launch date by 2 weeks if review is delayed.', due_date: '2026-06-15', created_at: '2026-04-15', updated_at: '2026-04-19', trend: 'flat' },
  { id: 'rk7', title: 'SOC 2 evidence collection gap', description: 'Missing evidence for 3 out of 20 Trust Service Criteria controls.', project_key: 'SOC2', project_name: 'SOC 2 Compliance', division: 'Legal & Compliance', category: 'compliance', probability: 2, impact: 4, score: 8, severity: 'medium', status: 'mitigating', owner: 'George Hayes', escalated_to: null, mitigation_plan: 'Assign dedicated analyst to evidence collection. Weekly checkpoint with auditor.', contingency: 'Request audit extension for specific controls.', due_date: '2026-06-30', created_at: '2026-03-20', updated_at: '2026-04-15', trend: 'down' },
  { id: 'rk8', title: 'Cloud migration staging env instability', description: 'Intermittent failures in CMP2 staging. Traced to networking config.', project_key: 'CMP2', project_name: 'Cloud Migration Phase 2', division: 'IT Operations', category: 'technical', probability: 2, impact: 3, score: 6, severity: 'low', status: 'mitigating', owner: 'Bob Martinez', escalated_to: null, mitigation_plan: 'Network team investigating VPC peering config. Fix ETA Apr 23.', contingency: 'Fall back to direct connect if VPC peering unreliable.', due_date: '2026-04-23', created_at: '2026-04-16', updated_at: '2026-04-19', trend: 'down' },
];

const severityColors: Record<Severity, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-600', text: 'text-white' },
  high: { bg: 'bg-orange-500', text: 'text-white' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

const statusColors: Record<RiskStatus, string> = {
  open: 'bg-red-100 text-red-700',
  mitigating: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  closed: 'bg-emerald-100 text-emerald-700',
};

const categoryLabels: Record<string, string> = {
  schedule: 'Schedule', budget: 'Budget', scope: 'Scope', resource: 'Resource',
  technical: 'Technical', vendor: 'Vendor', compliance: 'Compliance',
};

const trendIcons: Record<string, typeof TrendingUp> = { up: TrendingUp, down: TrendingDown, flat: Minus };
const trendColors: Record<string, string> = { up: 'text-red-600', down: 'text-emerald-600', flat: 'text-muted-foreground' };

function matrixColor(p: number, i: number): string {
  const score = p * i;
  if (score >= 15) return 'bg-red-500';
  if (score >= 8) return 'bg-orange-400';
  if (score >= 4) return 'bg-amber-300';
  return 'bg-emerald-300';
}

export function RiskRegisterPage() {
  const dialog = useDialog();
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(mockRisks[0]);
  const [showMatrix, setShowMatrix] = useState(true);

  const filtered = useMemo(() => mockRisks.filter((r) => {
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.project_key.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.score - a.score), [search, filterSeverity, filterStatus]);

  const sevCounts = { critical: mockRisks.filter((r) => r.severity === 'critical' && r.status !== 'closed').length, high: mockRisks.filter((r) => r.severity === 'high' && r.status !== 'closed').length, medium: mockRisks.filter((r) => r.severity === 'medium' && r.status !== 'closed').length, low: mockRisks.filter((r) => r.severity === 'low' && r.status !== 'closed').length };
  const escalated = mockRisks.filter((r) => r.escalated_to).length;

  // Build 5×5 matrix
  const matrixRisks: Record<string, Risk[]> = {};
  mockRisks.filter((r) => r.status !== 'closed').forEach((r) => {
    const key = `${r.probability}-${r.impact}`;
    (matrixRisks[key] = matrixRisks[key] || []).push(r);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Risk & Issue Register</h1>
          <p className="text-muted-foreground">{mockRisks.filter((r) => r.status !== 'closed').length} open risks across {new Set(mockRisks.map((r) => r.project_key)).size} projects &middot; {escalated} escalated</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMatrix(!showMatrix)}>{showMatrix ? 'Hide' : 'Show'} Matrix</Button>
          <Button size="sm" onClick={() => dialog.alert({ title: 'Exporting', message: 'Exporting risk register as PDF...', variant: 'info' })}><Download className="h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 text-center border-red-200">
          <div className="text-2xl font-bold text-red-600">{sevCounts.critical}</div>
          <div className="text-[11px] text-muted-foreground">Critical</div>
        </Card>
        <Card className="p-3 text-center border-orange-200">
          <div className="text-2xl font-bold text-orange-500">{sevCounts.high}</div>
          <div className="text-[11px] text-muted-foreground">High</div>
        </Card>
        <Card className="p-3 text-center border-amber-200">
          <div className="text-2xl font-bold text-amber-600">{sevCounts.medium}</div>
          <div className="text-[11px] text-muted-foreground">Medium</div>
        </Card>
        <Card className="p-3 text-center border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{sevCounts.low}</div>
          <div className="text-[11px] text-muted-foreground">Low</div>
        </Card>
        <Card className="p-3 text-center border-violet-200">
          <div className="text-2xl font-bold text-violet-600">{escalated}</div>
          <div className="text-[11px] text-muted-foreground">Escalated</div>
        </Card>
      </div>

      {/* Probability × Impact Matrix */}
      {showMatrix && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Matrix — Probability × Impact</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1 max-w-lg">
              <div />
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">Impact {i}</div>)}
              {[5, 4, 3, 2, 1].map((p) => (
                <>
                  <div key={`l${p}`} className="text-[10px] font-semibold text-muted-foreground flex items-center justify-end pr-2">P{p}</div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const cellRisks = matrixRisks[`${p}-${i}`] || [];
                    return (
                      <div key={`${p}-${i}`} className={cn('rounded h-10 flex items-center justify-center text-[10px] font-bold text-white relative cursor-default', matrixColor(p, i))} title={cellRisks.map((r) => r.project_key + ': ' + r.title).join('\n')}>
                        {cellRisks.length > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white/90 text-gray-800 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow">{cellRisks.length}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px]">
              <span className="flex items-center gap-1"><div className="h-3 w-6 rounded bg-red-500" />Critical (15-25)</span>
              <span className="flex items-center gap-1"><div className="h-3 w-6 rounded bg-orange-400" />High (8-14)</span>
              <span className="flex items-center gap-1"><div className="h-3 w-6 rounded bg-amber-300" />Medium (4-7)</span>
              <span className="flex items-center gap-1"><div className="h-3 w-6 rounded bg-emerald-300" />Low (1-3)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search risks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="inline-flex rounded-md border">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button key={s} onClick={() => setFilterSeverity(s)} className={cn('px-3 py-1.5 text-xs capitalize', filterSeverity === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>{s}</button>
          ))}
        </div>
        <div className="inline-flex rounded-md border">
          {(['all', 'open', 'mitigating', 'accepted', 'closed'] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-1.5 text-xs capitalize', filterStatus === s ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>{s}</button>
          ))}
        </div>
      </div>

      {/* Risk List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {filtered.map((r) => {
            const TrendIcon = trendIcons[r.trend];
            const isSelected = selectedRisk?.id === r.id;
            return (
              <Card key={r.id} className={cn('p-3 cursor-pointer transition-all', isSelected && 'ring-2 ring-primary')} onClick={() => setSelectedRisk(r)}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold', severityColors[r.severity].bg, severityColors[r.severity].text)}>{r.score}</div>
                    <TrendIcon className={cn('h-3.5 w-3.5', trendColors[r.trend])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{r.project_key}</Badge>
                      <Badge className={cn('text-[10px]', severityColors[r.severity].bg, severityColors[r.severity].text)}>{r.severity}</Badge>
                      <Badge className={cn('text-[10px]', statusColors[r.status])}>{r.status}</Badge>
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{r.title}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">{r.owner} &middot; {categoryLabels[r.category]} &middot; Due {r.due_date}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {selectedRisk ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn(severityColors[selectedRisk.severity].bg, severityColors[selectedRisk.severity].text)}>{selectedRisk.severity.toUpperCase()}</Badge>
                      <Badge className={cn(statusColors[selectedRisk.status])}>{selectedRisk.status}</Badge>
                      <Badge variant="outline" className="text-[10px] font-mono">{selectedRisk.project_key}</Badge>
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[selectedRisk.category]}</Badge>
                    </div>
                    <CardTitle className="text-lg">{selectedRisk.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRisk.project_name} &middot; {selectedRisk.division}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={cn('h-14 w-14 rounded-xl flex items-center justify-center text-xl font-bold', severityColors[selectedRisk.severity].bg, severityColors[selectedRisk.severity].text)}>{selectedRisk.score}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">P{selectedRisk.probability} × I{selectedRisk.impact}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold mb-1">Description</h4>
                  <p className="text-sm">{selectedRisk.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 text-sm">
                  <div><span className="text-xs text-muted-foreground">Owner</span><div className="font-medium">{selectedRisk.owner}</div></div>
                  <div><span className="text-xs text-muted-foreground">Escalated To</span><div className="font-medium">{selectedRisk.escalated_to || '—'}</div></div>
                  <div><span className="text-xs text-muted-foreground">Due Date</span><div className="font-medium">{selectedRisk.due_date}</div></div>
                  <div><span className="text-xs text-muted-foreground">Trend</span><div className={cn('font-medium flex items-center gap-1', trendColors[selectedRisk.trend])}>{(() => { const I = trendIcons[selectedRisk.trend]; return <I className="h-4 w-4" />; })()}{selectedRisk.trend === 'up' ? 'Worsening' : selectedRisk.trend === 'down' ? 'Improving' : 'Stable'}</div></div>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                  <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Mitigation Plan</h4>
                  <p className="text-sm">{selectedRisk.mitigation_plan}</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3">
                  <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Contingency Plan</h4>
                  <p className="text-sm">{selectedRisk.contingency}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t text-[11px] text-muted-foreground">
                  <span>Created {selectedRisk.created_at}</span>
                  <span>Updated {selectedRisk.updated_at}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground">Select a risk to view details</Card>
          )}
        </div>
      </div>
    </div>
  );
}
