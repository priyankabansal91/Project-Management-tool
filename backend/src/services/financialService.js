/**
 * Financial Dashboard Service
 * Manages budgets, costs, revenue, ROI, and financial forecasting
 */

const financialStorage = new Map();
let budgetIdCounter = 1;

class FinancialService {
  /**
   * Create budget for project/division/org
   */
  static createBudget(data) {
    const id = `budget_${budgetIdCounter++}`;
    const budget = {
      id,
      entityType: data.entityType, // 'project', 'division', 'organization'
      entityId: data.entityId,
      entityName: data.entityName,
      totalBudget: data.totalBudget,
      spent: 0,
      remaining: data.totalBudget,
      quarter: data.quarter,
      year: data.year,
      costBreakdown: {
        fte: 0,
        contractor: 0,
        vendor: 0,
        saasTools: 0,
        other: 0,
      },
      revenue: 0,
      roi: 0,
      burnRate: 0,
      forecastedEndDate: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    financialStorage.set(id, budget);
    return budget;
  }

  /**
   * Get budget by ID
   */
  static getBudget(id) {
    return financialStorage.get(id) || null;
  }

  /**
   * List budgets with filters
   */
  static listBudgets(filters = {}) {
    let budgets = Array.from(financialStorage.values());

    if (filters.entityType) {
      budgets = budgets.filter(b => b.entityType === filters.entityType);
    }
    if (filters.entityId) {
      budgets = budgets.filter(b => b.entityId === filters.entityId);
    }
    if (filters.quarter) {
      budgets = budgets.filter(b => b.quarter === filters.quarter);
    }
    if (filters.year) {
      budgets = budgets.filter(b => b.year === filters.year);
    }

    return budgets;
  }

  /**
   * Record cost against budget
   */
  static recordCost(budgetId, cost) {
    const budget = financialStorage.get(budgetId);
    if (!budget) return null;

    budget.spent += cost.amount;
    budget.remaining = budget.totalBudget - budget.spent;
    budget.costBreakdown[cost.type] = (budget.costBreakdown[cost.type] || 0) + cost.amount;

    // Calculate burn rate (cost per day)
    const daysElapsed = Math.ceil((new Date() - new Date(budget.createdAt)) / (1000 * 60 * 60 * 24));
    budget.burnRate = daysElapsed > 0 ? budget.spent / daysElapsed : 0;

    // Forecast when budget runs out
    if (budget.burnRate > 0) {
      const daysRemaining = budget.remaining / budget.burnRate;
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + daysRemaining);
      budget.forecastedEndDate = forecastDate.toISOString();
    }

    budget.updatedAt = new Date().toISOString();
    financialStorage.set(budgetId, budget);
    return budget;
  }

  /**
   * Record revenue for project
   */
  static recordRevenue(budgetId, revenue) {
    const budget = financialStorage.get(budgetId);
    if (!budget) return null;

    budget.revenue += revenue.amount;
    budget.roi = ((budget.revenue - budget.spent) / budget.spent) * 100;
    budget.updatedAt = new Date().toISOString();
    financialStorage.set(budgetId, budget);
    return budget;
  }

  /**
   * Get budget vs actual report
   */
  static getBudgetVsActual(filters = {}) {
    const budgets = this.listBudgets(filters);
    const report = {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      totalRevenue: 0,
      avgUtilization: 0,
      budgets: [],
    };

    budgets.forEach(budget => {
      report.totalBudget += budget.totalBudget;
      report.totalSpent += budget.spent;
      report.totalRemaining += budget.remaining;
      report.totalRevenue += budget.revenue;

      report.budgets.push({
        id: budget.id,
        entityName: budget.entityName,
        budget: budget.totalBudget,
        spent: budget.spent,
        remaining: budget.remaining,
        utilization: (budget.spent / budget.totalBudget) * 100,
        revenue: budget.revenue,
        roi: budget.roi,
      });
    });

    report.avgUtilization = budgets.length > 0 ? report.totalSpent / report.totalBudget * 100 : 0;
    return report;
  }

  /**
   * Get cost breakdown by resource type
   */
  static getCostBreakdown(filters = {}) {
    const budgets = this.listBudgets(filters);
    const breakdown = {
      fte: 0,
      contractor: 0,
      vendor: 0,
      saasTools: 0,
      other: 0,
      total: 0,
    };

    budgets.forEach(budget => {
      breakdown.fte += budget.costBreakdown.fte || 0;
      breakdown.contractor += budget.costBreakdown.contractor || 0;
      breakdown.vendor += budget.costBreakdown.vendor || 0;
      breakdown.saasTools += budget.costBreakdown.saasTools || 0;
      breakdown.other += budget.costBreakdown.other || 0;
    });

    breakdown.total = Object.values(breakdown).reduce((a, b) => a + b, 0) - breakdown.total;
    return breakdown;
  }

  /**
   * Get revenue attribution by project
   */
  static getRevenueAttribution(filters = {}) {
    const budgets = this.listBudgets({ ...filters, entityType: 'project' });
    const attribution = budgets
      .filter(b => b.revenue > 0)
      .map(b => ({
        projectId: b.entityId,
        projectName: b.entityName,
        revenue: b.revenue,
        cost: b.spent,
        profit: b.revenue - b.spent,
        margin: ((b.revenue - b.spent) / b.revenue) * 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: attribution.reduce((sum, a) => sum + a.revenue, 0),
      totalCost: attribution.reduce((sum, a) => sum + a.cost, 0),
      totalProfit: attribution.reduce((sum, a) => sum + a.profit, 0),
      avgMargin: attribution.length > 0 ? attribution.reduce((sum, a) => sum + a.margin, 0) / attribution.length : 0,
      projects: attribution,
    };
  }

  /**
   * Calculate ROI for initiative
   */
  static calculateROI(budgetId) {
    const budget = financialStorage.get(budgetId);
    if (!budget) return null;

    const roi = {
      budgetId,
      entityName: budget.entityName,
      investment: budget.spent,
      return: budget.revenue,
      profit: budget.revenue - budget.spent,
      roiPercentage: budget.roi,
      paybackPeriod: budget.burnRate > 0 ? budget.spent / budget.burnRate : null,
      status: budget.roi > 0 ? 'profitable' : 'loss',
    };

    return roi;
  }

  /**
   * Get financial forecast
   */
  static getForecast(budgetId) {
    const budget = financialStorage.get(budgetId);
    if (!budget) return null;

    const forecast = {
      budgetId,
      entityName: budget.entityName,
      currentBudget: budget.totalBudget,
      currentSpent: budget.spent,
      currentRemaining: budget.remaining,
      burnRate: budget.burnRate,
      daysRemaining: budget.remaining / budget.burnRate,
      forecastedEndDate: budget.forecastedEndDate,
      projectedFinalCost: budget.spent + (budget.remaining / budget.burnRate * budget.burnRate),
      budgetStatus: budget.remaining > 0 ? 'on_track' : 'over_budget',
    };

    return forecast;
  }

  /**
   * Allocate shared costs across divisions (chargebacks)
   */
  static allocateSharedCosts(sharedCost) {
    const divisions = this.listBudgets({ entityType: 'division' });
    if (divisions.length === 0) return null;

    const allocation = {
      totalCost: sharedCost.amount,
      costType: sharedCost.type,
      allocations: [],
    };

    // Allocate proportionally based on budget size
    const totalBudget = divisions.reduce((sum, d) => sum + d.totalBudget, 0);

    divisions.forEach(division => {
      const proportion = division.totalBudget / totalBudget;
      const allocatedAmount = sharedCost.amount * proportion;

      allocation.allocations.push({
        divisionId: division.entityId,
        divisionName: division.entityName,
        allocatedAmount,
        proportion: (proportion * 100).toFixed(2),
      });

      // Record the cost
      this.recordCost(division.id, {
        amount: allocatedAmount,
        type: sharedCost.type,
      });
    });

    return allocation;
  }

  /**
   * Track invoices for external/client work
   */
  static createInvoice(data) {
    const invoiceId = `inv_${Date.now()}`;
    const invoice = {
      id: invoiceId,
      projectId: data.projectId,
      clientName: data.clientName,
      amount: data.amount,
      description: data.description,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: 'draft', // 'draft', 'sent', 'paid', 'overdue'
      items: data.items || [],
      createdAt: new Date().toISOString(),
    };

    if (!financialStorage.has('invoices')) {
      financialStorage.set('invoices', []);
    }
    const invoices = financialStorage.get('invoices');
    invoices.push(invoice);
    financialStorage.set('invoices', invoices);

    return invoice;
  }

  /**
   * Get invoices
   */
  static getInvoices(filters = {}) {
    const invoices = financialStorage.get('invoices') || [];

    if (filters.projectId) {
      return invoices.filter(i => i.projectId === filters.projectId);
    }
    if (filters.status) {
      return invoices.filter(i => i.status === filters.status);
    }

    return invoices;
  }

  /**
   * Get financial dashboard summary
   */
  static getDashboardSummary() {
    const budgets = Array.from(financialStorage.values()).filter(b => b.totalBudget);
    const invoices = financialStorage.get('invoices') || [];

    const summary = {
      totalBudget: budgets.reduce((sum, b) => sum + b.totalBudget, 0),
      totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
      totalRemaining: budgets.reduce((sum, b) => sum + b.remaining, 0),
      totalRevenue: budgets.reduce((sum, b) => sum + b.revenue, 0),
      avgROI: budgets.length > 0 ? budgets.reduce((sum, b) => sum + b.roi, 0) / budgets.length : 0,
      avgBurnRate: budgets.length > 0 ? budgets.reduce((sum, b) => sum + b.burnRate, 0) / budgets.length : 0,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
      costBreakdown: this.getCostBreakdown(),
    };

    return summary;
  }
}

module.exports = FinancialService;
