import uuid
from django.core.management.base import BaseCommand
from api.models.user_models import User  # Changed back from 'backend.api.models.user_models'

class Command(BaseCommand):
    help = 'Clean up users with invalid UUIDs'

    def handle(self, *args, **options):
        # Get all users
        users = User.objects.all()
        
        invalid_users = []
        valid_users = []
        
        for user in users:
            try:
                # Try to convert the user ID to a UUID
                uuid.UUID(str(user.id))
                valid_users.append(user)
            except (ValueError, TypeError):
                # If it fails, it's an invalid UUID
                invalid_users.append(user)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Found {len(valid_users)} valid users and {len(invalid_users)} invalid users'
            )
        )
        
        # Delete invalid users
        if invalid_users:
            for user in invalid_users:
                self.stdout.write(f'Deleting user with invalid ID: {user.id} ({user.email})')
                user.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {len(invalid_users)} invalid users'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    'No invalid users found'
                )
            )
