from api.utils.notification_utils import create_notification as create_notification_util

# Maintain backward compatibility
def create_notification(user, title, body='', link=''):
    """Backward compatible function for creating notifications."""
    return create_notification_util(
        recipient=user,
        notification_type='other',
        title=title,
        message=body,
        payload={'link': link} if link else None
    )
