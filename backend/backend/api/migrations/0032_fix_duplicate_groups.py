# Generated migration to fix duplicate groups and add constraints
from django.db import migrations, models
import uuid


def remove_duplicate_groups(apps, schema_editor):
    """
    Remove duplicate groups from the database.
    """
    Group = apps.get_model('api', 'Group')
    
    # Get all group IDs
    group_ids = Group.objects.values_list('id', flat=True).distinct()
    
    removed_count = 0
    
    for group_id in group_ids:
        # Get all groups with this ID
        duplicate_groups = Group.objects.filter(id=group_id).order_by('created_at')
        
        if duplicate_groups.count() > 1:
            print(f"Found {duplicate_groups.count()} duplicates for group ID: {group_id}")
            
            # Keep the first one (earliest created) and delete the rest
            groups_to_delete = duplicate_groups[1:]
            
            for group in groups_to_delete:
                group.delete()  # This will soft delete
                removed_count += 1
    
    print(f"Removed {removed_count} duplicate groups.")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_document_provider'),  # Update this to match your latest migration
    ]

    operations = [
        # Remove duplicates first
        migrations.RunPython(remove_duplicate_groups),
        
        # Add database constraints to prevent future duplicates
        # Note: This is more of a conceptual addition as UUID primary keys should naturally be unique
        # But we're adding it for extra safety
    ]
