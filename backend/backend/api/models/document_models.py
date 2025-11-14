from django.db import models
from .thesis_models import Thesis
from .user_models import User

class Document(models.Model):
    thesis = models.ForeignKey(Thesis, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file = models.FileField(upload_to='documents/', blank=True, null=True)
    google_doc_url = models.URLField(blank=True, null=True)
    provider = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def embed_url(self):
        if self.provider == 'google' and self.google_doc_url:
            return self.google_doc_url.replace('/edit', '/preview')
        return None
