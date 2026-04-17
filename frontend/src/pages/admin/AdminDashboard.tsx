import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Shield,
  Users,
  Clock,
  Download,
  ChevronRight,
  Settings,
  BarChart3,
  Lock,
  FileText,
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: 'Divisions',
      description: 'Manage organizational divisions and hierarchy',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
      path: '/admin/divisions',
      stats: 'Hierarchical structure',
    },
    {
      title: 'Custom Roles',
      description: 'Create roles with granular permissions',
      icon: Shield,
      color: 'bg-purple-100 text-purple-600',
      path: '/admin/roles',
      stats: '30+ permissions',
    },
    {
      title: 'External Users',
      description: 'Manage guest and external user access',
      icon: Users,
      color: 'bg-green-100 text-green-600',
      path: '/admin/external-users',
      stats: 'Resource-level access',
    },
    {
      title: 'Versioning',
      description: 'Point-in-time history and snapshots',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      path: '/admin/versioning',
      stats: 'Full audit trail',
    },
    {
      title: 'Exports',
      description: 'Export data in multiple formats',
      icon: Download,
      color: 'bg-red-100 text-red-600',
      path: '/admin/exports',
      stats: 'CSV, JSON, XLSX, PDF',
    },
    {
      title: 'Approvals',
      description: 'Multi-step approval workflows',
      icon: FileText,
      color: 'bg-indigo-100 text-indigo-600',
      path: '/admin/approvals',
      stats: 'Conditional routing',
    },
    {
      title: 'Forms',
      description: 'Public and internal forms',
      icon: FileText,
      color: 'bg-cyan-100 text-cyan-600',
      path: '/admin/forms',
      stats: 'Auto-task creation',
    },
    {
      title: 'Organization Settings',
      description: 'Configure organization settings',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600',
      path: '/admin/settings',
      stats: 'Plan & billing',
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Manage organization settings, users, and advanced features
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Divisions</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Custom Roles</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">External Users</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <Users className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Exports</p>
              <p className="text-2xl font-bold">—</p>
            </div>
            <Download className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Advanced Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.path}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(feature.path)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs font-medium text-muted-foreground">{feature.stats}</span>
                  <Button size="sm" variant="ghost">
                    Manage
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Division Hierarchy */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Division Hierarchy</h3>
              <p className="text-sm text-muted-foreground">
                Organize your company into hierarchical divisions with per-division settings
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ Parent-child division relationships</li>
            <li>✓ Per-division budgets and head count</li>
            <li>✓ Division managers and members</li>
            <li>✓ Project assignment to divisions</li>
          </ul>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/divisions')}
            className="w-full"
          >
            Manage Divisions
          </Button>
        </Card>

        {/* Custom Roles */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Custom Roles & Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Build custom roles with granular permission scoping
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ 30+ available permissions</li>
            <li>✓ Scope: org, project, division</li>
            <li>✓ Prevent system role modification</li>
            <li>✓ Dynamic permission checking</li>
          </ul>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/roles')}
            className="w-full"
          >
            Manage Roles
          </Button>
        </Card>

        {/* External Users */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">External/Guest Users</h3>
              <p className="text-sm text-muted-foreground">
                Manage guest and external user access with resource-level control
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ Invite external users</li>
            <li>✓ Resource-level access grants</li>
            <li>✓ Expiration dates</li>
            <li>✓ Access tracking</li>
          </ul>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/external-users')}
            className="w-full"
          >
            Manage External Users
          </Button>
        </Card>

        {/* Versioning */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Versioning & History</h3>
              <p className="text-sm text-muted-foreground">
                Point-in-time history and snapshots for all entities
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ Automatic version tracking</li>
            <li>✓ Change diffs and audit trail</li>
            <li>✓ Restore to any version</li>
            <li>✓ Point-in-time snapshots</li>
          </ul>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/versioning')}
            className="w-full"
          >
            View Versioning
          </Button>
        </Card>

        {/* Exports */}
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Export Framework</h3>
              <p className="text-sm text-muted-foreground">
                Export data in multiple formats with advanced filtering
              </p>
            </div>
            <Download className="h-8 w-8 text-red-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ CSV, JSON, XLSX, PDF formats</li>
            <li>✓ Custom column selection</li>
            <li>✓ Advanced filtering</li>
            <li>✓ Export history tracking</li>
          </ul>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/exports')}
            className="w-full"
          >
            Manage Exports
          </Button>
        </Card>

        {/* Security */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Security & Compliance</h3>
              <p className="text-sm text-muted-foreground">
                Audit logs, access control, and compliance features
              </p>
            </div>
            <Lock className="h-8 w-8 text-indigo-600 opacity-50" />
          </div>
          <ul className="text-sm space-y-1 mb-4">
            <li>✓ Full audit trail</li>
            <li>✓ Access control lists</li>
            <li>✓ Permission scoping</li>
            <li>✓ Compliance reporting</li>
          </ul>
          <Button variant="outline" className="w-full">
            View Audit Logs
          </Button>
        </Card>
      </div>

      {/* Documentation */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Documentation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Getting Started</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Setting up divisions</li>
              <li>• Creating custom roles</li>
              <li>• Inviting external users</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Advanced Topics</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Permission scoping</li>
              <li>• Version management</li>
              <li>• Export automation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
