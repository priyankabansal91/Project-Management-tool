import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, Check, X, Eye, Zap, Info, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

type AccessLevel = 'full' | 'limited' | 'view' | 'none';

interface Permission {
  action: string;
  levels: AccessLevel[]; // one per role column, in order
}

interface ResourceRow {
  resource: string;
  permissions: Permission[];
}

interface Category {
  key: string;
  label: string;
  rows: ResourceRow[];
}

// ─── Role Definitions ────────────────────────────────────

const ROLES = [
  { key: 'sys_admin',   label: 'System Admin',       short: 'SA', color: 'bg-red-600',     text: 'text-red-700',    badge: 'bg-red-100 text-red-700',     description: 'Full platform control' },
  { key: 'div_admin',   label: 'Division Admin',      short: 'DA', color: 'bg-orange-500',  text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700',description: 'Manage own division' },
  { key: 'vert_head',   label: 'Vertical Head',       short: 'VH', color: 'bg-amber-500',   text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  description: 'Lead a vertical unit' },
  { key: 'proj_lead',   label: 'Project Lead',        short: 'PL', color: 'bg-blue-600',    text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',    description: 'Own & drive projects' },
  { key: 'team_lead',   label: 'Team Lead',           short: 'TL', color: 'bg-indigo-500',  text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700',description: 'Lead a task sub-team' },
  { key: 'member',      label: 'Project Member',      short: 'PM', color: 'bg-green-600',   text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  description: 'Execute assigned work' },
  { key: 'leadership',  label: 'Leadership',          short: 'LS', color: 'bg-purple-600',  text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700',description: 'Strategic oversight' },
  { key: 'others',      label: 'Others',              short: 'OT', color: 'bg-gray-500',    text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600',    description: 'Guests / read-only' },
] as const;

// Column index map for readability
// [SA, DA, VH, PL, TL, PM, LS, OT]
const F: AccessLevel = 'full';
const L: AccessLevel = 'limited';
const V: AccessLevel = 'view';
const N: AccessLevel = 'none';

// ─── Permission Data ─────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    key: 'org',
    label: 'Organization Management',
    rows: [
      {
        resource: 'Boards / Divisions',
        permissions: [
          { action: 'Create',         levels: [F, L, N, N, N, N, V, N] },
          { action: 'Edit',           levels: [F, L, N, N, N, N, V, N] },
          { action: 'Delete',         levels: [F, N, N, N, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, V] },
          { action: 'Manage Members', levels: [F, L, N, N, N, N, N, N] },
        ],
      },
      {
        resource: 'Verticals',
        permissions: [
          { action: 'Create',         levels: [F, F, N, N, N, N, N, N] },
          { action: 'Edit',           levels: [F, F, L, N, N, N, N, N] },
          { action: 'Delete',         levels: [F, L, N, N, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, V] },
          { action: 'Assign Head',    levels: [F, F, N, N, N, N, N, N] },
        ],
      },
      {
        resource: 'Users',
        permissions: [
          { action: 'Invite',         levels: [F, F, L, L, N, N, N, N] },
          { action: 'Edit Role',      levels: [F, L, N, N, N, N, N, N] },
          { action: 'Remove',         levels: [F, L, N, N, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, N] },
          { action: 'Export',         levels: [F, L, N, N, N, N, N, N] },
        ],
      },
    ],
  },
  {
    key: 'projects',
    label: 'Project Management',
    rows: [
      {
        resource: 'Projects',
        permissions: [
          { action: 'Create',         levels: [F, F, L, F, N, N, N, N] },
          { action: 'Edit',           levels: [F, F, L, F, L, N, V, N] },
          { action: 'Delete',         levels: [F, L, N, L, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, V] },
          { action: 'Archive',        levels: [F, L, N, L, N, N, N, N] },
        ],
      },
      {
        resource: 'Milestones',
        permissions: [
          { action: 'Create',         levels: [F, L, L, F, L, N, N, N] },
          { action: 'Edit',           levels: [F, L, L, F, L, N, N, N] },
          { action: 'Delete',         levels: [F, L, N, F, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, V] },
          { action: 'Approve',        levels: [F, F, L, N, N, N, F, N] },
        ],
      },
      {
        resource: 'Tasks',
        permissions: [
          { action: 'Create',         levels: [F, L, L, F, F, L, N, N] },
          { action: 'Edit',           levels: [F, L, L, F, F, L, N, N] },
          { action: 'Delete',         levels: [F, L, N, F, L, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, F, F, V] },
          { action: 'Assign',         levels: [F, L, L, F, F, N, N, N] },
          { action: 'Close',          levels: [F, L, L, F, F, L, N, N] },
        ],
      },
    ],
  },
  {
    key: 'work',
    label: 'Work Management',
    rows: [
      {
        resource: 'Sprints',
        permissions: [
          { action: 'Create',         levels: [F, L, L, F, L, N, N, N] },
          { action: 'Edit',           levels: [F, L, L, F, L, N, N, N] },
          { action: 'Delete',         levels: [F, L, N, F, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, V] },
          { action: 'Close',          levels: [F, L, L, F, N, N, N, N] },
        ],
      },
      {
        resource: 'Time Logs',
        permissions: [
          { action: 'Create',         levels: [F, L, L, L, L, F, N, N] },
          { action: 'Edit',           levels: [F, L, L, L, L, L, N, N] },
          { action: 'Delete',         levels: [F, L, N, L, N, L, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, F, F, N] },
        ],
      },
      {
        resource: 'Reports',
        permissions: [
          { action: 'View',           levels: [F, F, F, F, F, V, F, N] },
          { action: 'Export',         levels: [F, L, L, L, N, N, F, N] },
          { action: 'Create Custom',  levels: [F, L, N, L, N, N, F, N] },
        ],
      },
      {
        resource: 'Dashboards',
        permissions: [
          { action: 'View Personal',  levels: [F, F, F, F, F, F, F, V] },
          { action: 'View Team',      levels: [F, F, F, F, F, V, F, V] },
          { action: 'View Org',       levels: [F, F, L, L, N, N, F, N] },
        ],
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    rows: [
      {
        resource: 'Workflows',
        permissions: [
          { action: 'Create',         levels: [F, L, N, N, N, N, N, N] },
          { action: 'Edit',           levels: [F, L, N, N, N, N, N, N] },
          { action: 'Delete',         levels: [F, N, N, N, N, N, N, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, N] },
        ],
      },
      {
        resource: 'Approvals',
        permissions: [
          { action: 'Create',         levels: [F, L, L, L, N, N, N, N] },
          { action: 'Approve / Reject',levels: [F, L, L, N, N, N, F, N] },
          { action: 'View',           levels: [F, F, F, F, F, V, F, N] },
        ],
      },
      {
        resource: 'Settings',
        permissions: [
          { action: 'Org Settings',   levels: [F, N, N, N, N, N, N, N] },
          { action: 'Division Config',levels: [F, F, N, N, N, N, N, N] },
          { action: 'Feature Flags',  levels: [F, N, N, N, N, N, N, N] },
        ],
      },
      {
        resource: 'Audit Log',
        permissions: [
          { action: 'View',           levels: [F, L, N, N, N, N, V, N] },
          { action: 'Export',         levels: [F, N, N, N, N, N, N, N] },
        ],
      },
    ],
  },
];

// ─── Access level rendering ───────────────────────────────

const ACCESS_STYLES: Record<AccessLevel, { icon: React.ReactNode; label: string; cell: string; dot: string }> = {
  full: {
    icon: <Check className="h-3.5 w-3.5" />,
    label: 'Full Access',
    cell: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  limited: {
    icon: <Zap className="h-3.5 w-3.5" />,
    label: 'Limited Access',
    cell: 'text-amber-600',
    dot: 'bg-amber-400',
  },
  view: {
    icon: <Eye className="h-3.5 w-3.5" />,
    label: 'View Only',
    cell: 'text-blue-600',
    dot: 'bg-blue-400',
  },
  none: {
    icon: <X className="h-3.5 w-3.5" />,
    label: 'No Access',
    cell: 'text-muted-foreground/40',
    dot: 'bg-gray-200',
  },
};

function AccessCell({ level }: { level: AccessLevel }) {
  const s = ACCESS_STYLES[level];
  return (
    <td className="px-2 py-2 text-center">
      <div className={cn('inline-flex items-center justify-center h-6 w-6 rounded-full', s.cell,
        level === 'full'    && 'bg-emerald-50',
        level === 'limited' && 'bg-amber-50',
        level === 'view'    && 'bg-blue-50',
        level === 'none'    && 'bg-transparent',
      )}>
        {s.icon}
      </div>
    </td>
  );
}

// ─── Category section ────────────────────────────────────

function CategorySection({ category, expanded, onToggle }: {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Category header row */}
      <tr
        className="cursor-pointer select-none bg-muted/60 hover:bg-muted transition-colors"
        onClick={onToggle}
      >
        <td colSpan={ROLES.length + 2} className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {category.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({category.rows.reduce((s, r) => s + r.permissions.length, 0)} permissions)
            </span>
          </div>
        </td>
      </tr>

      {/* Resource rows */}
      {expanded && category.rows.map((row, ri) => (
        row.permissions.map((perm, pi) => (
          <tr
            key={`${row.resource}-${perm.action}`}
            className={cn(
              'border-b border-border/50 hover:bg-muted/20 transition-colors',
              ri % 2 === 0 ? 'bg-card' : 'bg-muted/10',
            )}
          >
            {/* Resource name (merged visually for first permission) */}
            <td className="px-4 py-1.5 min-w-[140px] w-[140px]">
              {pi === 0 ? (
                <span className="text-xs font-semibold text-foreground">{row.resource}</span>
              ) : (
                <span /> // empty for subsequent permissions of same resource
              )}
            </td>

            {/* Action label */}
            <td className="px-3 py-1.5 min-w-[130px] w-[130px]">
              <span className="text-xs text-muted-foreground">{perm.action}</span>
            </td>

            {/* Access level cells */}
            {perm.levels.map((lvl, ci) => (
              <AccessCell key={ci} level={lvl} />
            ))}
          </tr>
        ))
      ))}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────

export function PermissionMatrixPage() {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.key)), // all expanded by default
  );

  const toggleCat = (key: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpandedCats(new Set(CATEGORIES.map((c) => c.key)));
  const collapseAll = () => setExpandedCats(new Set());

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-full mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Permission Matrix
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comprehensive overview of what each role can do across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Permission Hierarchy</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            Roles follow a hierarchy: <strong>System Admin</strong> overrides all.
            <strong> Division Admin</strong> and <strong>Vertical Head</strong> are scoped to their organizational unit.
            <strong> Limited Access</strong> means the action is permitted only within the user&apos;s own assigned scope
            (division, vertical, or project). Higher roles always include the permissions of lower roles in their scope.
          </p>
        </div>
      </div>

      {/* Role legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Role Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROLES.map((role) => (
              <div
                key={role.key}
                className="flex items-center gap-2 rounded-lg border p-2.5"
              >
                <div className={cn('h-7 w-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0', role.color)}>
                  {role.short}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', role.text)}>{role.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matrix table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              {/* Role headers */}
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[140px] w-[140px]">
                  Resource
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[130px] w-[130px]">
                  Action
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role.key}
                    className="px-2 py-3 text-center min-w-[80px] w-[80px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn('h-6 w-6 rounded flex items-center justify-center text-white text-[9px] font-bold', role.color)}>
                        {role.short}
                      </div>
                      <span className={cn('text-[9px] font-semibold uppercase leading-tight text-center', role.text)} style={{ maxWidth: 70 }}>
                        {role.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {CATEGORIES.map((cat) => (
                <CategorySection
                  key={cat.key}
                  category={cat}
                  expanded={expandedCats.has(cat.key)}
                  onToggle={() => toggleCat(cat.key)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Legend</p>
        <div className="flex flex-wrap gap-4">
          {(Object.entries(ACCESS_STYLES) as [AccessLevel, typeof ACCESS_STYLES[AccessLevel]][]).map(([level, s]) => (
            <div key={level} className="flex items-center gap-2">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center',
                s.cell,
                level === 'full'    && 'bg-emerald-50',
                level === 'limited' && 'bg-amber-50',
                level === 'view'    && 'bg-blue-50',
                level === 'none'    && 'bg-muted/40',
              )}>
                {s.icon}
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          <strong>Limited Access</strong> is scoped to the user&apos;s own division, vertical, or project.
          Click any category header row to expand or collapse that section.
          Role columns are ordered by privilege level from highest (left) to lowest (right).
        </p>
      </Card>
    </div>
  );
}
