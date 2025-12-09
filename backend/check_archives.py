#!/usr/bin/env python
"""
Script to check archive records in the database.
"""
import os
import sys
import django
from datetime import datetime
import pytz

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from api.models.archive_record_models import ArchiveRecord

def check_archives():
    """Check archive records"""

    print("=== All Archive Records ===")
    all_archives = ArchiveRecord.objects.filter(content_type='thesis')
    print(f"Total thesis archives: {all_archives.count()}")

    for archive in all_archives:
        print(f"ID: {archive.id}, Title: {archive.data.get('title', 'N/A')}, Archived At: {archive.archived_at}, Status: {archive.data.get('status', 'N/A')}")

    print("\n=== 2024 Archives (using Django timezone) ===")
    # 2024 archives using Django timezone
    start_2024 = timezone.make_aware(datetime(2024, 1, 1))
    end_2024 = timezone.make_aware(datetime(2025, 1, 1))

    print(f"Start date: {start_2024}")
    print(f"End date: {end_2024}")

    archives_2024 = ArchiveRecord.objects.filter(
        content_type='thesis',
        archived_at__gte=start_2024,
        archived_at__lt=end_2024
    )

    print(f"2024 archives count: {archives_2024.count()}")

    for archive in archives_2024:
        print(f"ID: {archive.id}, Title: {archive.data.get('title', 'N/A')}, Archived At: {archive.archived_at}, Status: {archive.data.get('status', 'N/A')}, Adviser: {archive.data.get('adviser', 'N/A')}")

    print("\n=== 2024 FINAL_APPROVED Archives ===")
    archives_2024_approved = ArchiveRecord.objects.filter(
        content_type='thesis',
        archived_at__gte=start_2024,
        archived_at__lt=end_2024,
        data__status='FINAL_APPROVED'
    )

    print(f"2024 FINAL_APPROVED archives count: {archives_2024_approved.count()}")

    for archive in archives_2024_approved:
        print(f"ID: {archive.id}, Title: {archive.data.get('title', 'N/A')}, Archived At: {archive.archived_at}, Status: {archive.data.get('status', 'N/A')}, Adviser: {archive.data.get('adviser', 'N/A')}")

    print("\n=== 2025 Archives (using Django timezone) ===")
    # 2025 archives using Django timezone
    start_2025 = timezone.make_aware(datetime(2025, 1, 1))
    end_2025 = timezone.make_aware(datetime(2026, 1, 1))

    print(f"Start date: {start_2025}")
    print(f"End date: {end_2025}")

    archives_2025 = ArchiveRecord.objects.filter(
        content_type='thesis',
        archived_at__gte=start_2025,
        archived_at__lt=end_2025
    )

    print(f"2025 archives count: {archives_2025.count()}")

    for archive in archives_2025:
        print(f"ID: {archive.id}, Title: {archive.data.get('title', 'N/A')}, Archived At: {archive.archived_at}, Status: {archive.data.get('status', 'N/A')}, Adviser: {archive.data.get('adviser', 'N/A')}")

    print("\n=== 2025 FINAL_APPROVED Archives ===")
    archives_2025_approved = ArchiveRecord.objects.filter(
        content_type='thesis',
        archived_at__gte=start_2025,
        archived_at__lt=end_2025,
        data__status='FINAL_APPROVED'
    )

    print(f"2025 FINAL_APPROVED archives count: {archives_2025_approved.count()}")

    for archive in archives_2025_approved:
        print(f"ID: {archive.id}, Title: {archive.data.get('title', 'N/A')}, Archived At: {archive.archived_at}, Status: {archive.data.get('status', 'N/A')}, Adviser: {archive.data.get('adviser', 'N/A')}")

if __name__ == '__main__':
    check_archives()