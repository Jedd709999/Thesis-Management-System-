import json
import logging
from django.conf import settings
from django.db.models.signals import post_save, post_delete, m2m_changed, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from api.models.audit_log_models import AuditLog
from api.middleware.audit_middleware import get_current_user, get_current_ip, get_current_user_agent, get_current_path

logger = logging.getLogger(__name__)

# Store original values for instances before they're updated
_original_values = {}

def _get_model_fields(instance):
    """
    Get all field values for a model instance as a dictionary.
    """
    data = {}
    for field in instance._meta.get_fields():
        # Skip reverse foreign key relations
        if hasattr(field, 'related_model') and field.many_to_one is False and field.one_to_many is True:
            continue
            
        try:
            if hasattr(instance, field.name):
                value = getattr(instance, field.name)
                # Handle related objects
                if hasattr(value, 'id'):
                    data[field.name] = str(value.id)
                elif hasattr(value, '__str__'):
                    data[field.name] = str(value)
                else:
                    data[field.name] = value
        except Exception as e:
            # Some fields might not be accessible, skip them
            logger.debug(f"Could not get value for field {field.name}: {str(e)}")
            continue
    
    return data

@receiver(pre_save, dispatch_uid="audit_log_pre_save")
def audit_log_pre_save(sender, instance, **kwargs):
    """
    Capture original values before saving an instance.
    """
    try:
        # Skip audit logging for the AuditLog model itself to prevent recursion
        if sender._meta.app_label == 'api' and sender._meta.model_name == 'auditlog':
            return
            
        # Only capture original values for existing instances (not new ones)
        if hasattr(instance, 'id') and instance.id:
            try:
                # Get the original instance from the database
                original_instance = sender.objects.get(id=instance.id)
                _original_values[f"{sender._meta.label}_{instance.id}"] = _get_model_fields(original_instance)
            except sender.DoesNotExist:
                # This is a new instance, no original values to capture
                pass
    except Exception as e:
        logger.error(f"Failed to capture original values for pre_save: {str(e)}")

@receiver(post_save, dispatch_uid="audit_log_post_save")
def audit_log_post_save(sender, instance, created, **kwargs):
    """
    Log create and update operations.
    """
    # Skip audit logging if disabled (e.g., during tests)
    if getattr(settings, 'DISABLE_AUDIT_LOGGING', False):
        return
        
    try:
        # Skip audit logging for the AuditLog model itself to prevent recursion
        if sender._meta.app_label == 'api' and sender._meta.model_name == 'auditlog':
            return
            
        # Get the current user from middleware
        user = get_current_user()
        
        action = 'create' if created else 'update'
        
        # Get current values
        new_values = _get_model_fields(instance)
        
        # Get old values if this is an update
        old_values = None
        if not created and hasattr(instance, 'id'):
            old_values = _original_values.get(f"{sender._meta.label}_{instance.id}")
        
        # Remove from original values cache
        if hasattr(instance, 'id'):
            cache_key = f"{sender._meta.label}_{instance.id}"
            if cache_key in _original_values:
                del _original_values[cache_key]
        
        # Create audit log entry
        try:
            content_type = ContentType.objects.get_for_model(instance)
            
            AuditLog.log_action(
                action=action,
                user=user,
                obj=instance,
                old_values=old_values,
                new_values=new_values
            )
        except Exception as e:
            # Handle case where audit log table doesn't exist yet (e.g., during test setup)
            logger.debug(f"Could not create audit log entry: {str(e)}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log for post_save: {str(e)}")

@receiver(post_delete, dispatch_uid="audit_log_post_delete")
def audit_log_post_delete(sender, instance, **kwargs):
    """
    Log delete operations.
    """
    # Skip audit logging if disabled (e.g., during tests)
    if getattr(settings, 'DISABLE_AUDIT_LOGGING', False):
        return
        
    try:
        # Skip audit logging for the AuditLog model itself to prevent recursion
        if sender._meta.app_label == 'api' and sender._meta.model_name == 'auditlog':
            return
            
        # Get the current user from middleware
        user = get_current_user()
            
        # Get old values (current values before deletion)
        old_values = _get_model_fields(instance)
        
        # Create audit log entry
        try:
            content_type = ContentType.objects.get_for_model(instance)
            
            AuditLog.log_action(
                action='delete',
                user=user,
                obj=instance,
                old_values=old_values,
                new_values=None
            )
        except Exception as e:
            # Handle case where audit log table doesn't exist yet (e.g., during test setup)
            logger.debug(f"Could not create audit log entry: {str(e)}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log for post_delete: {str(e)}")

@receiver(post_save, sender=AuditLog, dispatch_uid="prevent_audit_log_recursion")
def prevent_audit_log_recursion(sender, instance, **kwargs):
    """
    Prevent recursion when saving AuditLog entries.
    """
    pass
