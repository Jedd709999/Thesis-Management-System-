import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Users, FileText, Calendar, CheckCircle, Clock, Edit, Upload, Send, Check, X, MessageSquare } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { useAuth } from '../../hooks/useAuth';
import { fetchThesis, adviserReview, submitThesis } from '../../api/thesisService';
import { Document } from '../../types';
import { Thesis, Group, User } from '../../types';
import { DocumentUploadDialog } from '../../components/document/DocumentUploadDialog';

interface ThesisDetailProps {
  thesisId: string | null;
  onBack: () => void;
}

export function ThesisDetail({ thesisId: propThesisId, onBack }: ThesisDetailProps) {
  const { id: routeThesisId } = useParams<{ id: string }>();
  const thesisId = propThesisId || routeThesisId;
  
  const { user } = useAuth();
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (thesisId) {
      loadThesis();
    }
  }, [thesisId]);

  const loadThesis = async () => {
    try {
      setLoading(true);
      const data = await fetchThesis(thesisId!);
      setThesis(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching thesis:', err);
      setError('Failed to load thesis details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TOPIC_APPROVED':
      case 'CONCEPT_APPROVED':
      case 'PROPOSAL_APPROVED':
      case 'FINAL_APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TOPIC_SUBMITTED':
      case 'CONCEPT_SUBMITTED':
      case 'PROPOSAL_SUBMITTED':
      case 'FINAL_SUBMITTED':
      case 'CONCEPT_SCHEDULED':
      case 'PROPOSAL_SCHEDULED':
      case 'FINAL_SCHEDULED':
      case 'CONCEPT_DEFENDED':
      case 'PROPOSAL_DEFENDED':
      case 'FINAL_DEFENDED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESEARCH_IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'TOPIC_REJECTED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REVISIONS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleApprove = async () => {
    if (!thesis) return;
    
    try {
      setIsSubmitting(true);
      let action: 'approve_topic' | 'approve_thesis' | 'approve_proposal' | 'approve_final' = 'approve_topic';
      
      // Determine the appropriate action based on current status
      if (thesis.status === 'TOPIC_SUBMITTED') {
        action = 'approve_topic';
      } else if (thesis.status === 'TOPIC_APPROVED') {
        action = 'approve_thesis'; // Move to proposal phase
      } else if (thesis.status === 'PROPOSAL_DEFENDED') {
        action = 'approve_proposal'; // Move to research phase
      } else if (thesis.status === 'FINAL_DEFENDED') {
        action = 'approve_final'; // Final approval
      }
      
      const updatedThesis = await adviserReview(thesis.id, action as any, feedback);
      setThesis(updatedThesis);
      setIsApproveDialogOpen(false);
      setFeedback('');
      alert('Thesis approved successfully!');
    } catch (err) {
      console.error('Error approving thesis:', err);
      alert('Failed to approve thesis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!thesis) return;
    
    try {
      setIsSubmitting(true);
      const updatedThesis = await adviserReview(thesis.id, 'reject', feedback);
      setThesis(updatedThesis);
      setIsRejectDialogOpen(false);
      setFeedback('');
      alert('Thesis rejected successfully!');
    } catch (err) {
      console.error('Error rejecting thesis:', err);
      alert('Failed to reject thesis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!thesis) return;
    
    try {
      setIsSubmitting(true);
      const updatedThesis = await submitThesis(thesis.id);
      setThesis(updatedThesis);
      alert('Thesis submitted for review successfully!');
    } catch (err) {
      console.error('Error submitting thesis:', err);
      alert('Failed to submit thesis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Thesis List
        </Button>
        <div>Loading thesis details...</div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="p-8 space-y-6">
        <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Thesis List
        </Button>
        <div>Error: {error || 'Thesis not found'}</div>
      </div>
    );
  }

  // Type guard to check if group is a Group object
  const isGroupObject = (group: string | Group): group is Group => {
    return typeof group === 'object' && group !== null && 'id' in group;
  };

  // Extract group object if available
  const groupObj = isGroupObject(thesis.group) ? thesis.group : null;

  // Check if current user is the adviser for this thesis
  const isAdviser = user?.role === 'ADVISER' && groupObj?.adviser && groupObj.adviser.id === user.id;
  const isStudent = user?.role === 'STUDENT';
  const canSubmit = isStudent && ['TOPIC_REJECTED', 'REVISIONS_REQUIRED'].includes(thesis.status);

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Thesis List
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Badge className={`border mb-3 ${getStatusColor(thesis.status)}`}>
            {thesis.status.replace('_', ' ')}
          </Badge>
          <h1 className="text-3xl text-slate-900 mb-2">{thesis.title}</h1>
          <p className="text-slate-600">{groupObj && groupObj.name ? groupObj.name : 'No Group Assigned'}</p>
        </div>
        <div className="flex gap-2">
          {isStudent && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => alert('Edit functionality not implemented yet')}
            >
              <Edit className="w-4 h-4" />
              Edit Thesis
            </Button>
          )}
          
          {isStudent && (
            <DocumentUploadDialog 
              thesis={thesis} 
              onUploadSuccess={loadThesis}
            >
              <Button 
                className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </DocumentUploadDialog>
          )}
          
          {isStudent && canSubmit && (
            <Button 
              className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          )}
          
          {isAdviser && (
            // Only show approve/reject buttons for submitted theses
            ['TOPIC_SUBMITTED', 'CONCEPT_SUBMITTED', 'PROPOSAL_SUBMITTED', 'FINAL_SUBMITTED'].includes(thesis.status) && (
              <>
                <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Thesis</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="approve-feedback">Feedback (Optional)</Label>
                        <Textarea
                          id="approve-feedback"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide feedback for the student (optional)"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={handleApprove}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Thesis</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reject-feedback">Reason (Optional)</Label>
                        <Textarea
                          id="reject-feedback"
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide reason for rejection (optional)"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleReject}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Abstract</h2>
            <p className="text-slate-700 leading-relaxed">{thesis.abstract}</p>
          </Card>

          {/* Keywords */}
          {thesis.keywords && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {thesis.keywords.split(',').map((keyword, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800 border-blue-200">
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Documents */}
          {thesis.documents && thesis.documents.length > 0 && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-6">Documents</h2>
              <div className="space-y-3">
                {thesis.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                      <p className="text-xs text-slate-600">
                        {doc.document_type?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown'} • v{doc.version}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={doc.is_latest ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                        {doc.is_latest ? 'Latest' : 'Archived'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(doc.provider === 'google' ? doc.google_doc_edit_url! : doc.viewer_url!, '_blank')}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6">Progress Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-slate-900">Thesis Created</p>
                  <p className="text-sm text-slate-600">
                    {new Date(thesis.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['TOPIC_SUBMITTED', 'TOPIC_APPROVED', 'TOPIC_REJECTED'].includes(thesis.status)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {['TOPIC_SUBMITTED', 'TOPIC_APPROVED', 'TOPIC_REJECTED'].includes(thesis.status) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-slate-900">Topic Submitted</p>
                  <p className="text-sm text-slate-600">
                    {thesis.status === 'TOPIC_SUBMITTED' ? 'Pending Review' : 'Completed'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    ['TOPIC_APPROVED'].includes(thesis.status)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {['TOPIC_APPROVED'].includes(thesis.status) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-slate-900">Topic Approved</p>
                  <p className="text-sm text-slate-600">
                    {thesis.status === 'TOPIC_APPROVED' ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Group Members */}
          {groupObj && groupObj.members && groupObj.members.length > 0 && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Group Members
              </h2>
              <div className="space-y-3">
                {groupObj.members.map((member: User) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Adviser */}
          {groupObj && groupObj.adviser && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-4">Adviser</h2>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {groupObj.adviser.first_name?.charAt(0)}{groupObj.adviser.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-slate-900">
                    {groupObj.adviser.first_name} {groupObj.adviser.last_name}
                  </p>
                  <p className="text-xs text-slate-600">{groupObj.adviser.email}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Feedback */}
          {thesis.adviser_feedback && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Adviser Feedback
              </h2>
              <p className="text-slate-700">{thesis.adviser_feedback}</p>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-green-700">Status</p>
                <p className="text-xl text-green-900">{thesis.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Last Updated</p>
                <p className="text-sm text-green-900">
                  {new Date(thesis.updated_at).toLocaleDateString()}
                </p>
              </div>
              {thesis.drive_folder_url && (
                <div>
                  <p className="text-sm text-green-700">Google Drive Folder</p>
                  <a 
                    href={thesis.drive_folder_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-green-900 underline hover:text-green-700"
                  >
                    Open in Google Docs
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}