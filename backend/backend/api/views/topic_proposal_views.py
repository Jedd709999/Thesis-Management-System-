from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.group_models import TopicProposal, Group
from api.models.user_models import User
from api.serializers.topic_proposal_serializers import TopicProposalSerializer
from api.permissions.role_permissions import IsStudent, IsAdviser

class TopicProposalViewSet(viewsets.ModelViewSet):
    queryset = TopicProposal.objects.all().select_related('group', 'preferred_adviser')
    serializer_class = TopicProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Students can only see proposals from their own group
        if self.request.user.role == 'STUDENT':
            queryset = queryset.filter(group__members=self.request.user)
            
        # Advisers can only see proposals where they are the preferred adviser or panel member
        elif self.request.user.role == 'ADVISER':
            queryset = queryset.filter(preferred_adviser=self.request.user)
            
        # Panels can only see proposals where they are assigned as panel
        elif self.request.user.role == 'PANEL':
            queryset = queryset.filter(group__panels=self.request.user)
            
        return queryset

    def perform_create(self, serializer):
        # Students can only create proposals for their own group
        if self.request.user.role == 'STUDENT':
            # Get the user's group
            try:
                user_group = self.request.user.member_groups.first()
                if not user_group:
                    raise PermissionError("You must be a member of a group to create a topic proposal")
                
                # Check if the group is approved
                if user_group.status != 'APPROVED':
                    raise PermissionError("Your group must be approved before you can create a topic proposal")
                    
                serializer.save(group=user_group)
            except Exception as e:
                raise PermissionError(f"Unable to create topic proposal: {str(e)}")
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdviser])
    def review(self, request, pk=None):
        """Review a topic proposal (adviser only)"""
        proposal = self.get_object()
        
        # Only the preferred adviser can review
        if proposal.preferred_adviser != request.user:
            return Response(
                {'detail': 'You are not the preferred adviser for this proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        status_choice = request.data.get('status')
        comments = request.data.get('comments', '')
        
        if status_choice not in ['approved', 'rejected', 'needs_revision']:
            return Response(
                {'detail': 'Invalid status. Must be approved, rejected, or needs_revision'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        proposal.status = status_choice
        proposal.review_comments = comments
        proposal.save()
        
        return Response(
            {'detail': f'Proposal {status_choice} successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def submit(self, request, pk=None):
        """Submit a topic proposal for review"""
        proposal = self.get_object()
        
        # Only group members can submit
        if proposal.group not in request.user.member_groups.all():
            return Response(
                {'detail': 'You are not a member of the group for this proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if the group is approved before allowing submission
        if proposal.group.status != 'APPROVED':
            return Response(
                {'detail': 'Your group must be approved before you can submit a topic proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        proposal.status = 'submitted'
        proposal.save()
        
        return Response(
            {'detail': 'Proposal submitted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def request_revision(self, request, pk=None):
        """Request revisions to a proposal"""
        proposal = self.get_object()
        
        # Only group members can request revisions
        if proposal.group not in request.user.member_groups.all():
            return Response(
                {'detail': 'You are not a member of the group for this proposal'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        proposal.status = 'draft'
        proposal.save()
        
        return Response(
            {'detail': 'Proposal returned to draft status for revisions'},
            status=status.HTTP_200_OK
        )