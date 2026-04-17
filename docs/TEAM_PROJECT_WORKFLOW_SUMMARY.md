# Team Project Management Workflow - Quick Summary

## What is This Workflow?

A complete workflow designed for **collaborative team projects** with:
- ✅ Project Managers (PM)
- ✅ Internal Team Members
- ✅ External Users/Contractors
- ✅ QA Teams
- ✅ Task Assignment & Tracking
- ✅ Time Usage Logging
- ✅ Bug Identification & Resolution
- ✅ Team Communication

---

## The 10 Stages

```
1. BACKLOG (Gray)
   ↓ PM creates tasks
   
2. ASSIGNED (Blue)
   ↓ PM assigns to team member
   
3. IN PROGRESS (Amber)
   ↓ Team member works, logs time
   
4. IN REVIEW (Purple)
   ↓ PM/Lead reviews work
   
5. BUG FOUND (Red)
   ↓ Issues discovered, sent back to dev
   
6. BLOCKED (Pink)
   ↓ Waiting for something, can't proceed
   
7. READY FOR QA (Cyan)
   ↓ Approved, ready for testing
   
8. QA TESTING (Teal)
   ↓ QA team tests thoroughly
   
9. APPROVED (Green)
   ↓ All tests passed, ready to go live
   
10. DONE (Dark Green)
    ✓ Task complete and deployed
```

---

## Who Does What?

### Project Manager (PM)
- Creates tasks in Backlog
- Assigns tasks to team members
- Reviews work before QA
- Manages blockers
- Communicates with external users
- Tracks time and productivity

### Team Member
- Accepts assigned tasks
- Works on tasks and logs time
- Updates status regularly
- Communicates blockers
- Responds to feedback
- Fixes bugs when found

### QA Team
- Tests in "Ready for QA" stage
- Executes test cases
- Reports bugs if found
- Approves if all tests pass

### External User
- Submits requests/tasks
- Provides feedback
- Tests in staging
- Approves deliverables

---

## Key Features

### 1. Task Assignment
- Clear ownership
- Track who's working on what
- Reassign if needed

### 2. Time Tracking
- Log hours spent on each task
- Compare estimated vs. actual
- Identify bottlenecks
- Calculate productivity

### 3. Communication
- Discuss in task comments
- @mention team members
- Share files and links
- Threaded conversations

### 4. Bug Tracking
- Dedicated "Bug Found" stage
- Clear bug documentation
- Can move back to development
- Track bug resolution

### 5. QA Process
- Separate testing stage
- Comprehensive testing
- Test results documented
- Issues tracked

### 6. External User Involvement
- See task progress
- Provide feedback
- Approve deliverables
- Report issues

---

## Example Task Journey

### Simple Task (No Issues)
```
Backlog 
  → Assigned (PM assigns to John)
  → In Progress (John works, logs 4 hours)
  → In Review (PM reviews, approves)
  → Ready for QA (Sent to QA team)
  → QA Testing (QA tests, all pass)
  → Approved (QA approves)
  → Done (Deployed to production)

Timeline: 3-5 days
```

### Task with Bug Found
```
Backlog 
  → Assigned (PM assigns to John)
  → In Progress (John works, logs 4 hours)
  → In Review (PM reviews, approves)
  → Ready for QA (Sent to QA team)
  → QA Testing (QA finds bug)
  → Bug Found (Bug reported)
  → In Progress (John fixes bug, logs 2 hours)
  → In Review (PM reviews fix)
  → Ready for QA (Sent back to QA)
  → QA Testing (QA verifies fix)
  → Approved (QA approves)
  → Done (Deployed to production)

Timeline: 5-7 days
```

### Task with Blocker
```
Backlog 
  → Assigned (PM assigns to John)
  → In Progress (John starts work)
  → Blocked (Waiting for API from external team)
  → In Progress (API ready, John continues)
  → In Review (PM reviews)
  → Ready for QA (Sent to QA)
  → QA Testing (QA tests)
  → Approved (QA approves)
  → Done (Deployed)

Timeline: 4-6 days
```

---

## How to Use

### Creating a Task
1. Go to **Projects → [Project Name]**
2. Click **"New Task"** or use Kanban board
3. Fill in task details
4. Task starts in **Backlog**

### Assigning a Task
1. Open task from Backlog
2. Click **"Assign"**
3. Select team member
4. Task moves to **Assigned**

### Working on a Task
1. Open assigned task
2. Click **"Start Work"** or move to **In Progress**
3. Log time regularly
4. Update status in comments
5. When done, move to **In Review**

### Reviewing Work
1. Open task in **In Review**
2. Review deliverables
3. If approved, move to **Ready for QA**
4. If changes needed, move back to **In Progress**

### QA Testing
1. QA team sees task in **Ready for QA**
2. Move to **QA Testing** to start
3. Execute test cases
4. If bugs found, move to **Bug Found**
5. If all pass, move to **Approved**

### Completing Task
1. Task in **Approved** stage
2. Deploy to production
3. Move to **Done**
4. Task complete!

---

## Best Practices

### For Project Managers
✅ Define requirements clearly before assigning
✅ Set realistic timelines
✅ Monitor progress daily
✅ Unblock team quickly
✅ Communicate with external users regularly

### For Team Members
✅ Update status when moving between stages
✅ Log time regularly (daily)
✅ Communicate blockers immediately
✅ Ask questions in comments
✅ Test your own work before review

### For QA Team
✅ Create comprehensive test cases
✅ Document all issues clearly
✅ Provide reproduction steps
✅ Test edge cases
✅ Verify fixes thoroughly

### For External Users
✅ Provide clear requirements
✅ Review progress regularly
✅ Provide timely feedback
✅ Test in staging environment
✅ Approve when satisfied

---

## Common Issues & Solutions

### Task Stuck in "Blocked"
**Problem:** Task not moving forward
**Solution:** 
- Identify what's blocking
- Communicate with dependent team
- Set clear resolution timeline
- Update task with blocker details

### High Bug Rate
**Problem:** Too many bugs found in QA
**Solution:**
- Improve code review process
- Increase test coverage
- Provide developer training
- Adjust QA testing approach

### Time Tracking Inaccuracy
**Problem:** Team not logging time correctly
**Solution:**
- Remind team to log time daily
- Review time entries weekly
- Adjust estimates based on actuals
- Identify time-consuming tasks

### Slow QA Process
**Problem:** QA taking too long
**Solution:**
- Increase QA resources
- Improve test automation
- Clarify requirements earlier
- Reduce scope of changes

---

## Metrics to Track

- **Cycle Time:** Time from Assigned to Done
- **Lead Time:** Time from Backlog to Done
- **Bug Rate:** Bugs found per task
- **Time Accuracy:** Estimated vs. Actual time
- **Team Velocity:** Tasks completed per week
- **Blocker Frequency:** How often tasks get blocked
- **QA Pass Rate:** Tasks passing QA on first attempt

---

## When to Use This Workflow

✅ **Use This Workflow If:**
- You have a team working on one project
- You need to track task progress
- You need to log time spent
- You have QA/testing requirements
- You work with external users
- You need to handle bugs
- You need team communication

❌ **Don't Use This Workflow If:**
- You have very simple tasks (use Simple Kanban)
- You don't need QA testing
- You don't track time
- You don't have external users

---

## Quick Reference

| Stage | Color | Who Uses | Next Steps |
|-------|-------|----------|-----------|
| Backlog | Gray | PM | Assign |
| Assigned | Blue | Team | Start Work |
| In Progress | Amber | Team | Review |
| In Review | Purple | PM/Lead | QA or Back to Dev |
| Bug Found | Red | QA/Team | Fix |
| Blocked | Pink | Team | Unblock |
| Ready for QA | Cyan | QA | Test |
| QA Testing | Teal | QA | Approve or Bug |
| Approved | Green | PM | Deploy |
| Done | Dark Green | All | Complete |

---

## Support

For detailed information, see: **docs/05-team-project-workflow.md**

For questions:
1. Check the full documentation
2. Ask in task comments
3. Contact your Project Manager
4. Submit a support ticket

---

## Version

**Team Project Management Workflow v1.0**
Created: April 17, 2026
For: Collaborative team projects with PM, team, external users, QA, and communication

