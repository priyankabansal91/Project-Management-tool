/**
 * OKR & Goals Tracking Service
 * Manages Objectives & Key Results with goal cascading and progress tracking
 */

const okrStorage = new Map();
let okrIdCounter = 1;

class OKRService {
  /**
   * Create a new OKR
   */
  static createOKR(data) {
    const id = `okr_${okrIdCounter++}`;
    const okr = {
      id,
      title: data.title,
      description: data.description,
      level: data.level, // 'company', 'division', 'team', 'individual'
      parentId: data.parentId || null,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      quarter: data.quarter, // 'Q1', 'Q2', 'Q3', 'Q4'
      year: data.year,
      keyResults: data.keyResults || [],
      linkedProjects: data.linkedProjects || [],
      linkedTasks: data.linkedTasks || [],
      progress: 0,
      health: 'on_track', // 'on_track', 'behind', 'at_risk'
      status: 'active', // 'active', 'completed', 'paused'
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    okrStorage.set(id, okr);
    return okr;
  }

  /**
   * Get OKR by ID
   */
  static getOKR(id) {
    return okrStorage.get(id) || null;
  }

  /**
   * List all OKRs with optional filters
   */
  static listOKRs(filters = {}) {
    let okrs = Array.from(okrStorage.values());

    if (filters.level) {
      okrs = okrs.filter(o => o.level === filters.level);
    }
    if (filters.quarter) {
      okrs = okrs.filter(o => o.quarter === filters.quarter);
    }
    if (filters.year) {
      okrs = okrs.filter(o => o.year === filters.year);
    }
    if (filters.ownerId) {
      okrs = okrs.filter(o => o.ownerId === filters.ownerId);
    }
    if (filters.status) {
      okrs = okrs.filter(o => o.status === filters.status);
    }

    return okrs;
  }

  /**
   * Update OKR
   */
  static updateOKR(id, data) {
    const okr = okrStorage.get(id);
    if (!okr) return null;

    const updated = {
      ...okr,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    okrStorage.set(id, updated);
    return updated;
  }

  /**
   * Delete OKR
   */
  static deleteOKR(id) {
    return okrStorage.delete(id);
  }

  /**
   * Add key result to OKR
   */
  static addKeyResult(okrId, keyResult) {
    const okr = okrStorage.get(okrId);
    if (!okr) return null;

    const kr = {
      id: `kr_${Date.now()}`,
      title: keyResult.title,
      description: keyResult.description,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue || 0,
      unit: keyResult.unit, // '%', 'count', 'revenue', etc.
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    okr.keyResults.push(kr);
    this.updateOKRProgress(okrId);
    okrStorage.set(okrId, okr);
    return kr;
  }

  /**
   * Update key result progress
   */
  static updateKeyResult(okrId, krId, data) {
    const okr = okrStorage.get(okrId);
    if (!okr) return null;

    const kr = okr.keyResults.find(k => k.id === krId);
    if (!kr) return null;

    kr.currentValue = data.currentValue || kr.currentValue;
    kr.progress = (kr.currentValue / kr.targetValue) * 100;
    kr.status = data.status || kr.status;
    kr.updatedAt = new Date().toISOString();

    this.updateOKRProgress(okrId);
    okrStorage.set(okrId, okr);
    return kr;
  }

  /**
   * Calculate OKR progress from key results
   */
  static updateOKRProgress(okrId) {
    const okr = okrStorage.get(okrId);
    if (!okr || okr.keyResults.length === 0) return;

    const avgProgress = okr.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / okr.keyResults.length;
    okr.progress = Math.round(avgProgress);

    // Determine health based on progress
    if (avgProgress >= 80) {
      okr.health = 'on_track';
    } else if (avgProgress >= 50) {
      okr.health = 'behind';
    } else {
      okr.health = 'at_risk';
    }

    okrStorage.set(okrId, okr);
  }

  /**
   * Link project to OKR
   */
  static linkProject(okrId, projectId) {
    const okr = okrStorage.get(okrId);
    if (!okr) return null;

    if (!okr.linkedProjects.includes(projectId)) {
      okr.linkedProjects.push(projectId);
      okrStorage.set(okrId, okr);
    }
    return okr;
  }

  /**
   * Link task to OKR
   */
  static linkTask(okrId, taskId) {
    const okr = okrStorage.get(okrId);
    if (!okr) return null;

    if (!okr.linkedTasks.includes(taskId)) {
      okr.linkedTasks.push(taskId);
      okrStorage.set(okrId, okr);
    }
    return okr;
  }

  /**
   * Get goal cascade (parent → children)
   */
  static getGoalCascade(okrId) {
    const okr = okrStorage.get(okrId);
    if (!okr) return null;

    const cascade = {
      parent: okr,
      children: [],
    };

    // Find all child OKRs
    okrStorage.forEach(o => {
      if (o.parentId === okrId) {
        cascade.children.push(o);
      }
    });

    return cascade;
  }

  /**
   * Get alignment view - which projects support which OKRs
   */
  static getAlignmentView(filters = {}) {
    const okrs = this.listOKRs(filters);
    const alignment = [];

    okrs.forEach(okr => {
      alignment.push({
        okrId: okr.id,
        okrTitle: okr.title,
        okrLevel: okr.level,
        okrProgress: okr.progress,
        okrHealth: okr.health,
        linkedProjects: okr.linkedProjects,
        linkedTasks: okr.linkedTasks,
        keyResults: okr.keyResults,
      });
    });

    return alignment;
  }

  /**
   * Get quarterly check-in data
   */
  static getQuarterlyCheckIn(quarter, year) {
    const okrs = this.listOKRs({ quarter, year });
    const checkIn = {
      quarter,
      year,
      totalOKRs: okrs.length,
      completedOKRs: okrs.filter(o => o.status === 'completed').length,
      onTrackOKRs: okrs.filter(o => o.health === 'on_track').length,
      behindOKRs: okrs.filter(o => o.health === 'behind').length,
      atRiskOKRs: okrs.filter(o => o.health === 'at_risk').length,
      avgProgress: Math.round(okrs.reduce((sum, o) => sum + o.progress, 0) / okrs.length || 0),
      okrs,
    };
    return checkIn;
  }

  /**
   * Get goal health scores
   */
  static getHealthScores() {
    const okrs = Array.from(okrStorage.values());
    const scores = {
      on_track: okrs.filter(o => o.health === 'on_track').length,
      behind: okrs.filter(o => o.health === 'behind').length,
      at_risk: okrs.filter(o => o.health === 'at_risk').length,
      total: okrs.length,
      avgProgress: Math.round(okrs.reduce((sum, o) => sum + o.progress, 0) / okrs.length || 0),
    };
    return scores;
  }
}

module.exports = OKRService;
