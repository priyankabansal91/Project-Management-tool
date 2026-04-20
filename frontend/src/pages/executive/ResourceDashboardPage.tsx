import React, { useState } from 'react';
import { Users, AlertCircle, TrendingUp, Calendar, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Resource {
  id: string;
  name: string;
  type: 'fte' | 'contractor';
  department: string;
  utilization: number;
  skills: string[];
  available: number;
}

export default function ResourceDashboardPage() {
  const [resources] = useState<Resource[]>([
    {
      id: 'res_1',
      name: 'Alice Johnson',
      type: 'fte',
      department: 'Engineering',
      utilization: 95,
      skills: ['React', 'TypeScript', 'Node.js'],
      available: 5,
    },
    {
      id: 'res_2',
      name: 'Bob Smith',
      type: 'fte',
      department: 'Engineering',
      utilization: 110,
      skills: ['Python', 'AWS', 'DevOps'],
      available: -10,
    },
    {
      id: 'res_3',
      name: 'Carol Davis',
      type: 'contractor',
      department: 'Design',
      utilization: 60,
      skills: ['UI/UX', 'Figma', 'Design Systems'],
      available: 40,
    },
    {
      id: 'res_4',
      name: 'David Wilson',
      type: 'fte',
      department: 'Product',
      utilization: 0,
      skills: ['Product Strategy', 'Analytics'],
      available: 100,
    },
  ]);

  const overloaded = resources.filter(r => r.utilization > 100);
  const fullyUtilized = resources.filter(r => r.utilization >= 80 && r.utilization <= 100);
  const available = resources.filter(r => r.utilization > 0 && r.utilization < 80);
  const bench = resources.filter(r => r.utilization === 0);

  const ftes = resources.filter(r => r.type === 'fte');
  const contractors = resources.filter(r => r.type === 'contractor');

  const avgUtilization = resources.length > 0 ? resources.reduce((sum, r) => sum + r.utilization, 0) / resources.length : 0;

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600 bg-red-50';
    if (utilization >= 80) return 'text-green-600 bg-green-50';
    if (utilization > 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-500';
    if (utilization >= 80) return 'bg-green-500';
    if (utilization > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resource & Capacity Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage team capacity, skills, and utilization</p>
        </div>
        <Button className="gap-2">
          <Users className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Resources</p>
              <p className="text-3xl font-bold">{resources.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Utilization</p>
              <p className="text-3xl font-bold">{avgUtilization.toFixed(0)}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overloaded</p>
              <p className="text-3xl font-bold text-red-600">{overloaded.length}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Bench</p>
              <p className="text-3xl font-bold text-gray-600">{bench.length}</p>
            </div>
            <Briefcase className="w-12 h-12 text-gray-200" />
          </div>
        </Card>
      </div>

      {/* Capacity Heatmap */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Org-Wide Capacity Heatmap</h2>
        <div className="space-y-3">
          {resources.map(resource => (
            <div key={resource.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{resource.name}</p>
                  <p className="text-xs text-gray-600">{resource.department}</p>
                </div>
                <p className={`text-sm font-bold ${getUtilizationColor(resource.utilization)}`}>
                  {resource.utilization}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getUtilizationBgColor(resource.utilization)}`}
                  style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                />
              </div>
              {resource.utilization > 100 && (
                <p className="text-xs text-red-600">Overallocated by {resource.utilization - 100}%</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Utilization Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capacity Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Capacity Status</h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-red-900">Overloaded</p>
                <p className="text-lg font-bold text-red-600">{overloaded.length}</p>
              </div>
              <p className="text-xs text-red-700 mt-1">Need immediate attention</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-green-900">Fully Utilized</p>
                <p className="text-lg font-bold text-green-600">{fullyUtilized.length}</p>
              </div>
              <p className="text-xs text-green-700 mt-1">Optimal allocation</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-yellow-900">Available</p>
                <p className="text-lg font-bold text-yellow-600">{available.length}</p>
              </div>
              <p className="text-xs text-yellow-700 mt-1">Can take more work</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-900">On Bench</p>
                <p className="text-lg font-bold text-gray-600">{bench.length}</p>
              </div>
              <p className="text-xs text-gray-700 mt-1">Between projects</p>
            </div>
          </div>
        </Card>

        {/* FTE vs Contractor */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">FTE vs Contractor Utilization</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Full-Time Employees</p>
                <p className="text-sm text-gray-600">{ftes.length} people</p>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${ftes.length > 0 ? (ftes.reduce((sum, r) => sum + r.utilization, 0) / ftes.length) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Avg: {ftes.length > 0 ? (ftes.reduce((sum, r) => sum + r.utilization, 0) / ftes.length).toFixed(0) : 0}%
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Contractors</p>
                <p className="text-sm text-gray-600">{contractors.length} people</p>
              </div>
              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full"
                    style={{
                      width: `${contractors.length > 0 ? (contractors.reduce((sum, r) => sum + r.utilization, 0) / contractors.length) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Avg: {contractors.length > 0 ? (contractors.reduce((sum, r) => sum + r.utilization, 0) / contractors.length).toFixed(0) : 0}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Skill Matrix */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Skill Matrix</h2>
        <div className="space-y-3">
          {['React', 'TypeScript', 'Python', 'AWS', 'DevOps', 'UI/UX', 'Product Strategy'].map(skill => {
            const peopleWithSkill = resources.filter(r => r.skills.includes(skill));
            return (
              <div key={skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{skill}</p>
                  <p className="text-xs text-gray-600">{peopleWithSkill.length} people</p>
                </div>
                <div className="flex gap-1">
                  {peopleWithSkill.map(person => (
                    <span key={person.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {person.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bench Report */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bench Report</h2>
        {bench.length > 0 ? (
          <div className="space-y-3">
            {bench.map(resource => (
              <div key={resource.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-sm text-gray-600">{resource.department}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {resource.type === 'fte' ? 'FTE' : 'Contractor'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {resource.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No resources on bench</p>
        )}
      </Card>

      {/* Hiring Plan */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Hiring Plan - Demand vs Supply</h2>
        <div className="space-y-4">
          {['Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027'].map(quarter => (
            <div key={quarter} className="p-4 border rounded-lg">
              <p className="font-medium mb-3">{quarter}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current FTE</p>
                  <p className="text-2xl font-bold">{ftes.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Projected Demand</p>
                  <p className="text-2xl font-bold text-blue-600">{ftes.length + 2}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gap</p>
                  <p className="text-2xl font-bold text-red-600">+2</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PTO Calendar */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">PTO & Holiday Calendar</h2>
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Alice Johnson - Vacation</p>
                <p className="text-xs text-gray-600">Apr 22 - Apr 29, 2026</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600">8 days</span>
          </div>
          <div className="p-3 bg-green-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-sm">Bob Smith - Sick Leave</p>
                <p className="text-xs text-gray-600">Apr 25, 2026</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-green-600">1 day</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
