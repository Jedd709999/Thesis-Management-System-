from rest_framework import viewsets, permissions
<<<<<<< HEAD
from rest_framework.decorators import action, api_view
=======
from rest_framework.decorators import action
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import models
<<<<<<< HEAD
from django.db.models import Q
=======
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
from api.models.thesis_models import Thesis
from api.models.group_models import Group
from api.serializers.thesis_serializers import ThesisSerializer
from api.permissions.role_permissions import IsStudent, IsStudentOrAdviserForThesis
from api.utils.notifications import create_notification
from api.services.google_drive_service import GoogleDriveService

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
        user = self.request.user
        if user.role == 'ADMIN':
            # Admins can see all theses
            return Thesis.objects.all().select_related('group', 'proposer', 'group__adviser')
        elif user.role == 'ADVISER':
            # Advisers can see all theses (for overview) but can only modify their own
            return Thesis.objects.all().select_related('group', 'proposer', 'group__adviser')
        elif user.role == 'PANEL':
            # Panel members can see all theses for review purposes
            return Thesis.objects.all().select_related('group', 'proposer', 'group__adviser')
        else:  # STUDENT
            # Students can see all theses (for learning/reference) but can only modify their own
            return Thesis.objects.all().select_related('group', 'proposer', 'group__adviser')

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
        if thesis.adviser:
            print(f"Creating notification for adviser {thesis.adviser}")
            try:
                create_notification(thesis.adviser, f'New thesis submitted: {thesis.title}', link=f'/thesis/{thesis.id}')
            except Exception as e:
                print(f"Failed to create notification: {e}")
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
            
            if thesis.proposer:
                try:
                    create_notification(thesis.proposer, f'Topic proposal approved: {thesis.title}', body='Your topic has been approved. You can now start working on the full thesis.')
                except Exception as e:
                    print(f"Failed to create notification: {e}")
            return Response(self.get_serializer(thesis).data)
        elif action == 'request_revision':
            # Request revision for the topic proposal
            thesis.status = 'REVISIONS_REQUIRED'
            thesis.adviser_feedback = feedback
            thesis.save()
            if thesis.proposer:
                try:
                    create_notification(thesis.proposer, f'Revision requested for topic: {thesis.title}', body=feedback)
                except Exception as e:
                    print(f"Failed to create notification: {e}")
            return Response(self.get_serializer(thesis).data)
        elif action == 'reject':
            # Reject the topic proposal
            thesis.status = 'TOPIC_REJECTED'
            thesis.adviser_feedback = feedback
            thesis.save()
            if thesis.proposer:
                try:
                    create_notification(thesis.proposer, f'Topic proposal rejected: {thesis.title}', body=feedback or 'No reason provided')
                except Exception as e:
                    print(f"Failed to create notification: {e}")
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
                
                # Notify panels
                if thesis.group:
                    for p in thesis.group.panels.all():
                        if p:
                            try:
                                create_notification(p, f'Thesis ready for panel review: {thesis.title}', link=f'/thesis/{thesis.id}')
                            except Exception as e:
                                print(f"Failed to create notification for panel member: {e}")
                if thesis.proposer:
                    try:
                        create_notification(thesis.proposer, f'Thesis proposal submitted for panel review: {thesis.title}', body='Your thesis proposal has been submitted for panel review.')
                    except Exception as e:
                        print(f"Failed to create notification for proposer: {e}")
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
                if thesis.proposer:
                    try:
                        create_notification(thesis.proposer, f'Proposal approved: {thesis.title}', body='Your proposal has been approved. You can now proceed with your research.')
                    except Exception as e:
                        print(f"Failed to create notification: {e}")
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
                if thesis.proposer:
                    try:
                        create_notification(thesis.proposer, f'Final thesis approved: {thesis.title}', body='Congratulations! Your final thesis has been approved.')
                    except Exception as e:
                        print(f"Failed to create notification: {e}")
                return Response(self.get_serializer(thesis).data)
            else:
                return Response(
                    {'detail': 'Invalid action for current thesis status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        return Response({'detail':'invalid action'}, status=status.HTTP_400_BAD_REQUEST)
<<<<<<< HEAD

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
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
=======
>>>>>>> 9986194de6c7eb0f9dff4a8117cc3ead7b76b7fd
