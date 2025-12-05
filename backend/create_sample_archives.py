#!/usr/bin/env python
"""
Script to create sample archive records for testing the download functionality.
"""
import os
import sys
import django
from datetime import datetime, timedelta
import uuid

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.archive_record_models import ArchiveRecord
from api.models.user_models import User

def create_sample_archives():
    """Create 5 sample archive records for testing."""

    # Get or create a sample user
    user, created = User.objects.get_or_create(
        email='admin@example.com',
        defaults={
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'ADMIN',
            'is_approved': True
        }
    )

    # Sample thesis data
    sample_theses = [
        {
            'title': 'Machine Learning Applications in Healthcare',
            'abstract': 'This thesis explores various machine learning techniques applied to healthcare data analysis, focusing on predictive modeling for disease diagnosis and treatment optimization.',
            'group_name': 'CS-2024-001',
            'panels': ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Davis'],
            'finished_at': '2024-01-15T10:00:00Z',
            'created_at': '2023-09-01T09:00:00Z',
            'updated_at': '2024-01-15T10:00:00Z',
            'status': 'COMPLETED',
            'adviser': str(user.id),
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Sustainable Energy Solutions for Urban Areas',
            'abstract': 'An investigation into renewable energy systems and their implementation in urban environments, with a focus on solar and wind power integration.',
            'group_name': 'EE-2024-002',
            'panels': ['Dr. Robert Wilson', 'Prof. Lisa Zhang', 'Dr. David Brown'],
            'finished_at': '2024-02-20T14:30:00Z',
            'created_at': '2023-09-15T10:00:00Z',
            'updated_at': '2024-02-20T14:30:00Z',
            'status': 'COMPLETED',
            'adviser': str(user.id),
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Cybersecurity Frameworks for IoT Devices',
            'abstract': 'This research develops comprehensive security frameworks for Internet of Things devices, addressing vulnerabilities and implementing robust protection mechanisms.',
            'group_name': 'CS-2024-003',
            'panels': ['Dr. James Miller', 'Prof. Anna Garcia', 'Dr. Thomas Lee'],
            'finished_at': '2024-03-10T11:15:00Z',
            'created_at': '2023-10-01T08:30:00Z',
            'updated_at': '2024-03-10T11:15:00Z',
            'status': 'COMPLETED',
            'adviser': str(user.id),
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Climate Change Impact on Biodiversity',
            'abstract': 'A comprehensive study of how climate change affects biodiversity patterns, with case studies from various ecosystems and recommendations for conservation strategies.',
            'group_name': 'BIO-2024-004',
            'panels': ['Dr. Maria Rodriguez', 'Prof. Kevin Park', 'Dr. Jennifer White'],
            'finished_at': '2024-04-05T16:45:00Z',
            'created_at': '2023-10-15T09:15:00Z',
            'updated_at': '2024-04-05T16:45:00Z',
            'status': 'COMPLETED',
            'adviser': str(user.id),
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Artificial Intelligence in Financial Markets',
            'abstract': 'Exploring the application of AI and machine learning algorithms in financial market analysis, trading strategies, and risk assessment.',
            'group_name': 'FIN-2024-005',
            'panels': ['Dr. William Taylor', 'Prof. Sophia Kim', 'Dr. Christopher Moore'],
            'finished_at': '2024-05-12T13:20:00Z',
            'created_at': '2023-11-01T10:45:00Z',
            'updated_at': '2024-05-12T13:20:00Z',
            'status': 'COMPLETED',
            'adviser': str(user.id),
            'group': str(uuid.uuid4()),
        }
    ]

    # Create archive records
    for thesis_data in sample_theses:
        archive_record = ArchiveRecord.objects.create(
            content_type='thesis',
            original_id=uuid.uuid4(),
            data=thesis_data,
            archived_by=user,
            reason='Sample data for testing download functionality',
            retention_period_years=7,
            archived_at=datetime.fromisoformat(thesis_data['finished_at'].replace('Z', '+00:00'))
        )
        print(f"Created archive record for: {thesis_data['title']}")

    print(f"\nSuccessfully created {len(sample_theses)} sample archive records!")
    print("You can now test the download functionality in the Archive page.")

if __name__ == '__main__':
    create_sample_archives()
