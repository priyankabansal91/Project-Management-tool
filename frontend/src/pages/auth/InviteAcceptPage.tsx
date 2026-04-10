import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { Users, Check, Loader2 } from 'lucide-react';

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const token = params.get('token');
  const org = params.get('org') || 'Acme Corporation';

  const [step, setStep] = useState<'info' | 'register' | 'done'>('info');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', password: '' });

  const handleAccept = () => {
    setStep('register');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep('done');
      setLoading(false);
      // Auto-login after 2s
      setTimeout(() => {
        login('demo-token', { id: '99', email: 'new@acme.com', firstName: form.first_name, lastName: form.last_name, avatar_url: null }, 'member');
        navigate('/dashboard?welcome=1');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'done' ? 'Welcome aboard!' : `You're invited to ${org}`}
          </CardTitle>
          <CardDescription>
            {step === 'info' && 'You have been invited to join this workspace on ProjectFlow.'}
            {step === 'register' && 'Create your account to join the team.'}
            {step === 'done' && 'Your account has been created and you\'ve been added to the workspace.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'info' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4 text-center">
                <p className="text-sm font-medium">{org}</p>
                <p className="text-xs text-muted-foreground mt-1">Invited as <strong>Member</strong></p>
              </div>
              <Button className="w-full" onClick={handleAccept}>Accept Invitation</Button>
              <p className="text-xs text-muted-foreground text-center">This invitation expires in 7 days</p>
            </div>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create Account & Join'}
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
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
