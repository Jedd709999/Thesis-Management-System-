from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_notification_email(subject, body, to_email):
    logger.info(f"Sending email notification: subject='{subject}', to_email='{to_email}'")
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        logger.info("Email sent successfully")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Don't raise the exception, just log it
