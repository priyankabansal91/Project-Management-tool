import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  requester: { name: string; avatar_url: string | null };
  type: 'bug' | 'feature' | 'expense' | 'change' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    name: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    approver?: { name: string };
    approvedAt?: string;
  }>;
  amount?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  dueDate?: string;
}

interface ApprovalInboxProps {
  approvals: ApprovalItem[];
  onApprove: (id: string, stepId: string) => void;
  onReject: (id: string, stepId: string, reason: string) => void;
  loading?: boolean;
}

const typeColors: Record<string, string> = {
  bug: 'bg-red-100 text-red-700',
  feature: 'bg-blue-100 text-blue-700',
  expense: 'bg-green-100 text-green-700',
  change: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export function ApprovalInbox({ approvals, onApprove, onReject, loading = false }: ApprovalInboxProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const completedApprovals = approvals.filter((a) => a.status !== 'pending');

  const handleReject = (id: string, stepId: string) => {
    const reason = rejectReason[`${id}-${stepId}`];
    if (reason.trim()) {
      onReject(id, stepId, reason);
      setRejectReason((prev) => ({ ...prev, [`${id}-${stepId}`]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold">Pending Approvals ({pendingApprovals.length})</h2>
        </div>

        {pendingApprovals.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No pending approvals</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((approval) => {
              const currentStep = approval.steps[approval.currentStep - 1];
              const isExpanded = expandedId === approval.id;

              return (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={cn('text-xs', typeColors[approval.type])}>
                            {approval.type}
                          </Badge>
                          <Badge className={cn('text-xs', priorityColors[approval.priority])}>
                            {approval.priority}
                          </Badge>
                          {approval.amount && (
                            <Badge variant="outline" className="text-xs">
                              ${approval.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-sm mb-1">{approval.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{approval.description}</p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar name={approval.requester.name} size="sm" />
                          <span>{approval.requester.name}</span>
                          <span>•</span>
                          <span>
                            Step {approval.currentStep} of {approval.totalSteps}
                          </span>
                          {currentStep && (
                            <>
                              <span>•</span>
                              <span>Awaiting {currentStep.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <CardContent className="border-t pt-4 space-y-4">
                      {/* Approval Steps */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Approval Steps</h4>
                        <div className="space-y-2">
                          {approval.steps.map((step, idx) => (
                            <div key={step.id} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                {step.status === 'approved' ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : step.status === 'rejected' ? (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-amber-600" />
                                )}
                                {idx < approval.steps.length - 1 && (
                                  <div className="h-6 w-0.5 bg-gray-300 my-1" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{step.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {step.role}
                                  </Badge>
                                  {step.status === 'approved' && (
                                    <span className="text-xs text-green-600">
                                      ✓ Approved by {step.approver?.name}
                                    </span>
                                  )}
                                  {step.status === 'rejected' && (
                                    <span className="text-xs text-red-600">✗ Rejected</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {currentStep && currentStep.status === 'pending' && (
                        <div className="space-y-3 border-t pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                            <textarea
                              placeholder="Explain why you're rejecting this approval..."
                              value={rejectReason[`${approval.id}-${currentStep.id}`] || ''}
                              onChange={(e) =>
                                setRejectReason((prev) => ({
                                  ...prev,
                                  [`${approval.id}-${currentStep.id}`]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-md text-sm resize-none h-20"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => onApprove(approval.id, currentStep.id)}
                              disabled={loading}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(approval.id, currentStep.id)}
                              disabled={loading || !rejectReason[`${approval.id}-${currentStep.id}`]?.trim()}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Approvals */}
      {completedApprovals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Completed ({completedApprovals.length})</h2>
          </div>

          <div className="space-y-2">
            {completedApprovals.map((approval) => (
              <Card key={approval.id} className="p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-xs', typeColors[approval.type])}>
                        {approval.type}
                      </Badge>
                      {approval.status === 'approved' ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 text-xs">Rejected</Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{approval.title}</h3>
                  </div>
                  {approval.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
