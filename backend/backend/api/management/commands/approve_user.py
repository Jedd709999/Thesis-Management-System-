from django.core.management.base import BaseCommand
from api.models.user_models import User  # Changed back from 'backend.api.models.user_models'

class Command(BaseCommand):
    help = 'Approve a user account'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to approve')
        parser.add_argument(
            '--approve',
            action='store_true',
            help='Approve the user (default behavior)',
        )
        parser.add_argument(
            '--reject',
            action='store_true',
            help='Reject the user (set is_approved to False)',
        )

    def handle(self, *args, **options):
        email = options['email']
        approve = options['approve']
        reject = options['reject']
        
        # If neither approve nor reject is specified, default to approve
        if not approve and not reject:
            approve = True
            
        try:
            user = User.objects.get(email=email)
            if approve:
                user.is_approved = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully approved user: {email}')
                )
            else:
                user.is_approved = False
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully rejected user: {email}')
                )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} does not exist')
            )
