import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, MoreHorizontal, Shield, Mail, UserX, UserCheck, Trash2, Eye } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type Member = {
  id: string; email: string; first_name: string; last_name: string;
  role: string; is_owner: boolean; status: string;
  joined_at: string; last_login_at: string;
};

const INITIAL_MEMBERS: Member[] = [
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

function ActionMenu({ member, onUpdate, onRemove }: { member: Member; onUpdate: (id: string, patch: Partial<Member>) => void; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const isSuspended = member.status === 'suspended';

  return (
    <div className="relative" ref={ref}>
      <button className="p-1 rounded hover:bg-accent" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-44 rounded-md border bg-popover shadow-lg py-1">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => { window.open(`mailto:${member.email}`); setOpen(false); }}
          >
            <Mail className="h-4 w-4 text-muted-foreground" /> Send Email
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => { alert(`Profile: ${member.first_name} ${member.last_name}\n${member.email}`); setOpen(false); }}
          >
            <Eye className="h-4 w-4 text-muted-foreground" /> View Profile
          </button>
          <div className="my-1 border-t" />
          <button
            className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent', isSuspended ? 'text-green-600' : 'text-yellow-600')}
            onClick={() => { onUpdate(member.id, { status: isSuspended ? 'active' : 'suspended' }); setOpen(false); }}
          >
            {isSuspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
            {isSuspended ? 'Reactivate' : 'Suspend'}
          </button>
          {!confirmRemove ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="h-4 w-4" /> Remove Member
            </button>
          ) : (
            <div className="px-3 py-2 space-y-1">
              <p className="text-xs text-destructive font-medium">Sure? This can't be undone.</p>
              <div className="flex gap-1">
                <button className="flex-1 rounded bg-destructive text-destructive-foreground text-xs py-1" onClick={() => { onRemove(member.id); setOpen(false); }}>Remove</button>
                <button className="flex-1 rounded border text-xs py-1" onClick={() => setConfirmRemove(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UserManagementPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const handleUpdate = (id: string, patch: Partial<Member>) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const handleRemove = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const filtered = members.filter(
    (m) => `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{members.length} members in your organization</p>
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
            <p className="text-2xl font-bold mt-1">{members.filter((m) => m.role === role).length}</p>
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
                      onChange={(e) => handleUpdate(m.id, { role: e.target.value })}
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
                      <ActionMenu member={m} onUpdate={handleUpdate} onRemove={handleRemove} />
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
