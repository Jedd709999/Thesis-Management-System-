import uuid
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q, F
from .group_models import Group
from .thesis_models import Thesis
from .user_models import User
from .document_models import Document

class SoftDeleteManager(models.Manager):
    """Manager to handle soft deletes."""
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class OralDefenseSchedule(models.Model):
    """Represents a scheduled oral defense for a thesis."""
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thesis = models.ForeignKey(
        Thesis,
        on_delete=models.CASCADE,
        related_name='oral_defense_schedules'
    )
    title = models.CharField(max_length=255, blank=True, help_text="Title for the defense session")
    start = models.DateTimeField(help_text="Scheduled start time of the defense")
    end = models.DateTimeField(help_text="Scheduled end time of the defense")
    location = models.CharField(max_length=500, blank=True, help_text="Physical or virtual location")
    meeting_url = models.URLField(blank=True, help_text="Meeting URL for virtual defenses")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        help_text="Current status of the defense"
    )
    notes = models.TextField(blank=True, help_text="Additional notes about the defense")
    organizer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='organized_defenses',
        help_text="User who scheduled this defense"
    )
    panel_members = models.ManyToManyField(
        User,
        related_name='panel_defenses',
        blank=True,
        help_text="Panel members for this defense"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    objects = SoftDeleteManager()
    all_objects = models.Manager()  # Includes soft-deleted objects

    class Meta:
        ordering = ['start']
        verbose_name = 'Oral Defense Schedule'
        verbose_name_plural = 'Oral Defense Schedules'
        constraints = [
            models.CheckConstraint(
                check=Q(start__lt=F('end')),
                name='defense_start_before_end'
            )
        ]
    
    def __str__(self):
        return f"Defense for {self.thesis} at {self.start}"
    
    def clean(self):
        if self.start >= self.end:
            raise ValidationError('Defense end time must be after start time')
        
        # Check for scheduling conflicts with panel members
        if self.pk:
            conflicts = self.check_panel_availability(self.start, self.end, exclude_id=self.pk)
        else:
            conflicts = self.check_panel_availability(self.start, self.end)
            
        if conflicts:
            conflict_details = [
                f"{user.get_full_name() or user.email} is not available at the scheduled time"
                for user in conflicts
            ]
            raise ValidationError("Scheduling conflicts: " + "; ".join(conflict_details))
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.status = 'cancelled'
        self.save()
    
    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
    
    def check_panel_availability(self, start, end, exclude_id=None):
        """Check if panel members are available at the given time."""
        from datetime import time
        
        # Get the day of week (0=Monday, 6=Sunday)
        day_of_week = start.weekday()
        start_time = start.time()
        end_time = end.time()
        
        # Check each panel member's availability
        conflicts = []
        for member in self.panel_members.all():
            # Check if member has any availability records
            if not member.availabilities.exists():
                continue  # No availability set, assume available
                
            # Check member's availability for this day and time
            available = member.availabilities.filter(
                day_of_week=day_of_week,
                start_time__lte=start_time,
                end_time__gte=end_time
            ).exists()
            
            if not available:
                conflicts.append(member)
                
        return conflicts


class ApprovalSheet(models.Model):
    """Represents an approval sheet for a defense."""
    DECISION_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(
        OralDefenseSchedule,
        on_delete=models.CASCADE,
        related_name='approval_sheets'
    )
    panel_member = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='approval_sheets',
        help_text="Panel member who is approving"
    )
    decision = models.CharField(
        max_length=20,
        choices=DECISION_CHOICES,
        default='pending',
        help_text="Approval decision"
    )
    comments = models.TextField(blank=True, help_text="Reviewer's comments")
    submitted_at = models.DateTimeField(null=True, blank=True)
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approval_sheets',
        help_text="Approval document if uploaded"
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('schedule', 'panel_member')
        ordering = ['-submitted_at', '-created_at']
    
    def __str__(self):
        return f"Approval by {self.panel_member} for {self.schedule}"
    
    def save(self, *args, **kwargs):
        if self.decision != 'pending' and not self.submitted_at:
            self.submitted_at = timezone.now()
        super().save(*args, **kwargs)


class Evaluation(models.Model):
    """Evaluation of a thesis defense by a panel member."""
    RECOMMENDATION_CHOICES = [
        ('pass', 'Pass'),
        ('pass_with_revision', 'Pass with Revisions'),
        ('fail', 'Fail'),
        ('conditional_pass', 'Conditional Pass'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule = models.ForeignKey(
        OralDefenseSchedule,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    evaluator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='evaluations',
        help_text="Panel member who provided the evaluation"
    )
    rubric_scores = models.JSONField(
        default=dict,
        help_text="Scores for each criterion in the evaluation rubric"
    )
    total_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total score calculated from rubric"
    )
    recommendation = models.CharField(
        max_length=20,
        choices=RECOMMENDATION_CHOICES,
        null=True,
        blank=True,
        help_text="Overall recommendation"
    )
    comments = models.TextField(blank=True, help_text="Detailed feedback")
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations',
        help_text="Evaluation document if uploaded"
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('schedule', 'evaluator')
        ordering = ['-submitted_at', '-created_at']
    
    def __str__(self):
        return f"Evaluation by {self.evaluator} for {self.schedule}"
    
    def save(self, *args, **kwargs):
        if self.recommendation and not self.submitted_at:
            self.submitted_at = timezone.now()
        super().save(*args, **kwargs)