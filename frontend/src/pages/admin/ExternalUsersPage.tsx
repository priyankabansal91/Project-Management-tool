import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import { useExternalUsers, useInviteExternalUser, useUpdateExternalUser, useRevokeExternalUser } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader, Plus, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

export function ExternalUsersPage() {
  const dialog = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    accessLevel: 'viewer',
  });

  const { data: usersData, isLoading } = useExternalUsers();
  const inviteUser = useInviteExternalUser();
  const updateUser = useUpdateExternalUser();
  const revokeUser = useRevokeExternalUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser.mutateAsync(formData);
      setFormData({ email: '', firstName: '', lastName: '', accessLevel: 'viewer' });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!await dialog.danger({ title: 'Revoke Access', message: "Are you sure you want to revoke this user's access?", confirmLabel: 'Revoke' })) return;
    try {
      await revokeUser.mutateAsync(userId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const users = usersData?.items || [];
  const stats = {
    total: usersData?.pagination?.total || 0,
    active: users.filter((u: any) => u.is_active).length,
    pending: users.filter((u: any) => !u.accepted_at).length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">External Users</h1>
          <p className="text-muted-foreground">Manage guest and external user access</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Users</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">Invite External User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <select
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={inviteUser.isPending}>
                Send Invite
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ email: '', firstName: '', lastName: '', accessLevel: 'viewer' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user: any) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.first_name} className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Status and Details */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{user.access_level}</Badge>
                  {user.accepted_at ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      Accepted
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Clock className="h-3 w-3" />
                      Pending
                    </div>
                  )}
                  {user.expires_at && (
                    <div className="text-xs text-muted-foreground">
                      Expires: {new Date(user.expires_at).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>

                {/* Resources */}
                {user.resource_count > 0 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    📁 Access to {user.resource_count} resource(s)
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // TODO: Open resource access dialog
                  }}
                >
                  Resources
                </Button>
                {user.is_active && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevoke(user.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {users.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No external users invited yet</p>
          <p className="text-sm text-muted-foreground mt-2">Invite your first external user to get started</p>
        </Card>
      )}
    </div>
  );
}
