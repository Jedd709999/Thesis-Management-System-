from django.db import transaction
from api.models.document_models import Document, DocumentVersion
from api.models.thesis_models import Thesis
from api.services.google_drive_service import drive_service

def handle_document_uploaded(document, actor):
    """
    Handle document upload and transition thesis status accordingly.
    
    Args:
        document: Document instance that was uploaded
        actor: User who performed the upload
    
    Returns:
        Updated thesis instance
    """
    # Mapping of document types to thesis statuses
    status_mapping = {
        'concept_paper': 'CONCEPT_SUBMITTED',
        'research_proposal': 'PROPOSAL_SUBMITTED',
        'final_manuscript': 'FINAL_SUBMITTED',
    }
    
    # Get the thesis associated with the document
    thesis = document.thesis
    
    # If document type maps to a thesis status, update the thesis
    if document.document_type in status_mapping:
        new_status = status_mapping[document.document_type]
        thesis.status = new_status
        thesis.save(update_fields=['status'])
    
    return thesis

def convert_to_google_doc(document, file_content=None):
    """
    Convert a document to Google Doc format and update document fields.
    
    Args:
        document: Document instance
        file_content: File content bytes (optional, if not provided will read from file)
    
    Returns:
        Tuple of (success: bool, error_message: str or None)
    """
    try:
        # If file_content not provided, read from the document file
        if file_content is None and document.file:
            with open(document.file.path, 'rb') as f:
                file_content = f.read()
        
        if not file_content:
            return False, "No file content to convert"
        
        # Get the document name
        filename = f"{document.get_document_type_display()}_{document.id}"
        
        # Upload to Google Drive first
        success, file_info = drive_service.upload_file(
            file_content, 
            f"{filename}.pdf" if document.mime_type == 'application/pdf' else f"{filename}.docx",
            document.mime_type
        )
        
        if not success or not file_info:
            return False, "Failed to upload file to Google Drive"
        
        # Convert to Google Doc
        success, google_doc_id = drive_service.convert_to_google_doc(file_info['id'])
        
        if not success or not google_doc_id:
            return False, "Failed to convert file to Google Doc"
        
        # Update document fields
        document.is_google_doc = True
        document.google_doc_id = google_doc_id
        document.google_doc_edit_url = drive_service.get_google_doc_edit_url(google_doc_id)
        document.viewer_url = file_info.get('web_view_link')
        document.doc_embed_url = file_info.get('embed_url')
        document.google_drive_file_id = file_info['id']
        document.last_synced_at = timezone.now()
        document.save(update_fields=[
            'is_google_doc', 'google_doc_id', 'google_doc_edit_url',
            'viewer_url', 'doc_embed_url', 'google_drive_file_id', 'last_synced_at'
        ])
        
        # Create document version record
        DocumentVersion.objects.create(
            document=document,
            file_storage_id=file_info['id'],
            version=document.version,
            google_doc_id=google_doc_id,
            is_google_doc=True,
            created_by=document.uploaded_by
        )
        
        return True, None
        
    except Exception as e:
        return False, str(e)

def create_document_version(document, actor):
    """
    Create a new version of a document.
    
    Args:
        document: Document instance
        actor: User who is creating the new version
    
    Returns:
        New Document instance
    """
    with transaction.atomic():
        # Increment version number
        new_version_number = document.version + 1
        
        # Create new document version
        new_document = Document.objects.create(
            thesis=document.thesis,
            topic_proposal=document.topic_proposal,
            uploaded_by=actor,
            document_type=document.document_type,
            version=new_version_number,
            is_google_doc=document.is_google_doc,
            google_doc_id=document.google_doc_id,
            google_doc_edit_url=document.google_doc_edit_url,
            viewer_url=document.viewer_url,
            doc_embed_url=document.doc_embed_url,
            google_drive_file_id=document.google_drive_file_id,
            mime_type=document.mime_type,
            file_size=document.file_size
        )
        
        # Copy file if it exists
        if document.file:
            # Note: In a real implementation, you would copy the actual file
            # For now, we'll just copy the file reference
            new_document.file = document.file
        
        # Create version record
        DocumentVersion.objects.create(
            document=new_document,
            file_storage_id=document.google_drive_file_id or (document.file.name if document.file else ''),
            version=new_version_number,
            google_doc_id=document.google_doc_id,
            is_google_doc=document.is_google_doc,
            created_by=actor
        )
        
        return new_document

def sync_google_doc_metadata(document):
    """
    Sync Google Doc metadata with the document record.
    
    Args:
        document: Document instance
    
    Returns:
        Success status
    """
    if not document.is_google_doc or not document.google_doc_id:
        return False
    
    try:
        # Get file info from Google Drive
        file_info = drive_service.get_file_info(document.google_doc_id)
        if not file_info:
            return False
        
        # Update document metadata
        document.viewer_url = file_info.get('web_view_link')
        document.doc_embed_url = file_info.get('embed_url')
        document.mime_type = file_info.get('mime_type')
        document.file_size = file_info.get('size', 0)
        document.last_synced_at = timezone.now()
        
        document.save(update_fields=[
            'viewer_url', 'doc_embed_url', 'mime_type', 
            'file_size', 'last_synced_at'
        ])
        
        return True
        
    except Exception as e:
        print(f"Error syncing Google Doc metadata: {e}")
        return False