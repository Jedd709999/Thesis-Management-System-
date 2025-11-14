from api.models.notification_models import Notification
from api.utils.email_utils import send_notification_email

def create_notification(user, title, body='', link=''):
    n = Notification.objects.create(user=user, title=title, body=body, link=link)
    try:
        send_notification_email(title, body, user.email)
    except Exception:
        pass
    return n
