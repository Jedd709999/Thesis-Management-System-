from django.db import models
from .group_models import Group
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
    title = models.CharField(max_length=256)
    abstract = models.TextField()
    keywords = models.TextField(blank=True, null=True, help_text="Comma-separated keywords for the thesis")
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='thesis')
    proposer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='proposals')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='CONCEPT_SUBMITTED')
    adviser_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def submit(self):
        self.status = 'CONCEPT_SUBMITTED'
        self.save()
