/**
 * Financial Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const FinancialService = require('../services/financialService');

/**
 * GET /v1/financial/budgets - List budgets
 */
router.get('/budgets', (req, res) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      quarter: req.query.quarter,
      year: req.query.year,
    };
    const budgets = FinancialService.listBudgets(filters);
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/financial/budgets - Create budget
 */
router.post('/budgets', (req, res) => {
  try {
    const budget = FinancialService.createBudget(req.body);
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/budgets/:id - Get budget
 */
router.get('/budgets/:id', (req, res) => {
  try {
    const budget = FinancialService.getBudget(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/financial/budgets/:id/costs - Record cost
 */
router.post('/budgets/:id/costs', (req, res) => {
  try {
    const budget = FinancialService.recordCost(req.params.id, req.body);
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/financial/budgets/:id/revenue - Record revenue
 */
router.post('/budgets/:id/revenue', (req, res) => {
  try {
    const budget = FinancialService.recordRevenue(req.params.id, req.body);
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/budget-vs-actual - Budget vs actual report
 */
router.get('/budget-vs-actual', (req, res) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      quarter: req.query.quarter,
      year: req.query.year,
    };
    const report = FinancialService.getBudgetVsActual(filters);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/cost-breakdown - Cost breakdown by resource type
 */
router.get('/cost-breakdown', (req, res) => {
  try {
    const filters = {
      entityType: req.query.entityType,
      quarter: req.query.quarter,
      year: req.query.year,
    };
    const breakdown = FinancialService.getCostBreakdown(filters);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/revenue-attribution - Revenue attribution by project
 */
router.get('/revenue-attribution', (req, res) => {
  try {
    const filters = {
      quarter: req.query.quarter,
      year: req.query.year,
    };
    const attribution = FinancialService.getRevenueAttribution(filters);
    res.json({ success: true, data: attribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/roi/:budgetId - Calculate ROI
 */
router.get('/roi/:budgetId', (req, res) => {
  try {
    const roi = FinancialService.calculateROI(req.params.budgetId);
    if (!roi) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: roi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/forecast/:budgetId - Get forecast
 */
router.get('/forecast/:budgetId', (req, res) => {
  try {
    const forecast = FinancialService.getForecast(req.params.budgetId);
    if (!forecast) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/financial/chargebacks - Allocate shared costs
 */
router.post('/chargebacks', (req, res) => {
  try {
    const allocation = FinancialService.allocateSharedCosts(req.body);
    if (!allocation) {
      return res.status(400).json({ success: false, error: 'No divisions found' });
    }
    res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/financial/invoices - Create invoice
 */
router.post('/invoices', (req, res) => {
  try {
    const invoice = FinancialService.createInvoice(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/invoices - Get invoices
 */
router.get('/invoices', (req, res) => {
  try {
    const filters = {
      projectId: req.query.projectId,
      status: req.query.status,
    };
    const invoices = FinancialService.getInvoices(filters);
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/financial/dashboard - Financial dashboard summary
 */
router.get('/dashboard', (req, res) => {
  try {
    const summary = FinancialService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
