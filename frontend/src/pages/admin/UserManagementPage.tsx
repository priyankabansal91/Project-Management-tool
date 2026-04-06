import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, MoreHorizontal, Shield, Mail } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const mockMembers = [
  { id: '1', email: 'alice.admin@acme.com', first_name: 'Alice', last_name: 'Chen', role: 'org_admin', is_owner: true, status: 'active', joined_at: '2026-01-01T00:00:00Z', last_login_at: '2026-04-06T10:00:00Z' },
  { id: '2', email: 'bob.pm@acme.com', first_name: 'Bob', last_name: 'Martinez', role: 'project_manager', is_owner: false, status: 'active', joined_at: '2026-01-05T00:00:00Z', last_login_at: '2026-04-05T14:30:00Z' },
  { id: '3', email: 'carol.dev@acme.com', first_name: 'Carol', last_name: 'Johnson', role: 'member', is_owner: false, status: 'active', joined_at: '2026-01-10T00:00:00Z', last_login_at: '2026-04-06T08:00:00Z' },
  { id: '4', email: 'david.dev@acme.com', first_name: 'David', last_name: 'Park', role: 'member', is_owner: false, status: 'active', joined_at: '2026-01-15T00:00:00Z', last_login_at: '2026-04-04T16:00:00Z' },
];

const roleColors: Record<string, string> = {
  org_admin: 'bg-red-100 text-red-700',
  project_manager: 'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700',
};

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const filtered = mockMembers.filter(
    (m) => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{mockMembers.length} members in your organization</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['org_admin', 'project_manager', 'member', 'viewer'].map((role) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium capitalize">{role.replace('_', ' ')}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{mockMembers.filter((m) => m.role === role).length}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Last Active</th>
                <th className="p-4 font-medium w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${m.first_name} ${m.last_name}`} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.first_name} {m.last_name}</span>
                          {m.is_owner && <Badge className="text-[10px] bg-yellow-100 text-yellow-700">Owner</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{m.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={m.role}
                      disabled={m.is_owner}
                      className={cn('rounded-full px-2.5 py-1 text-xs font-medium border-0 cursor-pointer', roleColors[m.role])}
                    >
                      <option value="org_admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <Badge className={cn('text-xs', statusColors[m.status])}>{m.status}</Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(m.joined_at)}</td>
                  <td className="p-4 text-muted-foreground">{m.last_login_at ? formatDate(m.last_login_at) : 'Never'}</td>
                  <td className="p-4">
                    {!m.is_owner && (
                      <button className="p-1 rounded hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInvite(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Invite Team Member</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" placeholder="colleague@company.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select className="w-full rounded-md border p-2 text-sm">
                  <option value="member">Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="org_admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                <Button><Mail className="h-4 w-4" /> Send Invite</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
