from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.schedule_models import ApprovalSheet, OralDefenseSchedule
from api.models.user_models import User
from api.models.document_models import Document
from api.serializers.approval_sheet_serializers import ApprovalSheetSerializer
from api.permissions.custom_permissions import IsPanel

class ApprovalSheetViewSet(viewsets.ModelViewSet):
    queryset = ApprovalSheet.objects.all().select_related('schedule', 'panel_member', 'document')
    serializer_class = ApprovalSheetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Panel members can only see their own approval sheets
        if self.request.user.role == 'PANEL':
            queryset = queryset.filter(panel_member=self.request.user)
            
        # Students can only see approval sheets for their group's schedules
        elif self.request.user.role == 'STUDENT':
            queryset = queryset.filter(schedule__thesis__group__members=self.request.user)
            
        # Advisers can only see approval sheets for their advised theses
        elif self.request.user.role == 'ADVISER':
            queryset = queryset.filter(schedule__thesis__adviser=self.request.user)
            
        return queryset

    def perform_create(self, serializer):
        # Panel members can only create approval sheets for schedules they're assigned to
        if self.request.user.role == 'PANEL':
            schedule_id = self.request.data.get('schedule')
            if schedule_id:
                try:
                    schedule = OralDefenseSchedule.objects.get(id=schedule_id)
                    if self.request.user not in schedule.panel_members.all():
                        raise PermissionError("You are not assigned to this defense schedule")
                    serializer.save(panel_member=self.request.user)
                except OralDefenseSchedule.DoesNotExist:
                    raise PermissionError("Invalid schedule ID")
            else:
                raise PermissionError("Schedule ID is required")
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsPanel])
    def submit(self, request, pk=None):
        """Submit an approval sheet"""
        approval_sheet = self.get_object()
        
        # Only the panel member can submit their own approval sheet
        if approval_sheet.panel_member != request.user:
            return Response(
                {'detail': 'You are not the panel member for this approval sheet'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        decision = request.data.get('decision')
        comments = request.data.get('comments', '')
        document_id = request.data.get('document_id')
        
        if decision not in ['approved', 'rejected', 'needs_revision']:
            return Response(
                {'detail': 'Invalid decision. Must be approved, rejected, or needs_revision'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        approval_sheet.decision = decision
        approval_sheet.comments = comments
        
        if document_id:
            try:
                document = Document.objects.get(id=document_id)
                approval_sheet.document = document
            except Document.DoesNotExist:
                return Response(
                    {'detail': 'Invalid document ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        approval_sheet.save()
        
        return Response(
            {'detail': f'Approval sheet {decision} successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending approval sheets for the current user"""
        if request.user.role != 'PANEL':
            return Response(
                {'detail': 'Only panel members can view pending approval sheets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_sheets = ApprovalSheet.objects.filter(
            panel_member=request.user,
            decision='pending'
        ).select_related('schedule', 'schedule__thesis')
        
        serializer = self.get_serializer(pending_sheets, many=True)
        return Response(serializer.data)
