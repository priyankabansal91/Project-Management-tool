import { useState, useEffect } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Calendar, Brain, Link2, Unlink, RefreshCw, Send, Check,
  X, Settings, Shield, Zap, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/client';

interface IntegrationStatus {
  connected: boolean;
  microsoft_email?: string;
  connected_at?: string;
  settings?: {
    email_notifications: boolean;
    sync_calendar: boolean;
    ai_email_summaries: boolean;
  };
  synced_events?: number;
}

export function OutlookIntegrationPage() {
  const dialog = useDialog();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch integration status
  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const { data } = await api.get('/integrations/outlook/status');
      setStatus(data.data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      const { data } = await api.get('/integrations/outlook/connect');
      window.location.href = data.data.auth_url;
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to start connection flow' });
    }
  }

  async function handleDisconnect() {
    if (!await dialog.warning({ title: 'Disconnect Microsoft Account', message: 'Calendar sync and email notifications will stop. You can reconnect at any time.', confirmLabel: 'Disconnect' })) return;
    try {
      await api.post('/integrations/outlook/disconnect');
      setStatus({ connected: false });
      setMessage({ type: 'success', text: 'Microsoft account disconnected' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect' });
    }
  }

  async function handleToggleSetting(key: string, value: boolean) {
    try {
      const { data } = await api.patch('/integrations/outlook/settings', { [key]: value });
      setStatus((prev) => prev ? { ...prev, settings: data.data.settings } : prev);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update setting' });
    }
  }

  async function handleSyncCalendar() {
    setSyncing(true);
    try {
      const { data } = await api.post('/integrations/outlook/sync-calendar');
      setMessage({ type: 'success', text: data.data.message });
      fetchStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  }

  async function handleTestEmail() {
    setSendingTest(true);
    try {
      const { data } = await api.post('/integrations/outlook/test-email');
      setMessage({ type: 'success', text: data.data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Microsoft 365 Integration</h1>
        <p className="text-muted-foreground">Connect Outlook for email notifications, calendar sync, and SSO</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={cn(
          'flex items-center gap-2 rounded-lg p-3 text-sm',
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Microsoft Logo */}
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00A4EF]/10">
                <svg viewBox="0 0 23 23" className="h-7 w-7">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg">Microsoft 365</CardTitle>
                <CardDescription>Outlook Mail, Calendar, and Single Sign-On</CardDescription>
              </div>
            </div>
            {status?.connected ? (
              <Badge className="bg-green-100 text-green-700">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {status?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div>
                  <p className="text-sm font-medium">Connected as</p>
                  <p className="text-sm text-muted-foreground">{status.microsoft_email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connected {status.connected_at ? new Date(status.connected_at).toLocaleDateString('en-GB') : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive hover:bg-destructive/10">
                  <Unlink className="h-4 w-4" /> Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Connect your Microsoft 365 account to enable email notifications, calendar sync, and sign in with Microsoft.
              </p>
              <Button onClick={handleConnect} size="lg">
                <Link2 className="h-4 w-4" /> Connect Microsoft Account
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                We'll request permissions for: Mail.Send, Calendars.ReadWrite, User.Read
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Cards — only show when connected */}
      {status?.connected && (
        <>
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5"><Mail className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <CardTitle className="text-base">Email Notifications via Outlook</CardTitle>
                    <CardDescription>Receive task updates, assignments, and reminders in your Outlook inbox</CardDescription>
                  </div>
                </div>
                <ToggleSwitch
                  checked={status.settings?.email_notifications ?? true}
                  onChange={(v) => handleToggleSetting('email_notifications', v)}
                />
              </div>
            </CardHeader>
            {status.settings?.email_notifications && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <FeatureItem icon={Zap} label="Task assignments" description="When you're assigned a task" />
                  <FeatureItem icon={Clock} label="Due date reminders" description="1 day before task is due" />
                  <FeatureItem icon={Mail} label="Comment notifications" description="When someone comments on your task" />
                  <FeatureItem icon={Shield} label="Status changes" description="When task status is updated" />
                </div>
                <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={sendingTest}>
                  <Send className="h-3.5 w-3.5" /> {sendingTest ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Calendar Sync */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2.5"><Calendar className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <CardTitle className="text-base">Outlook Calendar Sync</CardTitle>
                    <CardDescription>Sync task due dates and sprint timelines to your Outlook calendar</CardDescription>
                  </div>
                </div>
                <ToggleSwitch
                  checked={status.settings?.sync_calendar ?? true}
                  onChange={(v) => handleToggleSetting('sync_calendar', v)}
                />
              </div>
            </CardHeader>
            {status.settings?.sync_calendar && (
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 mb-3">
                  <div>
                    <p className="text-sm font-medium">{status.synced_events || 0} events synced</p>
                    <p className="text-xs text-muted-foreground">Task due dates and sprint dates appear on your Outlook calendar</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSyncCalendar} disabled={syncing}>
                    <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FeatureItem icon={Calendar} label="Task due dates" description="Auto-create events for assigned tasks" />
                  <FeatureItem icon={Calendar} label="Sprint timelines" description="Sprint start/end dates as all-day events" />
                </div>
              </CardContent>
            )}
          </Card>

          {/* AI-Powered Emails */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2.5"><Brain className="h-5 w-5 text-purple-600" /></div>
                  <div>
                    <CardTitle className="text-base">AI-Powered Email Summaries</CardTitle>
                    <CardDescription>Claude AI generates smart, contextual email notifications instead of generic templates</CardDescription>
                  </div>
                </div>
                <ToggleSwitch
                  checked={status.settings?.ai_email_summaries ?? true}
                  onChange={(v) => handleToggleSetting('ai_email_summaries', v)}
                />
              </div>
            </CardHeader>
            {status.settings?.ai_email_summaries && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                  <p className="text-sm text-purple-800 mb-2"><strong>How it works:</strong></p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Claude reads the task context (title, description, status, project)</li>
                    <li>• Generates a concise, human-readable email summary</li>
                    <li>• Includes relevant action items and links</li>
                    <li>• Falls back to standard templates if AI is unavailable</li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* SSO Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2.5"><Shield className="h-5 w-5 text-orange-600" /></div>
                <div>
                  <CardTitle className="text-base">Single Sign-On (SSO)</CardTitle>
                  <CardDescription>
                    Your Microsoft account is linked. You can use "Sign in with Microsoft" on the login page.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </>
      )}

      {/* Setup Instructions */}
      {!status?.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Instructions (for admins)</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
                <span>Go to <strong>Azure Portal → Azure Active Directory → App registrations → New registration</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
                <span>Set Redirect URI to: <code className="bg-secondary px-1 rounded text-xs">http://localhost:4000/v1/integrations/outlook/callback</code></span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
                <span>Add API Permissions: <strong>Mail.Send, Calendars.ReadWrite, User.Read, offline_access</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">4</span>
                <span>Create a Client Secret and set <strong>MS_CLIENT_ID</strong>, <strong>MS_CLIENT_SECRET</strong>, <strong>MS_TENANT_ID</strong> in your .env file</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-gray-300'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  );
}

function FeatureItem({ icon: Icon, label, description }: { icon: any; label: string; description: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border p-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
