from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session

class Command(BaseCommand):
    help = 'Clear all sessions from the database'

    def handle(self, *args, **options):
        # Count sessions before deletion
        session_count = Session.objects.count()
        
        # Delete all sessions
        Session.objects.all().delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleared {session_count} sessions'
            )
        )
