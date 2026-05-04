import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useAcceptInvite } from '@/api/hooks';
import type { OrgRole } from '@/types';
import { Users, Check, Loader2, AlertCircle } from 'lucide-react';

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const acceptInvite = useAcceptInvite();

  const token = params.get('token');

  const [step, setStep] = useState<'info' | 'register' | 'done'>('info');
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Invalid Invitation</h2>
            <p className="text-sm text-muted-foreground">This invitation link is missing or invalid. Please ask your admin to resend the invite.</p>
            <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await acceptInvite.mutateAsync({
        token,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
      });

      const org = result.organizations[0];
      login(result.access_token, {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        avatar_url: result.user.avatar_url,
      }, (org?.role ?? 'member') as OrgRole);

      setStep('done');
      setTimeout(() => navigate('/dashboard?welcome=1'), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to accept invitation. The link may have expired.';
      setError(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'done' ? 'Welcome aboard!' : "You've been invited"}
          </CardTitle>
          <CardDescription>
            {step === 'info' && 'You have been invited to join this workspace.'}
            {step === 'register' && 'Create your account to join the team.'}
            {step === 'done' && "Your account is ready. Taking you to the dashboard..."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'info' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4 text-center">
                <p className="text-sm text-muted-foreground mt-1">Click below to set up your password and join.</p>
              </div>
              <Button className="w-full" onClick={() => setStep('register')}>
                Accept Invitation
              </Button>
              <p className="text-xs text-muted-foreground text-center">Invitation links expire after 7 days.</p>
            </div>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    required autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password *</label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm Password *</label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm_password}
                  onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={acceptInvite.isPending}>
                {acceptInvite.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</>
                  : 'Create Account & Join'}
              </Button>
              <button type="button" onClick={() => setStep('info')} className="w-full text-xs text-muted-foreground hover:underline">
                ← Back
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
