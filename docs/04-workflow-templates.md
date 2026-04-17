# Workflow Templates Guide

This document describes the predefined workflow templates available in the Project Management Tool for simple company project management.

## Overview

Workflows define the stages that tasks go through from creation to completion. The system provides 6 pre-built templates optimized for different project management styles.

## Available Templates

### 1. Simple Kanban (Recommended for Small Teams)
**Best for:** Small teams, simple projects, continuous delivery

**Stages:**
- **Backlog** (Initial) - Tasks waiting to be started
- **To Do** - Tasks ready to be worked on
- **In Progress** - Tasks currently being worked on
- **Done** (Final) - Completed tasks

**Flow:** Backlog → To Do → In Progress → Done (can move back from Done to In Progress)

**Use Case:** Perfect for small companies with simple project needs. Easy to understand and implement.

---

### 2. Kanban with Review
**Best for:** Quality-focused teams, code review requirements

**Stages:**
- **Backlog** (Initial) - Tasks waiting to be started
- **To Do** - Tasks ready to be worked on
- **In Progress** - Tasks currently being worked on
- **In Review** - Tasks awaiting review/approval
- **Done** (Final) - Completed and approved tasks

**Flow:** Backlog → To Do → In Progress → In Review → Done (can move back from Review to In Progress)

**Use Case:** Teams that require quality checks, code reviews, or approval processes before marking tasks complete.

---

### 3. Scrum
**Best for:** Teams using Scrum methodology, sprint-based development

**Stages:**
- **Product Backlog** (Initial) - All potential work items
- **Sprint Backlog** - Items selected for current sprint
- **In Progress** - Items being worked on in sprint
- **Testing** - Items in QA/testing phase
- **Done** (Final) - Sprint-completed items

**Flow:** Product Backlog → Sprint Backlog → In Progress → Testing → Done (can move back from Done to In Progress)

**Use Case:** Teams following Scrum framework with sprint planning and sprint reviews.

---

### 4. Waterfall
**Best for:** Sequential projects, phase-based development

**Stages:**
- **Requirements** (Initial) - Gathering and defining requirements
- **Design** - Creating design specifications
- **Development** - Building the solution
- **Testing** - Quality assurance and testing
- **Deployment** - Releasing to production
- **Complete** (Final) - Project completion

**Flow:** Requirements → Design → Development → Testing → Deployment → Complete

**Use Case:** Projects with strict sequential phases, government/regulated projects, or large infrastructure projects.

---

### 5. Bug Tracking
**Best for:** Bug and issue tracking, support teams

**Stages:**
- **New** (Initial) - Newly reported bugs
- **Assigned** - Bug assigned to a developer
- **In Progress** - Developer working on the fix
- **Fixed** - Fix implemented, awaiting verification
- **Verified** (Final) - Fix verified and working
- **Closed** (Final) - Bug closed/resolved

**Flow:** New → Assigned → In Progress → Fixed → Verified → Closed (can skip to Closed if invalid)

**Use Case:** Dedicated bug tracking, issue management, support ticket systems.

---

### 6. Marketing Campaign
**Best for:** Marketing teams, campaign management

**Stages:**
- **Idea** (Initial) - Campaign concept/brainstorm
- **Planning** - Strategy and planning phase
- **Creation** - Creating campaign materials
- **Review** - Internal review and approval
- **Approved** - Campaign approved for launch
- **Live** (Final) - Campaign is live/active

**Flow:** Idea → Planning → Creation → Review → Approved → Live (can move back from Review to Creation)

**Use Case:** Marketing teams managing campaigns, content creation, promotional activities.

---

## How to Use Workflow Templates

### Creating a New Workflow

1. Go to **Admin → Workflow Configuration**
2. Click **"New Workflow"** button
3. Select a template from the available options
4. Click **"Use Template"** to proceed
5. Customize the workflow name and description if needed
6. Click **"Create Workflow"** to save

### Customizing a Template

After selecting a template, you can:
- Change the workflow name
- Add or remove statuses
- Modify status colors
- Mark statuses as initial or final
- Reorder statuses

### Setting Default Workflow

1. Go to **Admin → Workflow Configuration**
2. Select the workflow you want as default
3. Click **"Set Default"** button
4. New projects will use this workflow by default

---

## Workflow Concepts

### Status Types

- **Initial Status**: The starting point for new tasks (usually "Backlog" or "New")
- **Final Status**: Indicates task completion (usually "Done" or "Closed")
- **Intermediate Status**: Stages between initial and final

### Status Transitions

Transitions define which statuses a task can move to from its current status. For example:
- From "To Do" → can move to "In Progress"
- From "In Progress" → can move to "In Review" or back to "To Do"

### Status Colors

Each status has a color for visual identification:
- **Gray** (#6B7280) - Backlog/Initial
- **Blue** (#3B82F6) - Planning/To Do
- **Amber** (#F59E0B) - In Progress
- **Purple** (#8B5CF6) - Review/Testing
- **Green** (#10B981) - Done/Complete
- **Red** (#EF4444) - Issues/Bugs

---

## Best Practices

### For Small Companies

1. **Start Simple**: Use "Simple Kanban" template for initial setup
2. **Iterate**: Add complexity only when needed
3. **Team Alignment**: Ensure all team members understand the workflow
4. **Regular Review**: Review workflow effectiveness monthly

### Workflow Design Tips

1. **Keep it Simple**: 4-6 stages is usually optimal
2. **Clear Names**: Use clear, descriptive status names
3. **Logical Flow**: Ensure transitions make sense
4. **Avoid Bottlenecks**: Don't create too many approval stages
5. **Flexibility**: Allow tasks to move back when needed

### Common Mistakes to Avoid

1. ❌ Too many stages (causes confusion)
2. ❌ Unclear status names
3. ❌ No way to move tasks backward
4. ❌ Unused statuses in workflow
5. ❌ Not communicating workflow to team

---

## Workflow Recommendations by Company Type

### Software Development Company
**Recommended:** Kanban with Review or Scrum

### Marketing Agency
**Recommended:** Marketing Campaign or Kanban with Review

### Support/Service Company
**Recommended:** Bug Tracking or Simple Kanban

### Consulting Firm
**Recommended:** Waterfall or Kanban with Review

### Product Company
**Recommended:** Scrum or Kanban with Review

---

## Modifying Workflows

### Adding a New Status

1. Open workflow in edit mode
2. Click **"Add Status"** button
3. Enter status name and select color
4. Mark as initial/final if needed
5. Save changes

### Removing a Status

1. Open workflow in edit mode
2. Click the trash icon next to the status
3. Confirm removal
4. Save changes

### Changing Status Order

1. Open workflow in edit mode
2. Drag statuses to reorder (using grip handle)
3. Save changes

---

## API Reference

### Get All Workflows
```
GET /v1/workflows
```

### Create Workflow
```
POST /v1/workflows
Body: {
  name: string,
  description?: string,
  statuses: WorkflowStatus[],
  transitions?: Transition[]
}
```

### Update Workflow
```
PATCH /v1/workflows/{workflowId}
Body: {
  name?: string,
  description?: string,
  statuses?: WorkflowStatus[],
  transitions?: Transition[],
  is_default?: boolean
}
```

### Delete Workflow
```
DELETE /v1/workflows/{workflowId}
```

---

## Troubleshooting

### Tasks stuck in a status
- Check if there are valid transitions from that status
- Verify the user has permission to move tasks
- Check workflow configuration

### Can't delete workflow
- Default workflows cannot be deleted
- Set another workflow as default first
- Then delete the workflow

### Workflow not appearing in projects
- Ensure workflow is created in the correct organization
- Refresh the page
- Check if workflow is marked as active

---

## Support

For issues or questions about workflows:
1. Check this documentation
2. Review workflow configuration in Admin panel
3. Contact your system administrator
4. Submit a support ticket

