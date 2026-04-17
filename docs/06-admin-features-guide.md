# Admin Features Guide

Complete guide to accessing and managing advanced admin features in the SaaS Project Management Tool.

## Table of Contents

1. [Admin Dashboard](#admin-dashboard)
2. [Division Hierarchy](#division-hierarchy)
3. [Custom Roles & Permissions](#custom-roles--permissions)
4. [External/Guest Users](#externalgguest-users)
5. [Versioning & History](#versioning--history)
6. [Export Framework](#export-framework)
7. [Approval Workflows](#approval-workflows)
8. [Forms & Intake](#forms--intake)

---

## Admin Dashboard

**Access**: Organization Admin Profile → Admin Dashboard

The Admin Dashboard is your central hub for managing all advanced features.

### Features Available:
- Quick stats overview
- Feature cards with descriptions
- Direct navigation to all admin pages
- Feature highlights with key capabilities

### Quick Navigation:
```
Admin Dashboard
├── Divisions
├── Custom Roles
├── External Users
├── Versioning
├── Exports
├── Approvals
├── Forms
└── Organization Settings
```

---

## Division Hierarchy

**Access**: Admin Dashboard → Divisions

Organize your company into hierarchical divisions with per-division settings.

### Creating a Division

1. Click "New Division" button
2. Fill in the form:
   - **Division Name**: e.g., "Engineering", "Sales"
   - **Code**: Unique identifier (e.g., "ENG", "SALES")
   - **Description**: Optional description
   - **Budget**: Optional budget allocation
   - **Head Count**: Optional employee count

3. Click "Create"

### Division Features

- **Hierarchical Structure**: Create parent-child relationships
- **Per-Division Settings**: Budget, head count, manager assignment
- **Member Management**: Add/remove division members
- **Project Assignment**: Link projects to divisions
- **Visual Tree View**: See full organizational structure

### Example Structure

```
Company
├── Engineering
│   ├── Backend Team
│   └── Frontend Team
├── Sales
│   ├── Enterprise Sales
│   └── SMB Sales
└── Operations
    ├── HR
    └── Finance
```

### API Endpoints

```
POST   /v1/divisions                    - Create division
GET    /v1/divisions/hierarchy          - Get hierarchy tree
GET    /v1/divisions                    - List divisions
GET    /v1/divisions/:divisionId        - Get division details
PATCH  /v1/divisions/:divisionId        - Update division
DELETE /v1/divisions/:divisionId        - Delete division
POST   /v1/divisions/:divisionId/members - Add member
DELETE /v1/divisions/:divisionId/members/:userId - Remove member
```

---

## Custom Roles & Permissions

**Access**: Admin Dashboard → Custom Roles

Create custom roles with granular permission scoping.

### Available Permissions (30+)

#### Project Permissions
- `project:create` - Create projects
- `project:read` - View projects
- `project:update` - Edit projects
- `project:delete` - Delete projects
- `project:manage_members` - Manage project members

#### Task Permissions
- `task:create` - Create tasks
- `task:read` - View tasks
- `task:update` - Edit tasks
- `task:delete` - Delete tasks
- `task:assign` - Assign tasks
- `task:comment` - Comment on tasks

#### Workflow Permissions
- `workflow:create` - Create workflows
- `workflow:read` - View workflows
- `workflow:update` - Edit workflows
- `workflow:delete` - Delete workflows

#### Approval Permissions
- `approval:create` - Create approvals
- `approval:approve` - Approve requests
- `approval:reject` - Reject requests

#### Division Permissions
- `division:create` - Create divisions
- `division:read` - View divisions
- `division:update` - Edit divisions
- `division:delete` - Delete divisions
- `division:manage_members` - Manage division members

#### Admin Permissions
- `admin:manage_roles` - Manage custom roles
- `admin:manage_users` - Manage users
- `admin:manage_settings` - Manage organization settings
- `admin:view_audit` - View audit logs

### Creating a Custom Role

1. Click "New Role" button
2. Fill in the form:
   - **Role Name**: e.g., "Project Lead", "Team Member"
   - **Description**: Optional description
   - **Color**: Choose a color for visual identification
   - **Permissions**: Select permissions from the list

3. Click "Create"

### Assigning Roles to Users

1. Open the role details
2. Click "Assign to User"
3. Select user and scope:
   - **Scope**: org (organization-wide), project, or division
   - **Scope ID**: If not org-wide, select specific project/division

4. Click "Assign"

### Permission Scoping

Permissions can be scoped to different levels:

- **Organization Level**: User has permission across entire org
- **Project Level**: User has permission only for specific project
- **Division Level**: User has permission only for specific division

### API Endpoints

```
GET    /v1/roles/permissions                    - Get available permissions
POST   /v1/roles                                - Create custom role
GET    /v1/roles                                - List roles
GET    /v1/roles/:roleId                        - Get role details
PATCH  /v1/roles/:roleId                        - Update role
DELETE /v1/roles/:roleId                        - Delete role
POST   /v1/roles/:roleId/assign                 - Assign role to user
POST   /v1/roles/:roleId/unassign               - Remove role from user
GET    /v1/roles/user/:userId/permissions      - Get user permissions
```

---

## External/Guest Users

**Access**: Admin Dashboard → External Users

Manage guest and external user access with resource-level control.

### Inviting External Users

1. Click "Invite User" button
2. Fill in the form:
   - **Email**: User's email address
   - **First Name**: User's first name
   - **Last Name**: User's last name
   - **Access Level**: viewer, editor, or admin

3. Click "Send Invite"

### Access Levels

- **Viewer**: Read-only access to assigned resources
- **Editor**: Can view and edit assigned resources
- **Admin**: Full access to assigned resources

### Granting Resource Access

1. Open external user details
2. Click "Grant Access"
3. Select:
   - **Resource Type**: project, task, etc.
   - **Resource ID**: Specific resource
   - **Access Level**: viewer, editor, admin

4. Click "Grant"

### Revoking Access

1. Click "Revoke" button on user card
2. Confirm revocation

### Features

- **Expiration Dates**: Set access expiration
- **Resource-Level Control**: Grant access to specific resources
- **Access Tracking**: See when users last accessed
- **Pending Invitations**: Track invitation status

### API Endpoints

```
POST   /v1/external-users                                    - Invite user
GET    /v1/external-users                                    - List users
GET    /v1/external-users/:externalUserId                    - Get user details
PATCH  /v1/external-users/:externalUserId                    - Update user
POST   /v1/external-users/:externalUserId/revoke             - Revoke access
POST   /v1/external-users/:externalUserId/grant-access       - Grant resource access
DELETE /v1/external-users/:externalUserId/access/:resourceType/:resourceId - Revoke resource access
GET    /v1/external-users/:externalUserId/access             - Get user's resource access
```

---

## Versioning & History

**Access**: Admin Dashboard → Versioning

Point-in-time history and snapshots for all entities.

### Features

- **Automatic Version Tracking**: All changes are automatically tracked
- **Change Diffs**: See exactly what changed between versions
- **Restore Capability**: Restore to any previous version
- **Snapshots**: Create point-in-time backups
- **Audit Trail**: Full history of who changed what and when

### Creating Snapshots

1. Click "Create Snapshot" button
2. Fill in the form:
   - **Snapshot Name**: e.g., "Pre-Launch Backup"
   - **Description**: Optional description
   - **Type**: Full Backup or Incremental

3. Click "Create Snapshot"

### Viewing Version History

1. Navigate to any entity (project, task, etc.)
2. Click "View History"
3. See all versions with:
   - Version number
   - Who made the change
   - When the change was made
   - What changed (diff)

### Restoring a Version

1. Open version history
2. Select the version to restore
3. Click "Restore"
4. Confirm restoration

### Comparing Versions

1. Open version history
2. Select two versions
3. Click "Compare"
4. See side-by-side comparison of changes

### API Endpoints

```
GET    /v1/versioning/:entityType/:entityId/history                    - Get version history
GET    /v1/versioning/:entityType/:entityId/version/:version           - Get specific version
POST   /v1/versioning/:entityType/:entityId/restore/:version           - Restore version
GET    /v1/versioning/:entityType/:entityId/compare/:version1/:version2 - Compare versions
POST   /v1/versioning/snapshots                                        - Create snapshot
GET    /v1/versioning/snapshots                                        - List snapshots
GET    /v1/versioning/snapshots/:snapshotId                            - Get snapshot
DELETE /v1/versioning/snapshots/:snapshotId                            - Delete snapshot
```

---

## Export Framework

**Access**: Admin Dashboard → Exports

Export data in multiple formats with advanced filtering.

### Supported Formats

- **CSV**: Comma-separated values (Excel compatible)
- **JSON**: JavaScript Object Notation (API friendly)
- **XLSX**: Excel spreadsheet format
- **PDF**: Portable Document Format

### Exporting Tasks

1. Click "Create New Export"
2. Select:
   - **Export Type**: Tasks
   - **Format**: CSV, JSON, XLSX, or PDF
   - **Filters** (optional): Status, priority, assignee, etc.
   - **Columns** (optional): Select specific columns

3. Click "Start Export"

### Exporting Projects

1. Click "Create New Export"
2. Select:
   - **Export Type**: Projects
   - **Format**: CSV, JSON, XLSX, or PDF
   - **Filters** (optional): Status, visibility, etc.
   - **Columns** (optional): Select specific columns

3. Click "Start Export"

### Export Status

- **Pending**: Export queued for processing
- **Processing**: Export is being generated
- **Completed**: Export ready for download
- **Failed**: Export failed (see error message)

### Features

- **Custom Columns**: Select which columns to include
- **Advanced Filtering**: Filter by status, priority, assignee, etc.
- **Auto-Expiration**: Exports expire after 7 days
- **Export History**: Track all exports
- **Download**: Download completed exports

### API Endpoints

```
POST   /v1/exports/tasks                - Export tasks
POST   /v1/exports/projects             - Export projects
POST   /v1/exports                      - Create custom export
GET    /v1/exports                      - List exports
GET    /v1/exports/:exportId            - Get export details
DELETE /v1/exports/:exportId            - Delete export
```

---

## Approval Workflows

**Access**: Admin Dashboard → Approvals

Multi-step approval workflows with conditional routing.

### Built-in Workflows

1. **Standard Approval**: PM → Director → Finance
2. **Cost-Based Approval**: Conditional based on cost
3. **Quick Approval**: PM only
4. **Executive Approval**: PM → Director → Executive
5. **Parallel Approval**: PM and Finance simultaneously

### Creating Approval Requests

1. Navigate to Approval Inbox
2. Click "Create Approval"
3. Select workflow type
4. Fill in details
5. Submit for approval

### Approving Requests

1. Open Approval Inbox
2. View pending approvals for your role
3. Click "Approve" or "Reject"
4. Add optional reason
5. Submit

### API Endpoints

```
POST   /v1/approvals                    - Create approval request
GET    /v1/approvals/pending            - Get pending approvals
GET    /v1/approvals                    - List all approvals
GET    /v1/approvals/:approvalId        - Get approval details
POST   /v1/approvals/:approvalId/approve - Approve step
POST   /v1/approvals/:approvalId/reject  - Reject step
```

---

## Forms & Intake

**Access**: Admin Dashboard → Forms

Public and internal forms for task creation.

### Available Form Templates

1. **Bug Report**: Report bugs with severity and reproduction steps
2. **Feature Request**: Request new features with use cases
3. **IT Ticket**: Request IT support
4. **Change Request**: Request production changes
5. **Expense Request**: Request expense approval

### Submitting Forms

1. Navigate to Forms page
2. Select a form template
3. Fill in the form fields
4. Submit

### Form Features

- **Conditional Fields**: Fields appear based on other field values
- **Auto-Task Creation**: Forms automatically create tasks
- **Approval Integration**: Forms can trigger approval workflows
- **Auto-Assignment**: Tasks assigned to specific queues/projects
- **File Uploads**: Attach files to form submissions

### API Endpoints

```
GET    /v1/forms/templates              - Get all form templates
GET    /v1/forms/templates/:formId      - Get specific form template
POST   /v1/forms/submit/:formId         - Submit form
GET    /v1/forms/submissions            - Get user's form submissions
```

---

## Best Practices

### Division Management
- Create divisions that match your organizational structure
- Assign managers to each division
- Set realistic budgets and head counts
- Link projects to appropriate divisions

### Role Management
- Create roles that match job functions
- Use descriptive role names
- Document permission requirements
- Review roles quarterly

### External User Management
- Set expiration dates for temporary access
- Grant minimum necessary permissions
- Review access regularly
- Revoke access when no longer needed

### Versioning
- Create snapshots before major changes
- Document snapshot purposes
- Review version history regularly
- Archive old snapshots

### Exports
- Schedule regular exports for backup
- Use appropriate formats for different use cases
- Document export purposes
- Clean up old exports

---

## Troubleshooting

### Can't see admin features?
- Verify you have org_admin role
- Check organization plan includes feature
- Refresh browser

### Permission denied errors?
- Check user has required role
- Verify role has necessary permissions
- Check permission scope (org vs project vs division)

### Export failed?
- Check data size (may be too large)
- Verify format is supported
- Check filters are valid
- Try again or contact support

### Version restore failed?
- Verify version exists
- Check you have permission to restore
- Ensure no conflicts with current data
- Try comparing versions first

---

## Support

For additional help:
- Check documentation
- Contact organization admin
- Submit support ticket
- Email support@example.com
