import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, AlertTriangle, FolderKanban, ArrowRightCircle, X } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_updated' | 'task_commented' | 'project_created' | 'member_added' | 'due_date_reminder' | 'mention';
  title: string;
  body: string;
  actor: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'task_assigned', title: 'New task assigned', body: 'You were assigned "Implement search functionality" in CPR', actor: 'Bob Martinez', is_read: false, created_at: new Date(Date.now() - 300000).toISOString() },
  { id: '2', type: 'task_commented', title: 'New comment', body: 'Carol Johnson commented on CPR-1: "Safari issues fixed!"', actor: 'Carol Johnson', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'due_date_reminder', title: 'Task due tomorrow', body: 'CPR-2 "Implement authentication flow" is due Feb 20', actor: 'System', is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'task_updated', title: 'Status changed', body: 'CPR-4 moved from "In Review" to "Done"', actor: 'David Park', is_read: true, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '5', type: 'member_added', title: 'New team member', body: 'Eve Wilson was added to your organization', actor: 'Alice Chen', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '6', type: 'project_created', title: 'New project', body: 'Project "Mobile App v2" (MAV2) was created', actor: 'Bob Martinez', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
];

const typeIcons: Record<string, typeof Bell> = {
  task_assigned: UserPlus,
  task_updated: ArrowRightCircle,
  task_commented: MessageSquare,
  project_created: FolderKanban,
  member_added: UserPlus,
  due_date_reminder: AlertTriangle,
  mention: MessageSquare,
};

const typeColors: Record<string, string> = {
  task_assigned: 'bg-blue-100 text-blue-600',
  task_updated: 'bg-purple-100 text-purple-600',
  task_commented: 'bg-green-100 text-green-600',
  project_created: 'bg-indigo-100 text-indigo-600',
  member_added: 'bg-orange-100 text-orange-600',
  due_date_reminder: 'bg-red-100 text-red-600',
  mention: 'bg-yellow-100 text-yellow-600',
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] rounded-xl border bg-card shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs h-5 px-1.5">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-secondary/30">
          <button onClick={() => setFilter('all')} className={cn('px-3 py-1 rounded-full text-xs font-medium', filter === 'all' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>All</button>
          <button onClick={() => setFilter('unread')} className={cn('px-3 py-1 rounded-full text-xs font-medium', filter === 'unread' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            filtered.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    'flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors',
                    !notif.is_read && 'bg-primary/[0.02]'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', typeColors[notif.type] || 'bg-gray-100')}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', !notif.is_read && 'font-medium')}>{notif.title}</p>
                      {!notif.is_read && <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{notif.actor}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t text-center">
          <button className="text-xs text-primary hover:underline">View all notifications</button>
        </div>
      </div>
    </>
  );
}

// ─── Bell Button (for Header) ───────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
            {unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
