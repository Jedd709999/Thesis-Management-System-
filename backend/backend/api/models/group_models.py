import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q, JSONField
from django.utils import timezone
from .user_models import User

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class GroupManager(SoftDeleteManager):
    def search_by_keywords(self, keywords):
        """Search groups by possible topics (case-insensitive)"""
        if not keywords:
            return self.none()
        
        keyword_queries = []
        for keyword in keywords.split():
            keyword_queries.append(Q(possible_topics__icontains=keyword))
        
        query = keyword_queries.pop()
        for q in keyword_queries:
            query |= q
        
        return self.filter(query)
    
    def search_by_topics(self, topics):
        """Search groups by possible topics (case-insensitive)"""
        if not topics:
            return self.none()
        
        topic_queries = []
        for topic in topics.split():
            topic_queries.append(Q(possible_topics__icontains=topic))
        
        query = topic_queries.pop()
        for q in topic_queries:
            query |= q
        
        return self.filter(query)
    
    def search(self, query):
        """Search groups by name or possible topics"""
        if not query:
            return self.all()
        
        return self.filter(
            Q(name__icontains=query) |
            Q(possible_topics__icontains=query)
        )

class Group(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    objects = GroupManager()
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PENDING')
    possible_topics = models.TextField(help_text="Possible research topics, one per line", blank=True)
    rejection_reason = models.TextField(help_text="Reason for rejection if status is REJECTED", blank=True)
    leader = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='led_groups')
    members = models.ManyToManyField(User, through='GroupMember', related_name='member_groups', blank=True)
    adviser = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='advised_groups')
    # Store preferred adviser ID from group creation (not directly assigned)
    preferred_adviser_id = models.CharField(max_length=36, null=True, blank=True, help_text="Preferred adviser ID from group proposal")
    panels = models.ManyToManyField(User, related_name='panel_groups', blank=True)
    drive_folder_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    def clean(self):
        # Check if any student members are already in another group
        if self.pk:  # Only check during updates, not during initial creation
            for member in self.members.all():
                if member.role == 'STUDENT':
                    existing_groups = Group.objects.filter(members=member).exclude(id=self.pk).exists()
                    if existing_groups:
                        raise ValidationError(f"Student {member.email} is already a member of another group")
    
    def save(self, *args, **kwargs):
        # Store original adviser value for change detection
        if self.pk:
            # This is an update, get the original adviser
            try:
                original = Group.objects.get(pk=self.pk)
                self._original_adviser = original.adviser
            except Group.DoesNotExist:
                self._original_adviser = None
        else:
            # This is a new object
            self._original_adviser = None
        
        try:
            self.full_clean()
            super().save(*args, **kwargs)
        except Exception as e:
            print(f"DEBUG: Error saving group {self.id if self.id else 'new'}: {e}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            raise
    
    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        
    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
    
    def get_keywords_list(self):
        """Return keywords as a list"""
        return []
    
    def get_topics_list(self):
        """Return proposed topic titles as a list"""
        if self.possible_topics:
            return [topic.strip() for topic in self.possible_topics.split('\n') if topic.strip()]
        return []


class GroupMember(models.Model):
    ROLES = [
        ('member', 'Member'),
        ('leader', 'Leader'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group_memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role_in_group = models.CharField(max_length=20, choices=ROLES, default='member')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('group', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.get_role_in_group_display()} in {self.group.name}"