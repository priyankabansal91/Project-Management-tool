import { useState } from 'react';
import { usePendingApprovals } from '@/api/hooks';
import { ApprovalInbox } from '@/components/shared/ApprovalInbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from 'lucide-react';

export function ApprovalInboxPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePendingApprovals({ page, page_size: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800">Error loading approvals: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </Card>
      </div>
    );
  }

  const approvals = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Approval Inbox</h1>
        <p className="text-muted-foreground">Review and approve pending requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pending Approvals</div>
          <div className="text-3xl font-bold">{pagination?.total || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Page</div>
          <div className="text-3xl font-bold">{page}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Pages</div>
          <div className="text-3xl font-bold">{pagination?.total_pages || 1}</div>
        </Card>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No pending approvals</p>
          <p className="text-sm text-muted-foreground mt-2">You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{approval.title}</h3>
                  <p className="text-sm text-muted-foreground">{approval.description}</p>
                </div>
                <Badge variant="outline" className="ml-4">
                  {approval.status}
                </Badge>
              </div>

              {/* Steps */}
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Approval Steps:</p>
                <div className="flex flex-wrap gap-2">
                  {approval.steps.map((step) => (
                    <Badge
                      key={step.id}
                      variant={step.status === 'approved' ? 'default' : 'outline'}
                      className={step.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    >
                      {step.step_name} - {step.status}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Requested By */}
              <div className="text-sm text-muted-foreground mb-4">
                Requested by: <span className="font-medium">{approval.requested_by?.email}</span>
              </div>

              {/* Approval Component */}
              <ApprovalInbox
                approvals={[
                  {
                    id: approval.id,
                    title: approval.title,
                    description: approval.description,
                    status: approval.status,
                    steps: approval.steps,
                    requestedBy: approval.requested_by,
                  },
                ]}
                onApprove={(approvalId, reason) => {
                  console.log('Approve:', approvalId, reason);
                }}
                onReject={(approvalId, reason) => {
                  console.log('Reject:', approvalId, reason);
                }}
              />
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
            disabled={page === pagination.total_pages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
