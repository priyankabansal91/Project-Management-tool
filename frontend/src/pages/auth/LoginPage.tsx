import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      const result = data.data;
      login(result.access_token, result.user, result.organizations?.[0]?.role || 'member');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    { role: 'System Admin',        email: 'admin@example.local',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { role: 'Division Admin',      email: 'div-admin@example.local', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { role: 'Project Lead',        email: 'pm@example.local',        color: 'bg-green-100 text-green-700 border-green-200' },
    { role: 'Project Team Member', email: 'member@example.local',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { role: 'Leadership',          email: 'executive@example.local', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-start justify-center">

        {/* ── Login Card ─────────────────────────────── */}
        <Card className="w-full lg:w-[420px] flex-shrink-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
              QF
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your Q-Flow account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>

              <a
                href="/v1/integrations/outlook/login"
                className="flex w-full items-center justify-center gap-3 rounded-md border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 23 23" className="h-5 w-5">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
                Sign in with Microsoft
              </a>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* ── Demo Credentials Card ──────────────────── */}
        <Card className="w-full lg:w-[320px] flex-shrink-0 border-dashed border-2 border-primary/30 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <CardTitle className="text-base">Demo Credentials</CardTitle>
            </div>
            <CardDescription className="text-xs">Click any role to auto-fill the login form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword('password123'); }}
                className="w-full text-left rounded-lg border p-3 hover:shadow-sm transition-all hover:scale-[1.01] bg-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${acc.color}`}>
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-muted-foreground">password123</span>
                </div>
                <p className="mt-1.5 text-xs text-foreground font-mono truncate">{acc.email}</p>
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              These are pre-seeded test accounts for evaluation purposes.
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
