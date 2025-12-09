import uuid
import json
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from .user_models import User

class AuditLog(models.Model):
    """
    Tracks all significant actions in the system for auditing purposes.
    """
    ACTION_TYPES = [
        ('create', _('Create')),
        ('read', _('Read')),
        ('update', _('Update')),
        ('delete', _('Delete')),
        ('login', _('Login')),
        ('logout', _('Logout')),
        ('login_failed', _('Login Failed')),
        ('password_change', _('Password Change')),
        ('permission_denied', _('Permission Denied')),
        ('other', _('Other')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(
        max_length=20,
        choices=ACTION_TYPES,
        help_text=_('Type of action performed')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text=_('User who performed the action')
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_('IP address of the user')
    )
    user_agent = models.TextField(
        blank=True,
        help_text=_('User agent string of the browser/device')
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Content type of the related object')
    )
    object_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('ID of the related object')
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # For tracking changes
    old_values = models.JSONField(
        null=True,
        blank=True,
        help_text=_('Values before the change (for updates/deletes)')
    )
    new_values = models.JSONField(
        null=True,
        blank=True,
        help_text=_('Values after the change (for creates/updates)')
    )
    
    # Additional context
    request_path = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('Request path/URL')
    )
    status_code = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text=_('HTTP status code of the response')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text=_('When the action was performed')
    )
    
    class Meta:
        verbose_name = _('Audit Log')
        verbose_name_plural = _('Audit Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action']),
            models.Index(fields=['user']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        user = self.user.email if self.user else 'System'
        return f"{self.get_action_display()} by {user} at {self.created_at}"
    
    @classmethod
    def log_action(
        cls, 
        action, 
        user=None, 
        request=None, 
        obj=None, 
        old_values=None, 
        new_values=None,
        **kwargs
    ):
        """
        Helper method to create an audit log entry.
        """
        # Skip audit logging if disabled (e.g., during tests)
        if getattr(settings, 'DISABLE_AUDIT_LOGGING', False):
            return None
            
        log_entry = cls(action=action)
        
        # Set user and request info
        if user and user.is_authenticated:
            log_entry.user = user
        elif request and hasattr(request, 'user') and request.user.is_authenticated:
            log_entry.user = request.user
        
        if request:
            log_entry.ip_address = cls.get_client_ip(request)
            log_entry.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            log_entry.request_path = request.path
        else:
            # Try to get request info from middleware
            from backend.api.middleware.audit_middleware import get_current_ip, get_current_user_agent, get_current_path
            log_entry.ip_address = get_current_ip()
            log_entry.user_agent = get_current_user_agent() or ''
            log_entry.request_path = get_current_path() or ''
        
        # Set object info if provided
        if obj:
            log_entry.content_object = obj
            
            # If old_values not provided and this is an update, try to get them
            if action == 'update' and old_values is None and hasattr(obj, '_old_values'):
                old_values = obj._old_values
        
        # Set values
        if old_values is not None:
            log_entry.old_values = old_values
        if new_values is not None:
            log_entry.new_values = new_values
        
        # Set any additional fields
        for field, value in kwargs.items():
            if hasattr(log_entry, field):
                setattr(log_entry, field, value)
        
        try:
            log_entry.save()
            return log_entry
        except Exception as e:
            # Handle case where audit log table doesn't exist yet (e.g., during test setup)
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f"Could not save audit log entry: {str(e)}")
            return None
    
    @staticmethod
    def get_client_ip(request):
        """
        Get the client IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip