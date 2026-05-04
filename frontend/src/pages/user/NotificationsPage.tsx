import { useState } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, AlertTriangle, FolderKanban, ArrowRightCircle, X, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/api/hooks';

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
  task_assigned: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  task_updated: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  task_commented: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
  project_created: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  member_added: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  due_date_reminder: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  mention: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
};

const typeLabels: Record<string, string> = {
  task_assigned: 'Task Assigned',
  task_updated: 'Task Updated',
  task_commented: 'Comment',
  project_created: 'Project',
  member_added: 'Member Added',
  due_date_reminder: 'Due Date',
  mention: 'Mention',
};

type Filter = 'all' | 'unread' | 'task_assigned' | 'task_commented' | 'due_date_reminder';

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const notifications: Notification[] = (data?.items ?? []) as Notification[];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter !== 'all') return n.type === filter;
    return true;
  });

  const filterTabs: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'task_assigned', label: 'Assigned' },
    { id: 'task_commented', label: 'Comments' },
    { id: 'due_date_reminder', label: 'Due Dates' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5 mr-1.5" />}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b pb-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              filter === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-50" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {filter === 'unread' ? 'You\'re all caught up!' : 'Nothing to show for this filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card
                key={notif.id}
                className={cn(
                  'transition-all cursor-pointer hover:shadow-sm',
                  !notif.is_read && 'border-primary/30 bg-primary/[0.02]'
                )}
                onClick={() => { if (!notif.is_read) markRead.mutate(notif.id); }}
              >
                <CardContent className="flex gap-4 p-4">
                  {/* Icon */}
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', typeColors[notif.type] || 'bg-muted')}>
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={cn('text-sm', !notif.is_read && 'font-semibold')}>{notif.title}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {typeLabels[notif.type] || notif.type}
                          </Badge>
                          {!notif.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>{notif.actor}</span>
                          <span>·</span>
                          <span>{timeAgo(notif.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(notif.id); }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
