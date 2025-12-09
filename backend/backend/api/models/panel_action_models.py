import uuid
from django.db import models
from django.utils import timezone
from .user_models import User
from .schedule_models import OralDefenseSchedule

class PanelAction(models.Model):
    """Tracks actions taken by panel members on a defense."""
    ACTION_CHOICES = [
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(
        OralDefenseSchedule,
        on_delete=models.CASCADE,
        related_name='panel_actions'
    )
    panel_member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='panel_actions'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Panel Action'
        verbose_name_plural = 'Panel Actions'
    
    def __str__(self):
        return f"{self.get_action_display()} by {self.panel_member} on {self.schedule.thesis}"
