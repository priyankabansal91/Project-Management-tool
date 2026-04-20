# Quick Test Guide - Task Creation & Details

## Prerequisites
- Backend running on port 4000
- Frontend running on port 5173
- Both servers started with `npm run dev`

## Test 1: Create Task in Calendar

### Steps
1. Open browser to `http://localhost:5173`
2. Navigate to **Calendar** (left sidebar)
3. Click on any date in the calendar
4. Fill in task details:
   - **Title**: "Test Task"
   - **Description**: "This is a test task"
   - **Priority**: Select any priority
   - **Due Date**: Should be pre-filled with clicked date
5. Click **"Create Task"** button

### Expected Result
- ✅ Modal closes
- ✅ Task appears on calendar on the selected date
- ✅ No error messages
- ✅ Task shows in the "Tasks due in [Month]" list below

---

## Test 2: View Task Details

### Steps
1. From Calendar view, click on the task you just created
2. Should navigate to task detail page

### Expected Result
- ✅ Page loads with task information
- ✅ Shows task title, description, priority
- ✅ Shows status, assignee, due date
- ✅ Shows time tracking info
- ✅ Shows tags (if any)
- ✅ Shows created/updated timestamps
- ✅ No error messages

---

## Test 3: Create Project

### Steps
1. Navigate to **Projects** (left sidebar)
2. Click **"New Project"** button
3. Fill in project details:
   - **Name**: "Test Project"
   - **Key**: "TEST"
   - **Description**: "A test project"
4. Click **"Create Project"** button

### Expected Result
- ✅ Modal closes
- ✅ New project appears in project list
- ✅ Project shows with correct name and key
- ✅ No error messages

---

## Test 4: Create Task in New Project

### Steps
1. From Projects page, click on the new project
2. Navigate to **Calendar** view
3. Click on a date to create task
4. Fill in task details
5. Click **"Create Task"**

### Expected Result
- ✅ Task created successfully
- ✅ Task appears on calendar
- ✅ Can click task to view details
- ✅ Task details page loads correctly

---

## Test 5: View My Tasks

### Steps
1. Navigate to **My Tasks** (left sidebar)
2. Should see list of tasks

### Expected Result
- ✅ Page loads
- ✅ Shows tasks you created
- ✅ Can click on task to view details
- ✅ Task detail page loads correctly

---

## Test 6: Kanban Board

### Steps
1. Navigate to **Kanban Board** (left sidebar)
2. Should see tasks organized by status

### Expected Result
- ✅ Page loads
- ✅ Shows tasks in columns by status
- ✅ Can click on task to view details
- ✅ Task detail page loads correctly

---

## Troubleshooting

### Task Creation Fails
- Check backend logs for errors
- Verify backend is running on port 4000
- Check browser console for error messages

### Task Details Page Shows Error
- Verify task was created successfully
- Check backend logs for errors
- Verify taskId in URL is correct
- Try refreshing the page

### No Tasks Appear
- Create a new task using the modal
- Check browser console for errors
- Verify backend is responding to API calls

### Backend Not Running
```bash
cd backend
npm run dev
```

### Frontend Not Running
```bash
cd frontend
npm run dev
```

---

## API Endpoints to Test

### Create Task
```bash
curl -X POST http://localhost:4000/v1/tasks/project/proj_default_1 \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Test description",
    "priority": "high",
    "status_id": "status_1",
    "due_date": "2026-02-20"
  }'
```

### Get Task Details
```bash
curl http://localhost:4000/v1/tasks/{taskId} \
  -H "Authorization: Bearer dev-token"
```

### List Projects
```bash
curl http://localhost:4000/v1/projects \
  -H "Authorization: Bearer dev-token"
```

### List Workflows
```bash
curl http://localhost:4000/v1/workflows \
  -H "Authorization: Bearer dev-token"
```

---

## Success Indicators

✅ All tests pass
✅ No error messages in browser console
✅ No error messages in backend logs
✅ Tasks appear in calendar
✅ Task details load correctly
✅ Projects can be created
✅ Tasks can be created in projects

---

## Next Steps

If all tests pass:
1. Try creating multiple tasks
2. Try different priorities and statuses
3. Try different views (Calendar, Kanban, My Tasks)
4. Try editing tasks
5. Try deleting tasks

If any test fails:
1. Check the error message
2. Review the troubleshooting section
3. Check backend logs
4. Check browser console
5. Restart servers if needed
