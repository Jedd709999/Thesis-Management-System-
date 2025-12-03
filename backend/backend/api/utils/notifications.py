from api.models.notification_models import Notification
from api.utils.email_utils import send_notification_email

def create_notification(user, title, body='', link=''):
    print(f"Creating notification for user: {user}, title: {title}")
    n = Notification.objects.create(user=user, title=title, body=body, link=link)
    try:
        send_notification_email(title, body, user.email)
    except Exception as e:
        print(f"Failed to send notification email: {e}")
        # Continue even if email fails
    return n
