import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useAcceptInvite } from '@/api/hooks';
import type { OrgRole } from '@/types';
import { Users, Check, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-green-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-500' };
}

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const acceptInvite = useAcceptInvite();

  const token = params.get('token');

  const [step, setStep] = useState<'info' | 'register' | 'done'>('info');
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(form.password);
  const passwordMismatch = form.confirm_password.length > 0 && form.password !== form.confirm_password;

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
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">Uppercase, numbers &amp; symbols help</p>
                      {strength.label && (
                        <span className={`text-xs font-medium ${
                          strength.score <= 1 ? 'text-red-500' :
                          strength.score === 2 ? 'text-orange-400' :
                          strength.score === 3 ? 'text-yellow-500' :
                          'text-green-600'
                        }`}>{strength.label}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm Password *</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirm_password}
                    onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    required
                    className={`pr-10 ${passwordMismatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={acceptInvite.isPending || passwordMismatch}>
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
