import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from api.models import OralDefenseSchedule, PanelAction, User
from api.models.schedule_models import PanelMemberAvailability
from api.permissions.role_permissions import IsPanel
from api.serializers import (
    PanelMemberAvailabilitySerializer,
    PanelActionSerializer
)

class PanelActionViewSet(viewsets.ViewSet):
    """
    ViewSet for panel member actions on scheduled defenses.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PanelActionSerializer

    def get_queryset(self):
        """Get panel actions based on user role and query parameters."""
        user = self.request.user
        queryset = PanelAction.objects.all()
        
        # Filter by thesis ID if provided in query parameters
        thesis_id = self.request.query_params.get('thesis', None)
        if thesis_id:
            queryset = queryset.filter(schedule__thesis__id=thesis_id)
        
        # For panel members, return actions they've created
        if user.role == 'PANEL':
            return queryset.filter(panel_member=user).select_related('schedule__thesis', 'panel_member')
        
        # For students, return actions related to their theses
        elif user.role == 'STUDENT':
            return queryset.filter(
                schedule__thesis__group__members=user
            ).select_related('schedule__thesis', 'panel_member')
        
        # For advisers, return actions related to theses they advise
        elif user.role == 'ADVISER':
            return queryset.filter(
                schedule__thesis__adviser=user
            ).select_related('schedule__thesis', 'panel_member')
        
        # For admins, return all actions
        elif user.role == 'ADMIN':
            return queryset.select_related('schedule__thesis', 'panel_member')
        
        # For other roles, return empty queryset
        return PanelAction.objects.none()
    
    def list(self, request):
        """List all panel actions accessible to the current user."""
        actions = self.get_queryset()
        serializer = self.serializer_class(actions, many=True, context={'request': request})
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Retrieve a specific panel action."""
        action = get_object_or_404(
            self.get_queryset(),
            pk=pk
        )
        serializer = self.serializer_class(action, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsPanel])
    def approve(self, request, pk=None):
        """Approve the thesis after defense."""
        return self._handle_action(pk, 'approved', request.data.get('comments', ''))

    @action(detail=True, methods=['post'], permission_classes=[IsPanel])
    def request_revision(self, request, pk=None):
        """Request revisions for the thesis."""
        return self._handle_action(pk, 'needs_revision', request.data.get('comments', ''))

    @action(detail=True, methods=['post'], permission_classes=[IsPanel])
    def reject(self, request, pk=None):
        """Reject the thesis."""
        return self._handle_action(pk, 'rejected', request.data.get('comments', ''))

    def _handle_action(self, schedule_id, action_type, comments):
        # Get the schedule with proper permissions
        schedule_queryset = OralDefenseSchedule.objects.filter(
            panel_members=self.request.user,
            status='scheduled'
        ).select_related('thesis')
        
        schedule = get_object_or_404(schedule_queryset, pk=schedule_id)
        thesis = schedule.thesis
        
        with transaction.atomic():
            # Update thesis status based on action
            if action_type == 'approved':
                if thesis.status == 'CONCEPT_SCHEDULED':
                    thesis.status = 'CONCEPT_APPROVED'
                elif thesis.status == 'PROPOSAL_SCHEDULED':
                    thesis.status = 'PROPOSAL_APPROVED'
                elif thesis.status == 'FINAL_SCHEDULED':
                    thesis.status = 'FINAL_APPROVED'
            elif action_type == 'needs_revision':
                # Update thesis status to stage-specific revision status
                if thesis.status == 'CONCEPT_SCHEDULED':
                    thesis.status = 'CONCEPT_REVISIONS_REQUIRED'
                elif thesis.status == 'PROPOSAL_SCHEDULED':
                    thesis.status = 'PROPOSAL_REVISIONS_REQUIRED'
                elif thesis.status == 'FINAL_SCHEDULED':
                    thesis.status = 'FINAL_REVISIONS_REQUIRED'
            elif action_type == 'rejected':
                thesis.status = 'REJECTED'
            
            thesis.save(update_fields=['status', 'updated_at'])
            
            # Record the panel action
            action = PanelAction.objects.create(
                schedule=schedule,
                panel_member=self.request.user,
                action=action_type,
                comments=comments
            )
            
            # Serialize the action for the response
            serializer = self.serializer_class(action, context={'request': self.request})
        
        return Response({
            'status': 'success',
            'message': f'Thesis has been {action_type}',
            'new_status': thesis.get_status_display(),
            'action': serializer.data
        }, status=status.HTTP_200_OK)


class PanelMemberAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = PanelMemberAvailability.objects.all().select_related('user')
    serializer_class = PanelMemberAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Panel members can only see their own availability
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        user_id = self.request.query_params.get('user_id')
        if user_id and self.request.user.is_staff:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset
    
    def perform_create(self, serializer):
        # Regular users can only create availability for themselves
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='my-availability')
    def my_availability(self, request):
        """Get current user's availability"""
        availability = PanelMemberAvailability.objects.filter(user=request.user)
        serializer = self.get_serializer(availability, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Create multiple availability records at once"""
        availability_data = request.data.get('availability', [])
        
        if not availability_data:
            return Response(
                {'error': 'No availability data provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_records = []
        
        try:
            with transaction.atomic():
                for data in availability_data:
                    # Add user to data if not provided (for non-staff users)
                    if 'user' not in data and not request.user.is_staff:
                        data['user'] = request.user.id
                    
                    serializer = self.get_serializer(data=data)
                    if serializer.is_valid():
                        availability = serializer.save()
                        created_records.append(serializer.data)
                    else:
                        return Response(
                            {'error': 'Invalid data', 'details': serializer.errors}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            return Response({
                'message': f'Successfully created {len(created_records)} availability records',
                'records': created_records
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create availability records: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )