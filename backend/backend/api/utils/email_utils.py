import resend
from django.core.mail import send_mail
from django.conf import settings
import logging
from zoneinfo import ZoneInfo

resend.api_key = settings.RESEND_API_KEY
logger = logging.getLogger(__name__)


def send_notification_email(subject, body, to_email):
    logger.info(f"Sending email notification: subject='{subject}', to_email='{to_email}'")
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to_email], fail_silently=False)
        logger.info("Email sent successfully")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Don't raise the exception, just log it


def format_duration(td):
    total_seconds = int(td.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    parts = []
    if hours:
        parts.append(f"{hours} hour{'s' if hours > 1 else ''}")
    if minutes:
        parts.append(f"{minutes} minute{'s' if minutes > 1 else ''}")
    return " ".join(parts) or "0 minutes"


def get_user_display_name(user):
    first = (getattr(user, 'first_name', '') or "").strip()
    last = (getattr(user, 'last_name', '') or "").strip()
    if first or last:
        return f"{first} {last}".strip()
    return getattr(user, 'email', getattr(user, 'username', 'Unknown User'))


def send_defense_scheduled_email(schedule_instance):
    group = schedule_instance.group
    manila_tz = ZoneInfo("Asia/Manila")
    # Convert start time
    start_time_manila = schedule_instance.start_at.astimezone(manila_tz)
    defense_type = schedule_instance.type
    start_time = start_time_manila.strftime("%B %d, %Y at %I:%M %p")

    # Convert end time
    end_time_manila = schedule_instance.end_at.astimezone(manila_tz)

    # Calculate duration
    duration_td = end_time_manila - start_time_manila
    duration = format_duration(duration_td)

    # Collect unique emails
    recipients = list(set(
        [m.email for m in group.members.all()] +
        ([group.adviser.email] if group.adviser else []) +
        [p.email for p in group.panels.all()]
    ))
    recipients = [email for email in recipients if email]
    members = list(group.members.all())
    adviser = group.adviser
    panels = list(group.panels.all())

    if not recipients:
        print("No recipients found — skipping email.")
        return

    for user in members + ([adviser] if adviser else []) + panels:
        if not user.email:
            continue

        # Determine role
        if user in members:
            role_message = """
                <p>Please prepare your presentation and arrive 15 minutes early.</p>
                <p>If you have questions, contact your adviser.</p>
            """
        else:
            role_message = """
                <p>You are invited to attend this defense as part of the panel/advisory team.</p>
                <p>Please be on time and review the group’s topic if needed.</p>
            """

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2c3e50;">🛡️ Defense Schedule Confirmed!</h2>

                <p>Hello {get_user_display_name(user)}!</p>


                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3><strong>Group:</strong> {group.name}</h3>
                    <p><strong>Date & Time:</strong> {start_time}</p>
                    <p><strong>Duration:</strong> {duration}</p>
                    <p><strong>Type:</strong> {defense_type}</p>
                    <p><strong>Topic:</strong> {getattr(group, 'proposed_topic_title', 'Thesis Defense')}</p>
                    <p><strong>Venue:</strong> {getattr(schedule_instance, 'location', 'To be announced')}</p>
                </div>

                {role_message}

                <hr style="border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    This is an automated message from the Thesis Defense System.<br>
                    © 2025 USTP
                </p>
            </body>
        </html>
        """

        params = {
            "from": "Defense System <no-reply@mails.enviscy.site>",
            "to": [user.email],
            "subject": f"🚀 Defense Scheduled: {group.name} - {start_time}",
            "html": html_body,
        }

        try:
            email = resend.Emails.send(params)
            print(f"✅ Email sent to {user.email}, ID: {email['id']}")
        except Exception as e:
            print(f"❌ Email failed for {user.email}: {e}")
