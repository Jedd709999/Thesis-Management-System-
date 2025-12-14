import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from api.models.schedule_models import OralDefenseSchedule
from api.models.panel_action_models import PanelAction
from api.models.user_models import User
from api.permissions.role_permissions import IsPanel
from api.serializers import PanelActionSerializer

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