const projectService = require('./projectService');
const logger = require('../utils/logger');

// Static dev task data for search (mirrors KanbanBoardPage fallback data)
const DEV_TASKS = [
  { id: 'task_kb_1', title: 'Design new navigation component',    taskKey: 'APIV3-1', status: 'In Progress', priority: 'high',     projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_2', title: 'Implement authentication flow',      taskKey: 'APIV3-2', status: 'To Do',       priority: 'critical', projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_3', title: 'Customer dashboard wireframes',      taskKey: 'APIV3-3', status: 'Done',        priority: 'medium',   projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_4', title: 'Set up CI/CD pipeline',              taskKey: 'APIV3-4', status: 'In Review',   priority: 'high',     projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_5', title: 'Add OAuth provider integration',     taskKey: 'APIV3-5', status: 'In Progress', priority: 'high',     projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_6', title: 'Database schema migration',          taskKey: 'APIV3-6', status: 'Backlog',     priority: 'medium',   projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_kb_7', title: 'GraphQL schema design',              taskKey: 'APIV3-7', status: 'To Do',       priority: 'high',     projectId: 'proj_eng_2',   projectKey: 'APIV3', projectName: 'API Platform v3' },
  { id: 'task_s1',   title: 'Lead generation campaign setup',     taskKey: 'SALES-1', status: 'In Progress', priority: 'high',     projectId: 'proj_sales_1', projectKey: 'SALES', projectName: 'Q2 Lead Campaign' },
  { id: 'task_s2',   title: 'CRM integration with Salesforce',    taskKey: 'SALES-2', status: 'To Do',       priority: 'medium',   projectId: 'proj_sales_1', projectKey: 'SALES', projectName: 'Q2 Lead Campaign' },
  { id: 'task_h1',   title: 'Annual performance review templates', taskKey: 'HR26-1',  status: 'Done',        priority: 'high',     projectId: 'proj_hr_1',    projectKey: 'HR26',  projectName: 'Annual Review 2026' },
  { id: 'task_h2',   title: 'Employee onboarding documentation',  taskKey: 'HR26-2',  status: 'In Progress', priority: 'medium',   projectId: 'proj_hr_1',    projectKey: 'HR26',  projectName: 'Annual Review 2026' },
];

function search(orgId, { q = '', types = 'tasks,projects', page = 1, pageSize = 20 } = {}) {
  const query = String(q).toLowerCase().trim();
  if (!query || query.length < 2) return { results: [], total: 0, took: 0 };

  const typeList = String(types).split(',').map(s => s.trim());
  const t0 = Date.now();
  const results = [];

  // Search projects
  if (typeList.includes('projects')) {
    try {
      const { items: projects = [] } = projectService.list(orgId, { page: 1, page_size: 200 });
      for (const p of projects) {
        const haystack = `${p.name} ${p.key} ${p.description || ''}`.toLowerCase();
        if (haystack.includes(query)) {
          results.push({
            id: p.id, type: 'project',
            title: p.name,
            subtitle: `${p.key} · ${p.status}`,
            url: `/projects/${p.id}/board`,
            meta: { color: p.color },
          });
        }
      }
    } catch (err) { logger.debug('Project search contrib failed', err); }
  }

  // Search tasks (dev static + any created at runtime)
  if (typeList.includes('tasks')) {
    for (const t of DEV_TASKS) {
      const haystack = `${t.title} ${t.taskKey} ${t.projectKey}`.toLowerCase();
      if (haystack.includes(query)) {
        results.push({
          id: t.id, type: 'task',
          title: t.title,
          subtitle: `${t.taskKey} · ${t.status}`,
          url: `/tasks/${t.id}`,
          meta: { priority: t.priority, status: t.status, projectKey: t.projectKey },
        });
      }
    }
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  return { results: results.slice(start, start + pageSize), total, took: Date.now() - t0 };
}

module.exports = { search };
