const ApiError = require('../utils/ApiError');
const taskService = require('./taskService');

const sprintsStore = new Map();

// Seed sprints for the default engineering project
const defaultSprints = [
  {
    id: 'sprint_1',
    orgId: 'dev-org-id',
    projectId: 'proj_default_1',
    name: 'Sprint 1',
    goal: 'Set up project foundation and core architecture',
    status: 'completed',
    startDate: '2026-01-05',
    endDate: '2026-01-18',
    taskIds: [],
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-18'),
  },
  {
    id: 'sprint_2',
    orgId: 'dev-org-id',
    projectId: 'proj_default_1',
    name: 'Sprint 2',
    goal: 'Implement user authentication and dashboard',
    status: 'active',
    startDate: '2026-01-19',
    endDate: '2026-02-01',
    taskIds: [],
    createdAt: new Date('2026-01-19'),
    updatedAt: new Date('2026-01-19'),
  },
  {
    id: 'sprint_3',
    orgId: 'dev-org-id',
    projectId: 'proj_default_1',
    name: 'Sprint 3',
    goal: 'Task management and reporting features',
    status: 'planned',
    startDate: '2026-02-02',
    endDate: '2026-02-15',
    taskIds: [],
    createdAt: new Date('2026-02-02'),
    updatedAt: new Date('2026-02-02'),
  },
];

defaultSprints.forEach((s) => sprintsStore.set(s.id, s));

function formatSprint(sprint, tasks = []) {
  return {
    id: sprint.id,
    project_id: sprint.projectId,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    start_date: sprint.startDate,
    end_date: sprint.endDate,
    tasks,
    task_count: tasks.length,
    completed_tasks: tasks.filter((t) => t.status_name?.toLowerCase() === 'done').length,
    created_at: sprint.createdAt,
    updated_at: sprint.updatedAt,
  };
}

class SprintService {
  async listByProject(orgId, projectId) {
    const sprints = [...sprintsStore.values()]
      .filter((s) => s.orgId === orgId && s.projectId === projectId && !s.deletedAt)
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

    const result = [];
    for (const sprint of sprints) {
      const tasks = await this._resolveSprintTasks(orgId, sprint);
      result.push(formatSprint(sprint, tasks));
    }
    return result;
  }

  async getBacklog(orgId, projectId) {
    // Tasks in this project not assigned to any sprint
    const allSprints = [...sprintsStore.values()]
      .filter((s) => s.orgId === orgId && s.projectId === projectId && !s.deletedAt);
    const sprintedTaskIds = new Set(allSprints.flatMap((s) => s.taskIds));

    const allTasks = taskService.listAllForProject(orgId, projectId);
    return allTasks.filter((t) => !sprintedTaskIds.has(t.id));
  }

  async create(orgId, projectId, userId, data) {
    const id = `sprint_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const sprint = {
      id,
      orgId,
      projectId,
      name: data.name,
      goal: data.goal || '',
      status: 'planned',
      startDate: data.start_date || null,
      endDate: data.end_date || null,
      taskIds: [],
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    sprintsStore.set(id, sprint);
    return formatSprint(sprint, []);
  }

  async update(orgId, sprintId, data) {
    const sprint = sprintsStore.get(sprintId);
    if (!sprint || sprint.orgId !== orgId || sprint.deletedAt) throw ApiError.notFound('Sprint not found');

    if (data.name !== undefined) sprint.name = data.name;
    if (data.goal !== undefined) sprint.goal = data.goal;
    if (data.start_date !== undefined) sprint.startDate = data.start_date;
    if (data.end_date !== undefined) sprint.endDate = data.end_date;
    if (data.status !== undefined) {
      // If starting: mark any current active sprint as completed first
      if (data.status === 'active') {
        [...sprintsStore.values()]
          .filter((s) => s.orgId === orgId && s.projectId === sprint.projectId && s.status === 'active' && s.id !== sprintId)
          .forEach((s) => { s.status = 'completed'; s.updatedAt = new Date(); sprintsStore.set(s.id, s); });
      }
      sprint.status = data.status;
    }
    sprint.updatedAt = new Date();
    sprintsStore.set(sprintId, sprint);

    const tasks = await this._resolveSprintTasks(orgId, sprint);
    return formatSprint(sprint, tasks);
  }

  async delete(orgId, sprintId) {
    const sprint = sprintsStore.get(sprintId);
    if (!sprint || sprint.orgId !== orgId || sprint.deletedAt) throw ApiError.notFound('Sprint not found');
    sprint.deletedAt = new Date();
    sprintsStore.set(sprintId, sprint);
    return { success: true };
  }

  async addTask(orgId, sprintId, taskId) {
    const sprint = sprintsStore.get(sprintId);
    if (!sprint || sprint.orgId !== orgId || sprint.deletedAt) throw ApiError.notFound('Sprint not found');

    // Remove from any other sprint in this project first
    [...sprintsStore.values()]
      .filter((s) => s.orgId === orgId && s.projectId === sprint.projectId && s.id !== sprintId && !s.deletedAt)
      .forEach((s) => {
        const idx = s.taskIds.indexOf(taskId);
        if (idx !== -1) { s.taskIds.splice(idx, 1); s.updatedAt = new Date(); sprintsStore.set(s.id, s); }
      });

    if (!sprint.taskIds.includes(taskId)) {
      sprint.taskIds.push(taskId);
      sprint.updatedAt = new Date();
      sprintsStore.set(sprintId, sprint);
    }

    const tasks = await this._resolveSprintTasks(orgId, sprint);
    return formatSprint(sprint, tasks);
  }

  async removeTask(orgId, sprintId, taskId) {
    const sprint = sprintsStore.get(sprintId);
    if (!sprint || sprint.orgId !== orgId || sprint.deletedAt) throw ApiError.notFound('Sprint not found');

    sprint.taskIds = sprint.taskIds.filter((id) => id !== taskId);
    sprint.updatedAt = new Date();
    sprintsStore.set(sprintId, sprint);

    const tasks = await this._resolveSprintTasks(orgId, sprint);
    return formatSprint(sprint, tasks);
  }

  async _resolveSprintTasks(orgId, sprint) {
    const tasks = [];
    for (const taskId of sprint.taskIds) {
      try {
        const task = await taskService.getById(orgId, taskId);
        tasks.push(taskService.formatTask(task));
      } catch {
        // Task deleted — skip it
      }
    }
    return tasks;
  }
}

module.exports = new SprintService();
