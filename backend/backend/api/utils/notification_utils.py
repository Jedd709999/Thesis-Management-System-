import json
import logging
from django.db import transaction
from django.utils import timezone
from api.models.notification_models import Notification, NotificationType
from django.contrib.contenttypes.models import ContentType
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
                'sender': sender,
            }
            
            # Add related object if provided
            if related_object:
                notification_data['related_content_type'] = ContentType.objects.get_for_model(related_object)
                notification_data['related_object_id'] = related_object.id
            
            # Add payload if provided
            if payload:
                notification_data['payload'] = payload
                
            # Create the notification
            notification = Notification.objects.create(**notification_data)
            
            # Send WebSocket notification
            send_websocket_notification(notification)
            
            logger.info(f"Created notification {notification.id} for user {recipient.id}")
            return notification
            
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        raise

def send_websocket_notification(notification):
    """
    Send a notification via WebSocket to the recipient.
    
    Args:
        notification: Notification object to send
    """
    try:
        # Get the channel layer
        channel_layer = get_channel_layer()
        
        if channel_layer is None:
            logger.error("Channel layer is None, cannot send WebSocket notification")
            return
            
        # Create the group name for this user
        group_name = f'notifications_{notification.recipient.id}'
        logger.info(f"Sending WebSocket notification to group: {group_name}")
        
        # Prepare the notification data for WebSocket transmission
        # This structure matches what the frontend expects
        notification_data = {
            'id': str(notification.id),
            'recipient': {
                'id': str(notification.recipient.id),  # Convert to string
                'email': notification.recipient.email,
                'first_name': getattr(notification.recipient, 'first_name', ''),
                'last_name': getattr(notification.recipient, 'last_name', ''),
                'role': getattr(notification.recipient, 'role', ''),
                'is_active': getattr(notification.recipient, 'is_active', True),
                'is_staff': getattr(notification.recipient, 'is_staff', False),
            },
            'type': notification.notification_type,  # Use notification_type to match frontend expectation
            'title': notification.title,
            'body': notification.message,  # Use body to match frontend expectation
            'link': getattr(notification, 'action_url', ''),  # Use link to match frontend expectation
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat(),
            'read_at': notification.read_at.isoformat() if notification.read_at else None,
        }
        
        logger.info(f"Prepared notification data: {notification_data}")
        
        # Send the notification to the user's group
        logger.info("About to send WebSocket message")
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_created',
                'notification': notification_data
            }
        )
        logger.info(f"Sent WebSocket notification {notification.id} to user {notification.recipient.id}")
        
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {e}", exc_info=True)

def mark_notification_as_read(notification_id, user):
    """
    Mark a notification as read and send WebSocket update.
    
    Args:
        notification_id: ID of the notification to mark as read
        user: User who owns the notification
        
    Returns:
        Notification object if successful, None otherwise
    """
    try:
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification.mark_as_read()
        
        # Send WebSocket update
        send_websocket_notification_update(notification)
        
        return notification
    except Notification.DoesNotExist:
        logger.warning(f"Notification {notification_id} not found for user {user.id}")
        return None
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        return None

def send_websocket_notification_update(notification):
    """
    Send a notification update via WebSocket to the recipient.
    
    Args:
        notification: Notification object that was updated
    """
    try:
        # Get the channel layer
        channel_layer = get_channel_layer()
        
        if channel_layer is None:
            logger.error("Channel layer is None, cannot send WebSocket notification update")
            return
            
        # Create the group name for this user
        group_name = f'notifications_{notification.recipient.id}'
        logger.info(f"Sending WebSocket notification update to group: {group_name}")
        
        # Prepare the notification data for WebSocket transmission
        # This structure matches what the frontend expects
        notification_data = {
            'id': str(notification.id),
            'recipient': {
                'id': str(notification.recipient.id),  # Convert to string
                'email': notification.recipient.email,
                'first_name': getattr(notification.recipient, 'first_name', ''),
                'last_name': getattr(notification.recipient, 'last_name', ''),
                'role': getattr(notification.recipient, 'role', ''),
                'is_active': getattr(notification.recipient, 'is_active', True),
                'is_staff': getattr(notification.recipient, 'is_staff', False),
            },
            'type': notification.notification_type,  # Use notification_type to match frontend expectation
            'title': notification.title,
            'body': notification.message,  # Use body to match frontend expectation
            'link': getattr(notification, 'action_url', ''),  # Use link to match frontend expectation
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat(),
            'read_at': notification.read_at.isoformat() if notification.read_at else None,
        }
        
        logger.info(f"Prepared notification update data: {notification_data}")
        
        # Send the notification update to the user's group
        logger.info("About to send WebSocket update message")
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_updated',
                'notification': notification_data
            }
        )
        logger.info(f"Sent WebSocket notification update {notification.id} to user {notification.recipient.id}")
        
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification update: {e}", exc_info=True)

def delete_notification_and_send_websocket(notification_id, user):
    """
    Delete a notification and send WebSocket deletion notification.
    
    Args:
        notification_id: ID of the notification to delete
        user: User who owns the notification
        
    Returns:
        True if successful, False otherwise
    """
    try:
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification_id_str = str(notification.id)
        notification.delete()
        
        # Send WebSocket deletion notification
        send_websocket_notification_deletion(notification_id_str, user)
        
        return True
    except Notification.DoesNotExist:
        logger.warning(f"Notification {notification_id} not found for user {user.id}")
        return False
    except Exception as e:
        logger.error(f"Failed to delete notification: {e}")
        return False

def send_websocket_notification_deletion(notification_id, user):
    """
    Send a notification deletion via WebSocket to the recipient.
    
    Args:
        notification_id: ID of the notification that was deleted
        user: User who owned the notification
    """
    try:
        # Get the channel layer
        channel_layer = get_channel_layer()
        
        if channel_layer is None:
            logger.error("Channel layer is None, cannot send WebSocket notification deletion")
            return
            
        # Create the group name for this user
        group_name = f'notifications_{user.id}'
        logger.info(f"Sending WebSocket notification deletion to group: {group_name}")
        
        # Send the notification deletion to the user's group
        logger.info("About to send WebSocket deletion message")
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_deleted',
                'notification_id': notification_id
            }
        )
        logger.info(f"Sent WebSocket notification deletion {notification_id} to user {user.id}")
        
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification deletion: {e}", exc_info=True)