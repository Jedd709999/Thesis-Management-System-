import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .user_models import User

class ArchiveRecord(models.Model):
    """
    Represents an archived record for data retention and compliance.
    """
    ARCHIVE_TYPES = [
        ('thesis', _('Thesis')),
        ('document', _('Document')),
        ('evaluation', _('Evaluation')),
        ('group', _('Group')),
        ('user', _('User')),
        ('other', _('Other')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content_type = models.CharField(
        max_length=20,
        choices=ARCHIVE_TYPES,
        help_text=_('Type of content being archived')
    )
    original_id = models.UUIDField(
        help_text=_('Original ID of the archived item')
    )
    data = models.JSONField(
        help_text=_('JSON representation of the archived data')
    )
    archived_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='archived_records',
        help_text=_('User who performed the archival')
    )
    reason = models.TextField(
        blank=True,
        help_text=_('Reason for archiving')
    )
    retention_period_years = models.PositiveSmallIntegerField(
        default=7,
        help_text=_('Number of years to retain this record')
    )
    archived_at = models.DateTimeField(
        default=timezone.now,
        help_text=_('When the record was archived')
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When this archive record expires (auto-calculated)')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Archive Record')
        verbose_name_plural = _('Archive Records')
        ordering = ['-archived_at']
        indexes = [
            models.Index(fields=['content_type', 'original_id']),
            models.Index(fields=['archived_at']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.get_content_type_display()} {self.original_id} (Archived: {self.archived_at.date()})"
    
    def save(self, *args, **kwargs):
        if not self.expires_at and self.archived_at:
            self.expires_at = self.archived_at + timezone.timedelta(
                days=365 * self.retention_period_years
            )
        super().save(*args, **kwargs)
