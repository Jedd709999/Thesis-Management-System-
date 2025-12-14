import uuid
from django.db import models
from django.utils import timezone
from .group_models import Group
from .user_models import User

class ThesisQuerySet(models.QuerySet):
    pass

class ThesisManager(models.Manager):
    def get_queryset(self):
        """Default queryset"""
        return ThesisQuerySet(self.model, using=self._db)

class Thesis(models.Model):
    STATUS_CHOICES = (
        # Topic phase
        ('TOPIC_SUBMITTED', 'Topic Submitted'),   # Initial state after submission
        ('TOPIC_APPROVED', 'Topic Approved'),    # Topic approved by adviser
        ('TOPIC_REJECTED', 'Topic Rejected'),    # Topic rejected by adviser
        
        # Concept phase
        ('CONCEPT_SUBMITTED', 'Concept Submitted'), # Concept paper uploaded
        ('READY_FOR_CONCEPT_DEFENSE', 'Ready for Concept Defense'),  # Concept paper approved, ready for defense
        ('CONCEPT_SCHEDULED', 'Concept Scheduled'), # Concept defense scheduled
        ('CONCEPT_APPROVED', 'Concept Approved'),  # Concept accepted (move to proposal phase)
        
        # Proposal phase
        ('PROPOSAL_SUBMITTED', 'Proposal Submitted'), # Research proposal uploaded
        ('READY_FOR_PROPOSAL_DEFENSE', 'Ready for Proposal Defense'),  # Research proposal approved, ready for defense
        ('PROPOSAL_SCHEDULED', 'Proposal Scheduled'), # Proposal defense scheduled
        ('PROPOSAL_APPROVED', 'Proposal Approved'),  # Proposal accepted (research may proceed; ethics clearance etc.)
        
        # Research phase
        ('RESEARCH_IN_PROGRESS', 'Research In Progress'), # Research / implementation ongoing, milestone uploads
        
        # Final phase
        ('FINAL_SUBMITTED', 'Final Submitted'),    # Final manuscript & required bound copies uploaded/submitted
        ('READY_FOR_FINAL_DEFENSE', 'Ready for Final Defense'),  # Final manuscript approved, ready for defense
        ('FINAL_SCHEDULED', 'Final Scheduled'),    # Final (oral) defense scheduled
        ('FINAL_APPROVED', 'Final Approved'),     # Thesis passed / approved
        
        # Specific revision statuses (stage-specific)
        ('CONCEPT_REVISIONS_REQUIRED', 'Concept Revisions Required'),  # Panel/adviser requested revisions for concept
        ('PROPOSAL_REVISIONS_REQUIRED', 'Proposal Revisions Required'),  # Panel/adviser requested revisions for proposal
        ('FINAL_REVISIONS_REQUIRED', 'Final Revisions Required'),  # Panel/adviser requested revisions for final manuscript
        
        # Other statuses
        ('REJECTED', 'Rejected'),           # Proposal/thesis rejected (rare)
        ('ARCHIVED', 'Archived'),           # Thesis closed & archived
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    keywords = models.TextField(blank=True, null=True, help_text="Comma-separated keywords for the thesis")
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='thesis')
    proposer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='proposed_theses')
    adviser = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='advised_theses',
        help_text="Thesis adviser"
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='TOPIC_SUBMITTED')
    adviser_feedback = models.TextField(blank=True, null=True)
    drive_folder_id = models.CharField(max_length=255, blank=True, null=True)
    archived_document = models.OneToOneField(
        'Document',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_in_thesis'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    # Use custom manager
    objects = ThesisManager()

    class Meta:
        verbose_name_plural = 'Theses'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
        
    def delete(self, *args, **kwargs):
        """Permanently delete the thesis"""
        super().delete(*args, **kwargs)
    
    def submit(self):
        """Submit the thesis for review."""
        # Handle transitions based on current status
        status_transitions = {
            'TOPIC_APPROVED': 'CONCEPT_SUBMITTED',
            'CONCEPT_APPROVED': 'PROPOSAL_SUBMITTED',
            'PROPOSAL_APPROVED': 'FINAL_SUBMITTED',
        }
        
        if self.status in status_transitions:
            self.status = status_transitions[self.status]
            self.save()
            return True
        elif self.status == 'TOPIC_REJECTED':
            # Resubmit after rejection
            self.status = 'TOPIC_SUBMITTED'
            self.save()
            return True
        elif self.status == 'CONCEPT_REVISIONS_REQUIRED':
            # Resubmit after concept revisions
            self.status = 'CONCEPT_SUBMITTED'
            self.save()
            return True
        elif self.status == 'PROPOSAL_REVISIONS_REQUIRED':
            # Resubmit after proposal revisions
            self.status = 'PROPOSAL_SUBMITTED'
            self.save()
            return True
        elif self.status == 'FINAL_REVISIONS_REQUIRED':
            # Resubmit after final revisions
            self.status = 'FINAL_SUBMITTED'
            self.save()
            return True
        else:
            # Default case - no automatic transition
            return False
        
    def get_keywords_list(self):
        """Return keywords as a list."""
        if self.keywords:
            return [k.strip() for k in self.keywords.split(',') if k.strip()]
        return []
        
    def set_keywords_from_list(self, keywords_list):
        """Set keywords from a list."""
        self.keywords = ', '.join(keywords_list)
        
    def get_drive_folder_url(self):
        """Get the Google Drive folder URL if folder ID exists."""
        if self.drive_folder_id:
            return f"https://drive.google.com/drive/folders/{self.drive_folder_id}"
        return None