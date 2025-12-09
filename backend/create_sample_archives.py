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
    """Create sample archive records for testing different years."""

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

    # Clear existing sample archives (those with reason containing 'Sample data')
    existing_samples = ArchiveRecord.objects.filter(reason__icontains='Sample data')
    if existing_samples.exists():
        deleted_count = existing_samples.delete()[0]
        print(f"Cleared {deleted_count} existing sample archive records.")

    # Sample thesis data for different years
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
        # 2022 theses
        {
            'title': 'Machine Learning Applications in Healthcare',
            'abstract': 'This thesis explores various machine learning techniques applied to healthcare data analysis, focusing on predictive modeling for disease diagnosis and treatment optimization.',
            'group_name': 'CS-2022-001',
            'panels': ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Davis'],
            'finished_at': '2022-03-15T10:00:00Z',
            'created_at': '2021-09-01T09:00:00Z',
            'updated_at': '2022-03-15T10:00:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Sustainable Energy Solutions for Urban Areas',
            'abstract': 'An investigation into renewable energy systems and their implementation in urban environments, with a focus on solar and wind power integration.',
            'group_name': 'EE-2022-002',
            'panels': ['Dr. Robert Wilson', 'Prof. Lisa Zhang', 'Dr. David Brown'],
            'finished_at': '2022-04-20T14:30:00Z',
            'created_at': '2021-09-15T10:00:00Z',
            'updated_at': '2022-04-20T14:30:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        # 2023 theses
        {
            'title': 'Cybersecurity Frameworks for IoT Devices',
            'abstract': 'This research develops comprehensive security frameworks for Internet of Things devices, addressing vulnerabilities and implementing robust protection mechanisms.',
            'group_name': 'CS-2023-003',
            'panels': ['Dr. James Miller', 'Prof. Anna Garcia', 'Dr. Thomas Lee'],
            'finished_at': '2023-02-10T11:15:00Z',
            'created_at': '2022-10-01T08:30:00Z',
            'updated_at': '2023-02-10T11:15:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'adviser_name': None,
            'group': str(uuid.uuid4()),
            'group_leader': 'John Doe',
            'group_members': ['John Doe', 'Jane Smith', 'Bob Johnson'],
        },
        {
            'title': 'Climate Change Impact on Biodiversity',
            'abstract': 'A comprehensive study of how climate change affects biodiversity patterns, with case studies from various ecosystems and recommendations for conservation strategies.',
            'group_name': 'BIO-2023-004',
            'panels': ['Dr. Maria Rodriguez', 'Prof. Kevin Park', 'Dr. Jennifer White'],
            'finished_at': '2023-05-05T16:45:00Z',
            'created_at': '2022-10-15T09:15:00Z',
            'updated_at': '2023-05-05T16:45:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        # 2024 theses
        {
            'title': 'Artificial Intelligence in Financial Markets',
            'abstract': 'Exploring the application of AI and machine learning algorithms in financial market analysis, trading strategies, and risk assessment.',
            'group_name': 'FIN-2024-005',
            'panels': ['Dr. William Taylor', 'Prof. Sophia Kim', 'Dr. Christopher Moore'],
            'finished_at': '2024-01-12T13:20:00Z',
            'created_at': '2023-09-01T10:45:00Z',
            'updated_at': '2024-01-12T13:20:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Blockchain Technology in Supply Chain Management',
            'abstract': 'This thesis examines the implementation of blockchain technology to enhance transparency, security, and efficiency in supply chain management systems.',
            'group_name': 'CS-2024-006',
            'panels': ['Dr. Patricia Adams', 'Prof. Richard Liu', 'Dr. Susan Carter'],
            'finished_at': '2024-03-18T09:45:00Z',
            'created_at': '2023-09-20T11:30:00Z',
            'updated_at': '2024-03-18T09:45:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Smart City Infrastructure Development',
            'abstract': 'A comprehensive analysis of smart city technologies and infrastructure development, focusing on IoT integration and urban planning optimization.',
            'group_name': 'CE-2024-007',
            'panels': ['Dr. Daniel Evans', 'Prof. Michelle Wong', 'Dr. Andrew Foster'],
            'finished_at': '2024-04-25T15:10:00Z',
            'created_at': '2023-10-05T14:20:00Z',
            'updated_at': '2024-04-25T15:10:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        # 2025 theses (future/completed)
        {
            'title': 'Quantum Computing Algorithms for Optimization',
            'abstract': 'Development and analysis of quantum computing algorithms for solving complex optimization problems in various domains including logistics and finance.',
            'group_name': 'CS-2025-008',
            'panels': ['Dr. Helen Brooks', 'Prof. George Martinez', 'Dr. Nancy Huang'],
            'finished_at': '2025-01-08T12:30:00Z',
            'created_at': '2024-08-15T09:00:00Z',
            'updated_at': '2025-01-08T12:30:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
            'group': str(uuid.uuid4()),
        },
        {
            'title': 'Neural Networks for Natural Language Understanding',
            'abstract': 'Advanced neural network architectures for natural language processing, with applications in conversational AI and automated content analysis.',
            'group_name': 'CS-2025-009',
            'panels': ['Dr. Oliver Scott', 'Prof. Rachel Green', 'Dr. Timothy Baker'],
            'finished_at': '2025-02-14T10:15:00Z',
            'created_at': '2024-09-01T08:45:00Z',
            'updated_at': '2025-02-14T10:15:00Z',
            'status': 'FINAL_APPROVED',
            'adviser': None,
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
    print("Sample archives created for years: 2020 (2), 2022 (2), 2023 (2), 2024 (3), 2025 (2)")
    print("Archive system supports downloading reports for any year (1995-2025 and beyond).")
    print("All archives have FINAL_APPROVED status and can be downloaded in PDF, Excel, and DOC formats.")
    print("You can now test the download functionality in the Archive page.")

if __name__ == '__main__':
    create_sample_archives()
