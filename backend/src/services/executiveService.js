const divisionConfigService = require('./divisionConfigService');
const projectService = require('./projectService');

// Per-division realistic metrics (augments real project/config data)
const DIVISION_AUGMENTED_STATS = {
  div_engineering: {
    totalTasks: 45, completedTasks: 30, overdueTasks: 5,
    velocityTrend: [28, 32, 35, 31, 38, 42, 40, 44, 37, 43, 46, 48],
    sprintVelocity: 42, avgCycleTimeDays: 4.2, bugRate: 8,
    highlights: ['Scrum sprints active', 'AI-assisted task gen', '2 active projects'],
  },
  div_sales: {
    totalTasks: 18, completedTasks: 8, overdueTasks: 4,
    velocityTrend: [12, 14, 11, 15, 13, 16, 14, 12, 15, 17, 15, 18],
    sprintVelocity: 16, avgCycleTimeDays: 6.5, bugRate: 2,
    highlights: ['Marketing workflow', 'Campaign tracking', '1 active project'],
  },
  div_hr: {
    totalTasks: 12, completedTasks: 3, overdueTasks: 0,
    velocityTrend: [5, 6, 8, 7, 9, 8, 10, 9, 8, 10, 11, 10],
    sprintVelocity: 10, avgCycleTimeDays: 8.1, bugRate: 1,
    highlights: ['Kanban board active', 'Resource dashboard', '1 active project'],
  },
};

function computeRAGHealth(completionPct, overdueTasks, totalTasks) {
  if (totalTasks === 0) return 'green';
  const overdueRatio = overdueTasks / totalTasks;
  if (completionPct >= 60 && overdueRatio < 0.15) return 'green';
  if (completionPct >= 30 || overdueRatio < 0.30) return 'amber';
  return 'red';
}

class ExecutiveService {
  async getDivisionScorecards(orgId) {
    const divisions = divisionConfigService.getAllDivisions();

    const scorecards = await Promise.all(
      divisions.map(async (div) => {
        const config   = divisionConfigService.getDivisionConfig(div.id);
        const members  = divisionConfigService.getDivisionMembers(div.id);
        const projectData = await projectService.list(
          orgId,
          { page_size: 100 },
          { isScopeAll: false, userDivisions: [div.id] }
        );
        const projects = projectData.items || [];

        const aug = DIVISION_AUGMENTED_STATS[div.id] || {
          totalTasks: 0, completedTasks: 0, overdueTasks: 0,
          velocityTrend: Array(12).fill(0), sprintVelocity: 0, avgCycleTimeDays: 0, bugRate: 0,
          highlights: [],
        };

        const completionPct = aug.totalTasks > 0
          ? Math.round((aug.completedTasks / aug.totalTasks) * 100)
          : 0;

        const enabledFeatures = Object.entries(config?.features || {})
          .filter(([, v]) => v)
          .map(([k]) => k);

        return {
          divisionId:         div.id,
          name:               div.name,
          color:              div.color,
          description:        div.description,
          budget:             div.budget,
          memberCount:        members.length,
          projectCount:       projects.length,
          activeProjects:     projects.filter((p) => p.status === 'active').length,
          totalTasks:         aug.totalTasks,
          completedTasks:     aug.completedTasks,
          overdueTasks:       aug.overdueTasks,
          completionPct,
          health:             computeRAGHealth(completionPct, aug.overdueTasks, aug.totalTasks),
          workflowTemplate:   config?.workflowTemplate || null,
          enabledFeatureCount: enabledFeatures.length,
          enabledFeatures,
          velocityTrend:      aug.velocityTrend,
          sprintVelocity:     aug.sprintVelocity,
          avgCycleTimeDays:   aug.avgCycleTimeDays,
          bugRate:            aug.bugRate,
          highlights:         aug.highlights,
        };
      })
    );

    return scorecards;
  }

  async getRollup(orgId) {
    const scorecards = await this.getDivisionScorecards(orgId);

    // Org-wide summary
    const orgSummary = {
      divisionsCount:   scorecards.length,
      totalProjects:    scorecards.reduce((s, d) => s + d.projectCount, 0),
      activeProjects:   scorecards.reduce((s, d) => s + d.activeProjects, 0),
      totalMembers:     scorecards.reduce((s, d) => s + d.memberCount, 0),
      totalBudget:      scorecards.reduce((s, d) => s + (d.budget || 0), 0),
      totalTasks:       scorecards.reduce((s, d) => s + d.totalTasks, 0),
      completedTasks:   scorecards.reduce((s, d) => s + d.completedTasks, 0),
      overdueTasks:     scorecards.reduce((s, d) => s + d.overdueTasks, 0),
      greenDivisions:   scorecards.filter((d) => d.health === 'green').length,
      amberDivisions:   scorecards.filter((d) => d.health === 'amber').length,
      redDivisions:     scorecards.filter((d) => d.health === 'red').length,
    };
    orgSummary.completionPct = orgSummary.totalTasks > 0
      ? Math.round((orgSummary.completedTasks / orgSummary.totalTasks) * 100)
      : 0;

    // Cross-division weekly velocity comparison (12 weeks)
    const velocityComparison = Array.from({ length: 12 }, (_, i) => {
      const pt = { week: `W${i + 1}` };
      scorecards.forEach((d) => { pt[d.name] = d.velocityTrend[i] || 0; });
      return pt;
    });

    // Budget comparison per division (₹ in Lakhs)
    const budgetComparison = scorecards.map((d) => ({
      division:      d.name,
      color:         d.color,
      allocated:     +(d.budget / 100000).toFixed(1),
      spent:         +(d.budget * ((d.completionPct || 0) / 100) * 1.15 / 100000).toFixed(1),
      completionPct: d.completionPct,
    }));

    // Escalated alerts
    const alerts = [];
    scorecards.forEach((d) => {
      if (d.health === 'red')
        alerts.push({ divisionId: d.divisionId, division: d.name, severity: 'critical', message: `${d.overdueTasks} overdue tasks — completion at ${d.completionPct}%` });
      if (d.health === 'amber')
        alerts.push({ divisionId: d.divisionId, division: d.name, severity: 'warning',  message: `At risk — ${d.completionPct}% complete, ${d.overdueTasks} overdue tasks` });
    });

    return { scorecards, orgSummary, velocityComparison, budgetComparison, alerts };
  }
}

module.exports = new ExecutiveService();
