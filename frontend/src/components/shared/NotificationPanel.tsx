import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell, CheckCheck, MessageSquare, UserPlus, AlertTriangle,
  FolderKanban, ArrowRightCircle, X, Loader2,
} from 'lucide-react';
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
  task_assigned:    UserPlus,
  task_updated:     ArrowRightCircle,
  task_commented:   MessageSquare,
  project_created:  FolderKanban,
  member_added:     UserPlus,
  due_date_reminder: AlertTriangle,
  mention:          MessageSquare,
};

const typeColors: Record<string, string> = {
  task_assigned:    'bg-blue-100 text-blue-600',
  task_updated:     'bg-purple-100 text-purple-600',
  task_commented:   'bg-green-100 text-green-600',
  project_created:  'bg-indigo-100 text-indigo-600',
  member_added:     'bg-orange-100 text-orange-600',
  due_date_reminder:'bg-red-100 text-red-600',
  mention:          'bg-yellow-100 text-yellow-600',
};

type Tab = 'all' | 'assigned' | 'mentioned';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  isMarkingAllRead: boolean;
}

function NotificationPanel({
  open, onClose, notifications, unreadCount, isLoading,
  onMarkRead, onMarkAllRead, onDelete, isMarkingAllRead,
}: NotificationPanelProps) {
  const [tab, setTab] = useState<Tab>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = tab === 'assigned'
    ? notifications.filter((n) => n.type === 'task_assigned')
    : tab === 'mentioned'
    ? notifications.filter((n) => n.type === 'mention')
    : notifications;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'mentioned', label: 'Mentioned' },
  ];

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
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
              <Button
                variant="ghost" size="sm" className="text-xs h-7"
                onClick={onMarkAllRead}
                disabled={isMarkingAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
            <button onClick={onClose} className="p-1 rounded hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-3 py-2 border-b bg-secondary/30">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                tab === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mb-2 opacity-50" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications in this category</p>
            </div>
          ) : (
            filtered.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  onMouseEnter={() => setHoveredId(notif.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => { if (!notif.is_read) onMarkRead(notif.id); }}
                  className={cn(
                    'relative flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 transition-colors',
                    !notif.is_read && 'bg-primary/[0.03]'
                  )}
                >
                  {/* Type icon */}
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', typeColors[notif.type] || 'bg-gray-100 text-gray-600')}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm leading-snug', !notif.is_read ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                        {notif.title}
                      </p>
                      {/* Unread dot — only on unread */}
                      {!notif.is_read && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">{notif.actor}</span>
                      <span className="text-[10px] text-muted-foreground/60">·</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>

                  {/* Delete on hover */}
                  {hoveredId === notif.id && (
                    <button
                      className="absolute right-2 top-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                      title="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t text-center">
          <button
            className="text-xs text-primary hover:underline font-medium"
            onClick={() => { onClose(); navigate('/notifications'); }}
          >
            View all notifications →
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Bell Button (for Header) ─────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications: Notification[] = (data?.items ?? []) as Notification[];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = (id: string) => markReadMutation.mutate(id);
  const handleMarkAllRead = () => markAllReadMutation.mutate();
  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationPanel
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onDelete={handleDelete}
        isMarkingAllRead={markAllReadMutation.isPending}
      />
    </div>
  );
}
