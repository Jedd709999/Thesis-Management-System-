import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Upload, FileText, AlertCircle, Link } from 'lucide-react';
import { uploadDocument, linkGoogleDoc } from '../../api/documentService';
import { Thesis } from '../../types';

interface DocumentUploadDialogProps {
  thesis: Thesis;
  onUploadSuccess: () => void;
  children: React.ReactNode;
}

export function DocumentUploadDialog({ thesis, onUploadSuccess, children }: DocumentUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [convertToGoogleDoc, setConvertToGoogleDoc] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for Google Docs linking
  const [isLinkingGoogleDoc, setIsLinkingGoogleDoc] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState('');

  // Determine which document types are allowed based on thesis status
  const getAllowedDocumentTypes = (): { value: string; label: string; description: string }[] => {
    const documentTypes = [
      { 
        value: 'concept_paper', 
        label: 'Concept Paper', 
        description: 'Upload your concept paper',
        allowedStatuses: ['TOPIC_APPROVED']
      },
      { 
        value: 'research_proposal', 
        label: 'Research Proposal', 
        description: 'Upload your full research proposal',
        allowedStatuses: ['CONCEPT_APPROVED']
      },
      { 
        value: 'final_manuscript', 
        label: 'Final Manuscript', 
        description: 'Upload your final manuscript',
        allowedStatuses: ['PROPOSAL_APPROVED', 'RESEARCH_IN_PROGRESS']
      },
      { 
        value: 'approval_sheet', 
        label: 'Approval Sheet', 
        description: 'Upload approval sheet',
        allowedStatuses: ['PROPOSAL_APPROVED', 'RESEARCH_IN_PROGRESS', 'FINAL_SUBMITTED']
      },
      { 
        value: 'evaluation_form', 
        label: 'Evaluation Form', 
        description: 'Upload evaluation form',
        allowedStatuses: ['PROPOSAL_APPROVED', 'RESEARCH_IN_PROGRESS', 'FINAL_SUBMITTED']
      }
    ];
    
    // Ensure thesis and thesis.status are defined before filtering
    if (!thesis || !thesis.status) {
      console.warn('Thesis or thesis.status is not defined:', thesis);
      return [];
    }
    
    // Filter document types based on current thesis status
    return documentTypes
      .filter(docType => docType.allowedStatuses.includes(thesis.status))
      .map(({ value, label, description }) => ({ value, label, description }));
  };

  const allowedTypes = getAllowedDocumentTypes();

  // Auto-select the only allowed document type
  React.useEffect(() => {
    if (Array.isArray(allowedTypes) && allowedTypes.length === 1) {
      setDocumentType(allowedTypes[0].value);
    } else if (Array.isArray(allowedTypes) && allowedTypes.length === 0) {
      setDocumentType('');
    }
  }, [allowedTypes]);

  const resetForm = () => {
    setTitle('');
    setDocumentType('');
    setFile(null);
    setConvertToGoogleDoc(true);
    setError('');
    setGoogleDocUrl('');
    setIsLinkingGoogleDoc(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!documentType) {
      setError('Please select a document type');
      return false;
    }
    
    if (isLinkingGoogleDoc) {
      // Validate Google Docs URL
      if (!googleDocUrl.trim()) {
        setError('Please enter a Google Docs URL');
        return false;
      }
      
      if (!googleDocUrl.includes('docs.google.com/document/d/')) {
        setError('Please enter a valid Google Docs URL');
        return false;
      }
    } else {
      // Validate file upload
      if (!file) {
        setError('Please select a file to upload');
        return false;
      }
      
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Only PDF and Word documents are allowed');
        return false;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsUploading(true);
    setError('');
    
    try {
      if (isLinkingGoogleDoc) {
        // Link existing Google Doc
        const payload = {
          google_doc_url: googleDocUrl,
          thesis: thesis.id,
          title,
          document_type: documentType
        };
        
        await linkGoogleDoc(payload);
      } else {
        // Upload local file
        if (!file) throw new Error('No file selected');
        
        const formData = new FormData();
        formData.append('thesis', thesis.id);
        formData.append('title', title);
        formData.append('file', file);
        formData.append('convert_to_google_doc', convertToGoogleDoc.toString());
        formData.append('document_type', documentType);
        
        await uploadDocument(formData);
      }
      
      onUploadSuccess();
      handleOpenChange(false);
    } catch (err: any) {
      console.error('Upload error:', err);
      // Provide more detailed error information
      let errorMessage = 'Failed to upload document';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // If no document types are allowed (only when TOPIC_SUBMITTED), don't render the dialog trigger
  if (Array.isArray(allowedTypes) && allowedTypes.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLinkingGoogleDoc ? (
              <>
                <Link className="w-5 h-5" />
                Link Google Doc
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Document
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isLinkingGoogleDoc 
              ? 'Link an existing Google Doc to your thesis' 
              : 'Upload a document for your thesis (PDF or Word only)'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={isUploading}
            />
          </div>
          
          <div>
            <Label htmlFor="documentType">Document Type</Label>
            <Select 
              value={documentType} 
              onValueChange={setDocumentType} 
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {documentType && (
              <p className="text-sm text-slate-500 mt-1">
                {allowedTypes.find(t => t.value === documentType)?.description}
              </p>
            )}
          </div>
          
          {/* Toggle between file upload and Google Docs linking */}
          <div className="flex border rounded-lg p-1 bg-slate-50">
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                !isLinkingGoogleDoc 
                  ? 'bg-white shadow text-slate-900 font-medium' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setIsLinkingGoogleDoc(false)}
              disabled={isUploading}
            >
              Upload File
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                isLinkingGoogleDoc 
                  ? 'bg-white shadow text-slate-900 font-medium' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setIsLinkingGoogleDoc(true)}
              disabled={isUploading}
            >
              Link Google Doc
            </button>
          </div>
          
          {isLinkingGoogleDoc ? (
            // Google Docs linking form
            <div>
              <Label htmlFor="googleDocUrl">Google Docs URL</Label>
              <Input
                id="googleDocUrl"
                value={googleDocUrl}
                onChange={(e) => setGoogleDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                disabled={isUploading}
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter the full URL of your Google Doc
              </p>
            </div>
          ) : (
            // File upload form
            <>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Only PDF and Word documents are allowed (max 100MB)
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  id="convertToGoogleDoc"
                  type="checkbox"
                  checked={convertToGoogleDoc}
                  onChange={(e) => setConvertToGoogleDoc(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-slate-300 text-primary focus:ring-ring"
                />
                <Label htmlFor="convertToGoogleDoc" className="text-sm">
                  Convert to Google Doc (recommended)
                </Label>
              </div>
            </>
          )}
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !title.trim() || !documentType || 
                (isLinkingGoogleDoc ? !googleDocUrl.trim() : !file)}
            >
              {isUploading ? (isLinkingGoogleDoc ? 'Linking...' : 'Uploading...') : 
                (isLinkingGoogleDoc ? 'Link Google Doc' : 'Upload')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}