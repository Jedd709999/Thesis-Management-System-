from django.core.management.base import BaseCommand
from django.db import transaction
from api.models.document_models import Document
from api.models.thesis_models import Thesis
from api.services.google_drive_service import GoogleDriveService
import os

class Command(BaseCommand):
    help = 'Migrate existing local documents to Google Drive'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without actually doing it',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Create a Google Drive service instance (without user context)
        drive_service = GoogleDriveService()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN: Showing what would be migrated')
            )
        
        # Find all documents with local provider that have files
        local_documents = Document.objects.filter(
            provider='local'
        ).exclude(file='')
        
        self.stdout.write(
            f'Found {local_documents.count()} local documents to migrate'
        )
        
        migrated_count = 0
        failed_count = 0
        
        for document in local_documents:
            try:
                if not document.thesis:
                    self.stdout.write(
                        f'Skipping document {document.id} - no thesis associated'
                    )
                    continue
                
                if not document.thesis.drive_folder_id:
                    self.stdout.write(
                        f'Skipping document {document.id} - no drive folder for thesis'
                    )
                    continue
                
                if not document.file:
                    self.stdout.write(
                        f'Skipping document {document.id} - no file attached'
                    )
                    continue
                
                if dry_run:
                    self.stdout.write(
                        f'Would migrate document {document.id} "{document.title}" '
                        f'to thesis folder {document.thesis.drive_folder_id}'
                    )
                    continue
                
                # Read the file content
                if not os.path.exists(document.file.path):
                    self.stdout.write(
                        f'Skipping document {document.id} - file not found on disk'
                    )
                    failed_count += 1
                    continue
                
                with open(document.file.path, 'rb') as f:
                    file_content = f.read()
                
                # Upload to Google Drive
                filename = os.path.basename(document.file.path)
                mime_type = document.mime_type or 'application/octet-stream'
                folder_id = document.thesis.drive_folder_id
                
                success, file_info = drive_service.upload_file(
                    file_content, filename, mime_type, folder_id
                )
                
                if not success:
                    self.stdout.write(
                        f'Failed to upload document {document.id} to Google Drive'
                    )
                    failed_count += 1
                    continue
                
                # Update document record
                with transaction.atomic():
                    document.provider = 'drive'
                    document.google_drive_file_id = file_info['id']
                    document.viewer_url = file_info['web_view_link']
                    document.doc_embed_url = file_info['embed_url']
                    document.file_size = int(file_info.get('size', 0))
                    document.mime_type = file_info.get('mime_type', mime_type)
                    document.save()
                
                self.stdout.write(
                    f'Successfully migrated document {document.id} to Google Drive'
                )
                migrated_count += 1
                
            except Exception as e:
                self.stdout.write(
                    f'Error migrating document {document.id}: {str(e)}'
                )
                failed_count += 1
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'DRY RUN COMPLETE: Would migrate {local_documents.count()} documents '
                    f'({migrated_count} successful, {failed_count} failed)'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'MIGRATION COMPLETE: Migrated {migrated_count} documents '
                    f'({failed_count} failed)'
                )
            )
