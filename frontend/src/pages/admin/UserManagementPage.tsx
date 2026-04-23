import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Plus, Search, MoreHorizontal, Shield, Mail, UserX, UserCheck,
  Trash2, Eye, Loader2, CheckCircle2, Clock, X,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import {
  useMembers, useInviteMember, useUpdateMemberStatus, useRemoveMember,
  usePendingInvites, useCancelInvite,
} from '@/api/hooks';

type Member = {
  id: string; email: string; first_name: string; last_name: string;
  role: string; is_owner: boolean; status: string;
  joined_at: string; last_login_at: string | null;
};

const roleColors: Record<string, string> = {
  org_admin:       'bg-red-100 text-red-700',
  division_admin:  'bg-orange-100 text-orange-700',
  project_manager: 'bg-blue-100 text-blue-700',
  member:          'bg-green-100 text-green-700',
  executive:       'bg-purple-100 text-purple-700',
  viewer:          'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-700',
  suspended: 'bg-red-100 text-red-700',
};

// ─── Action Menu ────────────────────────────────────────

function ActionMenu({ member, onStatusChange, onRemove }: {
  member: Member;
  onStatusChange: (id: string, status: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setConfirmRemove(false);
      }
    }
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
            onClick={() => { alert(`${member.first_name} ${member.last_name}\n${member.email}`); setOpen(false); }}
          >
            <Eye className="h-4 w-4 text-muted-foreground" /> View Profile
          </button>
          <div className="my-1 border-t" />
          <button
            className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent', isSuspended ? 'text-green-600' : 'text-yellow-600')}
            onClick={() => { onStatusChange(member.id, isSuspended ? 'active' : 'suspended'); setOpen(false); }}
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
                <button
                  className="flex-1 rounded bg-destructive text-destructive-foreground text-xs py-1"
                  onClick={() => { onRemove(member.id); setOpen(false); }}
                >Remove</button>
                <button className="flex-1 rounded border text-xs py-1" onClick={() => setConfirmRemove(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export function UserManagementPage() {
  const [tab, setTab] = useState<'members' | 'invites'>('members');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteSent, setInviteSent] = useState<{ email: string; link: string } | null>(null);

  const membersQuery = useMembers({ search: search || undefined });
  const invitesQuery = usePendingInvites();
  const members: Member[] = membersQuery.data?.items ?? [];
  const invites = invitesQuery.data ?? [];

  const inviteMember   = useInviteMember();
  const updateStatus   = useUpdateMemberStatus();
  const removeMember   = useRemoveMember();
  const cancelInvite   = useCancelInvite();

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const result = await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteSent({ email: result.email, link: result.invite_link });
      setInviteEmail('');
      setInviteRole('member');
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to send invitation');
    }
  };

  const handleCloseInvite = () => {
    setShowInvite(false);
    setInviteSent(null);
    setInviteEmail('');
    setInviteRole('member');
  };

  const roleCounts = ['org_admin', 'project_manager', 'member', 'viewer'].map((role) => ({
    role, count: members.filter((m) => m.role === role).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{members.length} active members · {invites.length} pending invite{invites.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="h-4 w-4 mr-1" /> Invite Member
        </Button>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {roleCounts.map(({ role, count }) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium capitalize">{role.replace('_', ' ')}</span>
            </div>
            <p className="text-2xl font-bold mt-1">{count}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setTab('members')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            tab === 'members' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Active Members
          <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-xs', tab === 'members' ? 'bg-primary/10' : 'bg-secondary')}>
            {members.length}
          </span>
        </button>
        <button
          onClick={() => setTab('invites')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1',
            tab === 'invites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Pending Invites
          {invites.length > 0 && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-xs', tab === 'invites' ? 'bg-primary/10' : 'bg-orange-100 text-orange-700')}>
              {invites.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Active Members Tab ── */}
      {tab === 'members' && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                  {membersQuery.isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No members found.</td></tr>
                  ) : members.map((m) => (
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
                        <Badge className={cn('text-xs', roleColors[m.role] ?? 'bg-gray-100 text-gray-700')}>
                          {m.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={cn('text-xs', statusColors[m.status])}>{m.status}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(m.joined_at)}</td>
                      <td className="p-4 text-muted-foreground">{m.last_login_at ? formatDate(m.last_login_at) : 'Never'}</td>
                      <td className="p-4">
                        {!m.is_owner && (
                          <ActionMenu
                            member={m}
                            onStatusChange={(id, status) => updateStatus.mutate({ userId: id, status })}
                            onRemove={(id) => removeMember.mutate(id)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Pending Invites Tab ── */}
      {tab === 'invites' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Invited By</th>
                  <th className="p-4 font-medium">Sent</th>
                  <th className="p-4 font-medium">Expires</th>
                  <th className="p-4 font-medium w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitesQuery.isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No pending invitations.</p>
                      <p className="text-xs mt-1">Use "Invite Member" to add someone.</p>
                    </td>
                  </tr>
                ) : invites.map((inv) => {
                  const isExpired = new Date(inv.expires_at) < new Date();
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{inv.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={cn('text-xs', roleColors[inv.role] ?? 'bg-gray-100 text-gray-700')}>
                          {inv.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{inv.invited_by}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                      <td className="p-4">
                        <span className={cn('text-sm', isExpired ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                          {isExpired ? 'Expired' : formatDate(inv.expires_at)}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => cancelInvite.mutate(inv.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Cancel invite"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseInvite}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              {inviteSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold">Invitation Sent!</h2>
                  <p className="text-sm text-muted-foreground">
                    An invite email has been sent to <strong>{inviteSent.email}</strong>.
                  </p>
                  <Button onClick={handleCloseInvite} className="w-full">Done</Button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">Invite Team Member</h2>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full rounded-md border bg-background p-2 text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="division_admin">Division Admin</option>
                      <option value="org_admin">Org Admin</option>
                      <option value="executive">Executive</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleCloseInvite}>Cancel</Button>
                    <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteMember.isPending}>
                      {inviteMember.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        : <Mail className="h-4 w-4 mr-1" />}
                      Send Invite
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
