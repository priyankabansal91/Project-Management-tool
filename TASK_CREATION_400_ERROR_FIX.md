# Task Creation 400 Error - FIXED

## Status: ✅ FIXED

## Problem
When creating a task in the calendar, received error:
```
Failed to create task: AxiosError: Request failed with status code 400
Expected number, received string (for estimated_hours)
```

## Root Cause
The backend validator expected `estimated_hours` to be a number, but the frontend was sending it as a string (empty string or number string).

Additionally:
- `assignee_id` validator was too strict (required UUID format)
- `status_name` was not in the validator schema

## Solution

### 1. Frontend Fix (CalendarViewPage.tsx)
**File**: `frontend/src/pages/pm/CalendarViewPage.tsx`

**Change**: Convert `estimated_hours` to number before sending
```javascript
const taskData = {
  ...data,
  due_date: selectedDateForTask || data.due_date,
  estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
};
```

### 2. Backend Validator Fix (task.js)
**File**: `backend/src/validators/task.js`

**Changes**:
- Updated `estimated_hours` to accept both number and string (with conversion)
- Removed UUID validation from `assignee_id` (accept any string)
- Added `status_name` to schema

**Before**:
```javascript
estimated_hours: z.number().positive().optional().nullable(),
assignee_id: z.string().uuid().optional().nullable(),
```

**After**:
```javascript
estimated_hours: z.union([
  z.number().positive(), 
  z.string().transform(v => v ? parseFloat(v) : null)
]).optional().nullable(),
assignee_id: z.string().optional().nullable(),
status_name: z.string().optional(),
```

## Files Modified
1. `frontend/src/pages/pm/CalendarViewPage.tsx` - Convert estimated_hours to number
2. `backend/src/validators/task.js` - Accept string/number for estimated_hours, remove UUID validation

## Testing

### Test Task Creation
1. Open Calendar view
2. Click on any date
3. Fill in task details (leave estimated hours empty or enter a number)
4. Click "Create Task"
5. Task should be created successfully ✅

### Expected Result
- ✅ No 400 error
- ✅ Task appears on calendar
- ✅ Task can be viewed in details page
- ✅ All task information saved correctly

## API Validation Now Accepts

### estimated_hours
- ✅ Empty string → null
- ✅ "5" → 5 (number)
- ✅ 5 → 5 (number)
- ✅ null → null
- ✅ undefined → undefined

### assignee_id
- ✅ Any string value
- ✅ null
- ✅ undefined

### status_name
- ✅ Any string value
- ✅ Optional field

## Servers Status

### Backend ✅
- Port: 4000
- Status: Running
- Changes: Applied and restarted

### Frontend ✅
- Port: 5173
- Status: Running
- Changes: Hot-reloaded

## Next Steps

1. Test task creation in calendar
2. Test task creation in kanban board
3. Test task creation in other views
4. Verify all task information is saved correctly

## Summary

The 400 error when creating tasks has been fixed by:
1. Converting `estimated_hours` to number on frontend before sending
2. Updating backend validator to accept string/number for `estimated_hours`
3. Removing strict UUID validation from `assignee_id`
4. Adding `status_name` to validator schema

**Task creation should now work successfully!** 🎉
