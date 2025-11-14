from django.db import models
from .group_models import Group
from .user_models import User

class Thesis(models.Model):
    STATUS_CHOICES = (
        ('DRAFT','Draft'),
        ('SUBMITTED','Submitted'),
        ('UNDER_REVIEW','Under Review'),
        ('APPROVED','Approved'),
        ('REJECTED','Rejected'),
    )
    title = models.CharField(max_length=256)
    abstract = models.TextField()
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='thesis')
    proposer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='proposals')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='DRAFT')
    adviser_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def submit(self):
        self.status = 'SUBMITTED'
        self.save()
