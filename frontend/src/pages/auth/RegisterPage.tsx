import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/client';
import { UserPlus } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', org_name: '', org_slug: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'org_name') {
      setForm((prev) => ({ ...prev, org_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', form);
      const result = data.data;
      login(result.access_token, result.user, 'org_admin');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
              <Input type="password" placeholder="Min 8 chars, upper + number + special" value={form.password} onChange={handleChange('password')} required />
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

            <Button type="submit" className="w-full" disabled={loading}>
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
