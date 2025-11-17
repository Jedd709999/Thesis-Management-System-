from django.db import models
from .thesis_models import Thesis
from .user_models import User

class Document(models.Model):
    thesis = models.ForeignKey(Thesis, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='documents/', blank=True, null=True)
    google_doc_url = models.URLField(blank=True, null=True)
    google_drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    google_drive_embed_url = models.URLField(blank=True, null=True)
    provider = models.CharField(max_length=32, blank=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def embed_url(self):
        if self.provider == 'google' and self.google_doc_url:
            return self.google_doc_url.replace('/edit', '/preview')
        elif self.provider == 'drive' and self.google_drive_embed_url:
            return self.google_drive_embed_url
        return None

    def get_file_url(self):
        """Get the appropriate file URL based on provider"""
        if self.provider == 'google' and self.google_doc_url:
            return self.google_doc_url
        elif self.provider == 'drive' and self.google_drive_file_id:
            return f"https://drive.google.com/file/d/{self.google_drive_file_id}/view"
        elif self.file:
            return self.file.url
        return None

    def get_file_size_display(self):
        """Get human-readable file size"""
        if self.file_size:
            for unit in ['B', 'KB', 'MB', 'GB']:
                if self.file_size < 1024:
                    return f"{self.file_size:.1f} {unit}"
                self.file_size /= 1024
            return f"{self.file_size:.1f} TB"
        return "Unknown"
