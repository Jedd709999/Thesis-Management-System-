import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Check, Edit, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { panelActions } from '../../services/panelService';

interface PanelActionsProps {
  scheduleId: string;
  onActionComplete?: (result: any) => void;
  disabled?: boolean;
}

const PanelActions: React.FC<PanelActionsProps> = ({ 
  scheduleId, 
  onActionComplete,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'request_revision' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = (type: typeof actionType) => {
    setActionType(type);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setActionType(null);
    setComments('');
  };

  const handleSubmit = async () => {
    if (!actionType) return;
    
    setIsSubmitting(true);
    try {
      let response;
      
      switch (actionType) {
        case 'approve':
          response = await panelActions.approve(scheduleId, comments);
          break;
        case 'request_revision':
          response = await panelActions.requestRevision(scheduleId, comments);
          break;
        case 'reject':
          response = await panelActions.reject(scheduleId, comments);
          break;
      }

      toast.success(`Successfully ${actionType.replace('_', ' ')}d the thesis.`);
      
      if (onActionComplete) {
        onActionComplete({
          action: actionType,
          data: response.data
        });
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Error submitting panel action:', error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} the thesis. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionDetails = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Approve Thesis',
          description: 'You are about to approve this thesis. This will mark it as approved in the system.',
          confirmText: 'Approve',
          variant: 'default' as const,
          icon: <Check className="w-4 h-4" />
        };
      case 'request_revision':
        return {
          title: 'Request Revisions',
          description: 'Please provide details about the required revisions for this thesis.',
          confirmText: 'Request Revisions',
          variant: 'default' as const,
          icon: <Edit className="w-4 h-4" />
        };
      case 'reject':
        return {
          title: 'Reject Thesis',
          description: 'Please provide the reason for rejecting this thesis.',
          confirmText: 'Reject',
          variant: 'destructive' as const,
          icon: <X className="w-4 h-4" />
        };
      default:
        return {
          title: '',
          description: '',
          confirmText: 'Confirm',
          variant: 'default' as const,
          icon: null
        };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <Card className="p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Panel Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          className="bg-primary hover:bg-primary/90"
          onClick={() => handleOpen('approve')}
          disabled={disabled}
        >
          <Check className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button
          variant="default"
          className="bg-yellow-600 hover:bg-yellow-700 text-yellow-50"
          onClick={() => handleOpen('request_revision')}
          disabled={disabled}
        >
          <Edit className="w-4 h-4 mr-2" />
          Request Revisions
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleOpen('reject')}
          disabled={disabled}
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDetails.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionDetails.description}
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter your comments here..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionDetails.variant}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionDetails.icon}
                  {actionDetails.confirmText}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PanelActions;