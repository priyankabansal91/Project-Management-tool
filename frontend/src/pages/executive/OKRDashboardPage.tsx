import React, { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OKR {
  id: string;
  title: string;
  level: 'company' | 'division' | 'team' | 'individual';
  progress: number;
  health: 'on_track' | 'behind' | 'at_risk';
  quarter: string;
  keyResults: Array<{
    id: string;
    title: string;
    progress: number;
    targetValue: number;
    currentValue: number;
  }>;
  linkedProjects: string[];
}

export default function OKRDashboardPage() {
  const [okrs, setOkrs] = useState<OKR[]>([
    {
      id: 'okr_1',
      title: 'Increase Revenue by 50%',
      level: 'company',
      progress: 65,
      health: 'on_track',
      quarter: 'Q2',
      keyResults: [
        { id: 'kr_1', title: 'Close 10 enterprise deals', progress: 70, targetValue: 10, currentValue: 7 },
        { id: 'kr_2', title: 'Increase ARR to $5M', progress: 60, targetValue: 5000000, currentValue: 3000000 },
      ],
      linkedProjects: ['proj_1', 'proj_2'],
    },
    {
      id: 'okr_2',
      title: 'Improve Product Quality',
      level: 'company',
      progress: 45,
      health: 'behind',
      quarter: 'Q2',
      keyResults: [
        { id: 'kr_3', title: 'Reduce bugs by 40%', progress: 45, targetValue: 40, currentValue: 18 },
        { id: 'kr_4', title: 'Achieve 99.9% uptime', progress: 45, targetValue: 99.9, currentValue: 99.5 },
      ],
      linkedProjects: ['proj_3'],
    },
  ]);

  const [selectedOKR, setSelectedOKR] = useState<OKR | null>(null);
  const [showModal, setShowModal] = useState(false);

  const healthScores = {
    on_track: okrs.filter(o => o.health === 'on_track').length,
    behind: okrs.filter(o => o.health === 'behind').length,
    at_risk: okrs.filter(o => o.health === 'at_risk').length,
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on_track':
        return 'bg-green-100 text-green-800';
      case 'behind':
        return 'bg-yellow-100 text-yellow-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'on_track':
        return <CheckCircle className="w-4 h-4" />;
      case 'behind':
        return <AlertCircle className="w-4 h-4" />;
      case 'at_risk':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OKR & Goals Tracking</h1>
          <p className="text-gray-600 mt-1">Link daily work to strategic objectives</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New OKR
        </Button>
      </div>

      {/* Health Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Track</p>
              <p className="text-3xl font-bold text-green-600">{healthScores.on_track}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Behind</p>
              <p className="text-3xl font-bold text-yellow-600">{healthScores.behind}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-200" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">At Risk</p>
              <p className="text-3xl font-bold text-red-600">{healthScores.at_risk}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200" />
          </div>
        </Card>
      </div>

      {/* OKRs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Q2 2026 OKRs</h2>
        {okrs.map(okr => (
          <Card key={okr.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedOKR(okr)}>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{okr.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getHealthColor(okr.health)}`}>
                      {getHealthIcon(okr.health)}
                      {okr.health.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Level: {okr.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{okr.progress}%</p>
                  <p className="text-xs text-gray-600">Progress</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    okr.health === 'on_track' ? 'bg-green-500' : okr.health === 'behind' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${okr.progress}%` }}
                />
              </div>

              {/* Key Results */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Key Results:</p>
                {okr.keyResults.map(kr => (
                  <div key={kr.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{kr.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${kr.progress}%` }} />
                      </div>
                      <span className="text-gray-700 font-medium">{kr.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Linked Projects */}
              {okr.linkedProjects.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">{okr.linkedProjects.length} linked projects</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Goal Cascade View */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Goal Cascade</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-lg p-4 w-40">
                <p className="font-semibold text-sm">Company OKRs</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-lg p-4 w-40">
                <p className="font-semibold text-sm">Division Goals</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="bg-green-100 rounded-lg p-4 w-40">
                <p className="font-semibold text-sm">Team Goals</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Alignment View */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Project-OKR Alignment</h2>
        <div className="space-y-3">
          {okrs.map(okr => (
            <div key={okr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{okr.title}</p>
                <p className="text-sm text-gray-600">{okr.linkedProjects.length} projects supporting this OKR</p>
              </div>
              <div className="flex gap-2">
                {okr.linkedProjects.map(proj => (
                  <span key={proj} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {proj}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
