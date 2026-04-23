import { useState } from 'react';
import { Users2, TrendingUp, AlertTriangle, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioCapacity } from '@/api/hooks';

// ── Types ─────────────────────────────────────────────────

interface WeekEntry {
  weekLabel: string;   // e.g. "Apr 28"
  weekStart: string;   // ISO date
  utilization: number; // 0–120+
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  division: string;
  capacityHours: number;
  weeks: WeekEntry[];
}

interface CapacityData {
  members: TeamMember[];
  weekLabels: string[];
}

// ── Mock data generator ───────────────────────────────────

function getMondayDate(weeksFromNow: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff + weeksFromNow * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildMockData(numWeeks: number): CapacityData {
  const weekDates = Array.from({ length: numWeeks }, (_, i) => getMondayDate(i));
  const weekLabels = weekDates.map(formatWeekLabel);

  const members: TeamMember[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      role: 'Senior Engineer',
      division: 'Engineering',
      capacityHours: 40,
      weeks: weekDates.map((d, i) => ({
        weekLabel: weekLabels[i],
        weekStart: d.toISOString(),
        utilization: [95, 70, 110, 60, 85, 75, 45, 100][i % 8],
      })),
    },
    {
      id: '2',
      name: 'Bob Martinez',
      role: 'Project Manager',
      division: 'Product',
      capacityHours: 40,
      weeks: weekDates.map((d, i) => ({
        weekLabel: weekLabels[i],
        weekStart: d.toISOString(),
        utilization: [60, 55, 65, 80, 45, 90, 70, 55][i % 8],
      })),
    },
    {
      id: '3',
      name: 'Carol Lee',
      role: 'UX Designer',
      division: 'Product',
      capacityHours: 40,
      weeks: weekDates.map((d, i) => ({
        weekLabel: weekLabels[i],
        weekStart: d.toISOString(),
        utilization: [40, 30, 50, 120, 85, 60, 35, 90][i % 8],
      })),
    },
    {
      id: '4',
      name: 'David Kim',
      role: 'DevOps Engineer',
      division: 'Infrastructure',
      capacityHours: 40,
      weeks: weekDates.map((d, i) => ({
        weekLabel: weekLabels[i],
        weekStart: d.toISOString(),
        utilization: [75, 80, 90, 95, 100, 85, 70, 65][i % 8],
      })),
    },
    {
      id: '5',
      name: 'Emma Williams',
      role: 'QA Engineer',
      division: 'Engineering',
      capacityHours: 32,
      weeks: weekDates.map((d, i) => ({
        weekLabel: weekLabels[i],
        weekStart: d.toISOString(),
        utilization: [25, 40, 60, 80, 30, 50, 70, 45][i % 8],
      })),
    },
  ];

  return { members, weekLabels };
}

// ── Helpers ───────────────────────────────────────────────

function getCellStyle(utilization: number): string {
  if (utilization > 100) return 'bg-red-100 text-red-700 font-bold';
  if (utilization >= 80)  return 'bg-yellow-50 text-yellow-700';
  if (utilization >= 50)  return 'bg-green-50 text-green-700';
  return 'bg-blue-50 text-blue-600';
}

function getAvgUtilization(member: TeamMember): number {
  if (member.weeks.length === 0) return 0;
  return Math.round(member.weeks.reduce((sum, w) => sum + w.utilization, 0) / member.weeks.length);
}

function getBarColor(utilization: number): string {
  if (utilization > 100) return 'bg-red-500';
  if (utilization >= 80)  return 'bg-yellow-500';
  if (utilization >= 50)  return 'bg-green-500';
  return 'bg-blue-400';
}

function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('engineer')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (r.includes('manager'))  return 'bg-purple-100 text-purple-800 border-purple-200';
  if (r.includes('designer')) return 'bg-pink-100 text-pink-800 border-pink-200';
  if (r.includes('devops'))   return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

// ── Skeleton ──────────────────────────────────────────────

function SkeletonHeatmapRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b animate-pulse">
      <td className="px-4 py-3 w-48">
        <div className="h-4 bg-muted rounded w-32 mb-1" />
        <div className="h-3 bg-muted rounded w-20" />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3 text-center">
          <div className="h-7 bg-muted rounded w-12 mx-auto" />
        </td>
      ))}
    </tr>
  );
}

// ── Stat Card ─────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, iconClassName = 'text-muted-foreground', subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Icon className={`h-8 w-8 ${iconClassName}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function CapacityPlanningPage() {
  const [selectedWeeks, setSelectedWeeks] = useState<2 | 4 | 8>(4);
  const { data: rawData, isLoading, isError } = usePortfolioCapacity(selectedWeeks);

  // Use API data if available, otherwise mock
  const capacityData: CapacityData =
    (rawData as CapacityData)?.members?.length
      ? (rawData as CapacityData)
      : buildMockData(selectedWeeks);

  const members = capacityData.members ?? [];
  const weekLabels = capacityData.weekLabels ?? [];

  const avgUtilization = members.length
    ? Math.round(members.reduce((sum, m) => sum + getAvgUtilization(m), 0) / members.length)
    : 0;

  const overAllocatedCount  = members.filter(m => getAvgUtilization(m) > 100).length;
  const underAllocatedCount = members.filter(m => getAvgUtilization(m) < 50).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Capacity Planning</h1>
            <p className="text-sm text-muted-foreground">Team workload and availability across upcoming weeks</p>
          </div>
        </div>

        {/* Week range selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">Show:</span>
          {([2, 4, 8] as const).map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeeks(w)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                selectedWeeks === w
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input text-muted-foreground hover:bg-accent'
              }`}
            >
              {w} weeks
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          API unavailable — showing demo capacity data.
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={members.length}
          icon={Users2}
          iconClassName="text-primary"
        />
        <StatCard
          title="Avg Utilization"
          value={`${avgUtilization}%`}
          icon={TrendingUp}
          iconClassName={
            avgUtilization > 100 ? 'text-red-500' :
            avgUtilization >= 80  ? 'text-yellow-500' :
            avgUtilization >= 50  ? 'text-green-500' :
            'text-blue-400'
          }
          subtitle={`across ${selectedWeeks} weeks`}
        />
        <StatCard
          title="Over-Allocated"
          value={overAllocatedCount}
          icon={AlertTriangle}
          iconClassName="text-red-500"
          subtitle="> 100% avg"
        />
        <StatCard
          title="Under-Allocated"
          value={underAllocatedCount}
          icon={Minus}
          iconClassName="text-blue-400"
          subtitle="< 50% avg"
        />
      </div>

      {/* Capacity Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Capacity Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" /> &lt;50% under-utilized
            </span>
            {' · '}
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> 50–80% healthy
            </span>
            {' · '}
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block" /> 80–100% near capacity
            </span>
            {' · '}
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> &gt;100% overloaded
            </span>
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Member</th>
                  {weekLabels.map((label, i) => (
                    <th key={i} className="text-center px-3 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Avg</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonHeatmapRow key={i} cols={selectedWeeks} />
                  ))
                ) : (
                  members.map((member) => {
                    const avg = getAvgUtilization(member);
                    return (
                      <tr key={member.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{member.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${getRoleBadgeClass(member.role)}`}>
                              {member.role}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {member.division}
                            </Badge>
                          </div>
                        </td>
                        {member.weeks.slice(0, selectedWeeks).map((week, wi) => (
                          <td key={wi} className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium min-w-[44px] ${getCellStyle(week.utilization)}`}>
                              {week.utilization}%
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-semibold min-w-[44px] ${getCellStyle(avg)}`}>
                            {avg}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Member Workload Bars */}
      <div>
        <h2 className="text-base font-semibold mb-3">Member Workload Overview</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const avg = getAvgUtilization(member);
              const barWidth = Math.min(avg, 100);
              return (
                <Card key={member.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      <span className={`text-sm font-bold ${
                        avg > 100 ? 'text-red-600' :
                        avg >= 80  ? 'text-yellow-600' :
                        avg >= 50  ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {avg}%
                      </span>
                    </div>

                    {/* Utilization bar */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(avg)}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Overload indicator */}
                    {avg > 100 && (
                      <div className="mt-1.5 flex items-center gap-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{avg - 100}% over capacity</span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {member.capacityHours} hrs/week capacity
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
