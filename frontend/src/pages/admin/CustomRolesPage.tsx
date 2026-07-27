import { useState } from 'react';
import { useDialog } from '@/components/ui/AppDialog';
import {
  useCustomRoles, useAvailablePermissions, useCreateCustomRole, useUpdateCustomRole,
  useDeleteCustomRole, useSystemRoleMatrix, useUpdateSystemRolePermissions,
  useOrgMembers, useUpdateMemberRole,
} from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronRight,
  Users, KeyRound, Lock, Unlock, Crown, Briefcase, Eye, UserCheck,
  CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────

const SYSTEM_ROLES = [
  { key: 'org_admin',       label: 'System Admin',       icon: Crown,     color: 'text-red-600',    bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    description: 'Full access to all features' },
  { key: 'project_manager', label: 'Project Lead',       icon: Briefcase, color: 'text-blue-600',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700',   description: 'Manage projects, sprints & team' },
  { key: 'member',          label: 'Project Team Member',icon: UserCheck, color: 'text-green-600',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700', description: 'Work on tasks & log time' },
  { key: 'viewer',          label: 'Others',             icon: Eye,       color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700',description: 'Read-only dashboards & reports' },
];

function getRoleStyle(role: string) {
  return SYSTEM_ROLES.find((r) => r.key === role) || SYSTEM_ROLES[2];
}

// ─── Tab 1: Permissions Matrix ───────────────────────────

function PermissionsMatrix() {
  const { data: matrix, isLoading } = useSystemRoleMatrix();
  const updateMatrix = useUpdateSystemRolePermissions();
  const [selectedRole, setSelectedRole] = useState<string>('org_admin');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const categories: { key: string; label: string; permissions: string[] }[] = matrix?.categories || [];
  const roles: string[] = matrix?.roles || [];
  const permsMap: Record<string, string[]> = matrix?.permissions || {};

  const activeRole = selectedRole || roles[0];
  const rs = getRoleStyle(activeRole);
  const RoleIcon = rs.icon;

  const currentPerms: string[] = editingRole === activeRole ? editPerms : (permsMap[activeRole] || []);
  const allPermsCount = categories.reduce((s, c) => s + c.permissions.length, 0);

  const startEdit = () => {
    setEditingRole(activeRole);
    setEditPerms([...(permsMap[activeRole] || [])]);
  };

  const saveEdit = async () => {
    await updateMatrix.mutateAsync({ role: editingRole!, permissions: editPerms });
    setEditingRole(null);
  };

  const cancelEdit = () => setEditingRole(null);

  const togglePerm = (perm: string) =>
    setEditPerms((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);

  const toggleCategoryAll = (cat: { permissions: string[] }) => {
    const all = cat.permissions.every((p) => editPerms.includes(p));
    setEditPerms((prev) =>
      all ? prev.filter((p) => !cat.permissions.includes(p))
          : [...new Set([...prev, ...cat.permissions])]
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">System Role Permissions</h2>
          <p className="text-sm text-muted-foreground">Select a role on the left to view and edit its permissions on the right</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Granted</span>
          <span className="flex items-center gap-1"><X className="h-3.5 w-3.5 text-muted-foreground/40" /> Denied</span>
        </div>
      </div>

      {/* ── Split panel: Roles LEFT │ Permissions RIGHT ── */}
      <div className="flex rounded-xl border overflow-hidden" style={{ minHeight: 480 }}>

        {/* ── LEFT: Role selector list ── */}
        <div className="w-56 flex-shrink-0 border-r bg-muted/20 flex flex-col">
          <div className="px-4 py-2.5 border-b bg-muted/40">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Roles</p>
          </div>
          {roles.map((role) => {
            const s = getRoleStyle(role);
            const Icon = s.icon;
            const isSelected = activeRole === role;
            const grantedCount = (permsMap[role] || []).length;
            return (
              <button
                key={role}
                onClick={() => { setSelectedRole(role); setEditingRole(null); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-all duration-150 group',
                  isSelected
                    ? 'bg-card border-l-[3px] border-l-primary shadow-sm'
                    : 'hover:bg-muted/50 border-l-[3px] border-l-transparent'
                )}
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all', s.bg, isSelected && 'shadow-sm')}>
                  <Icon className={cn('h-4 w-4', s.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {grantedCount}/{allPermsCount} permissions
                  </p>
                </div>
                {isSelected && <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* ── RIGHT: Permissions for selected role ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          {/* Role header bar */}
          <div className={cn('flex items-center justify-between px-5 py-3 border-b', rs.bg)}>
            <div className="flex items-center gap-3">
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', rs.bg, 'border border-white/60')}>
                <RoleIcon className={cn('h-5 w-5', rs.color)} />
              </div>
              <div>
                <p className={cn('text-sm font-bold', rs.color)}>{rs.label}</p>
                <p className="text-[11px] text-muted-foreground">{rs.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', rs.badge)}>
                {currentPerms.length} / {allPermsCount} granted
              </span>
              {editingRole !== activeRole ? (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={startEdit}>
                  <Edit2 className="h-3 w-3" /> Edit Permissions
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={updateMatrix.isPending}>
                    {updateMatrix.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Permission categories + items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {categories.map((cat) => {
              const granted = cat.permissions.filter((p) => currentPerms.includes(p));
              const allGranted = granted.length === cat.permissions.length;
              const isEditing = editingRole === activeRole;

              return (
                <div key={cat.key} className="rounded-lg border overflow-hidden">
                  {/* Category header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{cat.label}</span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        granted.length === 0 ? 'bg-muted text-muted-foreground'
                          : allGranted ? cn(rs.badge)
                          : 'bg-amber-100 text-amber-700'
                      )}>
                        {granted.length}/{cat.permissions.length}
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => toggleCategoryAll(cat)}
                        className={cn('text-[10px] font-medium px-2 py-0.5 rounded border transition-colors',
                          allGranted
                            ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                            : 'hover:bg-accent border-transparent text-muted-foreground'
                        )}
                      >
                        {allGranted ? 'Remove all' : 'Grant all'}
                      </button>
                    )}
                  </div>

                  {/* Permission pills grid — side by side */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-card">
                    {cat.permissions.map((perm) => {
                      const has = currentPerms.includes(perm);
                      const isEditing = editingRole === activeRole;
                      return (
                        <div
                          key={perm}
                          onClick={isEditing ? () => togglePerm(perm) : undefined}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-3 py-2 border transition-all duration-150',
                            isEditing && 'cursor-pointer',
                            has
                              ? cn('border-primary/20 bg-primary/5', isEditing && 'hover:bg-primary/10')
                              : cn('border-muted bg-muted/20', isEditing && 'hover:bg-muted/40 hover:border-muted-foreground/20')
                          )}
                        >
                          {/* Checkbox / indicator */}
                          <div className={cn(
                            'h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-all',
                            has
                              ? isEditing ? 'bg-primary border-2 border-primary' : cn('rounded-full', rs.bg)
                              : 'border-2 border-muted-foreground/25 bg-background'
                          )}>
                            {has && <Check className={cn('h-3 w-3', isEditing ? 'text-white' : rs.color)} />}
                          </div>
                          {/* Permission label */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[11px] font-mono leading-tight truncate', has ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                              {perm.split(':')[1]}
                            </p>
                            <p className="text-[9px] text-muted-foreground/60 font-sans">{perm.split(':')[0]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Custom Roles ─────────────────────────────────

function CustomRolesTab() {
  const dialog = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6', permissions: [] as string[] });

  const { data: rolesData, isLoading } = useCustomRoles();
  const { data: permissions } = useAvailablePermissions();
  const createRole = useCreateCustomRole();
  const updateRole = useUpdateCustomRole();
  const deleteRole = useDeleteCustomRole();

  const PERM_CATEGORIES = [
    { key: 'project', label: 'Projects', filter: (p: any) => p.id.startsWith('project:') },
    { key: 'task', label: 'Tasks', filter: (p: any) => p.id.startsWith('task:') },
    { key: 'workflow', label: 'Workflows', filter: (p: any) => p.id.startsWith('workflow:') },
    { key: 'approval', label: 'Approvals', filter: (p: any) => p.id.startsWith('approval:') },
    { key: 'division', label: 'Divisions', filter: (p: any) => p.id.startsWith('division:') },
    { key: 'admin', label: 'Administration', filter: (p: any) => p.id.startsWith('admin:') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await updateRole.mutateAsync({ roleId: editingId, ...formData });
      else await createRole.mutateAsync(formData);
      setFormData({ name: '', description: '', color: '#3B82F6', permissions: [] });
      setShowForm(false);
      setEditingId(null);
    } catch {}
  };

  const togglePerm = (id: string) => setFormData((p) => ({
    ...p, permissions: p.permissions.includes(id) ? p.permissions.filter((x) => x !== id) : [...p.permissions, id],
  }));

  const toggleCatAll = (cat: typeof PERM_CATEGORIES[0]) => {
    const catPerms = (permissions || []).filter(cat.filter).map((p: { id: string }) => p.id);
    const allSelected = catPerms.every((id: string) => formData.permissions.includes(id));
    setFormData((p) => ({
      ...p,
      permissions: allSelected
        ? p.permissions.filter((x) => !catPerms.includes(x))
        : [...new Set([...p.permissions, ...catPerms])],
    }));
  };

  const toggleExpandCat = (k: string) => setExpandedCats((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  const roles = rolesData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custom Roles</h2>
          <p className="text-sm text-muted-foreground">Create roles with granular permission sets beyond the 4 system roles</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', color: '#3B82F6', permissions: [] }); }}>
          <Plus className="h-4 w-4 mr-2" /> New Role
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editingId ? 'Edit Role' : 'Create Custom Role'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Role name (e.g. QA Engineer)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium whitespace-nowrap">Badge color</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="h-9 w-16 rounded cursor-pointer border" />
                  <div className="h-6 px-3 rounded-full text-xs font-medium flex items-center text-white" style={{ backgroundColor: formData.color }}>
                    {formData.name || 'Preview'}
                  </div>
                </div>
              </div>
              <textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm resize-none bg-background" rows={2} />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Permissions <span className="text-muted-foreground">({formData.permissions.length} selected)</span></label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData((p) => ({ ...p, permissions: [] }))}>Clear all</Button>
                </div>
                <div className="border rounded-lg overflow-hidden divide-y">
                  {PERM_CATEGORIES.map((cat) => {
                    const catPerms = (permissions || []).filter(cat.filter);
                    const selectedCount = catPerms.filter((p: any) => formData.permissions.includes(p.id)).length;
                    const allSelected = selectedCount === catPerms.length && catPerms.length > 0;
                    return (
                      <div key={cat.key}>
                        <div className="flex items-center gap-2 bg-muted/30 px-3 py-2">
                          <button type="button" onClick={() => toggleExpandCat(cat.key)} className="flex items-center gap-1.5 flex-1 text-left">
                            {expandedCats.has(cat.key) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <span className="text-sm font-medium">{cat.label}</span>
                            <span className="text-xs text-muted-foreground">{selectedCount}/{catPerms.length}</span>
                          </button>
                          <button type="button" onClick={() => toggleCatAll(cat)} className={cn('text-xs px-2 py-0.5 rounded border transition-colors', allSelected ? 'bg-primary/10 text-primary border-primary/30' : 'hover:bg-accent border-transparent')}>
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        {expandedCats.has(cat.key) && (
                          <div className="grid grid-cols-2 gap-1 p-3 bg-background">
                            {catPerms.map((perm: any) => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-muted/50">
                                <div onClick={() => togglePerm(perm.id)} className={cn('h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer', formData.permissions.includes(perm.id) ? 'bg-primary border-primary' : 'border-muted-foreground/40')}>
                                  {formData.permissions.includes(perm.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                </div>
                                <span className="text-xs">{perm.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createRole.isPending || updateRole.isPending}>
                  {(createRole.isPending || updateRole.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? 'Update Role' : 'Create Role'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role: any) => (
          <Card key={role.id} className="overflow-hidden">
            <div className="h-1.5 w-full" style={{ backgroundColor: role.color }} />
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: role.color }}>
                    {role.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{role.name}</h3>
                      {role.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                    </div>
                    {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
                  </div>
                </div>
                {!role.is_system && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                      setEditingId(role.id);
                      setFormData({ name: role.name, description: role.description || '', color: role.color || '#3B82F6', permissions: role.permissions || [] });
                      setShowForm(true);
                    }}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={async () => { if (await dialog.danger({ title: 'Delete Role', message: 'Delete this role? Members with this role will lose their custom permissions.', confirmLabel: 'Delete' })) deleteRole.mutate(role.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {role.permissions?.slice(0, 6).map((p: string) => (
                  <span key={p} className="text-[10px] rounded-full border px-2 py-0.5 font-mono">{p}</span>
                ))}
                {role.permissions?.length > 6 && <span className="text-[10px] text-muted-foreground px-1">+{role.permissions.length - 6} more</span>}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                <Users className="h-3.5 w-3.5" />
                <span>{role.member_count || 0} members assigned</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {roles.length === 0 && !showForm && (
          <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg">
            <KeyRound className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No custom roles yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Assign Roles ─────────────────────────────────

function AssignRolesTab() {
  const { data: members, isLoading } = useOrgMembers();
  const updateRole = useUpdateMemberRole();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = (members || []).filter((m: any) => {
    const name = `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleRoleChange = async (userId: string, role: string) => {
    setSaving(userId);
    try { await updateRole.mutateAsync({ userId, role }); }
    finally { setSaving(null); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Assign Roles to Members</h2>
          <p className="text-sm text-muted-foreground">Control what each team member can see and do</p>
        </div>
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SYSTEM_ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className={cn('rounded-lg p-3 border', r.bg)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4', r.color)} />
                <span className={cn('text-xs font-semibold', r.color)}>{r.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{r.description}</p>
            </div>
          );
        })}
      </div>

      {/* Members table */}
      <Card>
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{search ? 'No members match your search' : 'No members in this organization'}</p>
            </div>
          ) : filtered.map((member: any) => {
            const rs = getRoleStyle(member.role);
            const Icon = rs.icon;
            return (
              <div key={member.userId} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(member.firstName || member.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.firstName || ''} {member.lastName || ''}
                    {!member.firstName && <span className="text-muted-foreground">(No name)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', rs.badge)}>
                    <Icon className="h-3 w-3" />{rs.label}
                  </span>
                  {saving === member.userId ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      className="text-xs border rounded-md px-2 py-1.5 bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {SYSTEM_ROLES.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        Role changes take effect on next login or page refresh for the affected user.
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

const TABS = [
  { key: 'matrix', label: 'Permissions Matrix', icon: Shield },
  { key: 'custom', label: 'Custom Roles', icon: KeyRound },
  { key: 'assign', label: 'Assign Roles', icon: Users },
];

export function CustomRolesPage() {
  const [activeTab, setActiveTab] = useState('matrix');

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto animate-fade-in-up stagger-children">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Roles & Permissions
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage who can do what — configure system role permissions, create custom roles, and assign roles to team members.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'matrix' && <PermissionsMatrix />}
      {activeTab === 'custom' && <CustomRolesTab />}
      {activeTab === 'assign' && <AssignRolesTab />}
    </div>
  );
}
