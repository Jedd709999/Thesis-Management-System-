from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
import uuid
from api.models.user_models import User
from api.models.group_models import Group, GroupMember
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.models.schedule_models import DefenseSchedule
from api.models.notification_models import Notification
from api.models.panel_action_models import PanelAction
from api.models.archive_record_models import ArchiveRecord
import random

class Command(BaseCommand):
    help = 'Populate database with sample data for all tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-first',
            action='store_true',
            help='Clear existing data before populating',
        )

    def handle(self, *args, **options):
        clear_first = options['clear_first']
        
        if clear_first:
            self.stdout.write("Clearing existing data...")
            self.clear_existing_data()
        
        self.stdout.write("Creating sample users...")
        users = self.create_sample_users()
        
        self.stdout.write("Creating sample groups...")
        groups = self.create_sample_groups(users)
        
        self.stdout.write("Creating group memberships...")
        self.create_group_memberships(groups, users)
        
        self.stdout.write("Creating topic proposals...")
        proposals = self.create_topic_proposals(groups)
        
        self.stdout.write("Creating sample theses...")
        theses = self.create_sample_theses(groups, proposals, users)
        
        self.stdout.write("Creating sample documents...")
        self.create_sample_documents(theses, users)
        
        self.stdout.write("Creating sample schedules...")
        schedules = self.create_sample_schedules(theses)
        
        self.stdout.write("Creating sample panel actions...")
        self.create_sample_panel_actions(theses, users, schedules)
        
        self.stdout.write("Creating sample notifications...")
        self.create_sample_notifications(users)
        
        self.stdout.write("Creating sample archive records...")
        self.create_sample_archives(users)
        
        self.stdout.write(
            self.style.SUCCESS(
                'Successfully populated database with sample data!\n'
                f'Created {len(users)} users, {len(groups)} groups, {len(proposals)} proposals,\n'
                f'{len(theses)} theses, {Document.objects.count()} documents,\n'
                f'{len(schedules)} schedules, {PanelAction.objects.count()} panel actions,\n'
                f'{Notification.objects.count()} notifications, {ArchiveRecord.objects.count()} archive records'
            )
        )

    def clear_existing_data(self):
        """Clear all existing data from tables"""
        # Clear in reverse order of dependencies
        ArchiveRecord.objects.all().delete()
        Notification.objects.all().delete()
        PanelAction.objects.all().delete()
        DefenseSchedule.objects.all().delete()
        Document.objects.all().delete()
        Thesis.objects.all().delete()
        # TopicProposal.objects.all().delete()  # Removed as TopicProposal model no longer exists
        GroupMember.objects.all().delete()
        Group.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        
    def create_sample_users(self):
        """Create sample users with different roles"""
        users_data = [
            # Admin
            {
                'email': 'admin@example.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'is_approved': True,
                'is_staff': True,
                'is_superuser': False
            },
            # Students
            {
                'email': 'student1@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'STUDENT',
                'is_approved': True
            },
            {
                'email': 'student2@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'role': 'STUDENT',
                'is_approved': True
            },
            {
                'email': 'student3@example.com',
                'first_name': 'Bob',
                'last_name': 'Johnson',
                'role': 'STUDENT',
                'is_approved': True
            },
            {
                'email': 'student4@example.com',
                'first_name': 'Alice',
                'last_name': 'Williams',
                'role': 'STUDENT',
                'is_approved': True
            },
            # Advisers
            {
                'email': 'adviser1@example.com',
                'first_name': 'Dr.',
                'last_name': 'Robert Wilson',
                'role': 'ADVISER',
                'is_approved': True
            },
            {
                'email': 'adviser2@example.com',
                'first_name': 'Prof.',
                'last_name': 'Sarah Johnson',
                'role': 'ADVISER',
                'is_approved': True
            },
            # Panel members
            {
                'email': 'panel1@example.com',
                'first_name': 'Dr.',
                'last_name': 'Maria Rodriguez',
                'role': 'PANEL',
                'is_approved': True
            },
            {
                'email': 'panel2@example.com',
                'first_name': 'Dr.',
                'last_name': 'James Miller',
                'role': 'PANEL',
                'is_approved': True
            },
        ]
        
        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults=user_data
            )
            if not created:
                # Update existing user with new data
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.save()
            users.append(user)
            
        return users

    def create_sample_groups(self, users):
        """Create sample groups"""
        groups_data = [
            {
                'name': 'AI Research Group',
                'status': 'APPROVED',
                'possible_topics': 'Machine Learning Applications\nNatural Language Processing\nComputer Vision',
                'leader': users[1],  # student1
                'adviser': users[5],  # adviser1
            },
            {
                'name': 'IoT Security Team',
                'status': 'APPROVED',
                'possible_topics': 'Cybersecurity Frameworks\nNetwork Security Protocols\nData Privacy Solutions',
                'leader': users[2],  # student2
                'adviser': users[6],  # adviser2
            },
            {
                'name': 'Sustainable Energy Solutions',
                'status': 'PENDING',
                'possible_topics': 'Renewable Energy Systems\nSolar Power Optimization\nWind Energy Storage',
                'leader': users[3],  # student3
            },
        ]
        
        groups = []
        for group_data in groups_data:
            group, created = Group.objects.get_or_create(
                name=group_data['name'],
                defaults=group_data
            )
            if not created:
                # Update existing group with new data
                for key, value in group_data.items():
                    setattr(group, key, value)
                group.save()
            groups.append(group)
            
        return groups

    def create_group_memberships(self, groups, users):
        """Create group memberships"""
        # AI Research Group members
        GroupMember.objects.get_or_create(
            group=groups[0],
            user=users[1],  # John Doe
            defaults={'role_in_group': 'leader'}
        )
        GroupMember.objects.get_or_create(
            group=groups[0],
            user=users[2],  # Jane Smith
            defaults={'role_in_group': 'member'}
        )
        
        # IoT Security Team members
        GroupMember.objects.get_or_create(
            group=groups[1],
            user=users[3],  # Bob Johnson
            defaults={'role_in_group': 'leader'}
        )
        GroupMember.objects.get_or_create(
            group=groups[1],
            user=users[4],  # Alice Williams
            defaults={'role_in_group': 'member'}
        )
        
        # Add panel members to groups
        groups[0].panels.add(users[7])  # panel1
        groups[0].panels.add(users[8])  # panel2
        groups[1].panels.add(users[7])  # panel1

    def create_topic_proposals(self, groups):
        """Create sample topic proposals - REMOVED as TopicProposal model no longer exists"""
        # Return empty list as TopicProposal model no longer exists
        return []
        
    def create_sample_theses(self, groups, proposals, users):
        """Create sample theses"""
        theses_data = [
            {
                'title': 'Deep Learning Applications in Computer Vision',
                'abstract': 'This thesis presents novel approaches to computer vision problems using deep learning techniques, with particular focus on real-time object detection and classification.',
                'keywords': 'machine learning, computer vision, CNN, deep learning',
                'group': groups[0],
                'proposer': users[1],  # John Doe
                # 'origin_proposal': proposals[0],  # Removed as TopicProposal model no longer exists
                'adviser': users[5],  # adviser1
                'status': 'FINAL_APPROVED',
                'drive_folder_id': '1A2B3C4D5E6F7G8H9I0J',
            },
            {
                'title': 'IoT Network Security Frameworks',
                'abstract': 'Development of comprehensive security frameworks for Internet of Things networks, addressing vulnerabilities and implementing robust protection mechanisms.',
                'keywords': 'cybersecurity, IoT, network security, encryption',
                'group': groups[1],
                'proposer': users[3],  # Bob Johnson
                # 'origin_proposal': proposals[1],  # Removed as TopicProposal model no longer exists
                'adviser': users[6],  # adviser2
                'status': 'PROPOSAL_APPROVED',
                'drive_folder_id': '2B3C4D5E6F7G8H9I0J1K',
            },
        ]
        
        theses = []
        for thesis_data in theses_data:
            thesis, created = Thesis.objects.get_or_create(
                title=thesis_data['title'],
                defaults=thesis_data
            )
            theses.append(thesis)
            
        return theses

    def create_sample_documents(self, theses, users):
        """Create sample documents"""
        documents_data = [
            # Documents for first thesis
            {
                'thesis': theses[0],
                'title': 'Concept Paper - Computer Vision',
                'document_type': 'concept_paper',
                'status': 'approved',
                'provider': 'drive',
                'uploaded_by': users[1],  # John Doe
                'version': 1,
                'google_drive_file_id': '1a2b3c4d5e6f7g8h9i0j_concept',
                'viewer_url': 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j_concept/view',
                'file_size': 2048000,  # 2MB
            },
            {
                'thesis': theses[0],
                'title': 'Research Proposal - Computer Vision',
                'document_type': 'research_proposal',
                'status': 'approved',
                'provider': 'drive',
                'uploaded_by': users[1],  # John Doe
                'version': 1,
                'google_drive_file_id': '1a2b3c4d5e6f7g8h9i0j_proposal',
                'viewer_url': 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j_proposal/view',
                'file_size': 3072000,  # 3MB
            },
            {
                'thesis': theses[0],
                'title': 'Final Manuscript - Computer Vision',
                'document_type': 'final_manuscript',
                'status': 'approved',
                'provider': 'drive',
                'uploaded_by': users[1],  # John Doe
                'version': 1,
                'google_drive_file_id': '1a2b3c4d5e6f7g8h9i0j_final',
                'viewer_url': 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j_final/view',
                'file_size': 5120000,  # 5MB
            },
            # Documents for second thesis
            {
                'thesis': theses[1],
                'title': 'Concept Paper - IoT Security',
                'document_type': 'concept_paper',
                'status': 'approved',
                'provider': 'drive',
                'uploaded_by': users[3],  # Bob Johnson
                'version': 1,
                'google_drive_file_id': '2b3c4d5e6f7g8h9i0j1k_concept',
                'viewer_url': 'https://drive.google.com/file/d/2b3c4d5e6f7g8h9i0j1k_concept/view',
                'file_size': 1843200,  # 1.8MB
            },
            {
                'thesis': theses[1],
                'title': 'Research Proposal - IoT Security',
                'document_type': 'research_proposal',
                'status': 'approved',
                'provider': 'drive',
                'uploaded_by': users[3],  # Bob Johnson
                'version': 1,
                'google_drive_file_id': '2b3c4d5e6f7g8h9i0j1k_proposal',
                'viewer_url': 'https://drive.google.com/file/d/2b3c4d5e6f7g8h9i0j1k_proposal/view',
                'file_size': 2867200,  # 2.8MB
            },
        ]
        
        for document_data in documents_data:
            Document.objects.get_or_create(
                thesis=document_data['thesis'],
                title=document_data['title'],
                defaults=document_data
            )

    def create_sample_schedules(self, theses):
        """Create sample defense schedules"""
        schedules_data = [
            {
                'thesis': theses[0],
                'defense_type': 'FINAL',
                'scheduled_date': timezone.now() + timedelta(days=30),
                'start_time': '09:00:00',
                'end_time': '11:00:00',
                'location': 'Room 301, Science Building',
                'status': 'CONFIRMED',
            },
            {
                'thesis': theses[1],
                'defense_type': 'PROPOSAL',
                'scheduled_date': timezone.now() + timedelta(days=15),
                'start_time': '14:00:00',
                'end_time': '16:00:00',
                'location': 'Room 205, Engineering Building',
                'status': 'CONFIRMED',
            },
        ]
        
        schedules = []
        for schedule_data in schedules_data:
            schedule, created = DefenseSchedule.objects.get_or_create(
                thesis=schedule_data['thesis'],
                defense_type=schedule_data['defense_type'],
                defaults=schedule_data
            )
            schedules.append(schedule)
            
        return schedules

    def create_sample_panel_actions(self, theses, users, schedules):
        """Create sample panel actions"""
        panel_actions_data = [
            {
                'thesis': theses[0],
                'panel_member': users[7],  # panel1
                'schedule': schedules[0],
                'action': 'approved',
                'comments': 'Excellent work on the computer vision research. The methodology is sound and the results are impressive.',
            },
            {
                'thesis': theses[0],
                'panel_member': users[8],  # panel2
                'schedule': schedules[0],
                'action': 'approved',
                'comments': 'Well-structured thesis with innovative approaches to image recognition challenges.',
            },
            {
                'thesis': theses[1],
                'panel_member': users[7],  # panel1
                'schedule': schedules[1],
                'action': 'approved',
                'comments': 'Solid proposal with practical security solutions for IoT networks.',
            },
        ]
        
        for action_data in panel_actions_data:
            PanelAction.objects.get_or_create(
                thesis=action_data['thesis'],
                panel_member=action_data['panel_member'],
                schedule=action_data['schedule'],
                defaults=action_data
            )

    def create_sample_notifications(self, users):
        """Create sample notifications"""
        notifications_data = [
            {
                'recipient': users[1],  # John Doe
                'title': 'Thesis Approved',
                'message': 'Your thesis "Deep Learning Applications in Computer Vision" has been approved by your adviser.',
                'notification_type': 'THESIS',
            },
            {
                'recipient': users[3],  # Bob Johnson
                'title': 'Defense Scheduled',
                'message': 'Your proposal defense has been scheduled for next week. Please prepare accordingly.',
                'notification_type': 'SCHEDULE',
            },
            {
                'recipient': users[5],  # adviser1
                'title': 'New Thesis to Review',
                'message': 'A new thesis titled "IoT Network Security Frameworks" requires your review.',
                'notification_type': 'THESIS',
            },
        ]
        
        for notification_data in notifications_data:
            Notification.objects.get_or_create(
                recipient=notification_data['recipient'],
                title=notification_data['title'],
                defaults=notification_data
            )

    def create_sample_archives(self, users):
        """Create sample archive records"""
        # Use the existing sample data from create_sample_archives.py
        sample_theses = [
            # 2020 theses (to show historical archives)
            {
                'title': 'COVID-19 Impact on Remote Learning Systems',
                'abstract': 'This thesis examines the rapid transition to online education during the COVID-19 pandemic, analyzing the effectiveness of remote learning platforms and student adaptation strategies.',
                'group_name': 'EDU-2020-001',
                'panels': ['Dr. Maria Santos', 'Prof. Robert Kim', 'Dr. Lisa Wong'],
                'finished_at': '2020-05-20T14:00:00Z',
                'created_at': '2019-09-01T09:00:00Z',
                'updated_at': '2020-05-20T14:00:00Z',
                'status': 'FINAL_APPROVED',
                'adviser': None,
                'group': str(uuid.uuid4()),
            },
            {
                'title': 'Blockchain Security in Financial Transactions',
                'abstract': 'A comprehensive analysis of blockchain technology applications in securing financial transactions, with focus on cryptocurrency and digital banking systems.',
                'group_name': 'CS-2020-002',
                'panels': ['Dr. James Wilson', 'Prof. Anna Lee', 'Dr. David Park'],
                'finished_at': '2020-06-10T11:30:00Z',
                'created_at': '2019-09-15T10:00:00Z',
                'updated_at': '2020-06-10T11:30:00Z',
                'status': 'FINAL_APPROVED',
                'adviser': None,
                'group': str(uuid.uuid4()),
            },
        ]
        
        # Create archive records
        for thesis_data in sample_theses:
            ArchiveRecord.objects.get_or_create(
                content_type='thesis',
                data=thesis_data,
                archived_by=users[0],  # admin
                reason='Sample data for testing download functionality',
                retention_period_years=7,
                archived_at=datetime.fromisoformat(thesis_data['finished_at'].replace('Z', '+00:00')),
                defaults={
                    'original_id': uuid.uuid4(),
                }
            )