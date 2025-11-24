import json
import logging
from django.db import transaction
from django.utils import timezone
from api.models.notification_models import Notification, NotificationType
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)

def create_notification(recipient, notification_type, title, message, 
                       related_object=None, priority='normal', sender=None, payload=None):
    """
    Create a notification for a user in an async-safe manner.
    
    Args:
        recipient: User object who will receive the notification
        notification_type: str, type of notification (must be from NotificationType)
        title: str, brief title of the notification
        message: str, detailed message content
        related_object: Django model instance (optional)
        priority: str, priority level ('low', 'normal', 'high', 'urgent')
        sender: User object who triggered the notification (optional)
        payload: dict, additional data related to the notification (optional)
        
    Returns:
        Notification object
    """
    try:
        # Use atomic transaction to ensure data consistency
        with transaction.atomic():
            notification_data = {
                'recipient': recipient,
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'priority': priority,
            }
            
            if sender:
                notification_data['sender'] = sender
            
            if payload:
                notification_data['payload'] = payload
            
            if related_object:
                content_type = ContentType.objects.get_for_model(related_object)
                notification_data['related_content_type'] = content_type
                notification_data['related_object_id'] = related_object.id
            
            notification = Notification.objects.create(**notification_data)
            logger.info(f"Created notification {notification.id} for user {recipient.email}")
            return notification
            
    except Exception as e:
        logger.error(f"Failed to create notification: {str(e)}")
        # Re-raise the exception so callers can handle it appropriately
        raise

def create_schedule_notification(recipient, schedule, sender=None):
    """
    Create a notification for a new schedule.
    
    Args:
        recipient: User object
        schedule: OralDefenseSchedule object
        sender: User object (optional)
    """
    payload = {
        'schedule_id': str(schedule.id),
        'thesis_title': schedule.thesis.title,
        'start_time': schedule.start.isoformat(),
        'end_time': schedule.end.isoformat(),
        'location': schedule.location,
    }
    
    return create_notification(
        recipient=recipient,
        notification_type=NotificationType.SCHEDULE_CREATED,
        title='New Defense Schedule',
        message=f'A new defense schedule has been created for "{schedule.thesis.title}" on {schedule.start.strftime("%B %d, %Y at %I:%M %p")}',
        related_object=schedule,
        priority='high',
        sender=sender,
        payload=payload
    )

def create_topic_proposal_reviewed_notification(recipient, topic_proposal, sender=None):
    """
    Create a notification for a reviewed topic proposal.
    
    Args:
        recipient: User object
        topic_proposal: TopicProposal object
        sender: User object (optional)
    """
    payload = {
        'topic_proposal_id': str(topic_proposal.id),
        'title': topic_proposal.title,
        'status': topic_proposal.status,
        'review_comments': topic_proposal.review_comments,
    }
    
    status_display = topic_proposal.get_status_display()
    return create_notification(
        recipient=recipient,
        notification_type=NotificationType.TOPIC_PROPOSAL_REVIEWED,
        title='Topic Proposal Reviewed',
        message=f'Your topic proposal "{topic_proposal.title}" has been {status_display.lower()}',
        related_object=topic_proposal,
        priority='normal',
        sender=sender,
        payload=payload
    )

def create_document_updated_notification(recipient, document, sender=None):
    """
    Create a notification for an updated document.
    
    Args:
        recipient: User object
        document: Document object
        sender: User object (optional)
    """
    payload = {
        'document_id': str(document.id),
        'document_type': document.get_document_type_display(),
        'version': document.version,
        'updated_at': document.updated_at.isoformat(),
    }
    
    return create_notification(
        recipient=recipient,
        notification_type=NotificationType.DOCUMENT_UPDATED,
        title='Document Updated',
        message=f'The document "{document.get_document_type_display()}" has been updated to version {document.version}',
        related_object=document,
        priority='normal',
        sender=sender,
        payload=payload
    )

def create_adviser_changed_notification(recipient, thesis, new_adviser, sender=None):
    """
    Create a notification for adviser changes.
    
    Args:
        recipient: User object
        thesis: Thesis object
        new_adviser: User object (new adviser)
        sender: User object (optional)
    """
    payload = {
        'thesis_id': str(thesis.id),
        'thesis_title': thesis.title,
        'new_adviser_id': str(new_adviser.id),
        'new_adviser_name': f"{new_adviser.first_name} {new_adviser.last_name}".strip() or new_adviser.email,
    }
    
    return create_notification(
        recipient=recipient,
        notification_type=NotificationType.ADVISER_CHANGED,
        title='Adviser Changed',
        message=f'Your thesis "{thesis.title}" has been assigned to a new adviser: {payload["new_adviser_name"]}',
        related_object=thesis,
        priority='high',
        sender=sender,
        payload=payload
    )

def create_approval_sheet_submitted_notification(recipient, approval_sheet, sender=None):
    """
    Create a notification for submitted approval sheets.
    
    Args:
        recipient: User object
        approval_sheet: ApprovalSheet object
        sender: User object (optional)
    """
    payload = {
        'approval_sheet_id': str(approval_sheet.id),
        'decision': approval_sheet.get_decision_display(),
        'comments': approval_sheet.comments,
        'schedule_id': str(approval_sheet.schedule.id) if approval_sheet.schedule else None,
    }
    
    return create_notification(
        recipient=recipient,
        notification_type=NotificationType.APPROVAL_SHEET_SUBMITTED,
        title='Approval Sheet Submitted',
        message=f'An approval sheet for "{approval_sheet.schedule.thesis.title}" has been submitted with decision: {approval_sheet.get_decision_display()}',
        related_object=approval_sheet,
        priority='normal',
        sender=sender,
        payload=payload
    )

def mark_notification_as_read(notification_id, user):
    """
    Mark a notification as read for a user.
    
    Args:
        notification_id: UUID of the notification
        user: User object
        
    Returns:
        bool: Success status
    """
    try:
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification.mark_as_read()
        return True
    except Notification.DoesNotExist:
        return False

def get_user_notifications(user, limit=50, unread_only=False):
    """
    Get notifications for a user.
    
    Args:
        user: User object
        limit: int, maximum number of notifications to return
        unread_only: bool, whether to return only unread notifications
        
    Returns:
        QuerySet of Notification objects
    """
    notifications = Notification.objects.filter(recipient=user)
    
    if unread_only:
        notifications = notifications.filter(is_read=False)
    
    return notifications.order_by('-created_at')[:limit]