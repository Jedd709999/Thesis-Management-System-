from django.core.management.base import BaseCommand
from api.models.group_models import Group

class Command(BaseCommand):
    help = 'Remove duplicate groups from the database'

    def handle(self, *args, **options):
        self.stdout.write('Starting duplicate group cleanup...')
        
        # Get all groups ordered by ID and creation time
        groups = Group.objects.all().order_by('id', 'created_at')
        
        seen_ids = set()
        deleted_count = 0
        
        for group in groups:
            group_id_str = str(group.id)
            if group_id_str in seen_ids:
                self.stdout.write(f'Deleting duplicate group: {group_id_str} - {group.name}')
                try:
                    group.hard_delete()  # Permanently delete
                    deleted_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error deleting group {group_id_str}: {e}'))
            else:
                seen_ids.add(group_id_str)
        
        self.stdout.write(
            self.style.SUCCESS(f'Cleanup complete. Deleted {deleted_count} duplicate groups.')
        )
