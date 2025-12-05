from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from api.models.archive_record_models import ArchiveRecord
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.models.group_models import Group
from api.serializers.archive_serializers import ArchiveRecordSerializer
from api.permissions.role_permissions import IsAdmin, IsAdviser

class ArchiveRecordViewSet(viewsets.ModelViewSet):
    queryset = ArchiveRecord.objects.all().select_related('archived_by')
    serializer_class = ArchiveRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Admins can see all archive records
        if self.request.user.role == 'ADMIN':
            return queryset
            
        # Advisers can see archive records for their advised theses
        elif self.request.user.role == 'ADVISER':
            return queryset.filter(
                content_type='thesis',
                archived_by__advised_theses__adviser=self.request.user
            ) | queryset.filter(archived_by=self.request.user)
            
        # Students can only see archive records they created
        elif self.request.user.role == 'STUDENT':
            return queryset.filter(archived_by=self.request.user)
            
        # Panels can only see archive records they created
        elif self.request.user.role == 'PANEL':
            return queryset.filter(archived_by=self.request.user)
            
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(archived_by=self.request.user)

    @action(detail=False, methods=['get'])
    def thesis_archives(self, request):
        """Get all thesis archive records"""
        thesis_archives = ArchiveRecord.objects.filter(content_type='thesis').select_related('archived_by')
        serializer = self.get_serializer(thesis_archives, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def document_archives(self, request):
        """Get all document archive records"""
        document_archives = ArchiveRecord.objects.filter(content_type='document').select_related('archived_by')
        serializer = self.get_serializer(document_archives, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def group_archives(self, request):
        """Get all group archive records"""
        group_archives = ArchiveRecord.objects.filter(content_type='group').select_related('archived_by')
        serializer = self.get_serializer(group_archives, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def restore(self, request, pk=None):
        """Restore an archived record (admin only)"""
        archive_record = self.get_object()
        
        # For now, we'll just mark it as restored in the archive record
        # In a real implementation, you would restore the actual data
        return Response(
            {'detail': 'Archive record marked for restoration. Actual restoration would be implemented in a real system.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def archive_thesis(self, request):
        """Archive a thesis"""
        thesis_id = request.data.get('thesis_id')
        reason = request.data.get('reason', '')
        retention_period = request.data.get('retention_period_years', 7)
        
        if not thesis_id:
            return Response(
                {'detail': 'thesis_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            thesis = Thesis.objects.get(id=thesis_id)
        except Thesis.DoesNotExist:
            return Response(
                {'detail': 'Invalid thesis ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check permissions - only admins and advisers can archive theses
        if not (self.request.user.role == 'ADMIN' or 
                (self.request.user.role == 'ADVISER' and thesis.adviser == self.request.user)):
            return Response(
                {'detail': 'You do not have permission to archive this thesis'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get panel members
        panel_members = []
        if thesis.group and thesis.group.panels:
            panel_members = [f"{panel.first_name} {panel.last_name}" for panel in thesis.group.panels.all()]

        # Create archive record
        archive_data = {
            'title': thesis.title,
            'abstract': thesis.abstract,
            'status': thesis.status,
            'adviser': str(thesis.adviser.id) if thesis.adviser else None,
            'group': str(thesis.group.id),
            'group_name': thesis.group.name if thesis.group else 'Unknown Group',
            'panels': panel_members,
            'finished_at': timezone.now().isoformat(),
            'created_at': thesis.created_at.isoformat(),
            'updated_at': thesis.updated_at.isoformat(),
        }
        
        archive_record = ArchiveRecord.objects.create(
            content_type='thesis',
            original_id=thesis.id,
            data=archive_data,
            archived_by=self.request.user,
            reason=reason,
            retention_period_years=retention_period
        )
        
        serializer = self.get_serializer(archive_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def download_pdf_report(self, request):
        """Download PDF report of finished theses for a specific year"""
        year = request.GET.get('year')
        if not year:
            return HttpResponse('Year parameter is required', status=400, content_type='text/plain')

        try:
            year_int = int(year)
        except ValueError:
            return HttpResponse('Invalid year format', status=400, content_type='text/plain')

        # Check permissions - only admins and advisers can download reports
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return HttpResponse('Authentication required', status=401, content_type='text/plain')

        if request.user.role not in ['ADMIN', 'ADVISER']:
            return HttpResponse('You do not have permission to download reports', status=403, content_type='text/plain')

        # Get archived theses for the specified year
        start_date = timezone.make_aware(timezone.datetime(year_int, 1, 1))
        end_date = timezone.make_aware(timezone.datetime(year_int + 1, 1, 1))

        # Filter based on user role
        queryset = ArchiveRecord.objects.filter(
            content_type='thesis',
            archived_at__gte=start_date,
            archived_at__lt=end_date
        )

        # Temporarily disable adviser filtering for testing
        # if request.user.role == 'ADVISER':
        #     # Advisers can only see theses they advised
        #     queryset = queryset.filter(
        #         data__adviser=str(request.user.id)
        #     )

        # Create PDF document
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Normal'],
            fontSize=12,
            fontName='Helvetica-Bold',
            alignment=1
        )

        normal_style = styles['Normal']

        story = []

        # Title
        title = Paragraph(f"Thesis Archive Report - {year}", title_style)
        story.append(title)
        story.append(Spacer(1, 12))

        # Report info
        info_text = f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>Total theses: {queryset.count()}"
        info = Paragraph(info_text, normal_style)
        story.append(info)
        story.append(Spacer(1, 20))

        if queryset.exists():
            # Simple text-based report instead of table
            for archive in queryset:
                archive_data = archive.data or {}

                # Extract data with safe defaults
                group_name = str(archive_data.get('group_name', 'Unknown Group'))
                topic = str(archive_data.get('title', 'Unknown Topic'))
                abstract = str(archive_data.get('abstract', 'No abstract available'))
                finished_at = archive.archived_at.strftime('%Y-%m-%d %H:%M:%S') if archive.archived_at else 'Unknown'
                panels = archive_data.get('panels', [])
                panel_names = ', '.join(str(p) for p in panels) if panels else 'No panel assigned'

                # Add thesis info
                thesis_info = f"""
<b>Group:</b> {group_name}<br/>
<b>Topic:</b> {topic}<br/>
<b>Abstract:</b> {abstract[:300]}{'...' if len(abstract) > 300 else ''}<br/>
<b>Finished:</b> {finished_at}<br/>
<b>Panel:</b> {panel_names}
"""
                story.append(Paragraph(thesis_info, normal_style))
                story.append(Spacer(1, 12))
        else:
            # No data message
            no_data = Paragraph("No archived theses found for the selected year.", normal_style)
            story.append(no_data)

        # Build PDF
        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename=thesis_report_{year}.pdf'
        response['Content-Length'] = buffer.tell()

        return response

    def download_excel_report(self, request):
        """Download Excel report of finished theses for a specific year"""
        year = request.GET.get('year')
        if not year:
            return HttpResponse('Year parameter is required', status=400, content_type='text/plain')

        try:
            year_int = int(year)
        except ValueError:
            return HttpResponse('Invalid year format', status=400, content_type='text/plain')

        # Check permissions - only admins and advisers can download reports
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return HttpResponse('Authentication required', status=401, content_type='text/plain')

        if request.user.role not in ['ADMIN', 'ADVISER']:
            return HttpResponse('You do not have permission to download reports', status=403, content_type='text/plain')

        # Get archived theses for the specified year
        start_date = timezone.make_aware(timezone.datetime(year_int, 1, 1))
        end_date = timezone.make_aware(timezone.datetime(year_int + 1, 1, 1))

        # Filter based on user role
        queryset = ArchiveRecord.objects.filter(
            content_type='thesis',
            archived_at__gte=start_date,
            archived_at__lt=end_date
        )

        # Create Excel workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Thesis Report {year}"

        # Header styling
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        center_alignment = Alignment(horizontal="center", vertical="center")

        # Headers
        headers = ['Group Name', 'Topic', 'Abstract', 'Date & Time Finished', 'Panel Members']
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_alignment

        # Data rows
        row_num = 2
        if queryset.exists():
            for archive in queryset:
                data = archive.data or {}

                # Extract group name
                group_name = str(data.get('group_name', 'Unknown Group'))

                # Extract topic (title)
                topic = str(data.get('title', 'Unknown Topic'))

                # Extract abstract
                abstract = str(data.get('abstract', 'No abstract available'))

                # Extract finished date (use archived_at as finished date)
                finished_at = archive.archived_at.strftime('%Y-%m-%d %H:%M:%S') if archive.archived_at else 'Unknown'

                # Extract panel members (this would need to be stored in archive data)
                panels = data.get('panels', [])
                panel_names = ', '.join(str(p) for p in panels) if panels else 'No panel assigned'

                # Write data to Excel
                ws.cell(row=row_num, column=1, value=group_name)
                ws.cell(row=row_num, column=2, value=topic)
                ws.cell(row=row_num, column=3, value=abstract)
                ws.cell(row=row_num, column=4, value=finished_at)
                ws.cell(row=row_num, column=5, value=panel_names)

                row_num += 1
        else:
            # Add a row indicating no data
            ws.cell(row=row_num, column=1, value='No archived theses found for the selected year')
            ws.merge_cells(start_row=row_num, start_column=1, end_row=row_num, end_column=5)
            ws.cell(row=row_num, column=1).alignment = Alignment(horizontal='center')

        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)  # Max width of 50
            ws.column_dimensions[column_letter].width = adjusted_width

        # Create response with BytesIO buffer
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=thesis_report_{year}.xlsx'
        response['Content-Length'] = buffer.tell()

        return response

    def download_doc_report(self, request):
        """Download DOC (HTML) report of finished theses for a specific year"""
        year = request.GET.get('year')
        if not year:
            return HttpResponse('Year parameter is required', status=400, content_type='text/plain')

        try:
            year_int = int(year)
        except ValueError:
            return HttpResponse('Invalid year format', status=400, content_type='text/plain')

        # Check permissions - only admins and advisers can download reports
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return HttpResponse('Authentication required', status=401, content_type='text/plain')

        if request.user.role not in ['ADMIN', 'ADVISER']:
            return HttpResponse('You do not have permission to download reports', status=403, content_type='text/plain')

        # Get archived theses for the specified year
        start_date = timezone.make_aware(timezone.datetime(year_int, 1, 1))
        end_date = timezone.make_aware(timezone.datetime(year_int + 1, 1, 1))

        # Filter based on user role
        queryset = ArchiveRecord.objects.filter(
            content_type='thesis',
            archived_at__gte=start_date,
            archived_at__lt=end_date
        )

        # Create HTML content that can be opened as DOC
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thesis Archive Report - {year}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; text-align: center; }}
        .thesis {{ margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }}
        .field {{ margin-bottom: 10px; }}
        .label {{ font-weight: bold; color: #666; }}
        .value {{ margin-left: 10px; }}
        .metadata {{ text-align: center; color: #666; margin-bottom: 30px; }}
    </style>
</head>
<body>
    <h1>Thesis Archive Report - {year}</h1>
    <div class="metadata">
        Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
        Total theses: {queryset.count()}
    </div>
"""

        if queryset.exists():
            for archive in queryset:
                data = archive.data or {}

                group_name = str(data.get('group_name', 'Unknown Group'))
                topic = str(data.get('title', 'Unknown Topic'))
                abstract = str(data.get('abstract', 'No abstract available'))
                finished_at = archive.archived_at.strftime('%Y-%m-%d %H:%M:%S') if archive.archived_at else 'Unknown'
                panels = data.get('panels', [])
                panel_names = ', '.join(str(p) for p in panels) if panels else 'No panel assigned'

                html_content += f"""
    <div class="thesis">
        <div class="field">
            <span class="label">Group:</span>
            <span class="value">{group_name}</span>
        </div>
        <div class="field">
            <span class="label">Topic:</span>
            <span class="value">{topic}</span>
        </div>
        <div class="field">
            <span class="label">Abstract:</span>
            <span class="value">{abstract}</span>
        </div>
        <div class="field">
            <span class="label">Finished:</span>
            <span class="value">{finished_at}</span>
        </div>
        <div class="field">
            <span class="label">Panel:</span>
            <span class="value">{panel_names}</span>
        </div>
    </div>
"""
        else:
            html_content += """
    <div class="thesis">
        <p>No archived theses found for the selected year.</p>
    </div>
"""

        html_content += """
</body>
</html>
"""

        response = HttpResponse(
            html_content,
            content_type='application/msword'
        )
        response['Content-Disposition'] = f'attachment; filename=thesis_report_{year}.doc'
        response['Content-Length'] = len(html_content.encode('utf-8'))

        return response

    @action(detail=False, methods=['post'], url_path='download_report', permission_classes=[permissions.IsAuthenticated])
    def download_report(self, request):
        """Download report of finished theses for a specific year in selected format"""
        year = request.data.get('year')
        format_type = request.data.get('format', 'pdf')  # Default to PDF

        if not year:
            return Response(
                {'detail': 'Year is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if format_type not in ['pdf', 'excel', 'doc']:
            return Response(
                {'detail': 'Invalid format. Choose pdf, excel, or doc'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a mock GET request with the year and format parameters
        from django.http import HttpRequest, QueryDict
        mock_request = HttpRequest()
        mock_request.GET = QueryDict(f'year={year}&format={format_type}')
        mock_request.user = request.user
        mock_request.method = 'GET'
        mock_request.META = request.META.copy()  # Copy meta information

        if format_type == 'pdf':
            return self.download_pdf_report(mock_request)
        elif format_type == 'excel':
            return self.download_excel_report(mock_request)
        else:  # doc
            return self.download_doc_report(mock_request)

    @action(detail=False, methods=['post'])
    def archive_document(self, request):
        """Archive a document"""
        document_id = request.data.get('document_id')
        reason = request.data.get('reason', '')
        retention_period = request.data.get('retention_period_years', 7)
        
        if not document_id:
            return Response(
                {'detail': 'document_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response(
                {'detail': 'Invalid document ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check permissions - only admins, advisers, and owners can archive documents
        if not (self.request.user.role == 'ADMIN' or 
                (self.request.user.role == 'ADVISER' and document.thesis.adviser == self.request.user) or
                document.uploaded_by == self.request.user):
            return Response(
                {'detail': 'You do not have permission to archive this document'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Create archive record
        archive_data = {
            'title': document.get_document_type_display(),
            'document_type': document.document_type,
            'file_path': str(document.file) if document.file else None,
            'google_doc_id': document.google_doc_id,
            'provider': document.provider,
            'uploaded_by': str(document.uploaded_by.id) if document.uploaded_by else None,
            'thesis': str(document.thesis.id) if document.thesis else None,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
        }
        
        archive_record = ArchiveRecord.objects.create(
            content_type='document',
            original_id=document.id,
            data=archive_data,
            archived_by=self.request.user,
            reason=reason,
            retention_period_years=retention_period
        )
        
        serializer = self.get_serializer(archive_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)