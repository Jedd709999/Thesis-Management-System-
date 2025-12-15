from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Q
from django.utils import timezone
from api.models.thesis_models import Thesis
from api.models.group_models import Group
from api.serializers.thesis_serializers import ThesisSerializer
from api.permissions.role_permissions import IsStudent, IsStudentOrAdviserForThesis

from api.services.google_drive_service import GoogleDriveService
from api.services.notification_service import NotificationService

# Create a global drive service instance
drive_service = GoogleDriveService()

def ensure_thesis_drive_folder(thesis):
    """
    Ensure that a Google Drive folder exists for the thesis.
    If it doesn't exist, create one using the thesis proposer's Google Drive account.
    If it does exist, ensure it's shared with all relevant users.
    """
    print(f"ensure_thesis_drive_folder called for thesis: {thesis.title}")
    
    folder_id = thesis.drive_folder_id
    
    # If folder doesn't exist, create it using the thesis proposer's Google Drive account
    if not folder_id:
        print(f"Creating new folder for thesis: {thesis.title}")
        
        # Use the thesis proposer's Google Drive account if available
        from api.services.google_drive_service import GoogleDriveService
        
        # Try to use the proposer's credentials first
        if thesis.proposer:
            try:
                user_drive_service = GoogleDriveService(user=thesis.proposer)
                if user_drive_service.service:
                    print(f"Using proposer's Google Drive account: {thesis.proposer.email}")
                    success, folder_id, folder_url = user_drive_service.create_drive_folder(thesis)
                else:
                    print("Proposer's Google Drive service not available, falling back to system service")
                    # Fallback to system service
                    from api.services.google_drive_service import GoogleDriveService
                    success, folder_id, folder_url = drive_service.create_drive_folder(thesis)
            except Exception as e:
                print(f"Error using proposer's Google Drive account: {e}")
                # Fallback to system service
                from api.services.google_drive_service import GoogleDriveService
                success, folder_id, folder_url = drive_service.create_drive_folder(thesis)
        else:
            # Fallback to system service if no proposer
            from api.services.google_drive_service import GoogleDriveService
            success, folder_id, folder_url = drive_service.create_drive_folder(thesis)
        
        print(f"create_drive_folder returned: success={success}, folder_id={folder_id}, folder_url={folder_url}")
        
        if not success or not folder_id:
            print("Failed to create folder")
            # Check if the error is related to credentials that cannot be refreshed
            if folder_url and "Credentials expired and cannot be refreshed" in str(folder_url):
                print("Credentials need to be re-authenticated")
                # This would be handled by the frontend - show user a message to reconnect their Google account
            return None
        
        # Update the thesis with the new folder ID
        thesis.drive_folder_id = folder_id
        thesis.save(update_fields=['drive_folder_id'])
        
        print(f"Folder successfully created with ID: {folder_id}")
    else:
        print(f"Folder already exists with ID: {folder_id}")
    
    return folder_id

class ThesisViewSet(viewsets.ModelViewSet):
    serializer_class = ThesisSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentOrAdviserForThesis]
    queryset = Thesis.objects.all()  # Required for router basename
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        print(f"get_queryset called for user: {user.email}, role: {user.role}")
        
        # Admins can access all theses
        if user.role == 'ADMIN':
            queryset = Thesis.objects.select_related('group', 'proposer', 'group__adviser').all()
            print(f"Admin user, queryset count before any filter: {queryset.count()}")
            for thesis in queryset:
                print(f"  Thesis ID: {thesis.id}, Title: {thesis.title}, Status: {thesis.status}, Group: {thesis.group}")
        else:
            # For non-admin users, apply filtering based on their role
            queryset = Thesis.objects.select_related('group', 'proposer', 'group__adviser')
            
            # Students can only see theses they have access to
            if user.role == 'STUDENT':
                queryset = queryset.filter(
                    models.Q(proposer=user) |  # Their own theses
                    models.Q(group__members=user) |  # Theses from their groups
                    models.Q(group__leader=user)  # Theses from groups they lead
                )
                print(f"Student user, queryset count after role filter: {queryset.count()}")
            
            # Advisers can see theses from their assigned groups
            elif user.role == 'ADVISER':
                queryset = queryset.filter(group__adviser=user)
                print(f"Adviser user, queryset count after role filter: {queryset.count()}")
                
            # Panel members can see theses from their assigned groups
            elif user.role == 'PANEL':
                queryset = queryset.filter(group__panels=user)
                print(f"Panel user, queryset count after role filter: {queryset.count()}")
            else:
                # For any other role, return empty queryset
                queryset = queryset.none()
                print(f"Unknown user role: {user.role}, returning empty queryset")
        
        # Apply status filter if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            # Split comma-separated statuses
            statuses = [s.strip() for s in status_param.split(',')]
            print(f"Applying status filter: {statuses}")
            queryset = queryset.filter(status__in=statuses)
            print(f"Queryset count after status filter: {queryset.count()}")
        
        print(f"Final queryset count: {queryset.count()}")
        return queryset.distinct()
    
    def get_object(self):
        """Override to get the object"""
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def statistics(self, request):
        """Get thesis statistics for admin dashboard"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can view thesis statistics'}, status=status.HTTP_403_FORBIDDEN)

        # Get all theses counts by status
        total_theses = Thesis.objects.count()
        
        # Count theses by various statuses
        topic_submitted = Thesis.objects.filter(status='TOPIC_SUBMITTED').count()
        topic_approved = Thesis.objects.filter(status='TOPIC_APPROVED').count()
        topic_rejected = Thesis.objects.filter(status='TOPIC_REJECTED').count()
        concept_submitted = Thesis.objects.filter(status='CONCEPT_SUBMITTED').count()
        concept_approved = Thesis.objects.filter(status='CONCEPT_APPROVED').count()
        proposal_submitted = Thesis.objects.filter(status='PROPOSAL_SUBMITTED').count()
        proposal_approved = Thesis.objects.filter(status='PROPOSAL_APPROVED').count()
        final_submitted = Thesis.objects.filter(status='FINAL_SUBMITTED').count()
        final_approved = Thesis.objects.filter(status='FINAL_APPROVED').count()
        archived = Thesis.objects.filter(status='ARCHIVED').count()

        return Response({
            'total_theses': total_theses,
            'topic_submitted': topic_submitted,
            'topic_approved': topic_approved,
            'topic_rejected': topic_rejected,
            'concept_submitted': concept_submitted,
            'concept_approved': concept_approved,
            'proposal_submitted': proposal_submitted,
            'proposal_approved': proposal_approved,
            'final_submitted': final_submitted,
            'final_approved': final_approved,
            'archived': archived
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_current_user_theses(self, request):
        """Get theses for groups where the user is a member, adviser, panel, or leader"""
        user = request.user
        print(f"get_current_user_theses called for: {user.email}, Role: {user.role}")
        
        # Get theses for groups where user is a member, adviser, panel, or leader
        theses = Thesis.objects.filter(
            models.Q(group__members=user) | 
            models.Q(group__adviser=user) | 
            models.Q(group__panels=user) |
            models.Q(group__leader=user)
        ).select_related('group', 'proposer', 'group__adviser').distinct()
        
        # Filter out deleted theses for non-admin users
        # Note: deleted_at field was removed from Thesis model
        pass
        
        print(f"Theses count for user: {theses.count()}")
        for thesis in theses:
            print(f"  - ID: {thesis.id}, Title: {thesis.title}")
        
        serializer = self.get_serializer(theses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_other_theses(self, request):
        """Get all approved theses except those where the user is a member, adviser, panel, or leader"""
        user = request.user
        print(f"get_other_theses called for: {user.email}, Role: {user.role}")
        
        # Get all approved theses
        theses = Thesis.objects.filter(group__status='APPROVED')
        
        # Exclude theses for groups where user is a member, adviser, panel, or leader
        theses = theses.exclude(
            models.Q(group__members=user) | 
            models.Q(group__adviser=user) | 
            models.Q(group__panels=user) |
            models.Q(group__leader=user)
        ).select_related('group', 'proposer', 'group__adviser')
        
        # Filter out deleted theses for non-admin users
        # Note: deleted_at field was removed from Thesis model
        pass
        
        print(f"Other theses count: {theses.count()}")
        for thesis in theses:
            print(f"  - ID: {thesis.id}, Title: {thesis.title}")
        
        serializer = self.get_serializer(theses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def user_theses(self, request):
        """Get theses for the current user (student)"""
        user = request.user
        if user.role != 'STUDENT':
            return Response({'detail': 'Only students can access this endpoint'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get theses for groups where user is a member
        theses = Thesis.objects.filter(group__members=user, group__status='APPROVED') \
                               .select_related('group', 'proposer', 'group__adviser')
        
        # Filter out deleted theses
        # Note: deleted_at field was removed from Thesis model
        pass
        
        serializer = self.get_serializer(theses, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        # For students, check if they belong to an approved group
        if self.request.user.role == 'STUDENT':
            # Get the user's group
            user_group = self.request.user.member_groups.first()
            if not user_group:
                raise PermissionError("You must be a member of an approved group to create a thesis")
            
            # Check if the group is approved
            if user_group.status != 'APPROVED':
                raise PermissionError("Your group must be approved before you can create a thesis")
                
            thesis = serializer.save(group=user_group, proposer=self.request.user)
            
            # Ensure Google Drive folder exists for the new thesis
            try:
                ensure_thesis_drive_folder(thesis)
            except Exception as e:
                print(f"Failed to create Google Drive folder for new thesis: {e}")
        else:
            thesis = serializer.save()
            
            # Ensure Google Drive folder exists for the new thesis
            try:
                ensure_thesis_drive_folder(thesis)
            except Exception as e:
                print(f"Failed to create Google Drive folder for new thesis: {e}")

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        thesis = self.get_object()
        
        # Debug logging
        print(f"Submit called for thesis {thesis.id}")
        print(f"Thesis group status: {thesis.group.status}")
        print(f"Thesis adviser: {thesis.adviser}")
        
        # Check if the group is approved before allowing submission
        if thesis.group.status != 'APPROVED':
            return Response(
                {'detail': 'Your group must be approved before you can submit a thesis'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        thesis.submit()

        # Send thesis submission notification
        NotificationService.notify_thesis_submitted(thesis, request.user)
        return Response(self.get_serializer(thesis).data)

    @action(detail=True, methods=['post'])
    def adviser_review(self, request, pk=None):
        thesis = self.get_object()
        action = request.data.get('action')
        feedback = request.data.get('feedback','')
        
        # Debug logging
        print(f"Adviser review called for thesis {thesis.id}")
        print(f"Thesis adviser: {thesis.adviser}")
        print(f"Request user: {request.user}")
        print(f"Request user ID: {request.user.id if request.user else 'None'}")
        
        # Check if the current user is the adviser for this thesis
        # Use thesis.adviser instead of thesis.group.adviser for consistency
        if not thesis.adviser:
            print("Thesis adviser is None")
            return Response(
                {'detail': 'This thesis does not have an assigned adviser'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if thesis.adviser != request.user:
            print(f"Authorization failed: thesis.adviser={thesis.adviser}, request.user={request.user}")
            return Response(
                {'detail': 'You are not authorized to review this thesis'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        print(f"Authorization successful, action: {action}")
        
        if action == 'approve_topic':
            # Approve the topic proposal - status becomes TOPIC_APPROVED
            thesis.status = 'TOPIC_APPROVED'
            thesis.adviser_feedback = feedback

            # Ensure Google Drive folder exists for the thesis
            try:
                ensure_thesis_drive_folder(thesis)
            except Exception as e:
                print(f"Failed to create Google Drive folder: {e}")

            thesis.save()

            # Send topic approval notifications
            NotificationService.notify_topic_approved(thesis, request.user)
            return Response(self.get_serializer(thesis).data)
        elif action == 'request_revision':
            # Request revision for the topic proposal
            # Update thesis status to stage-specific revision status based on current status
            if thesis.status == 'CONCEPT_SCHEDULED':
                thesis.status = 'CONCEPT_REVISIONS_REQUIRED'
            elif thesis.status == 'PROPOSAL_SCHEDULED':
                thesis.status = 'PROPOSAL_REVISIONS_REQUIRED'
            elif thesis.status == 'FINAL_SCHEDULED':
                thesis.status = 'FINAL_REVISIONS_REQUIRED'
            else:
                # Fallback for other statuses
                thesis.status = 'CONCEPT_REVISIONS_REQUIRED'
            thesis.adviser_feedback = feedback
            thesis.save()

            # Send revision request notifications
            NotificationService.notify_revision_request(thesis, feedback, request.user)
            return Response(self.get_serializer(thesis).data)
        elif action == 'reject':
            # Reject the topic proposal
            thesis.status = 'TOPIC_REJECTED'
            thesis.adviser_feedback = feedback
            thesis.save()

            # Send rejection notifications
            NotificationService.notify_rejection(thesis, feedback or 'No reason provided', request.user)
            return Response(self.get_serializer(thesis).data)
        elif action == 'approve_thesis':
            # Approve the full thesis (after topic was approved)
            if thesis.status == 'TOPIC_APPROVED':
                thesis.status = 'PROPOSAL_SUBMITTED'  # Move to proposal phase
                thesis.adviser_feedback = feedback
                
                # Ensure Google Drive folder exists and is shared with panels
                try:
                    folder_id = ensure_thesis_drive_folder(thesis)
                    if folder_id:
                        # Share folder with panels if not already shared
                        users_to_share = []
                        if thesis.group:
                            for panel in thesis.group.panels.all():
                                if panel.email and panel.email not in [thesis.proposer.email if thesis.proposer else None, 
                                                                      thesis.adviser.email if thesis.adviser else None]:
                                    users_to_share.append(panel.email)
                        
                        if users_to_share:
                            # Sharing is now handled automatically by the newer GoogleDriveService
                            # when creating folders, so we don't need to do it separately
                            pass
                except Exception as e:
                    print(f"Failed to ensure Google Drive folder exists: {e}")
                
                thesis.save()

                # Send notifications for thesis status change
                NotificationService.notify_thesis_status_change(thesis, 'TOPIC_APPROVED', 'PROPOSAL_SUBMITTED')
                return Response(self.get_serializer(thesis).data)
            else:
                return Response(
                    {'detail': 'Invalid action for current thesis status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif action == 'approve_proposal':
            # Approve the proposal - move to research phase
            if thesis.status == 'PROPOSAL_DEFENDED':
                thesis.status = 'RESEARCH_IN_PROGRESS'
                thesis.adviser_feedback = feedback
                
                # Ensure Google Drive folder exists
                try:
                    ensure_thesis_drive_folder(thesis)
                except Exception as e:
                    print(f"Failed to ensure Google Drive folder exists: {e}")
                
                thesis.save()

                # Send proposal approval notifications
                NotificationService.notify_proposal_approved(thesis, request.user)
                return Response(self.get_serializer(thesis).data)
            else:
                return Response(
                    {'detail': 'Invalid action for current thesis status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif action == 'approve_final':
            # Approve the final thesis
            if thesis.status == 'FINAL_DEFENDED':
                thesis.status = 'FINAL_APPROVED'
                thesis.adviser_feedback = feedback
                
                # Ensure Google Drive folder exists
                try:
                    ensure_thesis_drive_folder(thesis)
                except Exception as e:
                    print(f"Failed to ensure Google Drive folder exists: {e}")
                
                thesis.save()

                # Send notifications for final approval
                NotificationService.notify_final_approved(thesis, request.user)
                return Response(self.get_serializer(thesis).data)
            else:
                return Response(
                    {'detail': 'Invalid action for current thesis status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        return Response({'detail':'invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to delete Google Drive folder when thesis is deleted"""
        instance = self.get_object()
        
        # Store the drive folder ID before deletion
        drive_folder_id = instance.drive_folder_id
        
        # Call the parent destroy method
        response = super().destroy(request, *args, **kwargs)
        
        # If deletion was successful and we have a drive folder, delete it from Google Drive
        if response.status_code == status.HTTP_204_NO_CONTENT and drive_folder_id:
            try:
                # Use the thesis proposer's Google Drive service if available, otherwise fall back to current user
                from api.services.google_drive_service import GoogleDriveService
                drive_user = instance.proposer if instance.proposer else request.user
                drive_service = GoogleDriveService(user=drive_user)
                
                # Delete the folder from Google Drive
                if drive_service.delete_folder(drive_folder_id):
                    print(f"Successfully deleted Google Drive folder {drive_folder_id} for thesis {instance.id}")
                else:
                    print(f"Failed to delete Google Drive folder {drive_folder_id} for thesis {instance.id}")
            except Exception as e:
                print(f"Error deleting Google Drive folder for thesis {instance.id}: {e}")
        
        return response
    
    # New panel actions that work directly with thesis status
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def panel_approve(self, request, pk=None):
        """Allow panel members to approve a thesis based on its scheduled status"""
        thesis = self.get_object()
        
        # Check if user is a panel member for this thesis
        if not self._is_panel_member_for_thesis(request.user, thesis):
            return Response(
                {'detail': 'You are not authorized to perform this action on this thesis.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if thesis has a scheduled status
        scheduled_statuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED']
        if thesis.status not in scheduled_statuses:
            return Response(
                {'detail': 'This thesis does not have a scheduled defense.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update thesis status based on current status
        if thesis.status == 'CONCEPT_SCHEDULED':
            thesis.status = 'CONCEPT_APPROVED'
        elif thesis.status == 'PROPOSAL_SCHEDULED':
            thesis.status = 'PROPOSAL_APPROVED'
        elif thesis.status == 'FINAL_SCHEDULED':
            thesis.status = 'FINAL_APPROVED'
        
        thesis.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'status': 'success',
            'message': 'Thesis has been approved',
            'new_status': thesis.get_status_display(),
            'thesis': self.get_serializer(thesis).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def panel_request_revision(self, request, pk=None):
        """Allow panel members to request revisions for a thesis"""
        thesis = self.get_object()
        
        # Check if user is a panel member for this thesis
        if not self._is_panel_member_for_thesis(request.user, thesis):
            return Response(
                {'detail': 'You are not authorized to perform this action on this thesis.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if thesis has a scheduled status
        scheduled_statuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED']
        if thesis.status not in scheduled_statuses:
            return Response(
                {'detail': 'This thesis does not have a scheduled defense.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update thesis status to stage-specific revision status
        if thesis.status == 'CONCEPT_SCHEDULED':
            thesis.status = 'CONCEPT_REVISIONS_REQUIRED'
        elif thesis.status == 'PROPOSAL_SCHEDULED':
            thesis.status = 'PROPOSAL_REVISIONS_REQUIRED'
        elif thesis.status == 'FINAL_SCHEDULED':
            thesis.status = 'FINAL_REVISIONS_REQUIRED'
        
        thesis.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'status': 'success',
            'message': 'Revisions have been requested for this thesis',
            'new_status': thesis.get_status_display(),
            'thesis': self.get_serializer(thesis).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def panel_reject(self, request, pk=None):
        """Allow panel members to reject a thesis"""
        thesis = self.get_object()
        
        # Check if user is a panel member for this thesis
        if not self._is_panel_member_for_thesis(request.user, thesis):
            return Response(
                {'detail': 'You are not authorized to perform this action on this thesis.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if thesis has a scheduled status
        scheduled_statuses = ['CONCEPT_SCHEDULED', 'PROPOSAL_SCHEDULED', 'FINAL_SCHEDULED']
        if thesis.status not in scheduled_statuses:
            return Response(
                {'detail': 'This thesis does not have a scheduled defense.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update thesis status
        thesis.status = 'REJECTED'
        thesis.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'status': 'success',
            'message': 'Thesis has been rejected',
            'new_status': thesis.get_status_display(),
            'thesis': self.get_serializer(thesis).data
        }, status=status.HTTP_200_OK)
    
    def _is_panel_member_for_thesis(self, user, thesis):
        """Helper method to check if a user is a panel member for a thesis"""
        # Check if the thesis group exists and has panels
        if hasattr(thesis, 'group') and thesis.group and hasattr(thesis.group, 'panels'):
            # Check if user is in the panels list
            return thesis.group.panels.filter(id=user.id).exists()
        return False
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def archive(self, request, pk=None):
        """Archive a thesis (admin only) - changes status to ARCHIVED and creates ArchiveRecord"""
        thesis = self.get_object()
        
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'detail': 'Only administrators can archive theses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if thesis is in FINAL_APPROVED status
        if thesis.status != 'FINAL_APPROVED':
            return Response(
                {'detail': 'Only theses with FINAL_APPROVED status can be archived'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Change thesis status to ARCHIVED
        thesis.status = 'ARCHIVED'
        thesis.save(update_fields=['status', 'updated_at'])
        
        # Also create an ArchiveRecord for this thesis
        try:
            from api.models.archive_record_models import ArchiveRecord
            
            # Get panel members
            panel_members = []
            if thesis.group and thesis.group.panels:
                panel_members = [f"{panel.first_name} {panel.last_name}" for panel in thesis.group.panels.all()]

            # Get adviser name
            adviser_name = None
            if thesis.adviser:
                adviser_name = f"{thesis.adviser.first_name} {thesis.adviser.last_name}"

            # Get keywords as list
            keywords_list = thesis.get_keywords_list()

            # Create archive record with all required information
            archive_data = {
                'title': thesis.title,
                'abstract': thesis.abstract,
                'keywords': keywords_list,
                'status': thesis.status,
                'adviser': str(thesis.adviser.id) if thesis.adviser else None,
                'adviser_name': adviser_name,
                'group': str(thesis.group.id),
                'group_name': thesis.group.name if thesis.group else 'Unknown Group',
                'panels': panel_members,
                'drive_folder_url': thesis.get_drive_folder_url(),
                'finished_at': timezone.now().isoformat(),
                'created_at': thesis.created_at.isoformat(),
                'updated_at': thesis.updated_at.isoformat(),
            }
            
            archive_record = ArchiveRecord.objects.create(
                content_type='thesis',
                original_id=thesis.id,
                data=archive_data,
                archived_by=request.user,
                reason='Archived by administrator',
                retention_period_years=7
            )
            
            # Update Google Drive folder permissions to read-only if folder exists
            if thesis.drive_folder_id:
                try:
                    from api.services.google_drive_service import GoogleDriveService
                    # Initialize Google Drive service with the thesis proposer's credentials if available
                    drive_service = GoogleDriveService(user=thesis.proposer if thesis.proposer else None)
                    if drive_service.service:
                        success = drive_service.update_folder_permissions_to_readonly(thesis.drive_folder_id)
                        if success:
                            print(f"Successfully updated Google Drive folder {thesis.drive_folder_id} to read-only")
                        else:
                            print(f"Failed to update Google Drive folder {thesis.drive_folder_id} to read-only")
                    else:
                        print(f"Google Drive service not available for folder {thesis.drive_folder_id}")
                except Exception as e:
                    print(f"Error updating Google Drive folder permissions: {e}")
            
        except Exception as e:
            print(f"Error creating archive record: {e}")
            # We don't return an error here because the thesis was already archived successfully
        
        return Response({
            'status': 'success',
            'message': 'Thesis has been archived successfully',
            'new_status': thesis.get_status_display(),
            'thesis': self.get_serializer(thesis).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def search_topics(self, request):
        """Search for thesis topics by keyword and return detailed information to prevent duplication"""
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({
                'query': query,
                'exists': False,
                'results': [],
                'message': 'Please provide a search query'
            })

        # Search in title, abstract, and keywords
        theses = Thesis.objects.filter(
            Q(title__icontains=query) |
            Q(abstract__icontains=query) |
            Q(keywords__icontains=query)
        ).select_related('group', 'proposer', 'adviser', 'group__leader').prefetch_related('group__panels')

        results = []
        for thesis in theses:
            # Get panel members
            panel_members = []
            if thesis.group and thesis.group.panels.exists():
                panel_members = [
                    f"{panel.first_name} {panel.last_name}" for panel in thesis.group.panels.all()
                ]

            # Get group members (students)
            group_members = []
            if thesis.group and thesis.group.members.exists():
                group_members = [
                    f"{member.first_name} {member.last_name}" for member in thesis.group.members.all()
                ]

            results.append({
                'id': str(thesis.id),
                'title': thesis.title,
                'abstract': thesis.abstract,
                'keywords': thesis.keywords,
                'status': thesis.status,
                'status_display': thesis.get_status_display(),
                # Group information
                'group_name': thesis.group.name if thesis.group else None,
                'group_leader': f"{thesis.group.leader.first_name} {thesis.group.leader.last_name}" if thesis.group and thesis.group.leader else None,
                'group_leader_email': thesis.group.leader.email if thesis.group and thesis.group.leader else None,
                # People involved
                'proposer_name': f"{thesis.proposer.first_name} {thesis.proposer.last_name}" if thesis.proposer else None,
                'proposer_email': thesis.proposer.email if thesis.proposer else None,
                'adviser_name': f"{thesis.adviser.first_name} {thesis.adviser.last_name}" if thesis.adviser else None,
                'adviser_email': thesis.adviser.email if thesis.adviser else None,
                'panel_members': panel_members,
                'group_members': group_members,
                # Dates
                'created_at': thesis.created_at.isoformat(),
                'updated_at': thesis.updated_at.isoformat(),
                'created_date_display': thesis.created_at.strftime('%B %d, %Y'),
                'created_time_display': thesis.created_at.strftime('%I:%M %p'),
                # Location (if available in group, otherwise generic)
                'location': 'University Research Laboratory'  # Default location, could be enhanced with actual location data
            })

        exists = len(results) > 0

        return Response({
            'query': query,
            'exists': exists,
            'results': results,
            'message': f"This thesis topic {'already exists' if exists else 'is not yet existed'}",
            'total_results': len(results)
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def find_similar_by_keywords(self, request):
        """Find theses with similar keywords to detect potential duplicates"""
        thesis_id = request.query_params.get('thesis_id', None)
        
        if not thesis_id:
            return Response({
                'error': 'thesis_id parameter is required'
            }, status=400)
        
        try:
            # Get the reference thesis
            reference_thesis = Thesis.objects.get(id=thesis_id)
            
            # Get reference keywords
            reference_keywords = reference_thesis.get_keywords_list()
            
            if not reference_keywords:
                return Response({
                    'similar_theses': [],
                    'count': 0,
                    'message': 'No keywords found in the reference thesis'
                })
            
            # Find similar theses based on keyword overlap
            similar_theses = []
            all_theses = Thesis.objects.exclude(id=thesis_id).exclude(keywords__isnull=True).exclude(keywords='')
            
            for thesis in all_theses:
                thesis_keywords = thesis.get_keywords_list()
                if not thesis_keywords:
                    continue
                
                # Calculate similarity based on keyword overlap
                common_keywords = set(reference_keywords) & set(thesis_keywords)
                similarity_ratio = len(common_keywords) / len(set(reference_keywords)) if reference_keywords else 0
                
                # If at least 50% of keywords match, consider it similar
                if similarity_ratio >= 0.5:
                    similar_theses.append({
                        'id': str(thesis.id),
                        'title': thesis.title,
                        'group_name': thesis.group.name if thesis.group else None,
                        'status': thesis.status,
                        'status_display': thesis.get_status_display(),
                        'common_keywords': list(common_keywords),
                        'similarity_ratio': similarity_ratio,
                        'total_common_keywords': len(common_keywords)
                    })
            
            # Sort by similarity ratio (highest first)
            similar_theses.sort(key=lambda x: x['similarity_ratio'], reverse=True)
            
            return Response({
                'similar_theses': similar_theses[:10],  # Limit to top 10 matches
                'count': len(similar_theses),
                'message': f"Found {len(similar_theses)} theses with similar keywords"
            })
            
        except Thesis.DoesNotExist:
            return Response({
                'error': 'Thesis not found'
            }, status=404)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)
