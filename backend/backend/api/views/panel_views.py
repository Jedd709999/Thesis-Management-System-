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
            # Instead of filtering by schedule__thesis__id, we'll filter by any panel action
            # related to the thesis, regardless of whether it has a schedule or not
            queryset = queryset.filter(
                Q(schedule__thesis__id=thesis_id) | 
                Q(schedule=None)
            )
        
        # For all authenticated users, if they're accessing a specific thesis,
        # check if they have permission to view that thesis
        if thesis_id:
            try:
                # Import here to avoid circular imports
                from api.models.thesis_models import Thesis
                thesis = Thesis.objects.get(id=thesis_id)
                
                # Check if user has access to this thesis based on their role
                has_access = False
                if user.role == 'ADMIN':
                    # Admins can access all theses
                    has_access = True
                elif user.role == 'STUDENT':
                    # Students can access theses they proposed, or are members of the group
                    has_access = (
                        thesis.proposer == user or
                        (thesis.group and (
                            user in thesis.group.members.all() or
                            user == thesis.group.leader
                        ))
                    )
                elif user.role == 'ADVISER':
                    # Advisers can access theses from their assigned groups
                    has_access = thesis.group and thesis.group.adviser == user
                elif user.role == 'PANEL':
                    # Panel members can access theses from their assigned groups
                    has_access = thesis.group and user in thesis.group.panels.all()
                
                # If user doesn't have access to the thesis, return empty queryset
                if not has_access:
                    print(f"User {user.email} with role {user.role} does not have access to thesis {thesis_id}")
                    return PanelAction.objects.none()
            except Thesis.DoesNotExist:
                # If thesis doesn't exist, return empty queryset
                print(f"Thesis {thesis_id} does not exist")
                return PanelAction.objects.none()
        
        # Apply select_related for performance
        queryset = queryset.select_related('schedule__thesis', 'panel_member')
        
        print(f"Returning {queryset.count()} panel actions for user {user.email} with role {user.role}")
        return queryset
    
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
        # Instead of requiring a schedule, we'll work directly with the thesis
        # This allows panel members to provide feedback on theses with scheduled statuses
        # even when no formal defense schedule exists
        
        try:
            # Import here to avoid circular imports
            from api.models.thesis_models import Thesis
            
            # Get the thesis directly by ID (passed as schedule_id for backward compatibility)
            thesis = Thesis.objects.get(id=schedule_id)
            
            # Check if the thesis has a scheduled status that allows panel actions
            if thesis.status not in ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED']:
                return Response({
                    'status': 'error',
                    'message': 'Panel actions can only be performed on theses with scheduled statuses'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the current user is a panel member for this thesis
            if not (thesis.group and self.request.user in thesis.group.panels.all()):
                return Response({
                    'status': 'error',
                    'message': 'You are not authorized to perform actions on this thesis'
                }, status=status.HTTP_403_FORBIDDEN)
            
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
                
                # Create a dummy schedule for the panel action (since we don't have a real one)
                from api.models.schedule_models import OralDefenseSchedule
                # Try to get an existing schedule for this thesis, or create a dummy one
                schedule, created = OralDefenseSchedule.objects.get_or_create(
                    thesis=thesis,
                    defaults={
                        'date_time': timezone.now(),
                        'location': 'Online',
                        'status': 'completed',  # Mark as completed since action is already taken
                    }
                )
                
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
            
        except Thesis.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Thesis not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in _handle_action: {e}")
            return Response({
                'status': 'error',
                'message': 'An error occurred while processing the action'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
