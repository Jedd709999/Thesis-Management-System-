import uuid
from django.db import models
from django.utils import timezone
from .group_models import Group, TopicProposal
from .user_models import User

class Thesis(models.Model):
    STATUS_CHOICES = (
        # Concept phase
        ('CONCEPT_SUBMITTED', 'Concept Submitted'),  # Concept paper uploaded/submitted for concept defense
        ('CONCEPT_SCHEDULED', 'Concept Scheduled'),   # Concept defense scheduled
        ('CONCEPT_DEFENDED', 'Concept Defended'),   # Concept defense completed (results pending)
        ('CONCEPT_APPROVED', 'Concept Approved'),   # Concept passed (can proceed to full proposal)
        
        # Proposal phase
        ('PROPOSAL_SUBMITTED', 'Proposal Submitted'), # Full research proposal uploaded/submitted
        ('PROPOSAL_SCHEDULED', 'Proposal Scheduled'), # Proposal defense scheduled
        ('PROPOSAL_DEFENDED', 'Proposal Defended'),  # Proposal defense held
        ('PROPOSAL_APPROVED', 'Proposal Approved'),  # Proposal accepted (research may proceed; ethics clearance etc.)
        
        # Research phase
        ('RESEARCH_IN_PROGRESS', 'Research In Progress'), # Research / implementation ongoing, milestone uploads
        
        # Final phase
        ('FINAL_SUBMITTED', 'Final Submitted'),    # Final manuscript & required bound copies uploaded/submitted
        ('FINAL_SCHEDULED', 'Final Scheduled'),    # Final (oral) defense scheduled
        ('FINAL_DEFENDED', 'Final Defended'),     # Final defense held
        ('FINAL_APPROVED', 'Final Approved'),     # Thesis passed / approved
        
        # Other statuses
        ('REVISIONS_REQUIRED', 'Revisions Required'), # Panel/adviser requested major revisions after any defense
        ('REJECTED', 'Rejected'),           # Proposal/thesis rejected (rare)
        ('ARCHIVED', 'Archived'),           # Thesis closed & archived
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    abstract = models.TextField()
    keywords = models.TextField(blank=True, null=True, help_text="Comma-separated keywords for the thesis")
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='thesis')
    origin_proposal = models.OneToOneField(
        TopicProposal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resulting_thesis'
    )
    adviser = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='advised_theses',
        help_text="Thesis adviser"
    )
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='CONCEPT_SUBMITTED')
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
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Theses'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
        
    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        
    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

    def submit(self):
        """Submit the thesis for review."""
        if self.status == 'draft':
            self.status = 'CONCEPT_SUBMITTED'
            self.save()
            return True
        return False
        
    def get_keywords_list(self):
        """Return keywords as a list."""
        if self.keywords:
            return [k.strip() for k in self.keywords.split(',') if k.strip()]
        return []
        
    def set_keywords_from_list(self, keywords_list):
        """Set keywords from a list."""
        self.keywords = ', '.join(keywords_list)
