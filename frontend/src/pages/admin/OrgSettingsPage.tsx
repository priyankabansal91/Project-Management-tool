import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Palette, Clock, Calendar, CreditCard, Shield, Save, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  { id: 'free', name: 'Free', price: '$0', members: 5, projects: 3, features: ['Basic Kanban', '1GB storage'] },
  { id: 'starter', name: 'Starter', price: '$9/user/mo', members: 25, projects: 10, features: ['Custom workflows', '10GB storage', 'Reports'] },
  { id: 'professional', name: 'Professional', price: '$19/user/mo', members: 100, projects: 50, features: ['AI features', '100GB storage', 'SSO', 'Calendar sync'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', members: -1, projects: -1, features: ['Unlimited', 'Dedicated support', 'SLA', 'Audit logs', 'Custom integrations'] },
];

export function OrgSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    name: 'Acme Corporation',
    slug: 'acme-corp',
    domain: 'acme.com',
    logo_url: '',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    week_starts: 'monday',
    theme: 'light',
    plan: 'professional',
    require_task_estimates: true,
    allow_guest_access: false,
    default_task_priority: 'medium',
    brand_primary_color: '#3B82F6',
  });

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your workspace configuration and preferences</p>
        </div>
        <Button onClick={handleSave}>
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input value={settings.name} onChange={(e) => updateSetting('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Slug</label>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-1">projectflow.com/</span>
                <Input value={settings.slug} onChange={(e) => updateSetting('slug', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Domain (SSO)</label>
              <Input value={settings.domain} onChange={(e) => updateSetting('domain', e.target.value)} placeholder="company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo</label>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg border-2 border-dashed flex items-center justify-center bg-secondary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <Button variant="outline" size="sm">Upload Logo</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Localization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <select value={settings.timezone} onChange={(e) => updateSetting('timezone', e.target.value)} className="w-full rounded-md border p-2 text-sm bg-background">
                <option value="America/New_York">Eastern (US)</option>
                <option value="America/Chicago">Central (US)</option>
                <option value="America/Los_Angeles">Pacific (US)</option>
                <option value="Europe/London">London (UK)</option>
                <option value="Europe/Berlin">Berlin (EU)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Asia/Singapore">Singapore</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Format</label>
              <select value={settings.date_format} onChange={(e) => updateSetting('date_format', e.target.value)} className="w-full rounded-md border p-2 text-sm bg-background">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Week Starts On</label>
              <select value={settings.week_starts} onChange={(e) => updateSetting('week_starts', e.target.value)} className="w-full rounded-md border p-2 text-sm bg-background">
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
                <option value="saturday">Saturday</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Branding</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={settings.brand_primary_color} onChange={(e) => updateSetting('brand_primary_color', e.target.value)} className="h-10 w-10 rounded cursor-pointer border-0" />
                <Input value={settings.brand_primary_color} onChange={(e) => updateSetting('brand_primary_color', e.target.value)} className="flex-1 font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <div className="flex gap-2">
                {['light', 'dark', 'system'].map((t) => (
                  <button key={t} onClick={() => updateSetting('theme', t)} className={cn('rounded-md border px-4 py-2 text-sm capitalize', settings.theme === t ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Project Defaults</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Task Priority</label>
              <select value={settings.default_task_priority} onChange={(e) => updateSetting('default_task_priority', e.target.value)} className="w-full rounded-md border p-2 text-sm bg-background">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <ToggleRow label="Require task time estimates" description="All new tasks must have estimated hours" checked={settings.require_task_estimates} onChange={(v) => updateSetting('require_task_estimates', v)} />
            <ToggleRow label="Allow guest access" description="Users outside your org domain can be invited as viewers" checked={settings.allow_guest_access} onChange={(v) => updateSetting('allow_guest_access', v)} />
          </div>
        </CardContent>
      </Card>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Plan & Billing</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className={cn('rounded-lg border p-4 transition-all cursor-pointer', settings.plan === plan.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50')}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{plan.name}</h4>
                  {settings.plan === plan.id && <Badge className="bg-primary text-xs">Current</Badge>}
                </div>
                <p className="text-lg font-bold mb-2">{plan.price}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>{plan.members === -1 ? 'Unlimited' : plan.members} members</li>
                  <li>{plan.projects === -1 ? 'Unlimited' : plan.projects} projects</li>
                  {plan.features.map((f) => <li key={f}>+ {f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', checked ? 'bg-primary' : 'bg-gray-300')}>
        <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
    </div>
  );
}
