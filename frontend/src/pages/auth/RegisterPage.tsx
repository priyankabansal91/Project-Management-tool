import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

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

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '', org_name: '', org_slug: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'org_name') {
      setForm((prev) => ({
        ...prev,
        org_name: value,
        org_slug: value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        org_name: form.org_name,
        org_slug: form.org_slug,
      });
      const result = data.data;
      login(result.access_token, result.user, 'org_admin');
      // Redirect to email verification — OTP sent automatically by VerifyEmailPage
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}&purpose=verify_email`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordMismatch = form.confirm_password.length > 0 && form.password !== form.confirm_password;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            PF
          </div>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>Start managing projects in minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="Alice" value={form.first_name} onChange={handleChange('first_name')} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Chen" value={form.last_name} onChange={handleChange('last_name')} required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@company.com" value={form.email} onChange={handleChange('email')} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, upper + number + special"
                  value={form.password}
                  onChange={handleChange('password')}
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

              {/* Strength meter */}
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
                    <p className="text-xs text-muted-foreground">
                      Use 8+ chars, uppercase, numbers &amp; symbols
                    </p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirm_password}
                  onChange={handleChange('confirm_password')}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input placeholder="Acme Corporation" value={form.org_name} onChange={handleChange('org_name')} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization URL</label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>projectflow.com/</span>
                <Input placeholder="acme-corp" value={form.org_slug} onChange={handleChange('org_slug')} required className="flex-1" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || passwordMismatch}>
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating workspace...' : 'Create Workspace'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
