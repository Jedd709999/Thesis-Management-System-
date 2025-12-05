import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .user_models import User
from .thesis_models import Thesis


class AutoScheduleRun(models.Model):
    """
    Tracks automated scheduling runs for thesis defenses.
    """
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thesis = models.ForeignKey(
        Thesis,
        on_delete=models.CASCADE,
        related_name='auto_schedule_runs',
        help_text=_('Thesis associated with this scheduling run')
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('Current status of the scheduling run')
    )
    details = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Detailed results and information about the scheduling run')
    )
    run_at = models.DateTimeField(
        default=timezone.now,
        help_text=_('When the scheduling run was executed')
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the scheduling run was completed')
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auto_schedule_runs',
        help_text=_('User who initiated the scheduling run (if manual)')
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('Auto Schedule Run')
        verbose_name_plural = _('Auto Schedule Runs')
        ordering = ['-run_at']
        indexes = [
            models.Index(fields=['thesis', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['run_at']),
        ]
    
    def __str__(self):
        return f"Auto-schedule run for {self.thesis} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if self.status in ['completed', 'failed', 'cancelled'] and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)