from django.db import models
from django.core.exceptions import ValidationError
from .user_models import User

class Group(models.Model):
    name = models.CharField(max_length=128)
    members = models.ManyToManyField(User, blank=True)
    adviser = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='advised_groups')
    panels = models.ManyToManyField(User, related_name='panel_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    def clean(self):
        # Check if any student members are already in another group
        if self.pk:  # Only check during updates, not during initial creation
            for member in self.members.all():
                if member.role == 'STUDENT':
                    existing_groups = Group.objects.filter(members=member).exclude(id=self.pk).exists()
                    if existing_groups:
                        raise ValidationError(f"Student {member.email} is already a member of another group")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
