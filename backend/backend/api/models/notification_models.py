import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()

class NotificationType(models.TextChoices):
    """Types of notifications that can be sent."""
    THESIS_SUBMITTED = 'thesis_submitted', _('Thesis Submitted')
    DEFENSE_SCHEDULED = 'defense_scheduled', _('Defense Scheduled')
    DEFENSE_REMINDER = 'defense_reminder', _('Defense Reminder')
    DEFENSE_CANCELLED = 'defense_cancelled', _('Defense Cancelled')
    DOCUMENT_UPLOADED = 'document_uploaded', _('Document Uploaded')
    DOCUMENT_APPROVED = 'document_approved', _('Document Approved')
    DOCUMENT_REJECTED = 'document_rejected', _('Document Rejected')
    EVALUATION_SUBMITTED = 'evaluation_submitted', _('Evaluation Submitted')
    THESIS_APPROVED = 'thesis_approved', _('Thesis Approved')
    THESIS_REJECTED = 'thesis_rejected', _('Thesis Rejected')
    NEW_COMMENT = 'new_comment', _('New Comment')
    MENTION = 'mention', _('Mention')
    SYSTEM_ALERT = 'system_alert', _('System Alert')
    # New notification types
    SCHEDULE_CREATED = 'schedule_created', _('Schedule Created')
    TOPIC_PROPOSAL_REVIEWED = 'topic_proposal_reviewed', _('Topic Proposal Reviewed')
    DOCUMENT_UPDATED = 'document_updated', _('Document Updated')
    ADVISER_CHANGED = 'adviser_changed', _('Adviser Changed')
    APPROVAL_SHEET_SUBMITTED = 'approval_sheet_submitted', _('Approval Sheet Submitted')
    OTHER = 'other', _('Other')

class NotificationPriority(models.TextChoices):
    """Priority levels for notifications."""
    LOW = 'low', _('Low')
    NORMAL = 'normal', _('Normal')
    HIGH = 'high', _('High')
    URGENT = 'urgent', _('Urgent')

class Notification(models.Model):
    """Model for storing notifications to users."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text=_('User who will receive the notification'),
        null=True
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications',
        help_text=_('User who triggered the notification (if applicable)')
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.OTHER,
        help_text=_('Type of notification')
    )
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        help_text=_('Priority level of the notification')
    )
    title = models.CharField(
        max_length=255,
        help_text=_('Brief title of the notification')
    )
    message = models.TextField(
        help_text=_('Detailed message content'),
        default=''
    )
    payload = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional data related to the notification')
    )
    is_read = models.BooleanField(
        default=False,
        help_text=_('Whether the notification has been read')
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the notification was marked as read')
    )
    is_email_sent = models.BooleanField(
        default=False,
        help_text=_('Whether an email notification was sent')
    )
    email_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the email notification was sent')
    )
    action_url = models.URLField(
        blank=True,
        help_text=_('URL for the action associated with this notification')
    )
    related_content_type = models.ForeignKey(
        'contenttypes.ContentType',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Content type of the related object')
    )
    related_object_id = models.UUIDField(
        null=True,
        blank=True,
        help_text=_('ID of the related object')
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        help_text=_('When the notification was created')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_('When the notification was last updated')
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the notification expires (if applicable)')
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
            models.Index(fields=['created_at']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['priority']),
        ]

    def __str__(self):
        return f"{self.get_notification_type_display()}: {self.title}"

    def mark_as_read(self, save=True):
        """Mark the notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            if save:
                self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def mark_as_unread(self, save=True):
        """Mark the notification as unread."""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            if save:
                self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def mark_email_sent(self, save=True):
        """Mark that an email notification was sent."""
        if not self.is_email_sent:
            self.is_email_sent = True
            self.email_sent_at = timezone.now()
            if save:
                self.save(update_fields=['is_email_sent', 'email_sent_at', 'updated_at'])

    @property
    def related_object(self):
        """Get the related object if it exists."""
        if self.related_content_type and self.related_object_id:
            return self.related_content_type.get_object_for_this_type(pk=self.related_object_id)
        return None

class NotificationPreference(models.Model):
    """User preferences for notifications."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        help_text=_('User these preferences belong to')
    )
    email_enabled = models.BooleanField(
        default=True,
        help_text=_('Whether email notifications are enabled')
    )
    in_app_enabled = models.BooleanField(
        default=True,
        help_text=_('Whether in-app notifications are enabled')
    )
    push_enabled = models.BooleanField(
        default=False,
        help_text=_('Whether push notifications are enabled')
    )
    digest_enabled = models.BooleanField(
        default=True,
        help_text=_('Whether to receive digest emails for non-urgent notifications')
    )
    digest_frequency = models.PositiveSmallIntegerField(
        default=24,
        help_text=_('How often to send digest emails (in hours)')
    )
    last_digest_sent = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the last digest email was sent')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When the preferences were created')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_('When the preferences were last updated')
    )

    class Meta:
        verbose_name = _('Notification Preference')
        verbose_name_plural = _('Notification Preferences')

    def __str__(self):
        return f"Notification preferences for {self.user.email}"

class NotificationTemplate(models.Model):
    """Templates for different types of notifications."""
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Unique name for the template')
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        help_text=_('Type of notification this template is for')
    )
    subject_template = models.CharField(
        max_length=255,
        help_text=_('Subject template (supports template variables)')
    )
    message_template = models.TextField(
        help_text=_('Message template (supports template variables and HTML)')
    )
    email_enabled = models.BooleanField(
        default=True,
        help_text=_('Whether this notification type can be sent via email')
    )
    in_app_enabled = models.BooleanField(
        default=True,
        help_text=_('Whether this notification type can be sent as an in-app notification')
    )
    push_enabled = models.BooleanField(
        default=False,
        help_text=_('Whether this notification type can be sent as a push notification')
    )
    default_priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        help_text=_('Default priority for this notification type')
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('When the template was created')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_('When the template was last updated')
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def render(self, context):
        """Render the template with the given context."""
        from django.template import Template, Context
        subject = Template(self.subject_template).render(Context(context))
        message = Template(self.message_template).render(Context(context))
        return subject, message
