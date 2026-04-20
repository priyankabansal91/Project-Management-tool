/**
 * Resource & Capacity Dashboard Service
 * Manages resource allocation, capacity planning, and utilization tracking
 */

const resourceStorage = new Map();
let resourceIdCounter = 1;

class ResourceService {
  /**
   * Create resource profile
   */
  static createResource(data) {
    const id = `res_${resourceIdCounter++}`;
    const resource = {
      id,
      userId: data.userId,
      name: data.name,
      email: data.email,
      type: data.type, // 'fte', 'contractor', 'vendor'
      department: data.department,
      skills: data.skills || [],
      capacity: data.capacity || 100, // percentage
      allocated: 0,
      available: data.capacity || 100,
      currentProjects: [],
      utilization: 0,
      costPerHour: data.costPerHour || 0,
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'active', // 'active', 'on_leave', 'bench', 'inactive'
      ptoSchedule: data.ptoSchedule || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    resourceStorage.set(id, resource);
    return resource;
  }

  /**
   * Get resource by ID
   */
  static getResource(id) {
    return resourceStorage.get(id) || null;
  }

  /**
   * List all resources with filters
   */
  static listResources(filters = {}) {
    let resources = Array.from(resourceStorage.values());

    if (filters.type) {
      resources = resources.filter(r => r.type === filters.type);
    }
    if (filters.department) {
      resources = resources.filter(r => r.department === filters.department);
    }
    if (filters.status) {
      resources = resources.filter(r => r.status === filters.status);
    }
    if (filters.skill) {
      resources = resources.filter(r => r.skills.includes(filters.skill));
    }

    return resources;
  }

  /**
   * Allocate resource to project
   */
  static allocateResource(resourceId, projectId, allocation) {
    const resource = resourceStorage.get(resourceId);
    if (!resource) return null;

    const alloc = {
      projectId,
      projectName: allocation.projectName,
      allocatedCapacity: allocation.allocatedCapacity,
      startDate: allocation.startDate,
      endDate: allocation.endDate,
      role: allocation.role,
      createdAt: new Date().toISOString(),
    };

    resource.currentProjects.push(alloc);
    resource.allocated += allocation.allocatedCapacity;
    resource.available = resource.capacity - resource.allocated;
    resource.utilization = (resource.allocated / resource.capacity) * 100;

    resourceStorage.set(resourceId, resource);
    return resource;
  }

  /**
   * Deallocate resource from project
   */
  static deallocateResource(resourceId, projectId) {
    const resource = resourceStorage.get(resourceId);
    if (!resource) return null;

    const index = resource.currentProjects.findIndex(p => p.projectId === projectId);
    if (index === -1) return null;

    const allocation = resource.currentProjects[index];
    resource.allocated -= allocation.allocatedCapacity;
    resource.available = resource.capacity - resource.allocated;
    resource.utilization = (resource.allocated / resource.capacity) * 100;

    resource.currentProjects.splice(index, 1);
    resourceStorage.set(resourceId, resource);
    return resource;
  }

  /**
   * Add skill to resource
   */
  static addSkill(resourceId, skill) {
    const resource = resourceStorage.get(resourceId);
    if (!resource) return null;

    if (!resource.skills.includes(skill)) {
      resource.skills.push(skill);
      resourceStorage.set(resourceId, resource);
    }
    return resource;
  }

  /**
   * Get skill matrix - find people with specific skills
   */
  static getSkillMatrix(skill) {
    const resources = this.listResources({ skill });
    return {
      skill,
      totalPeople: resources.length,
      resources: resources.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        department: r.department,
        utilization: r.utilization,
        available: r.available,
      })),
    };
  }

  /**
   * Get skill gaps - skills needed but not available
   */
  static getSkillGaps(requiredSkills) {
    const gaps = [];

    requiredSkills.forEach(skill => {
      const available = this.listResources({ skill });
      if (available.length === 0) {
        gaps.push({
          skill,
          needed: true,
          available: 0,
        });
      }
    });

    return gaps;
  }

  /**
   * Get org-wide capacity heatmap
   */
  static getCapacityHeatmap() {
    const resources = Array.from(resourceStorage.values());
    const heatmap = {
      overloaded: [],
      fully_utilized: [],
      available: [],
      bench: [],
    };

    resources.forEach(resource => {
      if (resource.utilization > 100) {
        heatmap.overloaded.push({
          id: resource.id,
          name: resource.name,
          utilization: resource.utilization,
          overAllocation: resource.utilization - 100,
        });
      } else if (resource.utilization >= 80) {
        heatmap.fully_utilized.push({
          id: resource.id,
          name: resource.name,
          utilization: resource.utilization,
        });
      } else if (resource.utilization > 0) {
        heatmap.available.push({
          id: resource.id,
          name: resource.name,
          utilization: resource.utilization,
          available: resource.available,
        });
      } else {
        heatmap.bench.push({
          id: resource.id,
          name: resource.name,
          utilization: 0,
          available: resource.capacity,
        });
      }
    });

    return heatmap;
  }

  /**
   * Get bench report - people between projects
   */
  static getBenchReport() {
    const resources = this.listResources({ status: 'active' });
    const bench = resources.filter(r => r.utilization === 0 || r.status === 'bench');

    return {
      totalBench: bench.length,
      benchCapacity: bench.reduce((sum, r) => sum + r.available, 0),
      resources: bench.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        department: r.department,
        skills: r.skills,
        availableCapacity: r.available,
        costPerHour: r.costPerHour,
      })),
    };
  }

  /**
   * Get hiring plan - forecast demand vs supply
   */
  static getHiringPlan(quarters) {
    const resources = Array.from(resourceStorage.values());
    const plan = {
      quarters: [],
    };

    quarters.forEach(quarter => {
      const quarterData = {
        quarter,
        currentFTE: resources.filter(r => r.type === 'fte').length,
        currentContractors: resources.filter(r => r.type === 'contractor').length,
        projectedDemand: 0,
        gap: 0,
        recommendedHires: 0,
      };

      // Calculate projected demand based on current allocations
      const totalAllocated = resources.reduce((sum, r) => sum + r.allocated, 0);
      quarterData.projectedDemand = Math.ceil(totalAllocated / 100);
      quarterData.gap = Math.max(0, quarterData.projectedDemand - quarterData.currentFTE);
      quarterData.recommendedHires = quarterData.gap;

      plan.quarters.push(quarterData);
    });

    return plan;
  }

  /**
   * Add PTO/holiday to resource
   */
  static addPTO(resourceId, pto) {
    const resource = resourceStorage.get(resourceId);
    if (!resource) return null;

    const ptoEntry = {
      id: `pto_${Date.now()}`,
      type: pto.type, // 'vacation', 'sick', 'holiday'
      startDate: pto.startDate,
      endDate: pto.endDate,
      days: pto.days,
      status: 'approved',
    };

    resource.ptoSchedule.push(ptoEntry);
    resourceStorage.set(resourceId, resource);
    return resource;
  }

  /**
   * Get PTO/holiday calendar
   */
  static getPTOCalendar(filters = {}) {
    const resources = this.listResources(filters);
    const calendar = [];

    resources.forEach(resource => {
      resource.ptoSchedule.forEach(pto => {
        calendar.push({
          resourceId: resource.id,
          resourceName: resource.name,
          type: pto.type,
          startDate: pto.startDate,
          endDate: pto.endDate,
          days: pto.days,
        });
      });
    });

    return calendar.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }

  /**
   * Get contractor vs employee utilization comparison
   */
  static getUtilizationComparison() {
    const resources = Array.from(resourceStorage.values());

    const ftes = resources.filter(r => r.type === 'fte');
    const contractors = resources.filter(r => r.type === 'contractor');

    const comparison = {
      fte: {
        count: ftes.length,
        totalCapacity: ftes.reduce((sum, r) => sum + r.capacity, 0),
        totalAllocated: ftes.reduce((sum, r) => sum + r.allocated, 0),
        avgUtilization: ftes.length > 0 ? ftes.reduce((sum, r) => sum + r.utilization, 0) / ftes.length : 0,
        totalCost: ftes.reduce((sum, r) => sum + r.costPerHour * 2080, 0), // 2080 hours/year
      },
      contractor: {
        count: contractors.length,
        totalCapacity: contractors.reduce((sum, r) => sum + r.capacity, 0),
        totalAllocated: contractors.reduce((sum, r) => sum + r.allocated, 0),
        avgUtilization: contractors.length > 0 ? contractors.reduce((sum, r) => sum + r.utilization, 0) / contractors.length : 0,
        totalCost: contractors.reduce((sum, r) => sum + r.costPerHour * 2080, 0),
      },
    };

    return comparison;
  }

  /**
   * Get resource dashboard summary
   */
  static getDashboardSummary() {
    const resources = Array.from(resourceStorage.values());
    const heatmap = this.getCapacityHeatmap();
    const bench = this.getBenchReport();
    const utilization = this.getUtilizationComparison();

    return {
      totalResources: resources.length,
      overloaded: heatmap.overloaded.length,
      fullyUtilized: heatmap.fully_utilized.length,
      available: heatmap.available.length,
      bench: bench.totalBench,
      avgUtilization: resources.length > 0 ? resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length : 0,
      utilization,
      heatmap,
      bench,
    };
  }
}

module.exports = ResourceService;
