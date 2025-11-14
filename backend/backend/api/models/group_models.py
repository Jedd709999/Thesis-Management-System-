from django.db import models
from .user_models import User

class Group(models.Model):
    name = models.CharField(max_length=128)
    members = models.ManyToManyField(User, blank=True)
    adviser = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='advised_groups')
    panels = models.ManyToManyField(User, related_name='panel_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
