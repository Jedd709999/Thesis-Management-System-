import logging
from django.contrib.auth import get_user_model
from api.models.notification_models import Notification, NotificationType, NotificationPriority
from api.models.group_models import Group
from api.models.thesis_models import Thesis
from api.utils.notifications import create_notification

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    """Service for managing notifications in the thesis management system."""

    @staticmethod
    def notify_group_formation(group):
        """Notify group members when group is approved."""
        try:
            if group.status == 'APPROVED':
                # Notify all group members
                for member in group.members.all():
                    create_notification(
                        user=member,
                        title=f'Group "{group.name}" has been approved',
                        body='Your group has been approved. You can now start working on your thesis proposal.',
                        link=f'/group/{group.id}'
                    )

                # Notify adviser if assigned
                if group.adviser:
                    create_notification(
                        user=group.adviser,
                        title=f'New group assigned: "{group.name}"',
                        body=f'You have been assigned as the adviser for group "{group.name}".',
                        link=f'/group/{group.id}'
                    )

                logger.info(f"Group formation notifications sent for group {group.id}")
        except Exception as e:
            logger.error(f"Failed to send group formation notifications: {e}")

    @staticmethod
    def notify_adviser_assigned(group):
        """Notify group members when adviser is assigned."""
        try:
            if group.adviser:
                # Notify all group members
                for member in group.members.all():
                    create_notification(
                        user=member,
                        title=f'Adviser assigned to your group',
                        body=f'{group.adviser.first_name} {group.adviser.last_name} has been assigned as your thesis adviser.',
                        link=f'/group/{group.id}'
                    )

                # Notify the adviser
                create_notification(
                    user=group.adviser,
                    title=f'You have been assigned as adviser',
                    body=f'You are now the thesis adviser for group "{group.name}".',
                    link=f'/group/{group.id}'
                )

                logger.info(f"Adviser assignment notifications sent for group {group.id}")
        except Exception as e:
            logger.error(f"Failed to send adviser assignment notifications: {e}")

    @staticmethod
    def notify_thesis_status_change(thesis, old_status, new_status):
        """Notify relevant parties when thesis status changes."""
        try:
            status_messages = {
                'TOPIC_SUBMITTED': ('Topic proposal submitted', 'Your topic proposal has been submitted for review.'),
                'TOPIC_APPROVED': ('Topic proposal approved', 'Your topic proposal has been approved. You can now proceed to the concept paper phase.'),
                'TOPIC_REJECTED': ('Topic proposal rejected', 'Your topic proposal has been rejected. Please review the feedback and resubmit.'),
                'CONCEPT_SUBMITTED': ('Concept paper submitted', 'Your concept paper has been submitted for defense scheduling.'),
                'CONCEPT_SCHEDULED': ('Concept defense scheduled', 'Your concept defense has been scheduled.'),
                'CONCEPT_DEFENDED': ('Concept defense completed', 'Your concept defense has been completed. Results are pending.'),
                'CONCEPT_APPROVED': ('Concept paper approved', 'Your concept paper has been approved. You can now proceed to the full proposal phase.'),
                'PROPOSAL_SUBMITTED': ('Full proposal submitted', 'Your full research proposal has been submitted for defense scheduling.'),
                'PROPOSAL_SCHEDULED': ('Proposal defense scheduled', 'Your proposal defense has been scheduled.'),
                'PROPOSAL_DEFENDED': ('Proposal defense completed', 'Your proposal defense has been completed. Results are pending.'),
                'PROPOSAL_APPROVED': ('Proposal approved', 'Your proposal has been approved. You can now proceed with your research.'),
                'RESEARCH_IN_PROGRESS': ('Research phase started', 'Your research phase has begun. Please submit regular progress updates.'),
                'FINAL_SUBMITTED': ('Final manuscript submitted', 'Your final manuscript has been submitted for defense scheduling.'),
                'FINAL_SCHEDULED': ('Final defense scheduled', 'Your final defense has been scheduled.'),
                'FINAL_DEFENDED': ('Final defense completed', 'Your final defense has been completed. Results are pending.'),
                'FINAL_APPROVED': ('Thesis approved', 'Congratulations! Your thesis has been approved.'),
                'REVISIONS_REQUIRED': ('Revisions required', 'Revisions are required for your thesis. Please review the feedback.'),
                'REJECTED': ('Thesis rejected', 'Your thesis has been rejected. Please review the feedback.'),
            }

            if new_status in status_messages:
                title, message = status_messages[new_status]

                # Notify group members
                for member in thesis.group.members.all():
                    create_notification(
                        user=member,
                        title=title,
                        body=message,
                        link=f'/thesis/{thesis.id}'
                    )

                # Notify adviser
                if thesis.adviser:
                    create_notification(
                        user=thesis.adviser,
                        title=f'{title} - {thesis.group.name}',
                        body=f'Thesis "{thesis.title}" status changed to {new_status.replace("_", " ").title()}.',
                        link=f'/thesis/{thesis.id}'
                    )

                # Notify panels for certain statuses
                panel_statuses = ['PROPOSAL_SUBMITTED', 'FINAL_SUBMITTED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED']
                if new_status in panel_statuses:
                    for panel in thesis.group.panels.all():
                        create_notification(
                            user=panel,
                            title=f'{title} - {thesis.group.name}',
                            body=f'Thesis "{thesis.title}" is ready for your review.',
                            link=f'/thesis/{thesis.id}'
                        )

                logger.info(f"Thesis status change notifications sent for thesis {thesis.id}: {old_status} -> {new_status}")
        except Exception as e:
            logger.error(f"Failed to send thesis status change notifications: {e}")

    @staticmethod
    def notify_comment_added(thesis, commenter, comment_text):
        """Notify relevant parties when a comment is added."""
        try:
            # Notify group members (excluding the commenter if they're a member)
            for member in thesis.group.members.all():
                if member != commenter:
                    create_notification(
                        user=member,
                        title=f'New comment on your thesis',
                        body=f'{commenter.first_name} {commenter.last_name} commented: {comment_text[:100]}...',
                        link=f'/thesis/{thesis.id}'
                    )

            # Notify adviser if commenter is not the adviser
            if thesis.adviser and thesis.adviser != commenter:
                create_notification(
                    user=thesis.adviser,
                    title=f'New comment on thesis - {thesis.group.name}',
                    body=f'{commenter.first_name} {commenter.last_name} commented on "{thesis.title}": {comment_text[:100]}...',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify panels if commenter is not a panel
            if commenter.role != 'PANEL':
                for panel in thesis.group.panels.all():
                    create_notification(
                        user=panel,
                        title=f'New comment on thesis - {thesis.group.name}',
                        body=f'{commenter.first_name} {commenter.last_name} commented on "{thesis.title}": {comment_text[:100]}...',
                        link=f'/thesis/{thesis.id}'
                    )

            logger.info(f"Comment notifications sent for thesis {thesis.id}")
        except Exception as e:
            logger.error(f"Failed to send comment notifications: {e}")

    @staticmethod
    def notify_schedule_created(schedule, thesis):
        """Notify relevant parties when a schedule is created."""
        try:
            # Format the date for notifications
            scheduled_date_str = schedule.start.strftime("%B %d, %Y at %I:%M %p")
            schedule_type = "Defense"  # Default value since there's no schedule_type field
            
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Defense scheduled for your thesis',
                    body=f'Your defense has been scheduled for {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Defense scheduled - {thesis.group.name}',
                    body=f'Defense for "{thesis.title}" has been scheduled for {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            # Notify panels
            for panel in thesis.group.panels.all():
                create_notification(
                    user=panel,
                    title=f'Defense scheduled - {thesis.group.name}',
                    body=f'You are scheduled as a panel for the defense of "{thesis.title}" on {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            logger.info(f"Schedule creation notifications sent for schedule {schedule.id}")
        except Exception as e:
            logger.error(f"Failed to send schedule creation notifications: {e}")

    @staticmethod
    def notify_schedule_updated(schedule, thesis, old_date=None):
        """Notify relevant parties when a schedule is updated."""
        try:
            # Format the date for notifications
            scheduled_date_str = schedule.start.strftime("%B %d, %Y at %I:%M %p")
            schedule_type = "Defense"  # Default value since there's no schedule_type field
            
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Defense schedule updated',
                    body=f'Your defense schedule has been updated to {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Defense schedule updated - {thesis.group.name}',
                    body=f'Defense schedule for "{thesis.title}" has been updated to {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            # Notify panels
            for panel in thesis.group.panels.all():
                create_notification(
                    user=panel,
                    title=f'Defense schedule updated - {thesis.group.name}',
                    body=f'Your panel schedule for the defense of "{thesis.title}" has been updated to {scheduled_date_str}.',
                    link=f'/schedule/{schedule.id}'
                )

            logger.info(f"Schedule update notifications sent for schedule {schedule.id}")
        except Exception as e:
            logger.error(f"Failed to send schedule update notifications: {e}")

    @staticmethod
    def notify_schedule_cancelled(schedule, thesis, reason=""):
        """Notify relevant parties when a schedule is cancelled."""
        try:
            # Format the date for notifications
            scheduled_date_str = schedule.start.strftime("%B %d, %Y at %I:%M %p")
            schedule_type = "Defense"  # Default value since there's no schedule_type field
            
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Defense cancelled',
                    body=f'Your defense scheduled for {scheduled_date_str} has been cancelled.{f" Reason: {reason}" if reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Defense cancelled - {thesis.group.name}',
                    body=f'Defense for "{thesis.title}" has been cancelled.{f" Reason: {reason}" if reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify panels
            for panel in thesis.group.panels.all():
                create_notification(
                    user=panel,
                    title=f'Defense cancelled - {thesis.group.name}',
                    body=f'Your panel assignment for the defense of "{thesis.title}" has been cancelled.{f" Reason: {reason}" if reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            logger.info(f"Schedule cancellation notifications sent for schedule {schedule.id}")
        except Exception as e:
            logger.error(f"Failed to send schedule cancellation notifications: {e}")

    @staticmethod
    def notify_rejection(thesis, rejection_reason, rejected_by):
        """Notify relevant parties when a thesis is rejected."""
        try:
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Thesis rejected',
                    body=f'Your thesis "{thesis.title}" has been rejected.{f" Reason: {rejection_reason}" if rejection_reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Thesis rejected - {thesis.group.name}',
                    body=f'Thesis "{thesis.title}" has been rejected by {rejected_by.first_name} {rejected_by.last_name}.{f" Reason: {rejection_reason}" if rejection_reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify panels
            for panel in thesis.group.panels.all():
                create_notification(
                    user=panel,
                    title=f'Thesis rejected - {thesis.group.name}',
                    body=f'Thesis "{thesis.title}" has been rejected.{f" Reason: {rejection_reason}" if rejection_reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            logger.info(f"Rejection notifications sent for thesis {thesis.id}")
        except Exception as e:
            logger.error(f"Failed to send rejection notifications: {e}")

    @staticmethod
    def notify_topic_approved(thesis, approved_by):
        """Notify relevant parties when a thesis topic is approved."""
        try:
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Thesis topic approved',
                    body=f'Your thesis topic "{thesis.title}" has been approved by {approved_by.first_name} {approved_by.last_name}. You can now proceed to the concept paper phase.',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Thesis topic approved - {thesis.group.name}',
                    body=f'Thesis topic "{thesis.title}" has been approved.',
                    link=f'/thesis/{thesis.id}'
                )

            logger.info(f"Topic approval notifications sent for thesis {thesis.id}")
        except Exception as e:
            logger.error(f"Failed to send topic approval notifications: {e}")

    @staticmethod
    def notify_revision_request(thesis, revision_reason, requested_by):
        """Notify relevant parties when revisions are requested."""
        try:
            # Notify group members
            for member in thesis.group.members.all():
                create_notification(
                    user=member,
                    title=f'Revisions required for your thesis',
                    body=f'Revisions are required for your thesis "{thesis.title}".{f" Reason: {revision_reason}" if revision_reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            # Notify adviser
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'Revisions requested - {thesis.group.name}',
                    body=f'Revisions have been requested for thesis "{thesis.title}" by {requested_by.first_name} {requested_by.last_name}.{f" Reason: {revision_reason}" if revision_reason else ""}',
                    link=f'/thesis/{thesis.id}'
                )

            logger.info(f"Revision request notifications sent for thesis {thesis.id}")
        except Exception as e:
            logger.error(f"Failed to send revision request notifications: {e}")

    @staticmethod
    def notify_thesis_submitted(thesis, submitted_by):
        """Notify relevant parties when a thesis is submitted."""
        try:
            # Notify adviser if assigned
            if thesis.adviser:
                create_notification(
                    user=thesis.adviser,
                    title=f'New thesis submitted: {thesis.title}',
                    body=f'Thesis "{thesis.title}" has been submitted by {submitted_by.first_name} {submitted_by.last_name}.',
                    link=f'/thesis/{thesis.id}'
                )

            logger.info(f"Thesis submission notification sent for thesis {thesis.id}")
        except Exception as e:
            logger.error(f"Failed to send thesis submission notification: {e}")
