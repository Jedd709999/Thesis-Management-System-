#!/usr/bin/env python
"""
Script to populate core database tables with sample data.
This script creates sample users, groups, and theses for testing purposes.
"""

import os
import sys
import django
from datetime import datetime
import uuid

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models.user_models import User
from api.models.group_models import Group, GroupMember
from api.models.thesis_models import Thesis
from api.models.document_models import Document

def populate_core_tables():
    """Populate core database tables with sample data."""
    
    print("=== Populating Core Database Tables ===")
    
    # Clear existing sample data (be careful with this in production!)
    print("Clearing existing sample data...")
    User.objects.filter(email__contains='sample').delete()
    User.objects.filter(email__in=['admin@example.com', 'student1@example.com', 
                                   'student2@example.com', 'adviser1@example.com']).delete()
    Group.objects.filter(name__contains='Sample').delete()
    Thesis.objects.filter(title__contains='Sample').delete()
    
    # Create sample users
    print("Creating sample users...")
    admin_user, _ = User.objects.get_or_create(
        email='admin@example.com',
        defaults={
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'ADMIN',
            'is_approved': True,
            'is_staff': True
        }
    )
    
    student1, _ = User.objects.get_or_create(
        email='student1@example.com',
        defaults={
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'STUDENT',
            'is_approved': True
        }
    )
    
    student2, _ = User.objects.get_or_create(
        email='student2@example.com',
        defaults={
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'STUDENT',
            'is_approved': True
        }
    )
    
    adviser1, _ = User.objects.get_or_create(
        email='adviser1@example.com',
        defaults={
            'first_name': 'Dr.',
            'last_name': 'Robert Wilson',
            'role': 'ADVISER',
            'is_approved': True
        }
    )
    
    # Create sample groups
    print("Creating sample groups...")
    ai_group, _ = Group.objects.get_or_create(
        name='Sample AI Research Group',
        defaults={
            'status': 'APPROVED',
            'possible_topics': 'Machine Learning Applications\nNatural Language Processing\nComputer Vision',
            'leader': student1,
            'adviser': adviser1,
        }
    )
    
    iot_group, _ = Group.objects.get_or_create(
        name='Sample IoT Security Team',
        defaults={
            'status': 'APPROVED',
            'possible_topics': 'Cybersecurity Frameworks\nNetwork Security Protocols\nData Privacy Solutions',
            'leader': student2,
            'adviser': adviser1,
        }
    )
    
    # Create group memberships
    print("Creating group memberships...")
    GroupMember.objects.get_or_create(
        group=ai_group,
        user=student1,
        defaults={'role_in_group': 'leader'}
    )
    
    GroupMember.objects.get_or_create(
        group=iot_group,
        user=student2,
        defaults={'role_in_group': 'leader'}
    )
    
    # Create sample theses
    print("Creating sample theses...")
    ai_thesis, _ = Thesis.objects.get_or_create(
        title='Sample: Deep Learning Applications in Computer Vision',
        defaults={
            'abstract': 'This sample thesis presents novel approaches to computer vision problems using deep learning techniques.',
            'keywords': 'machine learning, computer vision, CNN, deep learning',
            'group': ai_group,
            'proposer': student1,
            'adviser': adviser1,
            'status': 'FINAL_APPROVED',
            'drive_folder_id': 'sample_folder_id_12345'
        }
    )
    
    iot_thesis, _ = Thesis.objects.get_or_create(
        title='Sample: IoT Network Security Frameworks',
        defaults={
            'abstract': 'A comprehensive analysis of security vulnerabilities in Internet of Things networks.',
            'keywords': 'cybersecurity, IoT, network security, encryption',
            'group': iot_group,
            'proposer': student2,
            'adviser': adviser1,
            'status': 'PROPOSAL_APPROVED',
            'drive_folder_id': 'sample_folder_id_67890'
        }
    )
    
    # Create sample documents
    print("Creating sample documents...")
    concept_doc, _ = Document.objects.get_or_create(
        thesis=ai_thesis,
        title='Concept Paper - Computer Vision',
        defaults={
            'document_type': 'concept_paper',
            'status': 'approved',
            'provider': 'drive',
            'uploaded_by': student1,
            'version': 1,
            'google_drive_file_id': 'sample_concept_doc_1',
            'viewer_url': 'https://drive.google.com/file/d/sample_concept_doc_1/view',
            'file_size': 2048000,  # 2MB
        }
    )
    
    proposal_doc, _ = Document.objects.get_or_create(
        thesis=ai_thesis,
        title='Research Proposal - Computer Vision',
        defaults={
            'document_type': 'research_proposal',
            'status': 'approved',
            'provider': 'drive',
            'uploaded_by': student1,
            'version': 1,
            'google_drive_file_id': 'sample_proposal_doc_1',
            'viewer_url': 'https://drive.google.com/file/d/sample_proposal_doc_1/view',
            'file_size': 3072000,  # 3MB
        }
    )
    
    final_doc, _ = Document.objects.get_or_create(
        thesis=ai_thesis,
        title='Final Manuscript - Computer Vision',
        defaults={
            'document_type': 'final_manuscript',
            'status': 'approved',
            'provider': 'drive',
            'uploaded_by': student1,
            'version': 1,
            'google_drive_file_id': 'sample_final_doc_1',
            'viewer_url': 'https://drive.google.com/file/d/sample_final_doc_1/view',
            'file_size': 5120000,  # 5MB
        }
    )
    
    print("\n=== Summary ===")
    print(f"Created {User.objects.count()} users")
    print(f"Created {Group.objects.count()} groups")
    print(f"Created {Thesis.objects.count()} theses")
    print(f"Created {Document.objects.count()} documents")
    
    print("\n=== Sample Data Created Successfully ===")
    print("Users:")
    print("  - admin@example.com (ADMIN)")
    print("  - student1@example.com (STUDENT)")
    print("  - student2@example.com (STUDENT)")
    print("  - adviser1@example.com (ADVISER)")
    print("\nGroups:")
    print("  - Sample AI Research Group")
    print("  - Sample IoT Security Team")
    print("\nTheses:")
    print("  - Sample: Deep Learning Applications in Computer Vision")
    print("  - Sample: IoT Network Security Frameworks")

if __name__ == '__main__':
    populate_core_tables()