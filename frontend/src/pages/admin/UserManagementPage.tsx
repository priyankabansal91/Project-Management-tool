import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import {
  Plus, Search, MoreHorizontal, Shield, Mail, UserX, UserCheck,
  Trash2, Eye, Loader2, CheckCircle2, Clock, X, Copy, Check, Link2,
  UserPlus, RefreshCw, Key,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import {
  useMembers, useInviteMember, useUpdateMemberStatus, useRemoveMember,
  usePendingInvites, useCancelInvite, useDivisionMembers, useMyDivisions,
  useCreateMemberDirect, useResetMemberPassword,
} from '@/api/hooks';
import { useDialog } from '@/components/ui/AppDialog';
import { useAuthStore } from '@/store/authStore';
import { Building2 } from 'lucide-react';

type Member = {
  id: string; email: string; first_name: string; last_name: string;
  role: string; is_owner: boolean; status: string;
  joined_at: string; last_login_at: string | null;
};

const roleColors: Record<string, string> = {
  org_admin:       'bg-red-100 text-red-700',
  division_admin:  'bg-orange-100 text-orange-700',
  hod:             'bg-indigo-100 text-indigo-700',
  vertical_head:   'bg-teal-100 text-teal-700',
  project_manager: 'bg-blue-100 text-blue-700',
  team_lead:       'bg-cyan-100 text-cyan-700',
  member:          'bg-green-100 text-green-700',
  executive:       'bg-purple-100 text-purple-700',
  viewer:          'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-orange-100 text-orange-700',
};

// ─── Reset Password Dialog ──────────────────────────────

function ResetPasswordDialog({ member, onClose }: { member: Member; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(true);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const resetPw = useResetMemberPassword();

  const generate = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pw);
    setShowPw(true);
    setCopied(false);
  };

  const copyPw = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return;
    try {
      await resetPw.mutateAsync({ userId: member.id, password });
      setDone(true);
    } catch { /* error shown below */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-background rounded-lg border shadow-xl w-full max-w-sm mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> Reset Password
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {done ? (
          <div className="space-y-3 text-center py-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm font-medium">Password reset successfully</p>
            <p className="text-xs text-muted-foreground">
              Share the new password with <span className="font-medium">{member.first_name}</span> through a secure channel.
            </p>
            <Button className="w-full" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set a new password for <span className="font-medium text-foreground">{member.first_name} {member.last_name}</span>
              <br /><span className="text-xs">{member.email}</span>
            </p>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={generate}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Generate secure password
            </Button>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="Enter new password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-16 font-mono text-sm"
                minLength={8}
                required
              />
              <div className="absolute right-1 top-1 flex gap-0.5">
                <button type="button" className="p-1 rounded hover:bg-muted" onClick={() => setShowPw((s) => !s)}>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {password && (
                  <button type="button" className="p-1 rounded hover:bg-muted" onClick={copyPw}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                )}
              </div>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-destructive">Password must be at least 8 characters</p>
            )}
            {resetPw.isError && (
              <p className="text-xs text-destructive">
                {(resetPw.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to reset password'}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={password.length < 8 || resetPw.isPending}>
                {resetPw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Action Menu ────────────────────────────────────────

function ActionMenu({ member, onStatusChange, onRemove, onResetPassword, onViewProfile }: {
  member: Member;
  onStatusChange: (id: string, status: string) => void;
  onRemove: (id: string) => void;
  onResetPassword: (member: Member) => void;
  onViewProfile: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setConfirmRemove(false); setConfirmDeactivate(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const isActive    = member.status === 'active';
  const isSuspended = member.status === 'suspended';
  const isInactive  = member.status === 'inactive';

  return (
    <div className="relative" ref={ref}>
      <button className="p-1 rounded hover:bg-muted" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-52 rounded-md border bg-popover text-popover-foreground shadow-lg py-1">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => { window.open(`mailto:${member.email}`); setOpen(false); }}
          >
            <Mail className="h-4 w-4 text-muted-foreground" /> Send Email
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => { onViewProfile(member); setOpen(false); }}
          >
            <Eye className="h-4 w-4 text-muted-foreground" /> View Profile
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-primary"
            onClick={() => { onResetPassword(member); setOpen(false); }}
          >
            <Key className="h-4 w-4" /> Reset Password
          </button>
          <div className="my-1 border-t" />

          {/* Activate — shown when inactive or suspended */}
          {(isInactive || isSuspended) && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-green-600 dark:text-green-400"
              onClick={() => { onStatusChange(member.id, 'active'); setOpen(false); }}
            >
              <UserCheck className="h-4 w-4" /> Activate
            </button>
          )}

          {/* Suspend — shown when active */}
          {isActive && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-yellow-600 dark:text-yellow-400"
              onClick={() => { onStatusChange(member.id, 'suspended'); setOpen(false); }}
            >
              <UserX className="h-4 w-4" /> Suspend
            </button>
          )}

          {/* Deactivate (permanent) — shown when active or suspended */}
          {!isInactive && (
            confirmDeactivate ? (
              <div className="px-3 py-2 space-y-1">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Permanently deactivate this user?</p>
                <div className="flex gap-1">
                  <button
                    className="flex-1 rounded bg-orange-500 text-white text-xs py-1"
                    onClick={() => { onStatusChange(member.id, 'inactive'); setOpen(false); setConfirmDeactivate(false); }}
                  >Deactivate</button>
                  <button className="flex-1 rounded border text-xs py-1" onClick={() => setConfirmDeactivate(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-orange-600 dark:text-orange-400"
                onClick={() => setConfirmDeactivate(true)}
              >
                <UserX className="h-4 w-4" /> Deactivate
              </button>
            )
          )}

          <div className="my-1 border-t" />

          {/* Remove member */}
          {!confirmRemove ? (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
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
  const dialog = useDialog();
  const [tab, setTab] = useState<'members' | 'invites'>('members');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [resetPwMember, setResetPwMember] = useState<Member | null>(null);
  const [inviteMode, setInviteMode] = useState<'link' | 'direct'>('link');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteSent, setInviteSent] = useState<{ email: string; link: string } | null>(null);
  const [directForm, setDirectForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'member' });
  const [directDone, setDirectDone] = useState<{ name: string; email: string } | null>(null);
  const [directError, setDirectError] = useState('');
  const [copied, setCopied] = useState(false);

  const { currentDivisionId } = useAuthStore();
  const { data: myDivisions = [] } = useMyDivisions();
  const activeDivision = (myDivisions as any[]).find((d: any) => d.divisionId === currentDivisionId);

  const allMembersQuery    = useMembers({ search: search || undefined });
  const divMembersQuery    = useDivisionMembers(currentDivisionId);
  const invitesQuery       = usePendingInvites();

  // Use division-filtered members when a division is selected
  const rawMembers = currentDivisionId
    ? (divMembersQuery.data ?? [])
    : (allMembersQuery.data?.items ?? []);
  const members: Member[] = rawMembers.filter((m: any) =>
    !search || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const invites = invitesQuery.data ?? [];

  const inviteMember    = useInviteMember();
  const createDirect    = useCreateMemberDirect();
  const updateStatus    = useUpdateMemberStatus();
  const removeMember    = useRemoveMember();
  const cancelInvite    = useCancelInvite();
  const reInviteMember  = useInviteMember();

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const result = await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      setInviteSent({ email: result.email, link: result.invite_link });
      setInviteEmail('');
      setInviteRole('member');
    } catch (err: unknown) {
      await dialog.error({ title: 'Invitation Failed', message: (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send invitation' });
    }
  };

  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError('');
    try {
      const result = await createDirect.mutateAsync({
        email: directForm.email,
        first_name: directForm.firstName,
        last_name: directForm.lastName,
        password: directForm.password,
        role: directForm.role,
      });
      setDirectDone({ name: `${result.first_name} ${result.last_name}`, email: result.email });
    } catch (err: unknown) {
      setDirectError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to create member');
    }
  };

  const handleResendInvite = async (email: string, role: string, inviteId: string) => {
    try {
      await cancelInvite.mutateAsync(inviteId);
      const result = await reInviteMember.mutateAsync({ email, role });
      setInviteSent({ email: result.email, link: result.invite_link });
      setShowInvite(true);
    } catch { /* silent */ }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseInvite = () => {
    setShowInvite(false);
    setInviteSent(null);
    setDirectDone(null);
    setInviteEmail('');
    setInviteRole('member');
    setDirectForm({ firstName: '', lastName: '', email: '', password: '', role: 'member' });
    setDirectError('');
    setCopied(false);
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

      {/* Division filter banner */}
      {currentDivisionId && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Showing members for:</span>
          <span className="font-semibold text-primary">{activeDivision?.divisionName ?? 'Selected Division'}</span>
          <span className="ml-auto text-xs text-muted-foreground">Switch division in the header to change</span>
        </div>
      )}

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {roleCounts.map(({ role, count }) => (
          <Card key={role} className="p-4 stat-tile card-hover cursor-default">
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
                  {(currentDivisionId ? divMembersQuery : allMembersQuery).isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No members found.</td></tr>
                  ) : members.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/60">
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
                          {m.role?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={cn('text-xs capitalize', statusColors[m.status] ?? 'bg-gray-100 text-gray-700')}>{m.status}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(m.joined_at)}</td>
                      <td className="p-4 text-muted-foreground">{m.last_login_at ? formatDate(m.last_login_at) : 'Never'}</td>
                      <td className="p-4">
                        {!m.is_owner && (
                          <ActionMenu
                            member={m}
                            onStatusChange={(id, status) => updateStatus.mutate({ userId: id, status })}
                            onRemove={(id) => removeMember.mutate(id)}
                            onResetPassword={(mem) => setResetPwMember(mem)}
                            onViewProfile={(mem) => dialog.alert({
                              title: `${mem.first_name} ${mem.last_name}`,
                              message: `Email: ${mem.email}\nRole: ${mem.role.replace(/_/g, ' ')}\nStatus: ${mem.status}${mem.last_login_at ? `\nLast login: ${new Date(mem.last_login_at).toLocaleDateString()}` : ''}`,
                              variant: 'info',
                            })}
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
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/60">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{inv.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={cn('text-xs', roleColors[inv.role] ?? 'bg-gray-100 text-gray-700')}>
                          {inv.role?.replace(/_/g, ' ')}
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleResendInvite(inv.email, inv.role, inv.id)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Resend & get new link"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => cancelInvite.mutate(inv.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Cancel invite"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Add Member Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseInvite}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">

              {/* Success: invite link generated */}
              {inviteSent && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mx-auto">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-lg font-semibold">Invite Created</h2>
                    <p className="text-sm text-muted-foreground">Share this link with <strong>{inviteSent.email}</strong> via any channel.</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-mono break-all flex-1 text-muted-foreground">{inviteSent.link}</span>
                    </div>
                    <button
                      onClick={() => copyLink(inviteSent.link)}
                      className="w-full flex items-center justify-center gap-2 rounded-md border bg-background hover:bg-muted py-2 text-sm font-medium transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">The member opens this link, sets their name & password, and gets instant access. Link expires in 7 days.</p>
                  <Button onClick={handleCloseInvite} className="w-full">Done</Button>
                </div>
              )}

              {/* Success: direct account created */}
              {directDone && (
                <div className="text-center space-y-4 py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold">Account Created</h2>
                  <p className="text-sm text-muted-foreground">
                    <strong>{directDone.name}</strong> ({directDone.email}) can now log in with the password you set.
                  </p>
                  <Button onClick={handleCloseInvite} className="w-full">Done</Button>
                </div>
              )}

              {/* Form */}
              {!inviteSent && !directDone && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Add Team Member</h2>
                    <button onClick={handleCloseInvite} className="p-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mode tabs */}
                  <div className="flex rounded-lg border p-1 gap-1 bg-muted/30">
                    <button
                      onClick={() => setInviteMode('link')}
                      className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors', inviteMode === 'link' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                    >
                      <Link2 className="h-3.5 w-3.5" /> Send Invite Link
                    </button>
                    <button
                      onClick={() => setInviteMode('direct')}
                      className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors', inviteMode === 'direct' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Create Directly
                    </button>
                  </div>

                  {/* ── Invite Link mode ── */}
                  {inviteMode === 'link' && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-blue-800 dark:text-blue-300">
                        Generates a shareable link. Member clicks it, sets their name & password, and joins instantly — no email delivery needed.
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email Address *</label>
                        <Input type="email" placeholder="colleague@company.com" value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
                          autoFocus />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Role</label>
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="member">Project Team Member</option>
                          <option value="team_lead">Team Lead</option>
                          <option value="project_manager">Project Lead</option>
                          <option value="vertical_head">Vertical Head</option>
                          <option value="hod">Head of Department (HoD)</option>
                          <option value="division_admin">Division Admin</option>
                          <option value="org_admin">System Admin</option>
                          <option value="executive">Leadership</option>
                          <option value="viewer">Others</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={handleCloseInvite}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteMember.isPending}>
                          {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
                          Generate Link
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Create Directly mode ── */}
                  {inviteMode === 'direct' && (
                    <form onSubmit={handleCreateDirect} className="space-y-3">
                      <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                        Creates the account immediately with a password you set. The member logs in directly — no link or email needed.
                      </div>
                      {directError && (
                        <p className="text-sm text-destructive">{directError}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">First Name *</label>
                          <Input value={directForm.firstName} onChange={(e) => setDirectForm((p) => ({ ...p, firstName: e.target.value }))} required autoFocus />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Last Name *</label>
                          <Input value={directForm.lastName} onChange={(e) => setDirectForm((p) => ({ ...p, lastName: e.target.value }))} required />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email Address *</label>
                        <Input type="email" placeholder="member@company.com" value={directForm.email}
                          onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Temporary Password *</label>
                        <Input type="password" placeholder="Min 6 characters" value={directForm.password}
                          onChange={(e) => setDirectForm((p) => ({ ...p, password: e.target.value }))} required />
                        <p className="text-xs text-muted-foreground">Share this password with the member. They can change it after logging in.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Role</label>
                        <select value={directForm.role} onChange={(e) => setDirectForm((p) => ({ ...p, role: e.target.value }))}
                          className="w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="member">Project Team Member</option>
                          <option value="team_lead">Team Lead</option>
                          <option value="project_manager">Project Lead</option>
                          <option value="vertical_head">Vertical Head</option>
                          <option value="hod">Head of Department (HoD)</option>
                          <option value="division_admin">Division Admin</option>
                          <option value="org_admin">System Admin</option>
                          <option value="executive">Leadership</option>
                          <option value="viewer">Others</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={handleCloseInvite}>Cancel</Button>
                        <Button type="submit" disabled={createDirect.isPending}>
                          {createDirect.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                          Create Account
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {resetPwMember && (
        <ResetPasswordDialog member={resetPwMember} onClose={() => setResetPwMember(null)} />
      )}
    </div>
  );
}
