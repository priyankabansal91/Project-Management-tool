import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle, ListTodo, Clock, TrendingUp,
  TrendingDown, Check, X, Flame, Building2, Link2,
  Users, Zap, BarChart3, Shield, Flag, Target, Calendar, ArrowRight,
  RefreshCw, ChevronRight, Bell, CheckCircle2, Circle, AlertCircle,
  Layers, Activity, Wallet, Timer,
  Play, Pause, StopCircle, AtSign, UserPlus, BellRing, Inbox, Moon,
} from 'lucide-react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn, timeAgo, priorityColor } from '@/lib/utils';
import {
  useDashboard, useDashboardV2, useMilestoneBurnDashboard,
  usePendingApprovals, useMyTasks, useWeeklySummary, useProjects,
  useDivisionOverviewMIS, useExecutiveRollup, useApproveStep, useRejectStep,
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
} from '@/api/hooks';
import { DashboardCustomizer } from '@/components/dashboard/DashboardCustomizer';
import { useDashboardCustomizer } from '@/store/dashboardCustomizerStore';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  org_admin: 'System Admin',
  division_admin: 'Division Head',
  vertical_head: 'Vertical Head',
  team_lead: 'Team Lead',
  project_manager: 'Project Lead',
  member: 'Team Member',
  executive: 'Leadership',
  viewer: 'Observer',
};

function safeDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'number' || typeof detail === 'boolean') return String(detail);
  if (typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    if (d.from !== undefined && d.to !== undefined) return `${d.from} → ${d.to}`;
    if (d.value !== undefined) return String(d.value);
    if (d.name) return `assigned to ${d.name}`;
    if (d.status) return String(d.status);
    if (d.title) return String(d.title);
    return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return '';
}

function ragColor(pct: number): { bg: string; border: string; text: string; label: string } {
  if (pct >= 70) return { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-300', text: 'text-green-700 dark:text-green-300', label: 'On Track' };
  if (pct >= 40) return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300', text: 'text-amber-700 dark:text-amber-300', label: 'At Risk' };
  return { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300', text: 'text-red-700 dark:text-red-300', label: 'Off Track' };
}

function ProgressBar({ value, colorClass = 'bg-primary' }: { value: number; colorClass?: string }) {
  return (
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', colorClass)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function MiniStatChip({ label, value, color = 'text-foreground' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-3">
      <span className={cn('text-xl font-bold', color)}>{value}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5 text-center">{label}</span>
    </div>
  );
}

function fmtCurrency(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function agingBadge(createdAt?: string): { label: string; cls: string; isEscalated: boolean } {
  if (!createdAt) return { label: 'New', cls: 'bg-gray-100 text-gray-600 border-gray-200', isEscalated: false };
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days >= 7) return { label: `${days}d — Escalate`, cls: 'bg-red-100 text-red-700 border-red-200', isEscalated: true };
  if (days >= 3) return { label: `${days}d`, cls: 'bg-amber-100 text-amber-700 border-amber-200', isEscalated: false };
  return { label: days === 0 ? 'Today' : `${days}d`, cls: 'bg-green-100 text-green-700 border-green-200', isEscalated: false };
}

// ─── Pending Approvals widget (shared across roles) ───────────────────────────

function PendingApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 5 });
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  if (!q.isLoading && total === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Pending Approvals
          {total > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-semibold">{total}</span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/approvals/inbox')}>
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          items.map((a: any) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border px-3 py-2 hover:bg-muted/40 cursor-pointer transition-colors"
              onClick={() => navigate('/approvals/inbox')}
            >
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.title || a.description || 'Approval Request'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.createdAt || a.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── OrgAdmin Section ─────────────────────────────────────────────────────────

function OrgAdminSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const execQ = useExecutiveRollup();
  const org = execQ.data?.orgSummary;
  const alerts = execQ.data?.alerts ?? [];
  const { isWidgetVisible } = useDashboardCustomizer();

  return (
    <div className="space-y-4">
      {/* Org health summary — widget: org_health */}
      {isWidgetVisible('org_health') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStatChip label="Divisions Active" value={org?.divisionsCount ?? '—'} color="text-blue-600" />
          <MiniStatChip label="Projects Running" value={org?.activeProjects ?? '—'} color="text-green-600" />
          <MiniStatChip label="Members" value={org?.totalMembers ?? '—'} color="text-purple-600" />
          <MiniStatChip label="Pending Approvals" value="—" color="text-amber-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Division RAG overview — widget: division_rag */}
        {isWidgetVisible('division_rag') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Division Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {execQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (Array.isArray(execQ.data?.scorecards) ? execQ.data!.scorecards : []).slice(0, 5).map((sc: any) => {
                const pct = sc.completionRate ?? sc.completionPct ?? sc.health_score ?? 0;
                const rag = ragColor(pct);
                return (
                  <div key={sc.divisionId || sc.id} className={cn('rounded-lg border p-3 space-y-2', rag.bg, rag.border)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{sc.divisionName || sc.name}</span>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', rag.text, rag.border)}>{rag.label}</span>
                    </div>
                    <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                    <p className="text-xs text-muted-foreground">{pct}% completion · {sc.activeProjects ?? sc.projectCount ?? 0} active projects</p>
                  </div>
                );
              })}
              {!execQ.isLoading && (execQ.data?.scorecards ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No division data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alerts + Quick Actions */}
        <div className="space-y-4">
          {/* Alerts — widget: risk_alerts_exec */}
          {isWidgetVisible('risk_alerts_exec') && alerts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.slice(0, 4).map((a, i) => (
                  <div key={i} className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                    a.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700' :
                    'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                  )}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{a.message} <span className="font-medium">({a.division})</span></span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions — always visible */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Add Division', icon: Layers, path: '/admin/divisions' },
                  { label: 'Invite Users', icon: Users, path: '/admin/users' },
                  { label: 'Audit Log', icon: Shield, path: '/admin/audit-log' },
                  { label: 'Feature Flags', icon: Zap, path: '/admin/feature-flags' },
                ].map(({ label, icon: Icon, path }) => (
                  <Button key={label} variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate(path)}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending approvals — widget: vh_approvals */}
      {isWidgetVisible('vh_approvals') && <PendingApprovalsWidget navigate={navigate} />}
    </div>
  );
}

// ─── Division Admin sub-components ───────────────────────────────────────────

function VerticalHealthCard({ v, idx, navigate }: { v: any; idx: number; navigate: ReturnType<typeof useNavigate> }) {
  const pct = v.task_completion_rate ?? v.health_score ?? 0;
  const rag = ragColor(pct);
  const budgetSeed = [6500000, 4800000, 8200000, 3600000, 5100000, 7400000];
  const budgetPlanned = v.budget_planned ?? budgetSeed[idx % budgetSeed.length];
  const budgetConsumed = v.budget_consumed ?? Math.round(budgetPlanned * (0.3 + pct / 180));
  const budgetPct = Math.round((budgetConsumed / budgetPlanned) * 100);
  const budgetBar = budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500';
  const delayed = v.delayed_milestones ?? Math.max(0, Math.round((100 - pct) / 20));
  const msTotal = v.milestone_count ?? (v.project_count ?? 3) * 3;
  const msDone = v.milestones_completed ?? Math.round(msTotal * pct / 100);
  const burnTrend = v.burn_trend ?? (pct >= 70 ? 6 : pct >= 40 ? -3 : -14);
  const isHighRisk = delayed > 2 || budgetPct > 90;

  return (
    <Card className={cn('border-l-4 transition-all hover:shadow-lg cursor-pointer', rag.border)}
      onClick={() => navigate('/admin/divisions')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isHighRisk && <Flame className="h-3.5 w-3.5 text-red-500 shrink-0" />}
            <span className="font-semibold text-sm leading-tight truncate">{v.name}</span>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border', rag.text, rag.bg, rag.border)}>
            {rag.label}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Budget</span>
            <span className="font-semibold">{fmtCurrency(budgetConsumed)} <span className="text-muted-foreground font-normal">/ {fmtCurrency(budgetPlanned)}</span></span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', budgetBar)} style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{budgetPct}% consumed</span>
            <span className={cn(budgetPct >= 90 ? 'text-red-600 font-medium' : '')}>{fmtCurrency(budgetPlanned - budgetConsumed)} left</span>
          </div>
        </div>

        <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />

        <div className="grid grid-cols-3 gap-1 pt-1 border-t text-center">
          <div>
            <p className={cn('text-sm font-bold', rag.text)}>{pct}%</p>
            <p className="text-[9px] text-muted-foreground">Done</p>
          </div>
          <div className="border-x">
            <p className={cn('text-sm font-bold', delayed > 0 ? 'text-red-600' : 'text-green-600')}>{delayed}</p>
            <p className="text-[9px] text-muted-foreground">Delayed</p>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-600">{msDone}/{msTotal}</p>
            <p className="text-[9px] text-muted-foreground">Milestones</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1 border-t">
          <span className="text-muted-foreground">{v.project_count ?? 0}p · {v.member_count ?? 0}m</span>
          <span className={cn('flex items-center gap-0.5 font-semibold', burnTrend >= 0 ? 'text-green-600' : 'text-red-500')}>
            {burnTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {burnTrend > 0 ? '+' : ''}{burnTrend}%/wk
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function MilestoneCalendarStrip({ milestones }: { milestones: any[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {days.map((d, i) => {
        const isToday = i === 0;
        const dayMs = milestones.filter((m: any) => {
          const due = m.dueDate || m.due_date;
          if (!due) return false;
          const dd = new Date(due);
          dd.setHours(0, 0, 0, 0);
          return dd.getTime() === d.getTime();
        });
        const hasOverdue = dayMs.some((m: any) => m.isOverdue);
        return (
          <div key={i} className={cn(
            'flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 min-w-[38px] shrink-0 transition-colors',
            isToday ? 'bg-primary/10 border border-primary/40' :
            dayMs.length > 0 ? 'bg-muted/60 border border-border' : 'border border-transparent'
          )}>
            <span className={cn('text-[9px] font-medium uppercase', isToday ? 'text-primary' : 'text-muted-foreground')}>
              {d.toLocaleDateString('en', { weekday: 'short' })}
            </span>
            <span className={cn('text-xs font-bold', isToday ? 'text-primary' : 'text-foreground')}>
              {d.getDate()}
            </span>
            <div className="flex gap-0.5 flex-wrap justify-center min-h-[8px]">
              {dayMs.slice(0, 3).map((_, j) => (
                <div key={j} className={cn('h-1.5 w-1.5 rounded-full', hasOverdue ? 'bg-red-500' : 'bg-blue-500')} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EnhancedApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 8 });
  const approveM = useApproveStep();
  const rejectM  = useRejectStep();
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  const displayItems = items;
  const displayTotal = total;

  const typeColors: Record<string, string> = {
    Milestone: 'bg-purple-100 text-purple-700',
    Budget:    'bg-amber-100 text-amber-700',
    Access:    'bg-blue-100 text-blue-700',
    Workflow:  'bg-green-100 text-green-700',
  };
  const priorityDot: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Pending Approvals
          {displayTotal > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-bold">{displayTotal}</span>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/approvals')}>
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          displayItems.slice(0, 5).map((a: any) => {
            const age = agingBadge(a.createdAt || a.created_at);
            const aType = a.approvalType || a.approval_type || a.type || 'Request';
            const priority = a.priority || 'medium';
            return (
              <div key={a.id} className={cn(
                'rounded-lg border p-3 space-y-2',
                age.isEscalated ? 'border-red-200 bg-red-50/60 dark:bg-red-950/10' : 'border-border hover:bg-muted/20'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', priorityDot[priority] || 'bg-amber-500')} />
                    <p className="text-sm font-medium truncate">{a.title || a.description || 'Approval Request'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {age.isEscalated && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', age.cls)}>{age.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', typeColors[aType] || 'bg-gray-100 text-gray-600')}>
                    {aType}
                  </span>
                  {a.requestedBy && <span>by {a.requestedBy}</span>}
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Button size="sm"
                    className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={approveM.isPending}
                    onClick={(e) => { e.stopPropagation(); approveM.mutate({ approvalId: a.id }); }}>
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline"
                    className="h-7 text-xs flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={rejectM.isPending}
                    onClick={(e) => { e.stopPropagation(); rejectM.mutate({ approvalId: a.id }); }}>
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0"
                    onClick={() => navigate('/admin/approvals')}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// Delay risk classifier for milestones
function calcDelayRisk(m: any): { label: string; cls: string } {
  const dueDate = m.dueDate || m.due_date;
  const progress = m.progress ?? m.burnRate ?? 0;
  if (!dueDate) return { label: 'Low', cls: 'bg-green-100 text-green-700 border-green-200' };
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0)                          return { label: 'Critical', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (days <= 2 && progress < 70)        return { label: 'High',     cls: 'bg-red-100 text-red-700 border-red-200' };
  if (days <= 7 && progress < 60)        return { label: 'High',     cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  if (days <= 14 && progress < 50)       return { label: 'Medium',   cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Low', cls: 'bg-green-100 text-green-700 border-green-200' };
}

// ─── Division Admin Section ───────────────────────────────────────────────────

function DivisionAdminSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const misQ = useDivisionOverviewMIS();
  const divisionItems: any[] = Array.isArray(misQ.data) ? misQ.data : [];
  const burnQ = useMilestoneBurnDashboard();
  const rawBurnDA = burnQ.data?.items ?? burnQ.data?.milestones ?? burnQ.data;
  const burnItems: any[] = Array.isArray(rawBurnDA) ? rawBurnDA : [];
  const approvalsQ = usePendingApprovals({ page_size: 1 });
  void useDashboardV2();

  const verticals = divisionItems;

  const milestones = burnItems.filter((m: any) => {
    const d = m.dueDate || m.due_date;
    return d && Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) <= 30;
  }).slice(0, 8);

  const budgetSeed = [6500000, 4800000, 8200000, 3600000, 5100000, 7400000];
  const actualSeed = [4420000, 3120000, 5330000, 2180000, 3570000, 5180000];
  const onTrack  = verticals.filter((v: any) => (v.task_completion_rate ?? v.health_score ?? 0) >= 70).length;
  const atRisk   = verticals.filter((v: any) => { const p = v.task_completion_rate ?? v.health_score ?? 0; return p >= 40 && p < 70; }).length;
  const critical = verticals.filter((v: any) => (v.task_completion_rate ?? v.health_score ?? 0) < 40).length;
  const totalBudget = verticals.reduce((sum: number, _: any, i: number) => sum + budgetSeed[i % budgetSeed.length], 0);
  const totalActual = verticals.reduce((sum: number, _: any, i: number) => sum + actualSeed[i % actualSeed.length], 0);
  const delayedCount = milestones.filter((m: any) => m.isOverdue || calcDelayRisk(m).label !== 'Low').length;
  const pendingApprovals = approvalsQ.data?.total ?? approvalsQ.data?.items?.length ?? 3;

  return (
    <div className="space-y-5">
      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Active Projects */}
        <MiniStatChip
          label="Active Projects"
          value={verticals.reduce((s: number, v: any) => s + (v.project_count ?? 0), 0)}
          color="text-blue-600" />

        {/* RAG Status Split — combined chip */}
        <div className="flex flex-col items-center rounded-lg border p-3 gap-1">
          <span className="text-[11px] text-muted-foreground font-medium">RAG Status</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />{onTrack}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />{atRisk}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />{critical}
            </span>
          </div>
        </div>

        {/* Budget Planned vs Actual */}
        <div className="flex flex-col rounded-lg border p-3 gap-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-muted-foreground font-medium text-center">Budget</span>
          <div className="flex items-end justify-center gap-2">
            <div className="text-center">
              <p className="text-base font-bold text-purple-600">{fmtCurrency(totalActual)}</p>
              <p className="text-[9px] text-muted-foreground">Spent</p>
            </div>
            <span className="text-muted-foreground text-xs mb-1">/</span>
            <div className="text-center">
              <p className="text-base font-bold">{fmtCurrency(totalBudget)}</p>
              <p className="text-[9px] text-muted-foreground">Planned</p>
            </div>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden mt-0.5">
            <div className={cn('h-full rounded-full', totalActual / totalBudget > 0.9 ? 'bg-red-500' : totalActual / totalBudget > 0.75 ? 'bg-amber-500' : 'bg-green-500')}
              style={{ width: `${Math.min(100, Math.round((totalActual / totalBudget) * 100))}%` }} />
          </div>
        </div>

        {/* Delayed Milestones */}
        <MiniStatChip
          label="Delayed Milestones"
          value={delayedCount}
          color={delayedCount > 0 ? 'text-red-600' : 'text-green-600'} />

        {/* Pending Approvals */}
        <MiniStatChip
          label="Pending Approvals"
          value={pendingApprovals}
          color={pendingApprovals > 0 ? 'text-amber-600' : 'text-green-600'} />
      </div>

      {/* Vertical health cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Verticals Health
          </h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/divisions')}>
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {verticals.slice(0, 8).map((v: any, i: number) => (
            <VerticalHealthCard key={v.id} v={v} idx={i} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* Milestones + Approvals row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" /> Milestones Due This Month
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/milestones')}>
                All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <MilestoneCalendarStrip milestones={milestones} />
            <div className="space-y-2 pt-1">
              {milestones.slice(0, 5).map((m: any) => {
                const dueDate = m.dueDate || m.due_date;
                const days = dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000) : null;
                const isOverdue = m.isOverdue || (days !== null && days < 0);
                const urgencyClass = isOverdue
                  ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10'
                  : days !== null && days <= 3 ? 'border-amber-200 bg-amber-50/50' : '';
                const daysLabel = days === null ? '' : isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
                const burn = m.burnRate ?? m.progress ?? 0;
                const risk = calcDelayRisk(m);
                return (
                  <div key={m.id}
                    className={cn('rounded-lg border px-3 py-2.5 cursor-pointer hover:shadow-sm transition-all', urgencyClass)}
                    onClick={() => m.projectId ? navigate(`/projects/${m.projectId}/milestones`) : navigate('/milestones')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                          <Badge variant="outline" className="text-[9px] h-4">{m.projectName || '—'}</Badge>
                          {m.pmName && <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{m.pmName}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-semibold', risk.cls)}>
                          {risk.label} Risk
                        </span>
                        <p className={cn('text-[10px] font-semibold',
                          isOverdue ? 'text-red-600' : days !== null && days <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                          {daysLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={cn('h-full rounded-full',
                          isOverdue ? 'bg-red-500' : burn >= 70 ? 'bg-green-500' : burn >= 40 ? 'bg-blue-500' : 'bg-amber-500')}
                          style={{ width: `${burn}%` }} />
                      </div>
                      <span className="text-[10px] font-bold shrink-0 w-8 text-right">{burn}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <EnhancedApprovalsWidget navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Vertical Head sub-components ────────────────────────────────────────────

type MsStatus = 'completed' | 'in_progress' | 'pending' | 'overdue';
type VHMilestone = { title: string; status: MsStatus; burnRate?: number; hasDeps?: boolean };


function MilestoneTrack({ milestones }: { milestones: VHMilestone[] }) {
  const labelCls: Record<MsStatus, string> = {
    completed:   'text-green-600 dark:text-green-400',
    in_progress: 'text-blue-600 dark:text-blue-400 font-semibold',
    overdue:     'text-red-600 font-semibold',
    pending:     'text-muted-foreground',
  };
  const lineCls = (s: MsStatus) => s === 'completed' ? 'bg-green-300 dark:bg-green-700' : 'bg-border';

  // ● completed  ◐ in_progress  ○ pending  ✕ overdue
  const MsDot = ({ status }: { status: MsStatus }) => {
    if (status === 'completed')
      return (
        <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-green-500 shrink-0 flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      );
    if (status === 'in_progress')
      return (
        <div className="h-4 w-4 rounded-full border-2 border-blue-500 shrink-0 overflow-hidden ring-2 ring-blue-200 dark:ring-blue-900"
          style={{ background: 'linear-gradient(to right, #3B82F6 50%, transparent 50%)' }} />
      );
    if (status === 'overdue')
      return (
        <div className="h-4 w-4 rounded-full bg-red-500 border-2 border-red-500 shrink-0 flex items-center justify-center">
          <X className="h-2.5 w-2.5 text-white" />
        </div>
      );
    return <div className="h-4 w-4 rounded-full border-2 border-border bg-background shrink-0" />;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        {milestones.map((ms, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none" title={`${ms.title} — ${(ms.status ?? '').replace('_', ' ')}${ms.burnRate ? ` · ${ms.burnRate}% burn` : ''}`}>
            <MsDot status={ms.status} />
            {i < milestones.length - 1 && (
              <div className={cn('h-0.5 flex-1 transition-colors', lineCls(ms.status))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-start">
        {milestones.map((ms, i) => (
          <div key={i} className="flex-1 text-center">
            <p className={cn('text-[9px] leading-tight truncate px-0.5', labelCls[ms.status])}>{ms.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalProjectCard({ p, idx, navigate }: { p: any; idx: number; navigate: ReturnType<typeof useNavigate> }) {
  const pct = p.completion_pct ?? 0;
  const rag = ragColor(pct);
  const bSeed = [4500000, 3200000, 5800000, 2900000];
  const budgetPlanned  = p.budget_planned  ?? bSeed[idx % bSeed.length];
  const budgetConsumed = p.budget_consumed ?? Math.round(budgetPlanned * (0.3 + pct / 160));
  const budgetPct = Math.round((budgetConsumed / budgetPlanned) * 100);
  const pMilestones: VHMilestone[] = p.milestones ?? [];
  const delayed  = pMilestones.filter(m => m.status === 'overdue').length;
  const done     = pMilestones.filter(m => m.status === 'completed').length;
  const hasDeps  = pMilestones.some(m => m.hasDeps && (m.status === 'in_progress' || m.status === 'overdue'));
  const activeMs = pMilestones.find(m => m.status === 'in_progress' || m.status === 'overdue');
  const burnRate = activeMs?.burnRate ?? 0;
  const burnDrift = burnRate - pct;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/projects/${p.id}/board`)}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
            <p className="font-semibold text-sm truncate">{p.name}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {delayed > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />{delayed}
              </span>
            )}
            <Badge variant="outline" className="text-[10px]">{p.key}</Badge>
          </div>
        </div>

        {/* Milestone track ○ ○ ◐ ● ● */}
        <MilestoneTrack milestones={pMilestones} />

        {/* Burn rate vs completion indicator */}
        {burnRate > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" /> Burn rate
              </span>
              <span className={cn('font-semibold',
                burnDrift > 15 ? 'text-red-600' : burnDrift > 5 ? 'text-amber-600' : 'text-green-600')}>
                {burnRate}% {burnDrift > 5 ? `(+${burnDrift}% drift)` : ''}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
              <div className="absolute inset-y-0 left-0 h-full bg-green-400 opacity-50 rounded-full"
                style={{ width: `${pct}%` }} />
              <div className={cn('absolute inset-y-0 left-0 h-full rounded-full opacity-80',
                burnDrift > 15 ? 'bg-red-500' : burnDrift > 5 ? 'bg-amber-500' : 'bg-blue-500')}
                style={{ width: `${burnRate}%` }} />
            </div>
          </div>
        )}

        {/* Dependency alert */}
        {hasDeps && (
          <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 px-2 py-1 text-[10px]">
            <Link2 className="h-3 w-3 text-amber-600 shrink-0" />
            <span className="text-amber-700 dark:text-amber-300 font-medium">Dependency blockers active</span>
          </div>
        )}

        {/* Budget row */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" /> Budget</span>
            <span className={cn('font-semibold',
              budgetPct >= 95 ? 'text-red-600' : budgetPct >= 80 ? 'text-amber-600' : 'text-green-600')}>
              {fmtCurrency(budgetConsumed)} / {fmtCurrency(budgetPlanned)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div className={cn('h-full rounded-full',
              budgetPct >= 95 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500')}
              style={{ width: `${Math.min(100, budgetPct)}%` }} />
          </div>
        </div>

        {/* Completion + RAG */}
        <div>
          <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">{done}/{pMilestones.length} milestones · {pct}%</span>
            <span className={cn('font-semibold', rag.text)}>{rag.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t">
          <span>{delayed > 0 ? `${delayed} milestone${delayed > 1 ? 's' : ''} delayed` : 'All milestones on track'}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">View board →</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialVariancePanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const mockVariances = [
    { id: 'v1', name: 'CPR — Development Phase', variance: 12, burnRate: 68, completionRate: 62, risk: 'medium' as const },
    { id: 'v2', name: 'AGM — API Migration',      variance: 28, burnRate: 82, completionRate: 28, risk: 'high'   as const },
    { id: 'v3', name: 'MAV2 — Mobile Build',      variance: -5, burnRate: 45, completionRate: 45, risk: 'low'    as const },
    { id: 'v4', name: 'QMS — Compliance Review',  variance: 18, burnRate: 74, completionRate: 70, risk: 'medium' as const },
  ];
  const resourceAlerts = [
    { name: 'Rahul Sharma',  utilization: 118, role: 'Backend Dev' },
    { name: 'Carol Johnson', utilization: 105, role: 'Designer' },
  ];
  const riskBg: Record<string, string> = {
    high:   'border-red-200 bg-red-50/50 dark:bg-red-950/10',
    medium: 'border-amber-200 bg-amber-50/50',
    low:    '',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Financial Variance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {mockVariances.map((v) => {
            const drift = v.burnRate - v.completionRate;
            return (
              <div key={v.id} className={cn('rounded-lg border px-3 py-2 space-y-1', riskBg[v.risk])}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate flex-1">{v.name}</p>
                  <span className={cn('text-[10px] font-bold shrink-0',
                    v.variance > 0 ? 'text-red-600' : 'text-green-600')}>
                    {v.variance > 0 ? '+' : ''}{v.variance}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span>Burn {v.burnRate}% · Done {v.completionRate}%</span>
                  {drift > 10 && (
                    <span className="text-red-600 font-semibold flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +{drift}% drift
                    </span>
                  )}
                </div>
                {drift > 0 && (
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', drift > 20 ? 'bg-red-500' : drift > 10 ? 'bg-amber-500' : 'bg-green-500')}
                      style={{ width: `${Math.min(100, (drift / 40) * 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resource overload */}
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Resource Overload</p>
          {resourceAlerts.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 px-3 py-1.5">
              <div>
                <p className="text-xs font-medium">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.role}</p>
              </div>
              <span className="text-sm font-bold text-orange-600">{r.utilization}%</span>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/projects')}>
          <Activity className="h-3.5 w-3.5 mr-1" /> Full Resource Report
        </Button>
      </CardContent>
    </Card>
  );
}

function VerticalApprovalsWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const q = usePendingApprovals({ page_size: 10 });
  const approveM = useApproveStep();
  const rejectM  = useRejectStep();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items: any[] = q.data?.items ?? [];
  const total: number = q.data?.total ?? items.length;

  const displayItems = items;
  const displayTotal  = total;

  function slaStatus(createdAt: string, priority: string) {
    const slaHours: Record<string, number> = { high: 48, medium: 120, low: 168 };
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    const limit = slaHours[priority] || 120;
    const pct = Math.min(100, (elapsed / limit) * 100);
    const remaining = Math.max(0, Math.round(limit - elapsed));
    if (pct >= 100) return { label: 'SLA Breached', pct, cls: 'text-red-600', barCls: 'bg-red-500' };
    if (pct >= 75)  return { label: `${remaining}h left`, pct, cls: 'text-amber-600', barCls: 'bg-amber-500' };
    return { label: `${remaining}h left`, pct, cls: 'text-green-600', barCls: 'bg-green-500' };
  }

  const typeColors: Record<string, string> = {
    Milestone: 'bg-purple-100 text-purple-700',
    Budget:    'bg-amber-100 text-amber-700',
    Workflow:  'bg-blue-100 text-blue-700',
  };

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" /> Approvals Queue
          {displayTotal > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-bold">{displayTotal}</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { selected.forEach(id => approveM.mutate({ approvalId: id })); setSelected(new Set()); }}>
              <Check className="h-3 w-3 mr-1" /> Approve {selected.size}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/approvals')}>
            All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          displayItems.slice(0, 5).map((a: any) => {
            const sla = slaStatus(a.createdAt || a.created_at || new Date().toISOString(), a.priority || 'medium');
            const aType = a.approvalType || a.type || 'Request';
            const isSel = selected.has(a.id);
            return (
              <div key={a.id}
                className={cn('rounded-lg border p-3 space-y-2 cursor-pointer transition-all',
                  isSel ? 'border-primary/40 bg-primary/5' :
                  sla.pct >= 100 ? 'border-red-200 bg-red-50/40' : 'hover:bg-muted/20')}
                onClick={() => toggle(a.id)}>
                <div className="flex items-start gap-2">
                  <div className={cn('h-4 w-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                    isSel ? 'bg-primary border-primary' : 'border-border')}>
                    {isSel && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.title || 'Approval Request'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded font-medium', typeColors[aType] || 'bg-gray-100 text-gray-600')}>{aType}</span>
                      {a.project && <span>{a.project}</span>}
                      {a.requestedBy && <span>by {a.requestedBy}</span>}
                    </div>
                  </div>
                </div>
                {/* SLA bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">SLA Timer</span>
                    <span className={cn('font-semibold', sla.cls)}>{sla.label}</span>
                  </div>
                  <div className="h-1 rounded-full bg-secondary overflow-hidden">
                    <div className={cn('h-full rounded-full', sla.barCls)} style={{ width: `${sla.pct}%` }} />
                  </div>
                </div>
                {!isSel && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-6 text-[11px] flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={approveM.isPending}
                      onClick={(e) => { e.stopPropagation(); approveM.mutate({ approvalId: a.id }); }}>
                      <Check className="h-2.5 w-2.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[11px] flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      disabled={rejectM.isPending}
                      onClick={(e) => { e.stopPropagation(); rejectM.mutate({ approvalId: a.id }); }}>
                      <X className="h-2.5 w-2.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function VHActiveRisksPanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const sevCls: Record<string, string> = {
    high:   'border-red-200 bg-red-50/50 dark:bg-red-950/10',
    medium: 'border-amber-200 bg-amber-50/50',
  };
  const sevDot: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500' };
  const sevBadge: Record<string, string> = {
    high:   'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" /> Active Risks
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/executive/risk-register')}>
            Register <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center py-6">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">No active risks logged</p>
        </div>
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/executive/risk-register')}>
          <Activity className="h-3.5 w-3.5 mr-1" /> View Risk Register
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Vertical Head Section ────────────────────────────────────────────────────

function VerticalHeadSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const projectsQ = useProjects({ status: 'active' });
  const rawProjects = projectsQ.data?.items ?? projectsQ.data;
  const projects: any[] = Array.isArray(rawProjects) ? rawProjects : [];
  const dv2Q = useDashboardV2();
  const burnQ = useMilestoneBurnDashboard();

  const displayProjects = projects;

  const totalMembers   = dv2Q.data?.totalMembers ?? 0;
  const openApprovals  = dv2Q.data?.pendingApprovals ?? 0;
  const avgCompletion  = Math.round(displayProjects.reduce((s: number, p: any) => s + (p.completion_pct ?? 0), 0) / Math.max(1, displayProjects.length));
  const deliveryEff    = Math.min(100, Math.round(avgCompletion * 1.05));
  const sprintHealth   = avgCompletion >= 70 ? 'Good' : avgCompletion >= 40 ? 'Fair' : 'Poor';
  const sprintColor    = avgCompletion >= 70 ? 'text-green-600' : avgCompletion >= 40 ? 'text-amber-600' : 'text-red-600';
  const activeRisks    = 0;
  const highRisks      = 0;

  const rawBurnVH = burnQ.data?.items ?? burnQ.data?.milestones ?? burnQ.data;
  const burnQ_items: any[] = Array.isArray(rawBurnVH) ? rawBurnVH : [];
  const delayedCount = burnQ_items.filter((m: any) => m.isOverdue || m.is_overdue).length;

  return (
    <div className="space-y-5">
      {/* KPI strip — 5 operational metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniStatChip label="Team Utilization"  value={dv2Q.data?.teamUtilization != null ? `${dv2Q.data.teamUtilization}%` : '—'}
          color="text-blue-600" />
        <MiniStatChip label="Delivery Eff."     value={`${deliveryEff}%`}
          color={deliveryEff >= 80 ? 'text-green-600' : 'text-amber-600'} />
        <div className="flex flex-col items-center rounded-lg border p-3 gap-0.5 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => navigate('/executive/risk-register')}>
          <span className={cn('text-xl font-bold', highRisks > 0 ? 'text-red-600' : 'text-green-600')}>{activeRisks}</span>
          <span className="text-[11px] text-muted-foreground text-center">Active Risks</span>
          {highRisks > 0 && (
            <span className="text-[9px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5">{highRisks} high</span>
          )}
        </div>
        <MiniStatChip label="Sprint Health"     value={sprintHealth}       color={sprintColor} />
        <MiniStatChip label="Delayed Milestones" value={delayedCount}
          color={delayedCount > 0 ? 'text-red-600' : 'text-green-600'} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStatChip label="Active Projects" value={displayProjects.length} color="text-blue-600" />
        <MiniStatChip label="Team Members"    value={totalMembers}           color="text-purple-600" />
        <MiniStatChip label="Open Approvals"  value={openApprovals}          color="text-amber-600" />
      </div>

      {/* Project cards with ○ ◐ ● milestone track */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Project Health
          </h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/projects')}>
            All projects <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {displayProjects.slice(0, 3).map((p: any, i: number) => (
            <VerticalProjectCard key={p.id} p={p} idx={i} navigate={navigate} />
          ))}
        </div>
      </div>

      {/* 3-panel bottom row: Financial Variance | Active Risks | Approvals Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FinancialVariancePanel navigate={navigate} />
        <VHActiveRisksPanel navigate={navigate} />
        <VerticalApprovalsWidget navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Project Manager sub-components ──────────────────────────────────────────


function MilestoneNavCard({ m, isSelected, onClick }: { m: any; isSelected: boolean; onClick: () => void }) {
  const statusIcons: Record<string, React.ReactNode> = {
    completed:   <CheckCircle2 className="h-4 w-4 text-green-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500" />,
    on_hold:     <AlertCircle className="h-4 w-4 text-orange-500" />,
    pending:     <Circle className="h-4 w-4 text-gray-400" />,
  };
  const statusBg: Record<string, string> = {
    completed:   'border-green-200 bg-green-50/40',
    in_progress: 'border-blue-200 bg-blue-50/40',
    on_hold:     'border-orange-200',
    pending:     '',
  };
  const burn = m.burnRate ?? m.progress ?? 0;
  const isOverdue = m.isOverdue || false;

  return (
    <button onClick={onClick} className={cn(
      'flex-shrink-0 w-48 rounded-xl border-2 p-3 text-left transition-all hover:shadow-md',
      isSelected ? 'border-primary bg-primary/5 shadow-md' :
      isOverdue  ? 'border-red-300 bg-red-50/30 hover:border-red-400' :
      cn('hover:border-primary/40', statusBg[m.status] || ''),
    )}>
      <div className="flex items-center justify-between gap-1 mb-1.5">
        {statusIcons[m.status] || statusIcons.pending}
        {isOverdue && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Overdue</span>}
        {!isOverdue && (m.driftDays ?? 0) > 0 && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">+{m.driftDays}d</span>}
      </div>
      <p className="text-xs font-semibold leading-tight line-clamp-2">{m.title}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{m.projectName}</p>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">{m.completedTasks ?? 0}/{m.totalTasks ?? 0} tasks</span>
          <span className="font-bold">{burn}%</span>
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div className={cn('h-full rounded-full',
            m.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-500' : burn >= 60 ? 'bg-blue-500' : 'bg-amber-500')}
            style={{ width: `${burn}%` }} />
        </div>
      </div>
    </button>
  );
}

function MilestoneTaskList({ milestone, navigate }: { milestone: any; navigate: ReturnType<typeof useNavigate> }) {
  const tasks: any[] = milestone.tasks ?? [];
  const blocked     = tasks.filter(t => (t.blockers?.length ?? 0) > 0 && t.status !== 'done');
  const inProgress  = tasks.filter(t => t.status === 'in_progress' && !(t.blockers?.length));
  const todo        = tasks.filter(t => t.status === 'todo' && !(t.blockers?.length));
  const done        = tasks.filter(t => t.status === 'done');
  const pDot: Record<string, string> = { critical: 'bg-red-600', high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' };

  const TaskRow = ({ t }: { t: any }) => (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors',
      (t.blockers?.length ?? 0) > 0 && t.status !== 'done' ? 'border border-red-200/60 bg-red-50/30 dark:bg-red-950/10' : ''
    )} onClick={() => navigate('/my-tasks')}>
      <div className={cn('h-2 w-2 rounded-full shrink-0', pDot[t.priority] || 'bg-amber-500')} />
      <p className={cn('text-xs flex-1 min-w-0 truncate', t.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium')}>{t.title}</p>
      <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-muted-foreground">
        {(t.blockers?.length ?? 0) > 0 && t.status !== 'done' && (
          <span className="text-red-600 font-semibold flex items-center gap-0.5">
            <Link2 className="h-3 w-3" />{t.blockers.length}
          </span>
        )}
        <span>{t.assignee}</span>
      </div>
    </div>
  );

  const Group = ({ label, items, dot }: { label: string; items: any[]; dot: string }) =>
    items.length === 0 ? null : (
      <div>
        <div className="flex items-center gap-2 px-1 mb-1 mt-2 first:mt-0">
          <div className={cn('h-2 w-2 rounded-full', dot)} />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-[10px] font-bold">{items.length}</span>
        </div>
        {items.map(t => <TaskRow key={t.id} t={t} />)}
      </div>
    );

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
      {tasks.length === 0
        ? <p className="text-sm text-muted-foreground text-center py-6">No tasks in this milestone</p>
        : <>
            <Group label="Blocked"     items={blocked}    dot="bg-red-500" />
            <Group label="In Progress" items={inProgress} dot="bg-blue-500" />
            <Group label="To Do"       items={todo}       dot="bg-gray-400" />
            <Group label="Done"        items={done}       dot="bg-green-500" />
          </>
      }
    </div>
  );
}

function BurnVsPlanWidget({ milestone }: { milestone: any }) {
  const pH = milestone.plannedHours  ?? 80;  const aH = milestone.actualHours  ?? 0;
  const pB = milestone.plannedBudget ?? 1e6; const aB = milestone.actualBudget ?? 0;
  const ePct = pH > 0 ? Math.round((aH / pH) * 100) : 0;
  const bPct = pB > 0 ? Math.round((aB / pB) * 100) : 0;
  const drift = milestone.driftDays ?? 0;

  const barClsFor = (pct: number) => pct >= 115 ? 'bg-red-500' : pct >= 100 ? 'bg-amber-500' : 'bg-blue-500';
  const txtClsFor = (pct: number, actual: number, planned: number) =>
    actual > planned ? (pct >= 115 ? 'text-red-600' : 'text-amber-600') : 'text-green-600';

  const CompareRow = ({ label, icon: Icon, actualVal, plannedVal, pct, fmtFn }: {
    label: string; icon: any; actualVal: number; plannedVal: number; pct: number; fmtFn: (n: number) => string;
  }) => {
    const diff = Math.abs(pct - 100);
    const over = actualVal > plannedVal;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-medium flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{label}</span>
          <span className={cn('font-semibold text-[11px]', txtClsFor(pct, actualVal, plannedVal))}>
            {fmtFn(actualVal)} / {fmtFn(plannedVal)} ({over ? '+' : '-'}{diff}%)
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
          <div className="absolute inset-0 bg-muted/40 rounded-full" />
          <div className={cn('absolute inset-y-0 left-0 h-full rounded-full', barClsFor(pct))}
            style={{ width: `${Math.min(115, pct)}%`, opacity: 0.85 }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Plan: {fmtFn(plannedVal)}</span><span>Actual: {fmtFn(actualVal)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <CompareRow label="Effort" icon={Timer} actualVal={aH} plannedVal={pH} pct={ePct} fmtFn={n => `${n}h`} />
      <CompareRow label="Budget" icon={Wallet} actualVal={aB} plannedVal={pB} pct={bPct} fmtFn={fmtCurrency} />

      <div className={cn('rounded-lg border px-3 py-2 flex items-center justify-between',
        drift > 5 ? 'border-red-200 bg-red-50/50' : drift > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50')}>
        <span className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Timeline</span>
        <span className={cn('text-sm font-bold', drift > 5 ? 'text-red-600' : drift > 0 ? 'text-amber-600' : 'text-green-600')}>
          {drift === 0 ? 'On Schedule' : `+${drift} day drift`}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span className="text-green-600 font-medium">Completion {milestone.progress ?? 0}%</span>
          <span className="text-blue-600 font-medium">Burn {milestone.burnRate ?? 0}%</span>
        </div>
        <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
          <div className="absolute inset-y-0 left-0 h-full bg-green-400 rounded-full opacity-50"
            style={{ width: `${milestone.progress ?? 0}%` }} />
          <div className="absolute inset-y-0 left-0 h-full bg-blue-500 rounded-full opacity-70"
            style={{ width: `${milestone.burnRate ?? 0}%` }} />
        </div>
        {(milestone.burnRate ?? 0) > (milestone.progress ?? 0) + 10 && (
          <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Burn ahead of completion by {(milestone.burnRate ?? 0) - (milestone.progress ?? 0)}%
          </p>
        )}
      </div>
    </div>
  );
}

function TimeTrackingAggregates({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const mockTeam = [
    { name: 'Rahul Sharma',  role: 'Backend',  logged: 36, estimated: 40, tasks: 8,  overdue: 0 },
    { name: 'Carol Johnson', role: 'Frontend', logged: 42, estimated: 40, tasks: 6,  overdue: 1 },
    { name: 'David Park',    role: 'Backend',  logged: 28, estimated: 40, tasks: 5,  overdue: 0 },
    { name: 'Priya Sharma',  role: 'Design',   logged: 38, estimated: 32, tasks: 4,  overdue: 1 },
  ];
  const overloaded = mockTeam.filter(m => m.logged > m.estimated);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" /> Time Tracking
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {mockTeam.reduce((s, m) => s + m.logged, 0)}h logged / {mockTeam.reduce((s, m) => s + m.estimated, 0)}h est.
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockTeam.map(m => {
          const util = Math.round((m.logged / m.estimated) * 100);
          const over = m.logged > m.estimated;
          return (
            <div key={m.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar name={m.name} size="sm" />
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted-foreground">{m.role}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.overdue > 0 && <span className="text-[10px] text-red-600 font-semibold">{m.overdue} overdue</span>}
                  <span className={cn('font-bold', over ? 'text-orange-600' : 'text-foreground')}>{m.logged}h</span>
                  <span className="text-muted-foreground text-[11px]">/ {m.estimated}h</span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div className="absolute inset-0 bg-muted/40 rounded-full" />
                <div className={cn('absolute inset-y-0 left-0 h-full rounded-full',
                  util >= 110 ? 'bg-orange-500' : util >= 100 ? 'bg-amber-500' : 'bg-green-500')}
                  style={{ width: `${Math.min(100, util)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{m.tasks} tasks</span>
                <span className={cn(over ? 'text-orange-600 font-medium' : 'text-green-600')}>{util}% utilization</span>
              </div>
            </div>
          );
        })}

        {overloaded.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-300">
              {overloaded.map(m => m.name.split(' ')[0]).join(', ')} {overloaded.length === 1 ? 'is' : 'are'} over capacity — consider rebalancing
            </p>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/time-logging')}>
          <Clock className="h-3.5 w-3.5 mr-1" /> Full Time Log
        </Button>
      </CardContent>
    </Card>
  );
}

// Kanban column definition
type KanbanColId = 'blocked' | 'todo' | 'in_progress' | 'done';
const KANBAN_COLS: Array<{ id: KanbanColId; label: string; dot: string; header: string; bg: string }> = [
  { id: 'blocked',     label: 'Blocked',     dot: 'bg-red-500',   header: 'text-red-600',   bg: 'bg-red-50/50 dark:bg-red-950/10' },
  { id: 'todo',        label: 'To Do',       dot: 'bg-gray-400',  header: 'text-gray-600',  bg: 'bg-gray-50/60 dark:bg-gray-900/20' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-blue-500',  header: 'text-blue-600',  bg: 'bg-blue-50/50 dark:bg-blue-950/10' },
  { id: 'done',        label: 'Done',        dot: 'bg-green-500', header: 'text-green-600', bg: 'bg-green-50/50 dark:bg-green-950/10' },
];

function getTaskColId(t: any): KanbanColId {
  if ((t.blockers?.length ?? 0) > 0 && t.status !== 'done') return 'blocked';
  const s = (t.status ?? 'todo').toLowerCase();
  if (s === 'done' || s === 'completed' || s === 'closed') return 'done';
  if (s === 'in_progress') return 'in_progress';
  return 'todo';
}

function PMKanbanBoard({ milestone, navigate }: { milestone: any; navigate: ReturnType<typeof useNavigate> }) {
  const allTasks: any[] = milestone?.tasks ?? [];
  const [taskCols, setTaskCols] = useState<Record<string, KanbanColId>>(() => {
    const m: Record<string, KanbanColId> = {};
    allTasks.forEach(t => { m[t.id] = getTaskColId(t); });
    return m;
  });

  const NEXT: Record<KanbanColId, KanbanColId> = {
    blocked: 'todo', todo: 'in_progress', in_progress: 'done', done: 'todo',
  };
  const pDot: Record<string, string> = { critical: 'bg-red-600', high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-green-400' };

  const colTasks = (colId: KanbanColId) => allTasks.filter(t => (taskCols[t.id] ?? getTaskColId(t)) === colId);
  const moveTask = (id: string, to: KanbanColId) => setTaskCols(prev => ({ ...prev, [id]: to }));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KANBAN_COLS.map(col => {
        const tasks = colTasks(col.id);
        return (
          <div key={col.id} className={cn('rounded-xl p-2.5 space-y-2 min-h-[180px]', col.bg)}>
            <div className="flex items-center gap-1.5 pb-2 border-b">
              <div className={cn('h-2 w-2 rounded-full', col.dot)} />
              <span className={cn('text-xs font-semibold', col.header)}>{col.label}</span>
              <span className="ml-auto text-[10px] font-bold text-muted-foreground">{tasks.length}</span>
            </div>
            <div className="space-y-1.5">
              {tasks.map(t => (
                <div key={t.id}
                  className="rounded-lg border bg-background p-2 space-y-1.5 cursor-pointer hover:shadow-sm transition-all group relative"
                  onClick={() => moveTask(t.id, NEXT[col.id])}>
                  <div className="flex items-start gap-1.5">
                    <div className={cn('h-1.5 w-1.5 rounded-full shrink-0 mt-1.5', pDot[t.priority ?? 'medium'])} />
                    <p className={cn('text-[11px] font-medium leading-tight',
                      col.id === 'done' ? 'line-through text-muted-foreground' : '')}>
                      {t.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pl-3 flex-wrap">
                    {t.assignee && <span className="truncate max-w-[80px]">{t.assignee}</span>}
                    {(t.blockers?.length ?? 0) > 0 && t.status !== 'done' && (
                      <span className="text-red-600 font-semibold flex items-center gap-0.5">
                        <Link2 className="h-2.5 w-2.5" />{t.blockers.length}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {KANBAN_COLS.filter(c => c.id !== col.id).map(c => (
                      <button key={c.id}
                        className="text-[9px] px-1.5 py-0.5 rounded border bg-muted/50 hover:bg-muted text-muted-foreground"
                        onClick={(e) => { e.stopPropagation(); moveTask(t.id, c.id); }}>
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4 opacity-40">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EffortVarianceChart({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const mockData = [
    { name: 'Rahul S.',  planned: 40, actual: 36, tasks: 8,  overdue: 0 },
    { name: 'Carol J.',  planned: 40, actual: 42, tasks: 6,  overdue: 1 },
    { name: 'David P.',  planned: 40, actual: 28, tasks: 5,  overdue: 0 },
    { name: 'Priya S.',  planned: 32, actual: 38, tasks: 4,  overdue: 1 },
  ];
  const total = { planned: mockData.reduce((s, m) => s + m.planned, 0), actual: mockData.reduce((s, m) => s + m.actual, 0) };
  const overall = Math.round((total.actual / total.planned) * 100);

  const WEEK_BURNS = [18, 34, 47, 56, 68]; // % complete by end of each sprint week

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Effort & Burn Trend
          </CardTitle>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border',
            overall > 110 ? 'text-red-600 bg-red-50 border-red-200' :
            overall > 100 ? 'text-amber-600 bg-amber-50 border-amber-200' :
            'text-green-600 bg-green-50 border-green-200')}>
            {total.actual}h / {total.planned}h ({overall}%)
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Per-member effort bars */}
        <div className="space-y-2">
          {mockData.map(m => {
            const util = Math.round((m.actual / m.planned) * 100);
            const over = m.actual > m.planned;
            return (
              <div key={m.name} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={m.name} size="sm" />
                    <span className="font-medium truncate max-w-[80px]">{m.name}</span>
                    {m.overdue > 0 && <span className="text-[10px] text-red-600 font-semibold">{m.overdue} OD</span>}
                  </div>
                  <span className={cn('font-bold text-[11px]', over ? 'text-orange-600' : 'text-foreground')}>
                    {m.actual}h<span className="text-muted-foreground font-normal">/{m.planned}h</span>
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
                  {/* Plan reference line */}
                  <div className="absolute inset-y-0 left-0 w-full bg-muted/60 rounded-full" />
                  {/* Actual bar */}
                  <div className={cn('absolute inset-y-0 left-0 h-full rounded-full',
                    util >= 110 ? 'bg-orange-500' : util >= 100 ? 'bg-amber-500' : 'bg-green-500')}
                    style={{ width: `${Math.min(110, util)}%`, opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Burn-rate trend sparkline (5-week) */}
        <div className="border-t pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-muted-foreground uppercase tracking-wide">Burn Rate Trend</span>
            <span className="text-blue-600 font-bold">Sprint {WEEK_BURNS.length} weeks</span>
          </div>
          <div className="flex items-end gap-1.5 h-10">
            {WEEK_BURNS.map((pct, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                <div className="w-full rounded-t bg-blue-500 opacity-80 transition-all"
                  style={{ height: `${(pct / 100) * 32}px` }} />
                <span className="text-[9px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Start</span>
            <span className="text-blue-600 font-medium">Current: {WEEK_BURNS[WEEK_BURNS.length - 1]}%</span>
          </div>
        </div>

        {/* Task completion rate */}
        <div className="border-t pt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 px-2 py-2 text-center">
            <p className="text-base font-bold text-green-600">24</p>
            <p className="text-[10px] text-muted-foreground">Tasks Done</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2 text-center">
            <p className="text-base font-bold text-blue-600">13</p>
            <p className="text-[10px] text-muted-foreground">In Progress</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-2 text-center">
            <p className="text-base font-bold text-red-600">5</p>
            <p className="text-[10px] text-muted-foreground">Blocked</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => navigate('/time-logging')}>
          <Clock className="h-3.5 w-3.5 mr-1" /> Full Time Log
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Project Manager Section ──────────────────────────────────────────────────

function ProjectManagerSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const burnQ = useMilestoneBurnDashboard();
  const dv2Q  = useDashboardV2();
  const rawBurn = burnQ.data?.items ?? burnQ.data?.milestones ?? burnQ.data;
  const burnItems: any[] = Array.isArray(rawBurn) ? rawBurn : [];

  const milestones: any[] = burnItems;
  const [selectedId, setSelectedId] = useState<string>(milestones[0]?.id ?? '');
  const [msView, setMsView] = useState<'timeline' | 'kanban'>('timeline');
  const selectedMs = milestones.find((m: any) => m.id === selectedId) ?? milestones[0];

  const activeMilestones  = milestones.filter((m: any) => m.status === 'in_progress').length;
  const overdueMilestones = milestones.filter((m: any) => m.isOverdue).length;
  const blockedTasks      = milestones.flatMap((m: any) => m.tasks ?? []).filter((t: any) => (t.blockers?.length ?? 0) > 0 && t.status !== 'done').length;
  const pendingApprovals  = dv2Q.data?.pendingApprovals ?? 0;
  const totalBudgetUsed   = milestones.reduce((s: number, m: any) => s + (m.actualBudget ?? 0), 0);
  const totalBudgetPlan   = milestones.reduce((s: number, m: any) => s + (m.plannedBudget ?? 0), 0);
  const budgetPct         = totalBudgetPlan > 0 ? Math.round((totalBudgetUsed / totalBudgetPlan) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStatChip label="Active Milestones"  value={activeMilestones}  color="text-blue-600" />
        <MiniStatChip label="Overdue"            value={overdueMilestones} color={overdueMilestones > 0 ? 'text-red-600' : 'text-green-600'} />
        <MiniStatChip label="Blocked Tasks"      value={blockedTasks}      color={blockedTasks > 0 ? 'text-orange-600' : 'text-green-600'} />
        <MiniStatChip label="Pending Approvals"  value={pendingApprovals}  color="text-amber-600" />
        <MiniStatChip label="Budget Used"        value={fmtCurrency(totalBudgetUsed)} color="text-purple-600" />
        <MiniStatChip label="Budget Health"      value={`${budgetPct}%`}   color={budgetPct >= 110 ? 'text-red-600' : budgetPct >= 90 ? 'text-amber-600' : 'text-green-600'} />
      </div>

      {/* Milestone navigator with view toggle */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Flag className="h-4 w-4" /> Milestones
          </h3>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                  msView === 'timeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                onClick={() => setMsView('timeline')}>
                <Layers className="h-3 w-3" /> Timeline
              </button>
              <button
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                  msView === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                onClick={() => setMsView('kanban')}>
                <FolderKanban className="h-3 w-3" /> Kanban
              </button>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/milestones')}>
              All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Milestone cards row (scroll) */}
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {milestones.slice(0, 8).map((m: any) => (
            <MilestoneNavCard key={m.id} m={m} isSelected={m.id === selectedId} onClick={() => setSelectedId(m.id)} />
          ))}
        </div>
      </div>

      {/* Selected milestone detail */}
      {selectedMs && (
        msView === 'kanban' ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <span className="truncate">{selectedMs.title}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{selectedMs.projectName}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0 text-[11px] text-muted-foreground">
                  <span>{selectedMs.completedTasks ?? 0}/{selectedMs.totalTasks ?? 0} tasks</span>
                  <span>·</span>
                  <span>{selectedMs.progress ?? 0}% complete</span>
                  <span className="text-[9px] opacity-60 hidden sm:inline">Click card → move status · "→" buttons → move to column</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PMKanbanBoard milestone={selectedMs} navigate={navigate} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="truncate">{selectedMs.title}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{selectedMs.projectName}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedMs.isOverdue && <Badge className="bg-red-100 text-red-700 text-[10px] border-0">Overdue</Badge>}
                    <Button variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => selectedMs.projectId ? navigate(`/projects/${selectedMs.projectId}/milestones`) : navigate('/milestones')}>
                      Open <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>{selectedMs.completedTasks ?? 0}/{selectedMs.totalTasks ?? 0} tasks</span>
                  <span>{selectedMs.progress ?? 0}% complete</span>
                  <span className="capitalize">{(selectedMs.status ?? 'pending').replace('_', ' ')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <MilestoneTaskList milestone={selectedMs} navigate={navigate} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Burn vs Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BurnVsPlanWidget milestone={selectedMs} />
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Effort variance chart + Sprint status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EffortVarianceChart navigate={navigate} />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Sprint Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">Sprint 12</span>
                <Badge className="bg-blue-600 text-white text-[10px]">Active</Badge>
              </div>
              <ProgressBar value={65} colorClass="bg-blue-500" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>65% · 8 days remaining</span>
                <span>34 / 52 points</span>
              </div>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => navigate('/projects')}>
                Sprint Board <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Sprint 13</span>
                <Badge variant="outline" className="text-[10px]">Planning</Badge>
              </div>
              <p className="text-xs text-muted-foreground">18 stories in backlog · Grooming tomorrow</p>
            </div>
            <PendingApprovalsWidget navigate={navigate} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Team Lead Section ────────────────────────────────────────────────────────

function TeamLeadSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const dashQ = useDashboard();
  const teamWorkload: any[] = dashQ.data?.team_workload ?? [
    { user_id: '1', name: 'Carol Johnson', role: 'member', open_tasks: 6, high_priority: 2, overdue_tasks: 1, estimated_hours: 24 },
    { user_id: '2', name: 'David Park',    role: 'member', open_tasks: 5, high_priority: 1, overdue_tasks: 0, estimated_hours: 18 },
    { user_id: '3', name: 'Priya Sharma',  role: 'member', open_tasks: 4, high_priority: 0, overdue_tasks: 1, estimated_hours: 16 },
  ];

  const myTasksQ = useMyTasks();
  const rawMyTasks = myTasksQ.data?.items ?? myTasksQ.data;
  const myTasks: any[] = Array.isArray(rawMyTasks) ? rawMyTasks : [];
  const overdue = myTasks.filter((t: any) => t.is_overdue || t.isOverdue).length;
  const dueToday = myTasks.filter((t: any) => {
    if (!t.due_date && !t.dueDate) return false;
    const d = new Date(t.due_date || t.dueDate);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Team Size" value={teamWorkload.length} color="text-blue-600" />
        <MiniStatChip label="Due Today" value={dueToday} color="text-orange-600" />
        <MiniStatChip label="Overdue" value={overdue} color={overdue > 0 ? 'text-red-600' : 'text-green-600'} />
        <MiniStatChip label="Open Tasks" value={teamWorkload.reduce((s, m) => s + m.open_tasks, 0)} color="text-purple-600" />
      </div>

      {/* Team workload table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Team Workload
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/admin/users')}>
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Member</th>
                  <th className="pb-2 text-center font-medium">Open</th>
                  <th className="pb-2 text-center font-medium">High P</th>
                  <th className="pb-2 text-center font-medium">Overdue</th>
                  <th className="pb-2 text-right font-medium">Est.Hrs</th>
                </tr>
              </thead>
              <tbody>
                {teamWorkload.map((m: any) => (
                  <tr key={m.user_id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate('/my-tasks')}>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={m.name} size="sm" />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-bold text-primary">{m.open_tasks}</td>
                    <td className="py-2.5 text-center">
                      <span className={cn('font-bold', m.high_priority > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
                        {m.high_priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={cn('font-bold', m.overdue_tasks > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        {m.overdue_tasks}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{m.estimated_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sprint status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Sprint Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">Sprint 12</span>
                <Badge className="bg-blue-600 text-white text-[10px]">Active</Badge>
              </div>
              <ProgressBar value={65} colorClass="bg-blue-500" />
              <p className="text-xs text-muted-foreground">65% · 8 days remaining</p>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Sprint 13</span>
                <Badge variant="outline" className="text-[10px]">Planning</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Planning in progress. Backlog review tomorrow.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Member Section ───────────────────────────────────────────────────────────

type MemberNotifType = 'mention' | 'assignment' | 'approval' | 'deadline' | 'blocker';

// Inline task row with status cycling
function EnhancedTaskRow({ t, onStatusChange }: { t: any; onStatusChange: (id: string, s: string) => void }) {
  const cycle: Record<string, string> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
  const raw = (t.status ?? '').toLowerCase();
  const ns = ['done', 'completed', 'closed'].includes(raw) ? 'done'
    : ['in_progress', 'in progress', 'active'].includes(raw) ? 'in_progress' : 'todo';

  const statusIcon: Record<string, React.ReactNode> = {
    done:        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500 shrink-0" />,
    todo:        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />,
  };
  const priorityDot: Record<string, string> = {
    critical: 'bg-red-600', high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-green-400',
  };

  const due = t.due_date || t.dueDate;
  const dueFmt = due ? new Date(due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
  const isOverdue = due && new Date(due) < new Date() && ns !== 'done';
  const milestone = t.milestone || t.milestoneName;

  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors group border border-transparent hover:border-border/50">
      <button className="shrink-0 hover:scale-110 transition-transform"
        onClick={() => onStatusChange(t.id, cycle[ns])}
        title="Click to cycle status">
        {statusIcon[ns]}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityDot[t.priority ?? 'medium'] ?? priorityDot.medium)} />
          <span className={cn('text-sm truncate', ns === 'done' && 'line-through text-muted-foreground')}>{t.title}</span>
          {(t.blockers?.length > 0 || t.depsCount > 0) && (
            <span title="Has blockers"><Link2 className="h-3 w-3 text-red-500 shrink-0" /></span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-3">
          {milestone && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Flag className="h-2.5 w-2.5" />{milestone}
            </span>
          )}
          {dueFmt && (
            <span className={cn('text-[10px] font-medium flex items-center gap-0.5',
              isOverdue ? 'text-red-600' : 'text-muted-foreground')}>
              <Calendar className="h-2.5 w-2.5" />{dueFmt}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <Badge variant="outline" className="text-[10px] h-4">{t.project || t.projectKey || '—'}</Badge>
        {t.estimatedHours && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{t.estimatedHours}h</span>
        )}
      </div>
    </div>
  );
}

// Timer + daily breakdown + utilization
function TimeThisWeekPanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const weekQ = useWeeklySummary();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const fmtTimer = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const weeklyHours = weekQ.data?.totalHours ?? 0;
  const targetHours = weekQ.data?.targetHours ?? 40;
  const byDay = weekQ.data?.byDay ?? {};

  const todayDate = new Date();
  const dow = todayDate.getDay(); // 0=Sun
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // Generate Mon–Fri ISO date strings for current week
  const dayKeys = [1, 2, 3, 4, 5].map(d => {
    const dt = new Date(todayDate);
    dt.setDate(todayDate.getDate() - (dow === 0 ? 6 : dow - d));
    return dt.toISOString().split('T')[0];
  });
  const todayIdx = dow === 0 ? -1 : dow - 1; // index 0=Mon
  const dailyRaw = dayKeys.map(k => byDay[k] ?? 0);
  const dailyDisplay = dailyRaw.some(v => v > 0) ? dailyRaw : [6.5, 7.0, 8.0, 5.0, 0];
  const displayTotal = weeklyHours > 0 ? weeklyHours : dailyDisplay.reduce((a, b) => a + b, 0);
  const utilPct = targetHours > 0 ? Math.round((displayTotal / targetHours) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" /> Time This Week
          </CardTitle>
          <span className="text-xs text-muted-foreground">{displayTotal}h / {targetHours}h target</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer widget */}
        <div className={cn('rounded-lg border p-3 space-y-2 transition-colors',
          timerRunning ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-border')}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate flex-1">
              {timerRunning ? 'Timer running…' : 'Start a work timer'}
            </span>
            <span className={cn('font-mono text-sm font-bold tabular-nums',
              timerRunning ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
              {fmtTimer(timerElapsed)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm"
              className={cn('h-7 text-xs flex-1',
                timerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white')}
              onClick={() => setTimerRunning(r => !r)}>
              {timerRunning
                ? <><Pause className="h-3 w-3 mr-1" />Pause</>
                : <><Play className="h-3 w-3 mr-1" />Start Timer</>}
            </Button>
            {timerElapsed > 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2"
                title="Stop & discard"
                onClick={() => { setTimerRunning(false); setTimerElapsed(0); }}>
                <StopCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate('/time-tracking')}>
              Manual
            </Button>
          </div>
        </div>

        {/* Daily bar chart */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Daily Breakdown</p>
          <div className="flex items-end gap-1.5" style={{ height: '52px' }}>
            {DAYS.map((day, i) => {
              const h = dailyDisplay[i];
              const pct = Math.min(100, (h / 8) * 100);
              const isToday = i === todayIdx;
              const barH = pct > 0 ? Math.max(6, pct * 0.38) : 3;
              return (
                <div key={day} className="flex flex-col items-center gap-0.5 flex-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '38px' }}>
                    <div className={cn('w-full rounded-t transition-all',
                      isToday ? 'bg-primary' : pct >= 80 ? 'bg-green-400 dark:bg-green-600' : pct > 0 ? 'bg-blue-300 dark:bg-blue-700' : 'bg-muted')}
                      style={{ height: `${barH}px` }} />
                  </div>
                  <span className={cn('text-[10px]', isToday ? 'font-bold text-primary' : 'text-muted-foreground')}>{day}</span>
                  <span className="text-[9px] text-muted-foreground leading-none">{h > 0 ? `${h}h` : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Utilization bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Weekly utilization</span>
            <span className={cn('font-bold',
              utilPct >= 100 ? 'text-orange-600' : utilPct >= 60 ? 'text-green-600' : 'text-amber-600')}>
              {utilPct}%
            </span>
          </div>
          <ProgressBar value={utilPct}
            colorClass={utilPct >= 100 ? 'bg-orange-500' : utilPct >= 60 ? 'bg-green-500' : 'bg-amber-500'} />
        </div>

        {/* Productivity summary */}
        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-green-600">5</p>
            <p className="text-[10px] text-muted-foreground">Tasks closed</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-lg font-bold text-blue-600">+2</p>
            <p className="text-[10px] text-muted-foreground">vs last week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// My Projects — milestone context + dep warnings + activity
function MyProjectsPanel({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const projectsQ = useProjects({ status: 'active' });
  const apiProjects: any[] = projectsQ.data?.items ?? [];
  const displayProjects = apiProjects.slice(0, 2).map((p: any) => ({
    ...p, milestoneDone: 0, milestoneTotal: 0,
    completion: p.completion_pct ?? 0, myTasks: 0,
    recentActivity: [], blockingMyTask: null,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" /> My Projects
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/projects')}>
            All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayProjects.map((p: any, idx: number) => {
          const rag = ragColor(p.completion ?? 0);
          return (
            <div key={p.id} className={cn('space-y-2', idx < displayProjects.length - 1 && 'pb-3 border-b')}>
              {/* Project header */}
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/projects')}>
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#3B82F6' }} />
                <span className="text-sm font-semibold flex-1 truncate">{p.name}</span>
                <Badge variant="outline" className="text-[10px]">{p.key}</Badge>
              </div>

              {/* Milestone progress */}
              {p.milestoneTotal > 0 && (
                <div className="flex items-center gap-1.5 pl-4 text-[11px] text-muted-foreground">
                  <Flag className="h-3 w-3 shrink-0" />
                  <span>{p.milestoneDone}/{p.milestoneTotal} milestones done</span>
                </div>
              )}

              {/* Completion bar */}
              <div className="pl-4 space-y-1">
                <ProgressBar value={p.completion ?? 0}
                  colorClass={(p.completion ?? 0) >= 70 ? 'bg-green-500' : (p.completion ?? 0) >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{p.completion ?? 0}% complete</span>
                  <span className={rag.text}>{rag.label}</span>
                </div>
              </div>

              {/* Dependency blocker alert */}
              {p.blockingMyTask && (
                <div className="ml-4 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 px-2 py-1.5">
                  <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                  <span className="text-[10px] text-amber-700 dark:text-amber-300">{p.blockingMyTask}</span>
                </div>
              )}

              {/* Recent activity feed */}
              {(p.recentActivity ?? []).slice(0, 2).map((a: any, ai: number) => (
                <div key={ai} className="ml-4 flex items-start gap-1.5">
                  <Activity className="h-2.5 w-2.5 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="text-[10px] text-muted-foreground">
                    <strong className="text-foreground/70">{a.who}</strong> {a.action}
                    <span className="ml-1 text-muted-foreground/60">· {a.time}</span>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
        {displayProjects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No active projects</p>
        )}
      </CardContent>
    </Card>
  );
}

// Notifications panel — grouped, read/unread, snooze, tabs
function NotificationsPanelMember({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const notifQ = useNotifications({ unread_only: false, page: 1 });
  const markReadM = useMarkNotificationRead();
  const markAllM  = useMarkAllNotificationsRead();
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'assigned'>('all');

  const rawItems: any[] = notifQ.data?.items ?? [];
  const unreadCount = notifQ.data?.unreadCount ?? rawItems.filter((n: any) => !n.is_read).length;
  const items = rawItems;
  const visible = items.filter((n: any) => !snoozed.has(n.id));

  const tabVisible = visible.filter((n: any) => {
    if (activeTab === 'mentions') return n.type === 'mention';
    if (activeTab === 'assigned') return n.type === 'assignment';
    return true;
  });

  const urgentItems = tabVisible.filter((n: any) => n.urgent && !n.read);
  const normalItems = tabVisible.filter((n: any) => !n.urgent || n.read);

  const typeCfg: Record<string, { Icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    mention:    { Icon: AtSign,       color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900/40' },
    assignment: { Icon: UserPlus,     color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900/40' },
    approval:   { Icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    deadline:   { Icon: Clock,        color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/40' },
    blocker:    { Icon: Link2,        color: 'text-red-600',    bg: 'bg-red-100 dark:bg-red-900/40' },
  };
  const defaultCfg = { Icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' };

  const NotifRow = ({ n }: { n: any }) => {
    const cfg = typeCfg[n.type as string] ?? defaultCfg;
    const Icon = cfg.Icon;
    return (
      <div className={cn(
        'flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors group',
        !n.read && 'bg-blue-50/50 dark:bg-blue-950/10'
      )}
        onClick={() => { if (rawItems.length > 0) markReadM.mutate(n.id); navigate('/notifications'); }}>
        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
          <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 inline-block" />}
            <p className="text-xs font-semibold leading-tight truncate">{n.title}</p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{n.body}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{n.time || timeAgo(n.createdAt || n.created_at)}</p>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-muted mt-0.5"
          title="Snooze"
          onClick={(e) => { e.stopPropagation(); setSnoozed(s => new Set([...s, n.id])); }}>
          <Moon className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    );
  };

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" /> Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.5 font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground"
            onClick={() => markAllM.mutate()}>
            Mark all read
          </Button>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {(['all', 'mentions', 'assigned'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors',
                activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              {tab === 'all' ? 'All' : tab === 'mentions' ? '@Mentions' : 'Assigned'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-1 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {urgentItems.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 px-2 py-1">
              <AlertCircle className="h-3 w-3 text-red-500" />
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Urgent</span>
            </div>
            {urgentItems.map((n: any) => <NotifRow key={n.id} n={n} />)}
          </div>
        )}
        {normalItems.length > 0 && (
          <div className="space-y-0.5">
            {urgentItems.length > 0 && (
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-2">Earlier</p>
            )}
            {normalItems.map((n: any) => <NotifRow key={n.id} n={n} />)}
          </div>
        )}
        {tabVisible.length === 0 && (
          <div className="text-center py-8">
            <BellRing className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}
      </CardContent>

      <div className="px-4 pb-3 pt-2 border-t shrink-0">
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => navigate('/notifications')}>
          View all <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function MemberSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const myTasksQ = useMyTasks();
  const rawTasks = myTasksQ.data?.items ?? myTasksQ.data;
  const tasks: any[] = Array.isArray(rawTasks) ? rawTasks : [];
  const weekQ = useWeeklySummary();

  // Local status overrides (optimistic UI without mutation)
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});
  const handleStatusChange = (id: string, next: string) =>
    setTaskStatuses(prev => ({ ...prev, [id]: next }));

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59);
  const weekEnd  = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);

  const isDone = (t: any) => {
    const s = (taskStatuses[t.id] ?? t.status ?? '').toLowerCase();
    return ['done', 'completed', 'closed'].includes(s);
  };

  const overdue = tasks.filter(t => {
    if (isDone(t)) return false;
    const due = t.due_date || t.dueDate;
    return due && new Date(due) < today;
  });
  const dueToday = tasks.filter(t => {
    if (isDone(t)) return false;
    const due = t.due_date || t.dueDate;
    if (!due) return false;
    const d = new Date(due);
    return d >= today && d <= todayEnd;
  });
  const dueThisWeek = tasks.filter(t => {
    if (isDone(t)) return false;
    const due = t.due_date || t.dueDate;
    if (!due) return false;
    const d = new Date(due);
    return d > todayEnd && d <= weekEnd;
  });
  const later = tasks.filter(t => {
    if (isDone(t)) return false;
    const due = t.due_date || t.dueDate;
    if (!due) return true;
    return new Date(due) > weekEnd;
  });

  const groups = { overdue, dueToday, dueThisWeek, later };

  const totalVisible = groups.overdue.length + groups.dueToday.length + groups.dueThisWeek.length + groups.later.length;
  const weeklyHours = weekQ.data?.totalHours ?? 0;

  const GroupSection = ({
    label, items, dotColor, accentClass,
  }: { label: string; items: any[]; dotColor: string; accentClass?: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-0.5">
        <div className={cn('flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5', accentClass ?? 'bg-muted/30')}>
          <div className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
          <span className="text-xs font-bold text-foreground">{items.length}</span>
        </div>
        {items.map((t: any) => (
          <EnhancedTaskRow key={t.id}
            t={{ ...t, status: taskStatuses[t.id] ?? t.status }}
            onStatusChange={handleStatusChange} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Due Today"  value={groups.dueToday.length + groups.overdue.length} color="text-orange-600" />
        <MiniStatChip label="This Week"  value={groups.dueThisWeek.length}                       color="text-blue-600" />
        <MiniStatChip label="Overdue"    value={groups.overdue.length}  color={groups.overdue.length > 0 ? 'text-red-600' : 'text-green-600'} />
        <MiniStatChip label="Hrs Logged" value={weeklyHours > 0 ? `${weeklyHours}h` : '—'}      color="text-purple-600" />
      </div>

      {/* Row 1: Task inbox (2 cols) + Notifications (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" /> My Tasks
              {totalVisible > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-[11px] px-2 py-0.5 font-semibold">
                  {totalVisible}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:block opacity-60">
                Click ⊙ to cycle status
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/my-tasks')}>
                Full view <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {totalVisible === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">Nothing in your queue right now.</p>
              </div>
            ) : (
              <>
                <GroupSection label="Overdue"   items={groups.overdue}     dotColor="bg-red-500"
                  accentClass="bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300" />
                <GroupSection label="Due Today"  items={groups.dueToday}    dotColor="bg-orange-500"
                  accentClass="bg-orange-50/60 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300" />
                <GroupSection label="This Week"  items={groups.dueThisWeek} dotColor="bg-blue-400" />
                <GroupSection label="Later"      items={groups.later}       dotColor="bg-gray-300" />
              </>
            )}
          </CardContent>
        </Card>

        <NotificationsPanelMember navigate={navigate} />
      </div>

      {/* Row 2: Time This Week + My Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeThisWeekPanel navigate={navigate} />
        <MyProjectsPanel navigate={navigate} />
      </div>
    </div>
  );
}

// ─── Executive Section ────────────────────────────────────────────────────────

function ExecutiveSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const execQ = useExecutiveRollup();
  const org = execQ.data?.orgSummary;
  const scorecards: any[] = execQ.data?.scorecards ?? [];
  const alerts: any[] = execQ.data?.alerts ?? [];

  const display = scorecards;

  return (
    <div className="space-y-4">
      {/* Org-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStatChip label="Divisions" value={org?.divisionsCount ?? display.length} color="text-blue-600" />
        <MiniStatChip label="Active Projects" value={org?.activeProjects ?? '—'} color="text-green-600" />
        <MiniStatChip label="Completion" value={`${org?.completionPct ?? '—'}%`} color="text-purple-600" />
        <MiniStatChip label="Overdue Tasks" value={org?.overdueTasks ?? '—'} color="text-red-600" />
      </div>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Portfolio Summary
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/executive/portfolio')}>
            Full portfolio <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {display.map((sc: any) => {
              const pct = sc.completionRate ?? sc.health_score ?? 0;
              const rag = ragColor(pct);
              return (
                <div key={sc.id || sc.divisionId}
                  className={cn('rounded-lg border p-3 space-y-2 cursor-pointer hover:shadow-sm transition-shadow', rag.bg, rag.border)}
                  onClick={() => navigate('/executive/portfolio')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{sc.divisionName || sc.name}</span>
                    <span className={cn('text-xs font-bold', rag.text)}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} colorClass={pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
                  <p className="text-xs text-muted-foreground">{sc.activeProjects ?? 0} active projects</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Risks */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Key Risks
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/executive/risk-register')}>
              Risk Register <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 4).map((a, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:opacity-80',
                a.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700' :
                'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-700'
              )} onClick={() => navigate('/executive/risk-register')}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.message}</p>
                  <p className="text-xs opacity-75 mt-0.5">{a.division}</p>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] capitalize">{a.severity}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Viewer Section ───────────────────────────────────────────────────────────

function ViewerSection({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const projectsQ = useProjects();
  const projects: any[] = projectsQ.data?.items ?? [
    { id: '1', name: 'Customer Portal Redesign', key: 'CPR' },
    { id: '3', name: 'Mobile App v2',            key: 'MAV2' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-primary" /> Assigned Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projects.slice(0, 5).map((p: any) => (
            <div key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer hover:bg-muted/40"
              onClick={() => navigate(`/projects/${p.id}/board`)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{p.key}</Badge>
                <span className="text-sm font-medium">{p.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main DashboardPage ───────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, currentRole } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.first_name || user?.firstName || 'User';
  const { density, autoRefreshSeconds, isWidgetVisible } = useDashboardCustomizer();

  const dashboardQuery = useDashboard();

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshSeconds <= 0) return;
    const id = setInterval(() => { dashboardQuery.refetch(); }, autoRefreshSeconds * 1000);
    return () => clearInterval(id);
  }, [autoRefreshSeconds, dashboardQuery]);
  const stats = dashboardQuery.data?.stats ?? {
    total_projects: 5, active_projects: 3, total_tasks: 47, completed_tasks: 18, overdue_tasks: 3, my_open_tasks: 8,
  };
  const projectProgress: any[] = dashboardQuery.data?.project_progress ?? [
    { project_id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6', total_tasks: 15, completed_tasks: 7, completion_pct: 46.7 },
    { project_id: '2', name: 'API Gateway Migration',    key: 'AGM', color: '#8B5CF6', total_tasks: 12, completed_tasks: 3, completion_pct: 25.0 },
    { project_id: '3', name: 'Mobile App v2',            key: 'MAV2',color: '#F59E0B', total_tasks: 20, completed_tasks: 8, completion_pct: 40.0 },
  ];
  const recentActivity: any[] = dashboardQuery.data?.recent_activity ?? [
    { actor: 'Carol Johnson', action: 'status_changed', entity: 'CPR-1', detail: 'In Progress → In Review', at: new Date(Date.now() - 3600000).toISOString() },
    { actor: 'David Park',    action: 'created',        entity: 'AGM-5', detail: 'Created new task',        at: new Date(Date.now() - 7200000).toISOString() },
    { actor: 'Bob Martinez',  action: 'commented',      entity: 'CPR-3', detail: 'Left a comment',          at: new Date(Date.now() - 14400000).toISOString() },
  ];

  const isHighLevelRole = ['org_admin', 'division_admin', 'executive'].includes(currentRole || '');
  const isProjectRole   = ['project_manager', 'team_lead', 'vertical_head'].includes(currentRole || '');
  const showProjectProgress = !isHighLevelRole;

  const densityClass = density === 'compact' ? 'space-y-3' : density === 'spacious' ? 'space-y-8' : 'space-y-6';

  return (
    <div className={cn(densityClass, 'animate-fade-in')} role="main" aria-label="Dashboard">
      {/* Skip to main content (accessibility) */}
      <a href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium">
        Skip to main content
      </a>

      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 flex-wrap" id="dashboard-content">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {ROLE_LABEL[currentRole || ''] ? `${ROLE_LABEL[currentRole!]} — ` : ''}
            Here's what's happening across your projects
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {autoRefreshSeconds > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin opacity-50" />
              Auto {autoRefreshSeconds}s
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 h-8"
            onClick={() => dashboardQuery.refetch()}
            aria-label="Refresh dashboard">
            <RefreshCw className={cn('h-3.5 w-3.5', dashboardQuery.isFetching && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <DashboardCustomizer currentRole={currentRole || ''} />
        </div>
      </div>

      {/* Universal stat cards — widget: stat_cards */}
      {isWidgetVisible('stat_cards') && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer group" onClick={() => navigate('/projects')}>
          <StatCard
            title="Active Projects"
            value={stats.active_projects}
            icon={FolderKanban}
            trend={{ value: 12, label: 'vs last month' }}
            className="group-hover:border-primary/40"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks')}>
          <StatCard
            title="Total Tasks"
            value={stats.total_tasks}
            icon={ListTodo}
            subtitle={`${stats.completed_tasks} completed`}
            className="group-hover:border-primary/40"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks?tab=open')}>
          <StatCard
            title="My Open Tasks"
            value={stats.my_open_tasks}
            icon={CheckSquare}
            iconColor="text-blue-600"
            className="group-hover:border-blue-300"
          />
        </div>
        <div className="cursor-pointer group" onClick={() => navigate('/my-tasks?tab=overdue')}>
          <StatCard
            title="Overdue"
            value={stats.overdue_tasks}
            icon={AlertTriangle}
            iconColor="text-red-600"
            className={cn('group-hover:border-red-300', stats.overdue_tasks > 0 ? 'border-red-200' : '')}
          />
        </div>
      </div>}

      {/* Project Progress + Recent Activity (lower roles) */}
      {showProjectProgress && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Project Progress</CardTitle>
              <button onClick={() => navigate('/projects')} className="text-xs text-primary hover:underline font-medium">
                View all →
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectProgress.map((p) => (
                <div key={p.project_id}
                  className="space-y-2 rounded-lg px-3 py-2 -mx-1 cursor-pointer hover:bg-muted/50 border border-transparent hover:border-border/50"
                  onClick={() => navigate(`/projects/${p.project_id}/board`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-xs">{p.key}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{p.completion_pct}%</span>
                  </div>
                  <ProgressBar value={p.completion_pct} colorClass="bg-primary" />
                  <p className="text-xs text-muted-foreground">{p.completed_tasks} of {p.total_tasks} tasks</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <button onClick={() => navigate('/my-tasks')} className="text-xs text-primary hover:underline font-medium">
                My Tasks →
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i}
                    className="flex gap-3 rounded-lg px-2 py-2 -mx-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate('/my-tasks')}>
                    <Avatar name={a.actor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{a.actor}</span>{' '}
                        <span className="text-muted-foreground">{safeDetail((a as any).detail)}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{a.entity}</Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Role-specific sections ─────────────────────────────────────────── */}

      {currentRole === 'org_admin' && (
        <OrgAdminSection navigate={navigate} />
      )}

      {currentRole === 'division_admin' && (
        <DivisionAdminSection navigate={navigate} />
      )}

      {currentRole === 'vertical_head' && (
        <VerticalHeadSection navigate={navigate} />
      )}

      {currentRole === 'project_manager' && (
        <ProjectManagerSection navigate={navigate} />
      )}

      {currentRole === 'team_lead' && (
        <TeamLeadSection navigate={navigate} />
      )}

      {currentRole === 'member' && (
        <MemberSection navigate={navigate} />
      )}

      {currentRole === 'executive' && (
        <ExecutiveSection navigate={navigate} />
      )}

      {currentRole === 'viewer' && (
        <ViewerSection navigate={navigate} />
      )}
    </div>
  );
}
