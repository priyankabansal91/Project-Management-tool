import { useState } from 'react';
import { useCustomRoles, useAvailablePermissions, useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader, Plus, Edit2, Trash2, Check } from 'lucide-react';

export function CustomRolesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as string[],
  });

  const { data: rolesData, isLoading: rolesLoading } = useCustomRoles();
  const { data: permissions, isLoading: permissionsLoading } = useAvailablePermissions();
  const createRole = useCreateCustomRole();
  const updateRole = useUpdateCustomRole();
  const deleteRole = useDeleteCustomRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateRole.mutateAsync({ roleId: editingId, ...formData });
      } else {
        await createRole.mutateAsync(formData);
      }
      setFormData({ name: '', description: '', color: '#3B82F6', permissions: [] });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole.mutateAsync(roleId);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const roles = rolesData?.items || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Custom Roles</h1>
          <p className="text-muted-foreground">Create and manage custom roles with granular permissions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Role' : 'Create Role'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Color:</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded cursor-pointer"
                />
              </div>
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
            />

            {/* Permissions */}
            <div>
              <label className="text-sm font-medium mb-3 block">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 border rounded-md bg-white">
                {permissions?.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{perm.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', color: '#3B82F6', permissions: [] });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: role.color }}
                />
                <div>
                  <h3 className="font-semibold">{role.name}</h3>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(role.id);
                    setFormData({
                      name: role.name,
                      description: role.description || '',
                      color: role.color || '#3B82F6',
                      permissions: role.permissions || [],
                    });
                    setShowForm(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {!role.is_system && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {role.permissions?.length || 0} permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions?.slice(0, 5).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-xs">
                    {perm}
                  </Badge>
                ))}
                {role.permissions?.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Members */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                👥 {role.member_count || 0} members assigned
              </p>
            </div>
          </Card>
        ))}
      </div>

      {roles.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No custom roles created yet</p>
          <p className="text-sm text-muted-foreground mt-2">Create your first role to get started</p>
        </Card>
      )}
    </div>
  );
}
