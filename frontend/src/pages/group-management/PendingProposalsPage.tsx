import { useEffect, useState } from 'react';
import { Check, X, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { fetchPendingProposals, approveGroup, rejectGroup } from '../../api/groupService';
import { Group } from '../../types';
import { toast } from 'sonner';

interface PendingProposalsProps {
  onViewDetail: (groupId: string) => void;
}

export function PendingProposals({ onViewDetail }: PendingProposalsProps) {
  const [proposals, setProposals] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);
  
  // For rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const loadPendingProposals = async () => {
    try {
      setLoading(true);
      setError(null);
      const pendingProposals = await fetchPendingProposals();
      setProposals(pendingProposals);
    } catch (err) {
      console.error('Error fetching pending proposals:', err);
      setError('Failed to load pending proposals. Please try again.');
      toast.error('Failed to load pending proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingProposals();
  }, []);

  const handleApprove = async (groupId: string) => {
    try {
      setProcessingProposalId(groupId);
      await approveGroup(groupId);
      toast.success('Group proposal approved successfully');
      
      // Remove the approved proposal from the list
      setProposals(prev => prev.filter(proposal => proposal.id !== groupId));
    } catch (err: any) {
      console.error('Error approving group:', err);
      toast.error(err.response?.data?.error || 'Failed to approve group proposal');
    } finally {
      setProcessingProposalId(null);
    }
  };

  const handleRejectClick = (groupId: string) => {
    setSelectedProposalId(groupId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProposalId) return;
    
    try {
      setProcessingProposalId(selectedProposalId);
      setRejectDialogOpen(false);
      
      await rejectGroup(selectedProposalId, rejectionReason || undefined);
      toast.success('Group proposal rejected successfully');
      
      // Remove the rejected proposal from the list
      setProposals(prev => prev.filter(proposal => proposal.id !== selectedProposalId));
    } catch (err: any) {
      console.error('Error rejecting group:', err);
      toast.error(err.response?.data?.error || 'Failed to reject group proposal');
    } finally {
      setProcessingProposalId(null);
      setSelectedProposalId(null);
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pending Group Proposals</h1>
            <p className="text-slate-600">Review and decide on group proposals</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 border-0 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-8 w-8 rounded-full bg-slate-200"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pending Group Proposals</h1>
            <p className="text-slate-600">Review and decide on group proposals</p>
          </div>
        </div>
        <Card className="p-8 text-center border-0 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-medium text-slate-900">Error Loading Proposals</h3>
            <p className="text-slate-600 max-w-md">{error}</p>
            <Button onClick={loadPendingProposals} className="mt-4">
              <Loader2 className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pending Group Proposals</h1>
          <p className="text-slate-600">Review and decide on group proposals ({proposals.length} pending)</p>
        </div>
        <Button onClick={loadPendingProposals} variant="outline">
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <Card className="p-8 text-center border-0 shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Check className="w-12 h-12 text-green-500" />
              <h3 className="text-xl font-medium text-slate-900">No Pending Proposals</h3>
              <p className="text-slate-600 max-w-md">
                All group proposals have been reviewed. Great job!
              </p>
            </div>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-semibold text-slate-900">{proposal.name}</h2>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        PENDING
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {proposal.members?.length || 0} members • Created on {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                    {proposal.leader && (
                      <p className="text-sm text-slate-600 mt-1">
                        Proposed by: {proposal.leader.first_name} {proposal.leader.last_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetail(proposal.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleApprove(proposal.id)}
                      disabled={processingProposalId === proposal.id}
                      className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-1"
                    >
                      {processingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(proposal.id)}
                      disabled={processingProposalId === proposal.id}
                      variant="destructive"
                      className="flex items-center gap-1"
                    >
                      {processingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>

                {proposal.proposed_topic_title && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-1">Research Topics</h3>
                    <div className="text-sm text-slate-700 whitespace-pre-line">
                      {proposal.proposed_topic_title}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Members</h3>
                  <div className="flex flex-wrap gap-2">
                    {proposal.members?.map((member, idx) => (
                      <div key={member.id || idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {member.first_name} {member.last_name}
                          {String(proposal.leader?.id) === String(member.id) && (
                            <span className="ml-1 text-xs text-amber-600">(Leader)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="w-[95%] max-w-[500px] mx-auto">
          <DialogHeader>
            <DialogTitle>Reject Group Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this group proposal. This will be visible to the students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection (optional)..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedProposalId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processingProposalId === selectedProposalId}
            >
              {processingProposalId === selectedProposalId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Proposal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}