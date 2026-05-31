import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Building2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useMyDivisions } from '@/api/hooks';

interface Budget {
  id: string;
  entityName: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  revenue: number;
  roi: number;
  burnRate: number;
}

const EMPTY_FORM = { entityName: '', totalBudget: '', revenue: '', burnRate: '' };

export function FinancialDashboardPage() {
  const { currentDivisionId } = useAuthStore();
  const { data: myDivisions = [] } = useMyDivisions();
  const activeDivision = (myDivisions as any[]).find((d: any) => d.divisionId === currentDivisionId);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: 'budget_1',
      entityName: 'Project Alpha',
      totalBudget: 5000000,
      spent: 3250000,
      remaining: 1750000,
      revenue: 6000000,
      roi: 84.6,
      burnRate: 150000,
    },
    {
      id: 'budget_2',
      entityName: 'Project Beta',
      totalBudget: 3000000,
      spent: 1800000,
      remaining: 1200000,
      revenue: 2500000,
      roi: -16.7,
      burnRate: 120000,
    },
  ]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);
  const totalRevenue = budgets.reduce((sum, b) => sum + b.revenue, 0);
  const avgROI = budgets.length > 0 ? budgets.reduce((sum, b) => sum + b.roi, 0) / budgets.length : 0;

  const costBreakdown = {
    fte: 4500000,
    contractor: 1500000,
    vendor: 1000000,
    saasTools: 500000,
    other: 250000,
  };

  const handleAddBudget = () => {
    if (!form.entityName.trim()) { setFormError('Entity name is required.'); return; }
    const total = parseFloat(form.totalBudget);
    if (!total || total <= 0) { setFormError('Enter a valid total budget.'); return; }
    const revenue = parseFloat(form.revenue) || 0;
    const burnRate = parseFloat(form.burnRate) || 0;
    const newBudget: Budget = {
      id: `budget_${Date.now()}`,
      entityName: form.entityName.trim(),
      totalBudget: total,
      spent: 0,
      remaining: total,
      revenue,
      roi: revenue > 0 ? ((revenue - total) / total) * 100 : 0,
      burnRate,
    };
    setBudgets((prev) => [...prev, newBudget]);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Budget tracking, ROI analysis, and financial forecasting</p>
        </div>
        <Button className="gap-2" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }}>
          <DollarSign className="w-4 h-4" />
          New Budget
        </Button>
      </div>

      {/* Division filter banner */}
      {currentDivisionId && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Filtered by division:</span>
          <span className="font-semibold text-primary">{activeDivision?.divisionName ?? 'Selected Division'}</span>
          <span className="ml-auto text-xs text-muted-foreground">Budget figures scoped to this division</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-gray-600 mt-1">{((totalSpent / totalBudget) * 100).toFixed(1)}% utilized</p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average ROI</p>
              <p className={`text-2xl font-bold ${avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgROI.toFixed(1)}%
              </p>
            </div>
            <PieChart className="w-12 h-12 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Budget vs Actual */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Budget vs Actual</h2>
        <div className="space-y-4">
          {budgets.map(budget => (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium">{budget.entityName}</p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.totalBudget)}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${(budget.spent / budget.totalBudget) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Spent: {((budget.spent / budget.totalBudget) * 100).toFixed(1)}%</span>
                <span>Remaining: {formatCurrency(budget.remaining)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cost Breakdown by Resource Type</h2>
          <div className="space-y-3">
            {Object.entries(costBreakdown).map(([type, amount]) => {
              const total = Object.values(costBreakdown).reduce((a, b) => a + b, 0);
              const percentage = (amount / total) * 100;
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <p className="text-xs text-gray-600">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue Attribution */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Attribution by Project</h2>
          <div className="space-y-3">
            {budgets.map(budget => {
              const profit = budget.revenue - budget.spent;
              const margin = budget.revenue > 0 ? (profit / budget.revenue) * 100 : 0;
              return (
                <div key={budget.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">{budget.entityName}</p>
                    <span className={`text-xs font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold">{formatCurrency(budget.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cost</p>
                      <p className="font-semibold">{formatCurrency(budget.spent)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Margin</p>
                      <p className="font-semibold">{margin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ROI Calculator */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">ROI by Initiative</h2>
        <div className="space-y-3">
          {budgets.map(budget => (
            <div key={budget.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{budget.entityName}</p>
                <p className="text-sm text-gray-600">Investment: {formatCurrency(budget.spent)}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${budget.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budget.roi >= 0 ? '+' : ''}{budget.roi.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600">ROI</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial Forecast */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(budget => {
            const daysRemaining = budget.remaining / budget.burnRate;
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + daysRemaining);
            return (
              <div key={budget.id} className="p-4 border rounded-lg">
                <p className="font-medium mb-3">{budget.entityName}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Burn Rate</span>
                    <span className="font-semibold">{formatCurrency(budget.burnRate)}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining</span>
                    <span className="font-semibold">{daysRemaining.toFixed(0)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forecasted End Date</span>
                    <span className="font-semibold">{forecastDate.toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Budget Status</span>
                    <span className={`font-semibold ${budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.remaining > 0 ? 'On Track' : 'Over Budget'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Chargebacks & Invoices */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Invoices & Chargebacks</h2>
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Shared Infrastructure Costs</p>
              <p className="text-sm text-gray-600">Allocated across 3 divisions</p>
            </div>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(500000)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Client Invoices (Paid)</p>
              <p className="text-sm text-gray-600">12 invoices</p>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(4500000)}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">Pending Invoices</p>
              <p className="text-sm text-gray-600">3 invoices</p>
            </div>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(750000)}</p>
          </div>
        </div>
      </Card>

      {/* New Budget Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-base font-semibold">New Budget</h2>
                <button onClick={() => setShowModal(false)} className="rounded-md p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                {formError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Entity / Project Name <span className="text-destructive">*</span></label>
                  <Input
                    placeholder="e.g. Project Gamma"
                    value={form.entityName}
                    onChange={(e) => setForm((f) => ({ ...f, entityName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Total Budget (₹ INR) <span className="text-destructive">*</span></label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000000"
                    value={form.totalBudget}
                    onChange={(e) => setForm((f) => ({ ...f, totalBudget: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Expected Revenue (₹ INR)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 6000000"
                    value={form.revenue}
                    onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Daily Burn Rate (₹/day)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 15000"
                    value={form.burnRate}
                    onChange={(e) => setForm((f) => ({ ...f, burnRate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t px-5 py-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleAddBudget}>
                  <DollarSign className="h-4 w-4" />
                  Create Budget
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
