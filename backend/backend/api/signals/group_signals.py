import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models.group_models import Group
from api.models.thesis_models import Thesis

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Group)
def update_thesis_adviser_when_group_adviser_changes(sender, instance, **kwargs):
    """
    Update the adviser for all theses in a group when the group's adviser is changed.
    """
    try:
        # Check if adviser has changed
        if hasattr(instance, '_original_adviser'):
            old_adviser = instance._original_adviser
            new_adviser = instance.adviser
            
            # If adviser has changed, update all theses in this group
            if old_adviser != new_adviser:
                logger.info(f"Group adviser changed for group {instance.id}. Updating theses.")
                Thesis.objects.filter(group=instance).update(adviser=new_adviser)
        else:
            # For new groups, if they have an adviser, set it for any existing theses
            if instance.adviser:
                logger.info(f"New group with adviser created. Updating theses for group {instance.id}.")
                Thesis.objects.filter(group=instance).update(adviser=instance.adviser)
    except Exception as e:
        logger.error(f"Failed to update thesis adviser when group adviser changed: {str(e)}")
