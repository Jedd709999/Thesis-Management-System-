from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from api.models.group_models import Group
from api.models.thesis_models import Thesis
from api.services.notification_service import NotificationService

@receiver(post_save, sender=Group)
def notify_group_changes(sender, instance, created, **kwargs):
    """Send notifications when group status changes or adviser is assigned."""
    if created:
        return  # Skip notifications for newly created groups

    # Check if group was just approved
    if instance.status == 'APPROVED':
        NotificationService.notify_group_formation(instance)

    # Check if adviser was assigned
    if hasattr(instance, '_original_adviser') and instance._original_adviser != instance.adviser:
        if instance.adviser:
            NotificationService.notify_adviser_assigned(instance)

@receiver(pre_save, sender=Group)
def track_group_changes(sender, instance, **kwargs):
    """Track original values before saving."""
    if instance.pk:
        try:
            original = Group.objects.get(pk=instance.pk)
            instance._original_adviser = original.adviser
        except Group.DoesNotExist:
            pass

@receiver(post_save, sender=Thesis)
def notify_thesis_changes(sender, instance, created, **kwargs):
    """Send notifications when thesis status changes."""
    if created:
        return  # Skip notifications for newly created theses

    # Check if status changed
    if hasattr(instance, '_original_status') and instance._original_status != instance.status:
        NotificationService.notify_thesis_status_change(
            instance, instance._original_status, instance.status
        )

@receiver(pre_save, sender=Thesis)
def track_thesis_changes(sender, instance, **kwargs):
    """Track original values before saving."""
    if instance.pk:
        try:
            original = Thesis.objects.get(pk=instance.pk)
            instance._original_status = original.status
        except Thesis.DoesNotExist:
            pass
