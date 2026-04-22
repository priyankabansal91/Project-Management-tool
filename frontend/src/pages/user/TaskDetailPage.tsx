import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Send, Loader } from 'lucide-react';
import { cn, priorityColor, formatDate, timeAgo } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { useComments, useCreateComment } from '@/api/hooks';

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

  const commentsQuery = useComments(taskId || '');
  const createComment = useCreateComment(taskId || '');

  const comments = commentsQuery.data?.items ?? mockComments;

  const handleSubmitComment = () => {
    const body = newComment.trim();
    if (!body) return;
    createComment.mutate({ body }, { onSuccess: () => setNewComment('') });
  };

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data.data;
    },
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800">Error loading task: {error instanceof Error ? error.message : 'Task not found'}</p>
          <Link to="/tasks" className="text-red-600 hover:text-red-800 mt-4 inline-block">← Back to Tasks</Link>
        </Card>
      </div>
    );
  }

  const mockTask = task;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        {task?.project && (
          <>
            <Link to={`/projects/${task.project.id}/board`} className="hover:text-foreground flex items-center gap-1">
              <div className="h-2 w-2 rounded" style={{ backgroundColor: task.project.color || '#3B82F6' }} />
              {task.project.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">{task?.task_key}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">{task?.task_key}</Badge>
              <Badge className={cn('text-xs', priorityColor(task?.priority || 'medium'))}>{task?.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{task?.title}</h1>
          </div>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
            <CardContent>
              {task?.description ? (
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {task.description.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">{line.replace('## ', '')}</h3>;
                    if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 ml-2"><span>•</span><span>{line.replace('- ', '')}</span></div>;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader><CardTitle className="text-base">Comments ({comments.length})</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {comments.map((comment) => (
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
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    disabled={!newComment.trim() || createComment.isPending}
                    onClick={handleSubmitComment}
                  >
                    {createComment.isPending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
                  <span className="text-sm font-medium">{task?.status_name || 'Unknown'}</span>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                <Badge className={cn('text-xs', priorityColor(task?.priority || 'medium'))}>{task?.priority || 'medium'}</Badge>
              </div>

              {/* Assignee */}
              {task?.assignee && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={task.assignee.name} size="sm" />
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                </div>
              )}

              {/* Reporter */}
              {task?.reporter && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reporter</label>
                  <div className="flex items-center gap-2">
                    <Avatar name={task.reporter.name} size="sm" />
                    <span className="text-sm">{task.reporter.name}</span>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task?.due_date && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.due_date)}</span>
                  </div>
                </div>
              )}

              {/* Start Date */}
              {task?.start_date && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</label>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(task.start_date)}</span>
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              {task?.estimated_hours && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Tracking</label>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{task.logged_hours || 0}h / {task.estimated_hours}h</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${((task.logged_hours || 0) / task.estimated_hours) * 100}%` }} />
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-1"><Clock className="h-3 w-3" /> Log Time</Button>
                </div>
              )}

              {/* Tags */}
              {task?.tags && task.tags.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                {task?.created_at && <div className="flex justify-between"><span>Created</span><span>{formatDate(task.created_at)}</span></div>}
                {task?.updated_at && <div className="flex justify-between"><span>Updated</span><span>{formatDate(task.updated_at)}</span></div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
