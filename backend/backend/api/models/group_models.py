from django.db import models
from django.core.exceptions import ValidationError
from django.db.models import Q
from .user_models import User

class GroupManager(models.Manager):
    def search_by_keywords(self, keywords):
        """Search groups by keywords (case-insensitive)"""
        if not keywords:
            return self.none()
        
        keyword_queries = []
        for keyword in keywords.split():
            keyword_queries.append(Q(keywords__icontains=keyword))
        
        query = keyword_queries.pop()
        for q in keyword_queries:
            query |= q
        
        return self.filter(query)
    
    def search_by_topics(self, topics):
        """Search groups by proposed topic titles (case-insensitive)"""
        if not topics:
            return self.none()
        
        topic_queries = []
        for topic in topics.split():
            topic_queries.append(Q(proposed_topic_title__icontains=topic))
        
        query = topic_queries.pop()
        for q in topic_queries:
            query |= q
        
        return self.filter(query)
    
    def search(self, query):
        """Search groups by name, keywords, or topics"""
        if not query:
            return self.all()
        
        return self.filter(
            Q(name__icontains=query) |
            Q(keywords__icontains=query) |
            Q(proposed_topic_title__icontains=query) |
            Q(abstract__icontains=query)
        )

class Group(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    
    objects = GroupManager()
    
    name = models.CharField(max_length=128)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='PENDING')
    proposed_topic_title = models.TextField(help_text="Proposed topic title for the research", blank=True)
    abstract = models.TextField(help_text="Brief abstract describing the proposed research topic", blank=True)
    keywords = models.CharField(max_length=500, help_text="Comma-separated keywords for search and tagging", blank=True)
    rejection_reason = models.TextField(help_text="Reason for rejection if status is REJECTED", blank=True)
    leader = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='led_groups')
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
    
    def get_keywords_list(self):
        """Return keywords as a list"""
        if self.keywords:
            return [keyword.strip() for keyword in self.keywords.split(',') if keyword.strip()]
        return []
    
    def get_topics_list(self):
        """Return proposed topic titles as a list"""
        if self.proposed_topic_title:
            return [topic.strip() for topic in self.proposed_topic_title.split('\n') if topic.strip()]
        return []
    
    def set_keywords_from_list(self, keywords_list):
        """Set keywords from a list"""
        self.keywords = ', '.join(keywords_list)
    
    def set_topics_from_list(self, topics_list):
        """Set proposed topic titles from a list"""
        self.proposed_topic_title = '\n'.join(topics_list)
