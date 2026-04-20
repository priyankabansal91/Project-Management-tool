# Executive Features - Quick Start Guide

**Date:** April 20, 2026  
**Status:** ✅ READY TO USE

---

## What's New

Three powerful executive dashboards have been added to the application:

1. **OKR & Goals Tracking** - Strategic objective management
2. **Financial Dashboard** - Budget and ROI tracking
3. **Resource & Capacity Dashboard** - Team utilization planning

---

## Quick Access

### Backend Services
```javascript
// OKR Service
const OKRService = require('./services/okrService');

// Financial Service
const FinancialService = require('./services/financialService');

// Resource Service
const ResourceService = require('./services/resourceService');
```

### API Base URLs
```
/v1/okrs              - OKR endpoints
/v1/financial         - Financial endpoints
/v1/resources         - Resource endpoints
```

### Frontend Routes
```
/executive/okrs       - OKR Dashboard
/executive/financial  - Financial Dashboard
/executive/resources  - Resource Dashboard
```

---

## OKR Dashboard - 5 Minute Setup

### 1. Create an OKR
```bash
curl -X POST http://localhost:4000/v1/okrs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase Revenue by 50%",
    "level": "company",
    "ownerId": "ceo_id",
    "ownerName": "CEO",
    "quarter": "Q2",
    "year": 2026,
    "keyResults": [
      {
        "title": "Close 10 enterprise deals",
        "targetValue": 10,
        "unit": "count"
      }
    ]
  }'
```

### 2. Add Key Result
```bash
curl -X POST http://localhost:4000/v1/okrs/okr_1/key-results \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase ARR to $5M",
    "targetValue": 5000000,
    "unit": "revenue"
  }'
```

### 3. Link Project
```bash
curl -X POST http://localhost:4000/v1/okrs/okr_1/link-project \
  -H "Content-Type: application/json" \
  -d '{"projectId": "proj_1"}'
```

### 4. Update Progress
```bash
curl -X PATCH http://localhost:4000/v1/okrs/okr_1/key-results/kr_1 \
  -H "Content-Type: application/json" \
  -d '{"currentValue": 7}'
```

### 5. View Dashboard
Open browser: `http://localhost:5173/executive/okrs`

---

## Financial Dashboard - 5 Minute Setup

### 1. Create Budget
```bash
curl -X POST http://localhost:4000/v1/financial/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "project",
    "entityId": "proj_1",
    "entityName": "Project Alpha",
    "totalBudget": 500000,
    "quarter": "Q2",
    "year": 2026
  }'
```

### 2. Record Cost
```bash
curl -X POST http://localhost:4000/v1/financial/budgets/budget_1/costs \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "type": "fte"
  }'
```

### 3. Record Revenue
```bash
curl -X POST http://localhost:4000/v1/financial/budgets/budget_1/revenue \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

### 4. Get ROI
```bash
curl http://localhost:4000/v1/financial/roi/budget_1
```

### 5. View Dashboard
Open browser: `http://localhost:5173/executive/financial`

---

## Resource Dashboard - 5 Minute Setup

### 1. Create Resource
```bash
curl -X POST http://localhost:4000/v1/resources \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "name": "Alice Johnson",
    "email": "alice@company.com",
    "type": "fte",
    "department": "Engineering",
    "skills": ["React", "TypeScript"],
    "capacity": 100,
    "costPerHour": 150
  }'
```

### 2. Add Skill
```bash
curl -X POST http://localhost:4000/v1/resources/res_1/skills \
  -H "Content-Type: application/json" \
  -d '{"skill": "Node.js"}'
```

### 3. Allocate to Project
```bash
curl -X POST http://localhost:4000/v1/resources/res_1/allocate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1",
    "projectName": "Project Alpha",
    "allocatedCapacity": 60,
    "startDate": "2026-04-01",
    "endDate": "2026-06-30",
    "role": "Senior Engineer"
  }'
```

### 4. Get Capacity Heatmap
```bash
curl http://localhost:4000/v1/resources/capacity/heatmap
```

### 5. View Dashboard
Open browser: `http://localhost:5173/executive/resources`

---

## Common Tasks

### OKR Tasks
```bash
# List all OKRs
GET /v1/okrs

# Get OKR details
GET /v1/okrs/okr_1

# Update OKR
PATCH /v1/okrs/okr_1

# Delete OKR
DELETE /v1/okrs/okr_1

# Get goal cascade
GET /v1/okrs/okr_1/cascade

# Get alignment view
GET /v1/okrs/alignment/view

# Get quarterly check-in
GET /v1/okrs/quarterly-checkin?quarter=Q2&year=2026

# Get health scores
GET /v1/okrs/health/scores
```

### Financial Tasks
```bash
# List budgets
GET /v1/financial/budgets

# Get budget vs actual
GET /v1/financial/budget-vs-actual

# Get cost breakdown
GET /v1/financial/cost-breakdown

# Get revenue attribution
GET /v1/financial/revenue-attribution

# Get forecast
GET /v1/financial/forecast/budget_1

# Create invoice
POST /v1/financial/invoices

# Get dashboard summary
GET /v1/financial/dashboard
```

### Resource Tasks
```bash
# List resources
GET /v1/resources

# Get capacity heatmap
GET /v1/resources/capacity/heatmap

# Get skill matrix
GET /v1/resources/skills/React

# Get skill gaps
POST /v1/resources/skills/gaps

# Get bench report
GET /v1/resources/bench/report

# Get hiring plan
GET /v1/resources/hiring/plan

# Get PTO calendar
GET /v1/resources/pto/calendar

# Get utilization comparison
GET /v1/resources/utilization/comparison
```

---

## Data Examples

### OKR Example
```javascript
{
  id: "okr_1",
  title: "Increase Revenue by 50%",
  level: "company",
  progress: 65,
  health: "on_track",
  quarter: "Q2",
  keyResults: [
    {
      id: "kr_1",
      title: "Close 10 enterprise deals",
      progress: 70,
      targetValue: 10,
      currentValue: 7
    }
  ],
  linkedProjects: ["proj_1", "proj_2"]
}
```

### Budget Example
```javascript
{
  id: "budget_1",
  entityName: "Project Alpha",
  totalBudget: 500000,
  spent: 325000,
  remaining: 175000,
  revenue: 600000,
  roi: 84.6,
  burnRate: 15000
}
```

### Resource Example
```javascript
{
  id: "res_1",
  name: "Alice Johnson",
  type: "fte",
  department: "Engineering",
  utilization: 95,
  skills: ["React", "TypeScript", "Node.js"],
  available: 5
}
```

---

## Testing Checklist

### OKR Dashboard
- [ ] Create OKR
- [ ] Add key results
- [ ] Link project
- [ ] Update progress
- [ ] View health scores
- [ ] Check alignment

### Financial Dashboard
- [ ] Create budget
- [ ] Record cost
- [ ] Record revenue
- [ ] Calculate ROI
- [ ] Get forecast
- [ ] Create invoice

### Resource Dashboard
- [ ] Create resource
- [ ] Add skill
- [ ] Allocate to project
- [ ] View heatmap
- [ ] Get bench report
- [ ] View hiring plan

---

## Troubleshooting

### OKR Not Showing Progress
- Check key results are added
- Verify currentValue is updated
- Progress auto-calculates from key results

### Budget Not Showing ROI
- Ensure revenue is recorded
- Check costs are recorded
- ROI = (revenue - spent) / spent * 100

### Resource Not Showing in Heatmap
- Verify resource is created
- Check allocation is recorded
- Utilization = (allocated / capacity) * 100

---

## Performance Tips

1. **Batch Operations** - Create multiple items in one request
2. **Filter Results** - Use query parameters to filter
3. **Cache Data** - Frontend caches API responses
4. **Pagination** - Use limit/offset for large datasets

---

## Next Steps

1. **Explore Dashboards** - Open each dashboard in browser
2. **Create Sample Data** - Use curl commands above
3. **Test Workflows** - Follow testing checklist
4. **Read Full Guide** - See EXECUTIVE_FEATURES_GUIDE.md

---

## Support

For detailed information, see:
- `DOCUMENTATION/EXECUTIVE_FEATURES_GUIDE.md` - Complete feature guide
- `DOCUMENTATION/EXECUTIVE_FEATURES_IMPLEMENTATION_SUMMARY.md` - Implementation details
- Backend services for code examples
- Frontend components for UI patterns

---

**Ready to use!** 🚀

Start with the OKR Dashboard and explore the features!
