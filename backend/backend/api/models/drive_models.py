import uuid
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .user_models import User

class DriveCredential(models.Model):
    """
    Stores Google Drive API credentials for users.
    """
    CREDENTIAL_TYPES = [
        ('user', _('User OAuth')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='drive_credentials',
        help_text=_('User these credentials belong to')
    )
    credential_type = models.CharField(
        max_length=20,
        choices=CREDENTIAL_TYPES,
        default='user',
        help_text=_('Type of credentials')
    )
    token = models.JSONField(
        help_text=_('OAuth token')
    )
    refresh_token = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text=_('OAuth refresh token (if applicable)')
    )
    token_uri = models.URLField(
        blank=True,
        help_text=_('OAuth token URI (if applicable)')
    )
    client_id = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('OAuth client ID (if applicable)')
    )
    client_secret = models.CharField(
        max_length=255,
        blank=True,
        help_text=_('OAuth client secret (if applicable)')
    )
    scopes = models.TextField(
        blank=True,
        help_text=_('Comma-separated list of OAuth scopes')
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the access token expires')
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether these credentials are active')
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When these credentials were last used')
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Drive Credential')
        verbose_name_plural = _('Drive Credentials')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_active']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.user.email}'s {self.get_credential_type_display()} credentials"
    
    def is_expired(self):
        """Check if the access token has expired."""
        if not self.expires_at:
            return False
        
        # Handle both naive and timezone-aware datetimes
        if self.expires_at.tzinfo is None:
            # Naive datetime - compare directly
            return self.expires_at < timezone.now().replace(tzinfo=None)
        else:
            # Timezone-aware datetime - compare with timezone-aware
            return self.expires_at < timezone.now()
    
    def update_usage(self):
        """Update the last_used_at timestamp."""
        self.last_used_at = timezone.now()
        self.save(update_fields=['last_used_at', 'updated_at'])


class DriveFolder(models.Model):
    """
    Tracks folders in Google Drive that are associated with theses or groups.
    """
    FOLDER_TYPES = [
        ('thesis', _('Thesis')),
        ('group', _('Group')),
        ('submission', _('Submission')),
        ('archive', _('Archive')),
        ('other', _('Other')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    folder_id = models.CharField(
        max_length=255,
        unique=True,
        help_text=_('Google Drive folder ID')
    )
    name = models.CharField(
        max_length=255,
        help_text=_('Name of the folder')
    )
    folder_type = models.CharField(
        max_length=20,
        choices=FOLDER_TYPES,
        help_text=_('Type of folder')
    )
    parent_folder = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subfolders',
        help_text=_('Parent folder (if any)')
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_folders',
        help_text=_('User who owns this folder')
    )
    web_view_link = models.URLField(
        blank=True,
        help_text=_('URL to view the folder in Google Drive')
    )
    created_in_drive_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the folder was created in Google Drive')
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Drive Folder')
        verbose_name_plural = _('Drive Folders')
        ordering = ['folder_type', 'name']
        indexes = [
            models.Index(fields=['folder_id']),
            models.Index(fields=['folder_type']),
            models.Index(fields=['owner']),
        ]

    def __str__(self):
        return f"{self.get_folder_type_display()}: {self.name}"
    
    def get_path(self):
        """Get the full path of the folder."""
        if not self.parent_folder:
            return self.name
        return f"{self.parent_folder.get_path()}/{self.name}"
