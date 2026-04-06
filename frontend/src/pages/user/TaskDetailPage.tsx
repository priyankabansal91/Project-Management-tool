import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Tag, User, Send, MoreHorizontal } from 'lucide-react';
import { cn, priorityColor, formatDate, timeAgo } from '@/lib/utils';

const mockTask = {
  id: 't1', task_key: 'CPR-1', title: 'Design new navigation component',
  description: '## Overview\nCreate a responsive navigation component with mobile drawer and desktop mega-menu.\n\n## Acceptance Criteria\n- Mobile: hamburger drawer opens smoothly\n- Desktop: mega-menu with hover states\n- Keyboard navigation accessible\n- Unit tests pass',
  status_name: 'In Progress', status_id: 's3', priority: 'high' as const,
  assignee: { id: '3', name: 'Carol Johnson', avatar_url: null },
  reporter: { id: '2', name: 'Bob Martinez' },
  project: { id: '1', name: 'Customer Portal Redesign', key: 'CPR', color: '#3B82F6' },
  due_date: '2026-02-15', start_date: '2026-02-01',
  estimated_hours: 8, logged_hours: 3.5,
  tags: ['frontend', 'design'],
  created_at: '2026-01-15T10:00:00Z', updated_at: '2026-02-08T16:00:00Z',
};

const mockComments = [
  {
    id: 'c1', author: { id: '2', name: 'Bob Martinez', avatar_url: null },
    body: 'Great progress on the nav component! Please make sure to test in Safari as well — there were some animation issues in the previous iteration.',
    created_at: '2026-02-08T14:30:00Z', is_edited: false, replies: [
      { id: 'c2', author: { id: '3', name: 'Carol Johnson', avatar_url: null }, body: 'Safari issues fixed! Added test in Playwright cross-browser suite. Ready for review soon.', created_at: '2026-02-08T16:00:00Z', is_edited: false, replies: [] },
    ],
  },
];

const mockActivityLog = [
  { actor: 'Carol Johnson', action: 'Changed status', detail: 'To Do → In Progress', at: '2026-02-05T09:00:00Z' },
  { actor: 'Bob Martinez', action: 'Assigned to', detail: 'Carol Johnson', at: '2026-02-01T10:00:00Z' },
  { actor: 'Bob Martinez', action: 'Created task', detail: '', at: '2026-01-15T10:00:00Z' },
];

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [newComment, setNewComment] = useState('');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${mockTask.project.id}/board`} className="hover:text-foreground flex items-center gap-1">
          <div className="h-2 w-2 rounded" style={{ backgroundColor: mockTask.project.color }} />
          {mockTask.project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{mockTask.task_key}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">{mockTask.task_key}</Badge>
              <Badge className={cn('text-xs', priorityColor(mockTask.priority))}>{mockTask.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{mockTask.title}</h1>
          </div>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {mockTask.description.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 ml-2"><span>•</span><span>{line.replace('- ', '')}</span></div>;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader><CardTitle className="text-base">Comments ({mockComments.length})</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {mockComments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar name={comment.author.name} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.body}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3 ml-12">
                      <Avatar name={reply.author.name} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{reply.author.name}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{reply.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* New Comment */}
              <div className="flex gap-3 pt-4 border-t">
                <Avatar name="You" size="md" />
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" disabled={!newComment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivityLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
                    <div>
                      <p className="text-sm"><span className="font-medium">{log.actor}</span> {log.action} {log.detail && <span className="text-muted-foreground">{log.detail}</span>}</p>
                      <span className="text-xs text-muted-foreground">{timeAgo(log.at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Details sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">{mockTask.status_name}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                <Badge className={cn('text-xs', priorityColor(mockTask.priority))}>{mockTask.priority}</Badge>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                <div className="flex items-center gap-2">
                  <Avatar name={mockTask.assignee.name} size="sm" />
                  <span className="text-sm">{mockTask.assignee.name}</span>
                </div>
              </div>

              {/* Reporter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reporter</label>
                <div className="flex items-center gap-2">
                  <Avatar name={mockTask.reporter.name} size="sm" />
                  <span className="text-sm">{mockTask.reporter.name}</span>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(mockTask.due_date)}</span>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(mockTask.start_date)}</span>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Tracking</label>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{mockTask.logged_hours}h / {mockTask.estimated_hours}h</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(mockTask.logged_hours / mockTask.estimated_hours) * 100}%` }} />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-1"><Clock className="h-3 w-3" /> Log Time</Button>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {mockTask.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Created</span><span>{formatDate(mockTask.created_at)}</span></div>
                <div className="flex justify-between"><span>Updated</span><span>{formatDate(mockTask.updated_at)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
