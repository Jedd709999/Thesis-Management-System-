import uuid
from django.db import models
from django.utils import timezone
from .thesis_models import Thesis
from .user_models import User

class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('concept_paper', 'Concept Paper'),
        ('research_proposal', 'Research Proposal'),
        ('final_manuscript', 'Final Manuscript'),
        ('approval_sheet', 'Approval Sheet'),
        ('evaluation_form', 'Evaluation Form'),
    )
    
    DOCUMENT_STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('revision', 'Revision'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    PROVIDER_CHOICES = (
        ('local', 'Local Storage'),
        ('drive', 'Google Drive'),
        ('google', 'Google Docs'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thesis = models.ForeignKey(
        Thesis, 
        on_delete=models.CASCADE, 
        related_name='documents',
        null=True,  # Changed back to null=True to avoid migration issues
        blank=True  # Changed back to blank=True to avoid migration issues
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='uploaded_documents'
    )
    document_type = models.CharField(
        max_length=32, 
        choices=DOCUMENT_TYPE_CHOICES, 
        default='concept_paper'
    )
    status = models.CharField(
        max_length=20,
        choices=DOCUMENT_STATUS_CHOICES,
        default='draft'
    )
    provider = models.CharField(
        max_length=10,
        choices=PROVIDER_CHOICES,
        default='local'
    )
    file = models.FileField(upload_to='documents/%Y/%m/%d/', blank=True, null=True)
    file_storage_id = models.CharField(max_length=255, blank=True, null=True)
    viewer_url = models.URLField(blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_size = models.BigIntegerField(default=0)
    version = models.PositiveIntegerField(default=1)
    google_drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    google_doc_id = models.CharField(max_length=255, blank=True, null=True)
    is_google_doc = models.BooleanField(default=False)
    google_doc_edit_url = models.URLField(blank=True, null=True)
    doc_embed_url = models.TextField(blank=True, null=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        if self.title:
            return f"{self.title} - v{self.version}"
        return f"{self.get_document_type_display()} - v{self.version}"
        
    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        
    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

    def create_new_version(self, file_obj, uploaded_by, **kwargs):
        """Create a new version of this document."""
        new_version = Document.objects.create(
            thesis=self.thesis,
            uploaded_by=uploaded_by,
            document_type=self.document_type,
            version=self.version + 1,
            **kwargs
        )
        
        # Handle file upload
        if file_obj:
            new_version.file.save(file_obj.name, file_obj, save=True)
            
        return new_version
        
    def get_absolute_url(self):
        """Get the URL to view this document."""
        if self.viewer_url:
            return self.viewer_url
        elif self.file:
            return self.file.url
        return None

    def get_embed_url(self):
        """Get the embed URL for this document."""
        if self.doc_embed_url:
            return self.doc_embed_url
        elif self.is_google_doc and self.google_doc_id:
            return f"https://docs.google.com/document/d/{self.google_doc_id}/preview"
        return None

    def get_file_size_display(self):
        """Get human-readable file size."""
        if self.file_size:
            size = float(self.file_size)
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"
        return "0 B"


class DocumentVersion(models.Model):
    """Tracks different versions of a document."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    file_storage_id = models.CharField(max_length=255)
    version = models.PositiveIntegerField()
    google_doc_id = models.CharField(max_length=255, blank=True, null=True)
    is_google_doc = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='document_versions'
    )
    
    class Meta:
        unique_together = ('document', 'version')
        ordering = ['-version']
        
    def __str__(self):
        return f"{self.document} - v{self.version}"