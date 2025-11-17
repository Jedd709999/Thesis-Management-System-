from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with initial users and roles for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing test users before seeding',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Provide detailed output during seeding',
        )

    def handle(self, *args, **options):
        verbose = options['verbose']
        reset = options['reset']

        self.stdout.write(self.style.SUCCESS('🌱 Starting database seeding...'))

        try:
            with transaction.atomic():
                if reset:
                    self._reset_existing_users(verbose)

                self._create_admin_users(verbose)
                self._create_adviser_users(verbose)
                self._create_student_users(verbose)
                self._create_panel_users(verbose)

            self.stdout.write(self.style.SUCCESS('✅ Database seeding completed successfully!'))
            self._print_summary()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Seeding failed: {str(e)}'))
            raise

    def _reset_existing_users(self, verbose):
        """Delete existing test users"""
        test_emails = [
            'admin@test.com',
            'admin2@test.com',
            'adviser@test.com',
            'adviser2@test.com',
            'student@test.com',
            'student2@test.com',
            'student3@test.com',
            'panel@test.com',
            'panel2@test.com',
        ]
        
        deleted_count = User.objects.filter(email__in=test_emails).delete()[0]
        
        if verbose:
            self.stdout.write(self.style.WARNING(f'🗑️  Deleted {deleted_count} existing test users'))

    def _create_admin_users(self, verbose):
        """Create admin users"""
        admins = [
            {
                'email': 'admin@test.com',
                'password': 'admin123',
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'admin2@test.com',
                'password': 'admin123',
                'first_name': 'Secondary',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True,
            }
        ]

        for admin_data in admins:
            user, created = User.objects.get_or_create(
                email=admin_data['email'],
                defaults={
                    'role': 'ADMIN',
                    'first_name': admin_data['first_name'],
                    'last_name': admin_data['last_name'],
                    'is_staff': admin_data['is_staff'],
                    'is_superuser': admin_data['is_superuser'],
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(admin_data['password'])
                user.save()
                if verbose:
                    self.stdout.write(self.style.SUCCESS(f'✅ Created admin: {admin_data["email"]}'))
            elif verbose:
                self.stdout.write(self.style.WARNING(f'⚠️  Admin already exists: {admin_data["email"]}'))

    def _create_adviser_users(self, verbose):
        """Create adviser users"""
        advisers = [
            {
                'email': 'adviser@test.com',
                'password': 'adviser123',
                'first_name': 'John',
                'last_name': 'Smith',
                'is_staff': True,
            },
            {
                'email': 'adviser2@test.com',
                'password': 'adviser123',
                'first_name': 'Jane',
                'last_name': 'Johnson',
                'is_staff': True,
            }
        ]

        for adviser_data in advisers:
            user, created = User.objects.get_or_create(
                email=adviser_data['email'],
                defaults={
                    'role': 'ADVISER',
                    'first_name': adviser_data['first_name'],
                    'last_name': adviser_data['last_name'],
                    'is_staff': adviser_data['is_staff'],
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(adviser_data['password'])
                user.save()
                if verbose:
                    self.stdout.write(self.style.SUCCESS(f'✅ Created adviser: {adviser_data["email"]}'))
            elif verbose:
                self.stdout.write(self.style.WARNING(f'⚠️  Adviser already exists: {adviser_data["email"]}'))

    def _create_student_users(self, verbose):
        """Create student users"""
        students = [
            {
                'email': 'student@test.com',
                'password': 'student123',
                'first_name': 'Alice',
                'last_name': 'Williams',
            },
            {
                'email': 'student2@test.com',
                'password': 'student123',
                'first_name': 'Bob',
                'last_name': 'Brown',
            },
            {
                'email': 'student3@test.com',
                'password': 'student123',
                'first_name': 'Charlie',
                'last_name': 'Davis',
            }
        ]

        for student_data in students:
            user, created = User.objects.get_or_create(
                email=student_data['email'],
                defaults={
                    'role': 'STUDENT',
                    'first_name': student_data['first_name'],
                    'last_name': student_data['last_name'],
                    'is_staff': False,
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(student_data['password'])
                user.save()
                if verbose:
                    self.stdout.write(self.style.SUCCESS(f'✅ Created student: {student_data["email"]}'))
            elif verbose:
                self.stdout.write(self.style.WARNING(f'⚠️  Student already exists: {student_data["email"]}'))

    def _create_panel_users(self, verbose):
        """Create panel users"""
        panels = [
            {
                'email': 'panel@test.com',
                'password': 'panel123',
                'first_name': 'Robert',
                'last_name': 'Miller',
            },
            {
                'email': 'panel2@test.com',
                'password': 'panel123',
                'first_name': 'Sarah',
                'last_name': 'Wilson',
            }
        ]

        for panel_data in panels:
            user, created = User.objects.get_or_create(
                email=panel_data['email'],
                defaults={
                    'role': 'PANEL',
                    'first_name': panel_data['first_name'],
                    'last_name': panel_data['last_name'],
                    'is_staff': False,
                    'is_active': True,
                }
            )
            
            if created:
                user.set_password(panel_data['password'])
                user.save()
                if verbose:
                    self.stdout.write(self.style.SUCCESS(f'✅ Created panel: {panel_data["email"]}'))
            elif verbose:
                self.stdout.write(self.style.WARNING(f'⚠️  Panel already exists: {panel_data["email"]}'))

    def _print_summary(self):
        """Print summary of created users"""
        users = User.objects.all()
        role_counts = {}
        
        for user in users:
            role = user.role
            role_counts[role] = role_counts.get(role, 0) + 1

        self.stdout.write('\n📊 User Summary:')
        self.stdout.write('=' * 40)
        
        for role, count in role_counts.items():
            self.stdout.write(f'  {role}: {count} users')
        
        self.stdout.write(f'\n🔑 Test Credentials:')
        self.stdout.write('=' * 40)
        self.stdout.write('  Admin: admin@test.com / admin123')
        self.stdout.write('  Admin: admin2@test.com / admin123')
        self.stdout.write('  Adviser: adviser@test.com / adviser123')
        self.stdout.write('  Adviser: adviser2@test.com / adviser123')
        self.stdout.write('  Student: student@test.com / student123')
        self.stdout.write('  Student: student2@test.com / student123')
        self.stdout.write('  Student: student3@test.com / student123')
        self.stdout.write('  Panel: panel@test.com / panel123')
        self.stdout.write('  Panel: panel2@test.com / panel123')
