import { useState } from 'react';
import {
  BookOpen, CheckCircle2, AlertCircle, Users, Crown,
  Briefcase, ChevronDown, ChevronUp, HelpCircle,
  FileText, Clock, Shield, LayoutDashboard, Target,
  Kanban, BarChart3, CheckSquare, Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RoleKey = 'member' | 'project_manager' | 'division_admin' | 'org_admin';

const ROLES: { key: RoleKey; label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }[] = [
  { key: 'member',          label: 'Project Team Member', icon: CheckSquare, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',     desc: 'Executes tasks, logs time, updates status' },
  { key: 'project_manager', label: 'Project Lead',        icon: Briefcase,   color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', desc: 'Manages projects, sprints, and team workload' },
  { key: 'division_admin',  label: 'Division Head',       icon: Users,       color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',  desc: 'Oversees division projects, approves timesheets' },
  { key: 'org_admin',       label: 'System Admin',        icon: Shield,      color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',      desc: 'Full system control, users, roles, workflows' },
];

const GUIDES: Record<RoleKey, {
  steps: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string; tip?: string; warning?: string }[];
  dos: string[];
  donts: string[];
  faq: { q: string; a: string }[];
}> = {
  member: {
    steps: [
      {
        icon: LayoutDashboard,
        title: 'Check your Dashboard daily',
        detail: 'The Dashboard shows your open tasks, overdue items, and recent activity across your projects. Use "My Open Tasks" and "Overdue" KPI cards as your daily starting point.',
        tip: 'Bookmark /dashboard — it gives you everything at a glance without opening individual projects.',
      },
      {
        icon: CheckSquare,
        title: 'Work your tasks from My Tasks',
        detail: 'Navigate to My Tasks to see every task assigned to you, across all projects. Tasks are grouped by status. Click any task to open its detail page where you can update status, add comments, and log time.',
        tip: 'Use the status dropdown on the task detail page to move a task from "To Do" → "In Progress" → "In Review" → "Done".',
      },
      {
        icon: Kanban,
        title: 'Use the Kanban board for project-level view',
        detail: 'Open any project and go to the Board view. You\'ll see all tasks in columns matching the project workflow. Drag tasks between columns to update their status instantly.',
        tip: 'The board reflects real-time updates — if your PM moves a task, you\'ll see it on your next refresh.',
      },
      {
        icon: Timer,
        title: 'Log time against your tasks',
        detail: 'Open a task detail page and click "Log Time". Enter the hours worked, a brief description, and the date. This feeds into weekly timesheets and project reporting.',
        warning: 'Log time on the correct task and date. Incorrect entries require your PM or Division Head to correct them in the timesheet approval cycle.',
      },
      {
        icon: FileText,
        title: 'Submit your weekly timesheet',
        detail: 'Every Friday, go to Time Tracking and click "Submit Timesheet" for the current week. Your Division Head or PM will approve it. You\'ll be notified once approved or if corrections are requested.',
        tip: 'Log time daily — don\'t accumulate a week\'s worth on Friday. Accurate daily logs make sprint velocity and capacity planning more reliable.',
      },
    ],
    dos: [
      'Update task status every time you start or complete a step',
      'Log time on the same day you do the work',
      'Add a comment when moving a task to In Review — explain what was done',
      'Check your notification panel for mentions and task assignments',
      'Flag blockers early by commenting on the task and tagging your PM',
    ],
    donts: [
      "Don't leave tasks in In Progress for more than 3 days without an update",
      "Don't mark a task Done without completing all checklist items",
      "Don't log time on tasks you weren't assigned to without PM approval",
      "Don't skip timesheet submission — missing timesheets affect payroll and reporting",
    ],
    faq: [
      { q: 'A task was assigned to me but I can\'t do it. What should I do?', a: 'Comment on the task explaining the blocker and tag your Project Manager using the comment box. Do NOT leave it In Progress silently — your PM needs visibility.' },
      { q: 'I logged time on the wrong date. Can I fix it?', a: 'Yes — go to Time Tracking, find the entry, and click the edit icon. You can change the date, hours, and description as long as the timesheet hasn\'t been approved yet.' },
      { q: 'My task doesn\'t have a status column that matches what I need. Who do I tell?', a: 'Tell your Project Manager. They can update the project\'s workflow statuses in Admin → Workflows to add a custom status.' },
      { q: 'How do I know which sprint I should be working on?', a: 'Go to Sprints. The active sprint is clearly marked. All tasks in the active sprint appear in your My Tasks list filtered by "Current Sprint".' },
    ],
  },

  project_manager: {
    steps: [
      {
        icon: Briefcase,
        title: 'Create and configure your project',
        detail: 'Go to Projects → New Project. Fill in the name, key (e.g. BDG), division, and dates. Once created, go to the project settings to assign members and configure the workflow statuses for the Kanban board.',
        tip: 'Set a meaningful project key (2–5 letters) — it prefixes all task IDs and appears in notifications.',
      },
      {
        icon: Target,
        title: 'Plan your sprint',
        detail: 'Navigate to Sprints → Create Sprint. Name it (e.g. "Sprint 1 — Foundation"), set start and end dates, then drag tasks from the backlog into the sprint. Aim for 1–2 week sprints for faster feedback cycles.',
        tip: 'Only add tasks with estimates. Tasks without estimated hours make sprint capacity planning unreliable.',
      },
      {
        icon: Kanban,
        title: 'Run the board daily',
        detail: 'Open the project Kanban board each morning. Check for tasks stuck in the same column for 2+ days, tasks approaching due dates, and any In Review items that need your sign-off.',
        warning: 'Unreviewed In Review tasks block the developer from closing the task. Review them same-day if possible.',
      },
      {
        icon: BarChart3,
        title: 'Monitor via Reports and Dashboard',
        detail: 'Use Reports for sprint velocity, burndown, and team workload data. Use Team Workload on the Dashboard to catch overloaded members early. Use Advanced Reports for cross-project analysis.',
        tip: 'Run a weekly report every Monday and share the burndown with your team. Visibility prevents surprises at sprint end.',
      },
      {
        icon: Clock,
        title: 'Approve timesheets weekly',
        detail: 'Go to Time Tracking → Timesheets. Review each team member\'s submitted timesheet for the week. Approve if correct; reject with a note if entries need correction. Try to approve within 48 hours of submission.',
        warning: 'Unapproved timesheets delay payroll processing and division-level financial reporting.',
      },
    ],
    dos: [
      'Assign every task to a specific person — unassigned tasks never get done',
      'Set due dates and priority on all tasks before sprint start',
      'Run a short daily standup and update task statuses in real time',
      'Close completed sprints promptly — open sprints with 0 tasks skew velocity data',
      'Use the Capacity Planning view before adding tasks to a sprint',
    ],
    donts: [
      "Don't create tasks without a title and assignee",
      "Don't let In Progress tasks sit without a status update for more than 2 days",
      "Don't skip sprint retrospective — mark what worked and what didn't in the sprint notes",
      "Don't approve timesheets without checking the hours against task logs",
    ],
    faq: [
      { q: 'How do I add a new status column to the Kanban board?', a: 'Go to Admin → Workflows, select your project\'s workflow, and add a new status. It will appear as a new column on the board immediately.' },
      { q: 'A team member is overloaded. How do I rebalance?', a: 'Open the team member\'s tasks from the Kanban board (filter by assignee), then reassign some tasks to others using the task detail page → Assignee field.' },
      { q: 'Can I bulk-move tasks between statuses?', a: 'Yes — on the Kanban board, select multiple task cards using the checkbox and use the Bulk Actions menu to update status, priority, or assignee in one step.' },
      { q: 'What happens to backlog tasks when a sprint ends?', a: 'Incomplete sprint tasks are not automatically moved. You choose which tasks roll into the next sprint when you create it. This gives you full control over re-prioritisation.' },
    ],
  },

  division_admin: {
    steps: [
      {
        icon: LayoutDashboard,
        title: 'Use the Division MIS dashboard',
        detail: 'Navigate to Admin → Division MIS. This shows task completion rates, overdue items, and timesheet submission compliance across all projects in your division. Check it weekly.',
        tip: 'Use the division filter on Reports → Advanced to compare project health across your portfolio.',
      },
      {
        icon: Users,
        title: 'Review and approve timesheets',
        detail: 'Go to Time Tracking → Timesheets and set the filter to "Submitted". Review all team members\' weekly timesheets for your division. Approve accurate ones; reject with specific feedback when corrections are needed.',
        tip: 'Establish a weekly rhythm — timesheets submitted by Friday, reviewed and approved by Monday. Consistency builds trust.',
      },
      {
        icon: Shield,
        title: 'Manage your team\'s access',
        detail: 'Division Admins can invite new members scoped to their division. Go to Admin → Users → Invite Member. Select Division Admin or Member role and specify the division. You cannot grant org-level roles.',
        warning: 'Only invite users you have verified through your organization\'s HR process. Org Admin must approve changes to org-level roles.',
      },
      {
        icon: BarChart3,
        title: 'Monitor project health across the division',
        detail: 'From Projects, filter by your division to see all projects. Projects with red overdue counts or low completion percentages need attention. Escalate to the Org Admin if a Project Manager is underperforming.',
        tip: 'Use Advanced Reports → Export to generate a monthly division progress report for stakeholders.',
      },
      {
        icon: FileText,
        title: 'Handle workflow approvals in your queue',
        detail: 'Go to Admin → Approvals. Items assigned to your role appear here. Review, approve, or reject with a specific note. Aim to clear your queue within 24 hours of receiving a notification.',
        warning: 'Approval SLAs are tracked. Chronic delays are visible to the Org Admin in the Audit Log.',
      },
    ],
    dos: [
      'Review your division\'s MIS dashboard every Monday morning',
      'Approve or reject timesheets within 48 hours of submission',
      'Leave a clear note whenever you reject a timesheet or approval',
      'Escalate stalled projects to Org Admin before they become critical',
      'Keep your division member list up to date — deactivate leavers promptly',
    ],
    donts: [
      "Don't approve timesheets without spot-checking hours against task activity",
      "Don't grant project access to members outside your division without Org Admin approval",
      "Don't ignore approval notifications for more than 24 hours",
      "Don't use Admin Override — that is an Org Admin-only action",
    ],
    faq: [
      { q: 'A Project Manager in my division is not updating task statuses. What can I do?', a: 'Have a direct conversation first. If it persists, document the issue and escalate to Org Admin. The Audit Log can show the last time the PM made any system activity.' },
      { q: 'Can I see projects from other divisions?', a: 'Division Admins are scoped to their own division by default. The Org Admin can grant cross-division visibility if needed for reporting purposes.' },
      { q: 'A team member left mid-sprint. What happens to their tasks?', a: 'Immediately reassign their open tasks in bulk (Kanban → filter by assignee → Bulk Reassign). Then deactivate their account in Admin → Users to prevent further access.' },
      { q: 'How do I generate a report for a management review?', a: 'Go to Reports → Advanced, set the date range and division filter, and use the Export button to download an Excel or PDF summary ready for presentation.' },
    ],
  },

  org_admin: {
    steps: [
      {
        icon: Shield,
        title: 'Configure users, roles, and divisions',
        detail: 'Start with Admin → Divisions to set up your org structure. Then Admin → Users to invite people with the correct role scoped to their division. Use Admin → Roles for custom permission sets beyond the default six roles.',
        tip: 'Create divisions before inviting users — role scoping requires a division to be already configured.',
      },
      {
        icon: FileText,
        title: 'Set up workflow templates',
        detail: 'Go to Admin → Workflows to configure the default Kanban statuses for your organisation. Project Managers can override this per project, but a well-configured default saves every team setup time.',
        tip: 'A typical workflow: Backlog → To Do → In Progress → In Review → Done. Add "Blocked" as a status if your team needs it.',
      },
      {
        icon: BarChart3,
        title: 'Monitor org health from the Admin Dashboard',
        detail: 'Admin Dashboard shows system-wide stats: active users, project count, task velocity, and overdue items. Run this every Monday. Use the Audit Log for a detailed event trail.',
        warning: 'Check the Audit Log monthly for unusual activity — multiple failed logins, bulk deletes, or role changes made at odd hours.',
      },
      {
        icon: Clock,
        title: 'Manage the approval pipeline',
        detail: 'Admin → Approvals shows all pending items across the org. You can see who is bottlenecking approvals and intervene when SLAs are breached. Use Workflows to adjust SLA thresholds as the organisation matures.',
        tip: 'Export the Audit Log quarterly and archive it. Government-sector compliance requires a full record of all approvals and role changes.',
      },
      {
        icon: Crown,
        title: 'Manage integrations and system settings',
        detail: 'Settings → Integrations to configure Outlook/Microsoft 365 sync. Admin → Exports for bulk data downloads. Admin → Feature Flags to enable beta features for pilot teams before rolling out org-wide.',
        warning: 'Changes to Workflows and Feature Flags take effect immediately for all users. Test on a pilot project before applying org-wide.',
      },
    ],
    dos: [
      'Review the Admin Dashboard and Audit Log every Monday',
      'Deactivate users immediately when they leave the organisation',
      'Keep Role assignments minimal — least-privilege principle',
      'Export and archive the Audit Log quarterly for compliance',
      'Configure email notifications so all admins receive SLA breach alerts',
    ],
    donts: [
      "Don't grant Org Admin role without documented justification",
      "Don't delete projects — soft-delete (archive) them to preserve audit history",
      "Don't change workflow statuses on active projects mid-sprint without PM approval",
      "Don't share admin credentials — every admin must have their own named account",
    ],
    faq: [
      { q: 'How do I prepare for a government / compliance audit?', a: 'Go to Admin → Exports and download the full Audit Log for the relevant period. Every approval, role change, task update, and login event is logged with user identity and timestamp. The export is audit-ready by design.' },
      { q: 'A user was accidentally given the wrong role. How do I fix it?', a: 'Go to Admin → Users, find the user, and use Edit Role. The role change takes effect immediately and is logged in the Audit Trail. The user will need to re-login for the change to reflect in their session.' },
      { q: 'Can I migrate data from another project tool?', a: 'Use Admin → Exports to understand the data schema, then contact your system administrator for the bulk import utility. Direct DB imports should always be run in a staging environment first.' },
      { q: 'How do I set up Outlook email integration?', a: 'Go to Settings → Integrations and click "Connect Microsoft 365". You\'ll be redirected to Microsoft OAuth. After authorisation, Q-Flow can send notifications via your organisational email domain.' },
    ],
  },
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium pr-4">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  );
}

export function WorkflowTrainingPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('member');
  const guide = GUIDES[activeRole];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Q-Flow Training Guide
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Role-specific guidance for using Q-Flow effectively
        </p>
      </div>

      {/* System overview strip */}
      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How Q-Flow works</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { icon: Briefcase,      label: 'Create Project',    sub: 'PM sets up board & team' },
            { icon: Target,         label: 'Plan Sprint',        sub: 'Tasks pulled from backlog' },
            { icon: Kanban,         label: 'Execute on Board',   sub: 'Status updated in Kanban' },
            { icon: BarChart3,      label: 'Report & Improve',   sub: 'Reports, velocity, closure' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40">
              <Icon className="h-5 w-5 text-primary" />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setActiveRole(r.key)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center',
              activeRole === r.key
                ? 'border-primary shadow-md'
                : 'border-border hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', r.color)}>
              <r.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">{r.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{r.desc}</p>
            </div>
            {activeRole === r.key && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Viewing</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Role guide */}
      <div className="space-y-4">
        {/* Step-by-step */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Step-by-Step Guide — {ROLES.find(r => r.key === activeRole)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-6">
                {guide.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[22px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
                      {idx + 1}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.detail}</p>
                        {step.tip && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Tip:</span> {step.tip}</span>
                          </div>
                        )}
                        {step.warning && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span><span className="font-semibold">Important:</span> {step.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Do's
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {guide.dos.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {guide.donts.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" /> Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guide.faq.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
