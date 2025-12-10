import { useEffect, useState } from 'react';
import { 
  Upload, 
  Grid3x3, 
  List, 
  Filter, 
  Download, 
  Eye, 
  Share2, 
  FileText, 
  File, 
  Table, 
  Presentation, 
  Trash2, 
  ExternalLink,
  Search,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { fetchDocuments, deleteDocument, fetchDocument, downloadDocument, updateDocumentStatus, syncDocument, linkDocumentToDrive } from '../../api/documentService';
import type { Document, Group, Thesis } from '../../types';
import { DocumentUploadDialog } from '../../components/document/DocumentUploadDialog';
import { useAuth } from '../../hooks/useAuth';
import { useDriveConnection } from '../../hooks/useDriveConnection';
import { fetchUserTheses, fetchCurrentUserTheses } from '../../api/thesisService';
import { fetchUserGroups } from '../../api/groupService';

interface DocumentManagerProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

export function DocumentManager({ userRole }: DocumentManagerProps) {
  const { user } = useAuth();
  const { isDriveConnected, isDriveReconnected, checkDriveConnection } = useDriveConnection();
  
  // State declarations
  const [documents, setDocuments] = useState<Document[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid'>('grid');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'title' | 'document_type'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDriveAlert, setShowDriveAlert] = useState(false);
  
  console.log('DocumentManager component mounted');
  console.log('DocumentManager props:', { userRole });
  console.log('DocumentManager user context:', user);

  // Debug logging
  console.log('DocumentManager: userRole prop:', userRole);
  console.log('DocumentManager: user context:', user);
  console.log('DocumentManager: user role from context:', user?.role);

  // Helper function to check if thesis allows document uploads
  const canUploadDocuments = (thesis: Thesis) => {
    // Students cannot upload documents if thesis status is TOPIC_SUBMITTED or TOPIC_REJECTED
    return thesis.status !== 'TOPIC_SUBMITTED' && thesis.status !== 'TOPIC_REJECTED';
  };

  useEffect(() => {
    console.log('DocumentManager useEffect triggered');
    console.log('Current userRole:', userRole);
    console.log('Current user:', user);
    
    const loadDocuments = async () => {
      try {
        setLoading(true);
        console.log('Fetching documents...');
        const fetchedDocuments = await fetchDocuments();
        console.log('Fetched documents response:', fetchedDocuments);
        console.log('User role:', userRole);
        console.log('User context:', user);
        console.log('Number of documents fetched:', fetchedDocuments.length);
        setDocuments(fetchedDocuments);        
        // Load user theses and groups for document upload
        if (userRole === 'student') {
          let allTheses = [];
          
          try {
            // Try to fetch user theses first
            console.log('Fetching user theses...');
            const userTheses = await fetchUserTheses();
            console.log('User theses response:', userTheses);
            allTheses = userTheses;
          } catch (thesisError) {
            console.warn('Could not fetch user theses:', thesisError);
          }
          
          // If no user theses found, try current user theses
          if (allTheses.length === 0) {
            try {
              console.log('Fetching current user theses...');
              const currentUserTheses = await fetchCurrentUserTheses();
              console.log('Current user theses response:', currentUserTheses);
              allTheses = currentUserTheses;
            } catch (currentThesisError) {
              console.warn('Could not fetch current user theses:', currentThesisError);
            }
          }
          
          setTheses(allTheses);
          
          try {
            // Fetch user groups to check if they can create a thesis
            console.log('Fetching user groups...');
            const userGroups = await fetchUserGroups();
            console.log('User groups response:', userGroups);
            setGroups(userGroups);
          } catch (groupError) {
            console.warn('Could not fetch user groups:', groupError);
            setGroups([]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [userRole, user]);
  const getFileIcon = (documentType: string) => {
    // Extract file extension from document type
    const type = documentType?.split('_').pop()?.toUpperCase() || 'FILE';
    
    switch (type) {
      case 'PAPER':
      case 'MANUSCRIPT':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'PROPOSAL':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'SHEET':
      case 'FORM':
        return <Table className="w-6 h-6 text-blue-600" />;
      case 'PRESENTATION':
        return <Presentation className="w-6 h-6 text-blue-600" />;
      default:
        return <File className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'under review':
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getDocumentTypeLabel = (type?: string | null) => {
    if (!type) return 'Unknown';
    
    const typeLabels: Record<string, string> = {
      'concept_paper': 'Concept Paper',
      'research_proposal': 'Research Proposal',
      'final_manuscript': 'Final Manuscript',
      'approval_sheet': 'Approval Sheet',
      'evaluation_form': 'Evaluation Form'
    };
    
    return typeLabels[type] || 
      type.split('_')
         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
         .join(' ') || 
      'Unknown';
  };

  // Helper function to safely get group name from document
  const getGroupName = (document: Document) => {
    // Check thesis_detail first
    if (document.thesis_detail && typeof document.thesis_detail === 'object' && 'group' in document.thesis_detail) {
      const group = document.thesis_detail.group;
      if (group && typeof group === 'object' && 'name' in group) {
        return (group as Group).name;
      }
    }
    
    // Fallback to thesis
    if (document.thesis && typeof document.thesis === 'object' && 'group' in document.thesis) {
      const group = document.thesis.group;
      if (group && typeof group === 'object' && 'name' in group) {
        return (group as Group).name;
      }
    }
    
    return 'Unknown Group';
  };

  // Filter and sort documents
  const filteredDocuments = (Array.isArray(documents) ? documents : [])
    .filter(doc => {
      // Log all documents before filtering
      console.log('Processing document for filtering:', doc);
      
      // Apply search filter
      const matchesSearch = searchTerm === '' || 
        (doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Apply file type filter
      const matchesFileType = fileTypeFilter === 'all' || doc.document_type === fileTypeFilter;
      
      console.log('Document filter check:', {
        document: doc,
        searchTerm,
        fileTypeFilter,
        matchesSearch,
        matchesFileType
      });
      
      return matchesSearch && matchesFileType;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });
  
  console.log('Filtered documents:', filteredDocuments);
  console.log('Total documents:', documents.length);
  console.log('Filtered count:', filteredDocuments.length);
  
  // Check if user has any documents and display appropriate message
  const hasDocuments = Array.isArray(documents) && documents.length > 0;
  const hasFilteredDocuments = filteredDocuments.length > 0;
  
  console.log('Has documents:', hasDocuments);
  console.log('Has filtered documents:', hasFilteredDocuments);
  console.log('Current search term:', searchTerm);
  console.log('Current file type filter:', fileTypeFilter);

  const handleUploadSuccess = () => {
    // Refresh documents list after successful upload
    const loadDocuments = async () => {
      try {
        const fetchedDocuments = await fetchDocuments();
        setDocuments(fetchedDocuments);
      } catch (err) {
        console.error('Error refreshing documents:', err);
      }
    };

    loadDocuments();
  };

  // Handler for viewing a document
  const handleViewDocument = async (documentId: string) => {
    try {
      // First, check if the user is a panel member and the document is in a viewable state
      if (userRole === 'panel') {
        // Ensure documents is an array before using find
        const documentsArray = Array.isArray(documents) ? documents : [];
        const doc = documentsArray.find(d => d.id === documentId);
        if (doc && !['submitted', 'approved', 'revision', 'rejected'].includes(doc.status)) {
          alert('You can only view documents that have been submitted, approved, or require revision.');
          return;
        }
      }
      
      const doc = await fetchDocument(documentId);
      
      // If the document has a viewer_url, open that
      if (doc.viewer_url) {
        window.open(doc.viewer_url, '_blank');
      } 
      // If it's a Google Doc, open the edit URL
      else if (doc.google_doc_edit_url) {
        window.open(doc.google_doc_edit_url, '_blank');
      }
      // Otherwise, try to construct a Google Drive URL
      else if (doc.google_drive_file_id) {
        window.open(`https://drive.google.com/file/d/${doc.google_drive_file_id}/view`, '_blank');
      }
      else {
        alert('Unable to open document viewer. Please try downloading instead.');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);
      if (error.response?.status === 404) {
        // Document not found in database, remove it from the local state
        // Ensure documents is an array before using filter
        setDocuments(prevDocs => {
          const docsArray = Array.isArray(prevDocs) ? prevDocs : [];
          return docsArray.filter(doc => doc.id !== documentId);
        });
        alert('This document no longer exists and has been removed from the list.');
      } else if (error.response?.status === 403) {
        // Permission denied
        alert('You do not have permission to view this document.');
      } else {
        alert('Failed to view document. Please try again.');
      }
    }
  };

  // Handler for approving a document
  const handleApproveDocument = async (documentId: string) => {
    try {
      // Confirm with user before approving
      const confirmed = window.confirm('Are you sure you want to approve this document? This action cannot be undone.');
      
      if (confirmed) {
        await updateDocumentStatus(documentId, 'approved');
        // Refresh documents list
        const fetchedDocuments = await fetchDocuments();
        setDocuments(fetchedDocuments);
        alert('Document approved successfully');
      }
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Failed to approve document. Please try again.');
    }
  };

  // Handler for requesting revision on a document
  const handleRequestRevision = async (documentId: string) => {
    try {
      // Confirm with user before requesting revision
      const confirmed = window.confirm('Are you sure you want to request revision for this document? The student will need to make changes and resubmit.');
      
      if (confirmed) {
        await updateDocumentStatus(documentId, 'revision');
        // Refresh documents list
        const fetchedDocuments = await fetchDocuments();
        setDocuments(fetchedDocuments);
        alert('Revision requested successfully');
      }
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('Failed to request revision. Please try again.');
    }
  };

  // Handler for rejecting a document
  const handleRejectDocument = async (documentId: string) => {
    try {
      // Confirm with user before rejecting
      const confirmed = window.confirm('Are you sure you want to reject this document? This action cannot be undone and the student will need to upload a new version.');
      
      if (confirmed) {
        await updateDocumentStatus(documentId, 'rejected');
        // Refresh documents list
        const fetchedDocuments = await fetchDocuments();
        setDocuments(fetchedDocuments);
        alert('Document rejected successfully');
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document. Please try again.');
    }
  };

  // Helper function to check if user is adviser for document's thesis
  const isAdviserForDocument = (document: Document) => {
    // Check if user is adviser for the document's thesis
    console.log('isAdviserForDocument: userRole check:', userRole);
    if (userRole !== 'adviser') return false;
    
    // Use thesis_detail if available, otherwise fall back to thesis
    const thesisData = document.thesis_detail || document.thesis;
    if (!thesisData) {
      console.log('isAdviserForDocument: No thesis data found for document:', document.id);
      return false;
    }
    
    // Check if thesis is a Thesis object
    if (typeof thesisData === 'string') {
      console.log('isAdviserForDocument: Thesis data is a string, not object:', thesisData);
      return false;
    }
    const thesis = thesisData;
    
    // Check if group exists and is a Group object
    if (!thesis.group || typeof thesis.group === 'string') {
      console.log('isAdviserForDocument: No group data or group is string:', thesis.group);
      return false;
    }
    const group = thesis.group;
    
    // Check if adviser exists
    if (!group.adviser) {
      console.log('isAdviserForDocument: No adviser in group data:', group);
      return false;
    }
    
    // Compare IDs (could be strings or numbers)
    const adviserId = String(group.adviser.id);
    const userId = String(user?.id);
    
    const isAdviser = adviserId === userId;
    
    // Debug logging
    console.log('Adviser check:', { adviserId, userId, isAdviser, documentId: document.id, group, thesis });
    
    return isAdviser;
  };

  // Helper function to check if user can act on a document (adviser or panel)
  const canActOnDocument = (document: Document) => {
    console.log('canActOnDocument: userRole check:', userRole);
    console.log('canActOnDocument: document status:', document.status);
    console.log('canActOnDocument: document data:', document);
    
    const isAdviser = userRole === 'adviser' && isAdviserForDocument(document);
    const isPanel = userRole === 'panel' && isPanelForDocument(document);
    const canAct = isAdviser || isPanel;
    
    // Debug logging
    console.log('Can act on document check:', { documentId: document.id, userRole, isAdviser, isPanel, canAct });
    
    return canAct;
  };

  // Helper function to check if user is panel member for document's thesis
  const isPanelForDocument = (document: Document) => {
    // Check if user is panel member for the document's thesis
    console.log('isPanelForDocument: userRole check:', userRole);
    if (userRole !== 'panel') return false;
    
    // Use thesis_detail if available, otherwise fall back to thesis
    const thesisData = document.thesis_detail || document.thesis;
    if (!thesisData) {
      console.log('isPanelForDocument: No thesis data found for document:', document.id);
      return false;
    }
    
    // Check if thesis is a Thesis object
    if (typeof thesisData === 'string') {
      console.log('isPanelForDocument: Thesis data is a string, not object:', thesisData);
      return false;
    }
    const thesis = thesisData;
    
    // Check if group exists and is a Group object
    if (!thesis.group || typeof thesis.group === 'string') {
      console.log('isPanelForDocument: No group data or group is string:', thesis.group);
      return false;
    }
    const group = thesis.group;
    
    // Check if panels array exists
    if (!Array.isArray(group.panels)) {
      console.log('isPanelForDocument: Panels is not an array:', group.panels);
      return false;
    }
    
    // Check if user ID exists
    if (!user?.id) {
      console.log('isPanelForDocument: No user ID found');
      return false;
    }
    
    // Compare IDs (could be strings or numbers)
    const userId = String(user.id);
    
    const isPanel = group.panels.some((panel: any) => {
      if (!panel || !panel.id) return false;
      return String(panel.id) === userId;
    });
    
    // Debug logging
    console.log('Panel check:', { 
      userId, 
      panels: group.panels.map((p: any) => p.id), 
      isPanel, 
      documentId: document.id,
      group,
      thesis
    });
    
    return isPanel;
  };

  // Handler for downloading a document
  // Added explicit typing to help TypeScript compiler
  const handleDownloadDocument = async (documentId: string) => {
    try {
      const blob = await downloadDocument(documentId);
      
      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get the document to set the correct filename
      try {
        // Ensure documents is an array before using find
        const documentsArray = Array.isArray(documents) ? documents : [];
        const doc = documentsArray.find(d => d.id === documentId);
        if (doc?.file) {
          // Extract filename from the file URL
          const filename = doc.file.split('/').pop() || 'document';
          a.download = filename;
        } else {
          a.download = 'document';
        }
      } catch (e) {
        a.download = 'document';
      }
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      if (error.response?.status === 404) {
        // Document not found in database, remove it from the local state
        // Ensure documents is an array before using filter
        setDocuments(prevDocs => {
          const docsArray = Array.isArray(prevDocs) ? prevDocs : [];
          return docsArray.filter(doc => doc.id !== documentId);
        });
        alert('This document no longer exists and has been removed from the list.');
      } else {
        alert('Failed to download document. Please try again.');
      }
    }
  };

  // Handler for sharing a document
  const handleShareDocument = (documentId: string) => {
    alert('Share functionality would open here. In a full implementation, this would allow you to share the document with others.');
  };

  // Handler for submitting a document
  const handleSubmitDocument = async (documentId: string) => {
    try {
      // Confirm with user before submitting
      const confirmed = window.confirm('Are you sure you want to submit this document? Once submitted, it will be sent for review.');
      
      if (confirmed) {
        // Update document status to 'submitted'
        const updatedDocument = await updateDocumentStatus(documentId, 'submitted');
        
        // Update the document in the state
        // Ensure documents is an array before using map
        setDocuments(prevDocuments => {
          const docsArray = Array.isArray(prevDocuments) ? prevDocuments : [];
          return docsArray.map(doc => 
            doc.id === documentId ? updatedDocument : doc
          );
        });
        
        alert('Document submitted successfully for review!');
      }
    } catch (error) {
      console.error('Error submitting document:', error);
      alert('Failed to submit document. Please try again.');
    }
  };

  // Handler for deleting a document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Confirm with user before deleting
      const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
      
      if (confirmed) {
        try {
          // Try to delete the document
          await deleteDocument(documentId);
          alert('Document deleted successfully!');
        } catch (error: any) {
          // If it's a 404, 403, or permission error, we'll still remove it from the UI
          if (error.response?.status === 404 || 
              error.response?.status === 403 || 
              error.response?.data?.error?.includes('permission') ||
              error.response?.status === 500) {
            console.log('Document not found or no permission, removing from UI');
          } else {
            // Re-throw other errors
            throw error;
          }
        }
        
        // Always remove from the UI state
        setDocuments(prevDocs => {
          const docsArray = Array.isArray(prevDocs) ? prevDocs : [];
          return docsArray.filter(doc => doc.id !== documentId);
        });
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      if (error.response?.status === 404) {
        alert('This document no longer exists and has been removed from the list.');
      } else if (error.response?.status === 403 || error.response?.data?.error?.includes('permission')) {
        alert('You do not have permission to delete this document.');
      } else {
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
            <p className="text-slate-600">Loading documents...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
            <p className="text-slate-600">Error: {error}</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Documents</h3>
          <p className="text-slate-500 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
          <p className="text-slate-600">Manage research documents and files with Google Drive integration</p>
        </div>
        <div className="flex flex-col items-end">
          {userRole === 'student' && theses.length > 0 && canUploadDocuments(theses[0]) && (
            <DocumentUploadDialog 
              thesis={theses[0]} 
              onUploadSuccess={handleUploadSuccess}
            >
              <Button 
                className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2 rounded-md px-4 py-2"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </DocumentUploadDialog>
          )}
        </div>
        {userRole === 'student' && theses.length > 0 && !canUploadDocuments(theses[0]) && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 w-full">
            <p className="text-amber-700 text-sm flex items-start">
              <AlertCircle className="w-4 h-4 inline mr-2 mt-0.5 flex-shrink-0" />
              <span>You must have an approved topic before you can upload documents. Please wait for your adviser to approve your topic proposal.</span>
            </p>
          </div>
        )}
      </div>

      {/* Google Drive Re-authentication Alert */}
      {showDriveAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-700 mb-1">Google Drive Authentication Required</h3>
              <p className="text-red-600 text-sm mb-3">Your Google Drive credentials have expired or are missing required information. Please reconnect your Google Drive account to continue using document storage features.</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-red-200 text-red-700 hover:bg-red-100"
                  onClick={async () => {
                    // Trigger Google Drive re-authentication
                    try {
                      console.log('DocumentManager: Initiating Google Drive re-authentication');
                      // This would open the Google OAuth flow
                      // For now, we'll just update the connection status
                      checkDriveConnection();
                      console.log('DocumentManager: Drive connection after re-auth attempt - connected:', isDriveConnected, 'reconnected:', isDriveReconnected);
                      setShowDriveAlert(false);
                      
                      // In a real implementation, you would redirect to the Google OAuth flow
                      // and then update the connection status after successful authentication
                      console.log('DocumentManager: Completed Google Drive re-authentication');
                    } catch (error) {
                      console.error('DocumentManager: Error initiating Google Drive re-authentication:', error);
                    }
                  }}
                >
                  Reconnect Google Drive
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setShowDriveAlert(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="concept_paper">Concept Papers</SelectItem>
                  <SelectItem value="research_proposal">Research Proposals</SelectItem>
                  <SelectItem value="final_manuscript">Final Manuscripts</SelectItem>
                  <SelectItem value="approval_sheet">Approval Sheets</SelectItem>
                  <SelectItem value="evaluation_form">Evaluation Forms</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="document_type">Type</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2"
              >
                {sortDirection === 'asc' ? '↑' : '↓'} Sort
              </Button>
            </div>
          </div>
          

        </div>
      </Card>

      {/* Empty State */}
      {(Array.isArray(documents) ? documents : []).length === 0 && (
        <div className="p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Get started by uploading your first research document.
          </p>
        </div>
      )}

      {/* No Results State */}
      {(Array.isArray(documents) ? documents : []).length > 0 && filteredDocuments.length === 0 && (
        <div className="p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-slate-900 mb-2">No documents found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            There are currently no documents matching your filters. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && filteredDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
                  {getFileIcon(doc.document_type || '')}
                </div>
                <Badge variant="secondary" className={getStatusColor(doc.status)}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">{doc.title}</h3>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-medium">Type:</span> {getDocumentTypeLabel(doc.document_type)}
                  </p>
                  <p>
                    <span className="font-medium">Group:</span> {getGroupName(doc)}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span> {doc.file_size_display || 'Unknown size'}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span> {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {(doc.google_doc_edit_url || doc.viewer_url || doc.google_drive_file_id) && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={() => handleViewDocument(doc.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            onClick={async () => {
                              try {
                                const blob = await downloadDocument(doc.id);
                                
                                // Create a temporary link to trigger download
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                
                                // Try to get the document to set the correct filename
                                try {
                                  const documentData = documents.find(d => d.id === doc.id);
                                  if (documentData?.file) {
                                    // Extract filename from the file URL
                                    const filename = documentData.file.split('/').pop() || 'document';
                                    a.download = filename;
                                  } else {
                                    a.download = 'document';
                                  }
                                } catch (e) {
                                  a.download = 'document';
                                }
                                
                                document.body.appendChild(a);
                                a.click();
                                
                                // Clean up
                                setTimeout(() => {
                                  document.body.removeChild(a);
                                  window.URL.revokeObjectURL(url);
                                }, 0);
                              } catch (error: any) {
                                console.error('Error downloading document:', error);
                                if (error.response?.status === 404) {
                                  // Document not found in database, remove it from the local state
                                  setDocuments(prevDocs => {
                                                                    const docsArray = Array.isArray(prevDocs) ? prevDocs : [];
                                                                    return docsArray.filter(d => d.id !== doc.id);
                                                                  });
                                  alert('This document no longer exists and has been removed from the list.');
                                } else {
                                  alert('Failed to download document. Please try again.');
                                }
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
                
                {userRole === 'student' && (doc.status === 'draft' || doc.status === 'revision') && (
                  <TooltipProvider key="submit-tooltip">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={async () => {
                            try {
                              // Confirm with user before submitting
                              const confirmed = window.confirm('Are you sure you want to submit this document? Once submitted, it will be sent for review.');
                              
                              if (confirmed) {
                                // Update document status to 'submitted'
                                const updatedDocument = await updateDocumentStatus(doc.id, 'submitted');
                                
                                // Update the document in the state
                                setDocuments(prevDocuments => 
                                  prevDocuments.map(d => 
                                    d.id === doc.id ? updatedDocument : d
                                  )
                                );
                                
                                alert('Document submitted successfully for review!');
                              }
                            } catch (error) {
                              console.error('Error submitting document:', error);
                              alert('Failed to submit document. Please try again.');
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Submit Document</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Link to Google Drive button - for local documents */}
                {(doc.provider === 'local' || !doc.google_drive_file_id) && (
                  <>
                    <TooltipProvider key="link-tooltip">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                          onClick={async () => {
                            try {
                              // Show confirmation dialog
                              const confirmed = window.confirm('This will attempt to link this document to its corresponding file in Google Drive. Continue?');
                              if (!confirmed) return;
                              
                              // Call link API
                              const updatedDoc = await linkDocumentToDrive(doc.id);
                              
                              // Update document in state
                              setDocuments(prevDocs => 
                                prevDocs.map(d => d.id === doc.id ? updatedDoc : d)
                              );
                              
                              alert('Document successfully linked to Google Drive!');
                            } catch (error: any) {
                              console.error('Error linking document:', error);
                              const errorMsg = error.response?.data?.error || 'Failed to link document to Google Drive. Please try again.';
                              // Provide more detailed error information to the user
                              alert('Error linking document to Google Drive:\n\n' + errorMsg + '\n\nPlease check that the file exists in Google Drive with the exact same name.');
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Link to Google Drive</p>
                      </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                   
                    {/* Info button for debugging */}
                    <TooltipProvider key="info-tooltip">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2"
                            onClick={() => {
                              // Show information about what we're looking for
                              const fileInfo = 'Looking for file: ' + 
                                (doc.file ? doc.file.split('/').pop() : 'Unknown') + '\n' +
                                'Document ID: ' + doc.id + '\n' +
                                'Thesis ID: ' + doc.thesis + '\n' +
                                'Provider: ' + doc.provider + '\n' +
                                'Has file attachment: ' + (doc.file ? 'Yes' : 'No');
                            
                              alert('Document Linking Information:\n\n' + fileInfo + '\n\nThis information shows what file the system is looking for in Google Drive. The file should have the exact same name and be located in the thesis folder in Google Drive.');
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Linking Info</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}



                {/* Adviser action buttons - only show for submitted documents and for advisers/panels assigned to the thesis */}
                {doc.status === 'submitted' && (() => {
                  console.log('canActOnDocument: userRole check:', userRole);
                  console.log('canActOnDocument: document status:', doc.status);
                  console.log('canActOnDocument: document data:', doc);
                  
                  const isAdviser = userRole === 'adviser' && isAdviserForDocument(doc);
                  const isPanel = userRole === 'panel' && isPanelForDocument(doc);
                  const canAct = isAdviser || isPanel;
                  
                  // Debug logging
                  console.log('Can act on document check:', { documentId: doc.id, userRole, isAdviser, isPanel, canAct });
                  
                  return canAct;
                })() && (
                  <div className="flex space-x-1 border-l border-slate-200 pl-2 ml-2">
                    <TooltipProvider key="approve-tooltip">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                            onClick={() => handleApproveDocument(doc.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Approve Document</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider key="revision-tooltip">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 p-2"
                            onClick={() => handleRequestRevision(doc.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Request Revision</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider key="reject-tooltip">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                            onClick={() => handleRejectDocument(doc.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reject Document</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Delete button - available only for students and admins */}
                {(userRole === 'student' || userRole === 'admin') && (
                  <TooltipProvider key="delete-tooltip">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          onClick={async () => {
                            try {
                              // Confirm with user before deleting
                              const confirmed = window.confirm('Are you sure you want to delete this document? This action cannot be undone.');
                              
                              if (confirmed) {
                                try {
                                  // Try to delete the document
                                  await deleteDocument(doc.id);
                                  alert('Document deleted successfully!');
                                } catch (error: any) {
                                  // If it's a 404, 403, or permission error, we'll still remove it from the UI
                                  if (error.response?.status === 404 || 
                                      error.response?.status === 403 || 
                                      error.response?.data?.error?.includes('permission') ||
                                      error.response?.status === 500) {
                                    console.log('Document not found or no permission, removing from UI');
                                  } else {
                                    // Re-throw other errors
                                    throw error;
                                  }
                                }
                                
                                // Always remove from the UI state
                                setDocuments(prevDocs => {
                                  const docsArray = Array.isArray(prevDocs) ? prevDocs : [];
                                  return docsArray.filter(d => d.id !== doc.id);
                                });
                              }
                            } catch (error: any) {
                              console.error('Error deleting document:', error);
                              if (error.response?.status === 404) {
                                alert('This document no longer exists and has been removed from the list.');
                              } else if (error.response?.status === 403 || error.response?.data?.error?.includes('permission')) {
                                alert('You do not have permission to delete this document.');
                              } else {
                                alert('Failed to delete document. Please try again.');
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Document</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}