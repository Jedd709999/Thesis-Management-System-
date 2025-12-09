from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging
from urllib.parse import urljoin
import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

def send_notification_email(subject, body, to_email, html_message=None):
    """Send a plain text or HTML email notification"""
    logger.info(f"Sending email notification: subject='{subject}', to_email='{to_email}'")
    try:
        # For Gmail SMTP, we need to handle SSL/TLS properly
        if hasattr(settings, 'EMAIL_HOST') and 'gmail.com' in settings.EMAIL_HOST:
            # Create SMTP connection with proper SSL context
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=settings.EMAIL_TIMEOUT)
            server.starttls(context=context)
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.DEFAULT_FROM_EMAIL
            msg['To'] = to_email
            
            # Attach parts
            part1 = MIMEText(body, 'plain')
            msg.attach(part1)
            
            if html_message:
                part2 = MIMEText(html_message, 'html')
                msg.attach(part2)
            
            # Send email
            server.send_message(msg)
            server.quit()
        else:
            # Use default Django send_mail for other providers
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False
            )
        logger.info("Email sent successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_verification_email(user, request):
    """Send an email verification link to the user"""
    try:
        token = user.generate_verification_token()
        
        # Build verification URL using SITE_URL from settings
        verification_path = f'/api/auth/verify-email/{user.id}/{token}/'
        verification_url = f"{getattr(settings, 'SITE_URL', '')}{verification_path}"
        
        # Email content
        subject = 'Verify your email address'
        context = {
            'user': user,
            'verification_url': verification_url,
            'support_email': settings.DEFAULT_FROM_EMAIL,
            'site_name': getattr(settings, 'SITE_NAME', 'Thesis Management System')
        }
        
        # Render HTML email
        html_message = render_to_string('emails/verify_email.html', context)
        plain_message = f"""
        Hello {user.get_full_name() or 'there'},
        
        Thank you for registering with {context['site_name']}. 
        Please click the following link to verify your email address:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
        """
        
        return send_notification_email(
            subject=subject,
            body=strip_tags(plain_message),
            to_email=user.email,
            html_message=html_message
        )
    except Exception as e:
        logger.error(f"Failed to prepare verification email: {e}")
        raise