# Mock Services Guide

## Overview

To enable development and testing without a running PostgreSQL database, the following services have been converted to use in-memory storage:

1. **ApprovalService** (`backend/src/services/approvalService.js`)
2. **FormService** (`backend/src/services/formService.js`)
3. **ExternalUserService** (`backend/src/services/externalUserService.js`)

## How It Works

Each service uses JavaScript `Map` objects to store data in memory. This allows:
- Full API functionality without database
- Automatic data reset on server restart
- Perfect for development and testing
- No database setup required

## Services

### 1. ApprovalService

**Storage**: `approvalsStore` (Map) and `approvalRecordsStore` (Map)

**Features**:
- Create approval requests
- List pending approvals
- List all approvals with filtering
- Approve/reject approval steps
- Track approval history

**Endpoints**:
- `POST /v1/approvals` - Create approval
- `GET /v1/approvals` - List all approvals
- `GET /v1/approvals/pending` - List pending approvals
- `GET /v1/approvals/:approvalId` - Get approval details
- `POST /v1/approvals/:approvalId/approve` - Approve step
- `POST /v1/approvals/:approvalId/reject` - Reject step

### 2. FormService

**Storage**: `tasksStore` (Map) and `approvalsStore` (Map)

**Features**:
- Get form templates
- Submit forms and create tasks
- Track form submissions
- Trigger approval workflows on form submission

**Endpoints**:
- `GET /v1/forms` - List form templates
- `GET /v1/forms/:formId` - Get form template
- `POST /v1/forms/:formId/submit` - Submit form
- `GET /v1/forms/submissions` - List form submissions

### 3. ExternalUserService

**Storage**: `externalUsersStore` (Map) and `guestAccessStore` (Map)

**Features**:
- Invite external users
- Manage external user access levels
- Grant/revoke resource access
- Track guest access permissions

**Endpoints**:
- `POST /v1/external-users` - Invite external user
- `GET /v1/external-users` - List external users
- `GET /v1/external-users/:userId` - Get external user
- `PATCH /v1/external-users/:userId` - Update external user
- `DELETE /v1/external-users/:userId` - Revoke access
- `POST /v1/external-users/:userId/access` - Grant resource access
- `DELETE /v1/external-users/:userId/access/:resourceId` - Revoke resource access

## Data Persistence

**Important**: All data is stored in memory and will be lost when the server restarts.

To persist data:
1. Set up PostgreSQL (see `POSTGRES_SETUP_GUIDE.md`)
2. Update services to use Prisma instead of in-memory storage
3. Run database migrations

## Development Workflow

1. Start the backend server: `npm run dev` (in `backend/` directory)
2. Start the frontend server: `npm run dev` (in `frontend/` directory)
3. Access the application at `http://localhost:5173`
4. All API calls will use mock services

## Testing

To test the mock services:

```bash
# Test Approvals
curl -H "Authorization: Bearer dev-token" http://localhost:4000/v1/approvals

# Test Forms
curl -H "Authorization: Bearer dev-token" http://localhost:4000/v1/forms

# Test External Users
curl -H "Authorization: Bearer dev-token" http://localhost:4000/v1/external-users
```

## Transitioning to Database

When you're ready to use a real database:

1. Install PostgreSQL
2. Create a database
3. Update `.env` with database connection string
4. Run Prisma migrations: `npx prisma migrate dev`
5. Update services to use Prisma client instead of in-memory storage
6. Restart the backend server

## Notes

- Development mode (`NODE_ENV=development`) automatically provides a dev user context
- No authentication token is required in development mode
- All mock services validate input and return proper error responses
- Mock services follow the same API contract as database-backed services
