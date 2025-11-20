from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from api.models.thesis_models import Thesis
from api.models.group_models import Group
from api.serializers.thesis_serializers import ThesisSerializer
from api.permissions.role_permissions import IsStudent, IsStudentOrAdviserForThesis
from api.utils.notifications import create_notification

class ThesisViewSet(viewsets.ModelViewSet):
    serializer_class = ThesisSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentOrAdviserForThesis]
    queryset = Thesis.objects.all()  # Required for router basename
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            # Admins can see all theses
            return Thesis.objects.all().select_related('group','proposer','group__adviser')
        elif user.role == 'ADVISER':
            # Advisers can see all theses (for overview) but can only modify their own
            return Thesis.objects.all().select_related('group','proposer','group__adviser')
        elif user.role == 'PANEL':
            # Panel members can see all theses for review purposes
            return Thesis.objects.all().select_related('group','proposer','group__adviser')
        else:  # STUDENT
            # Students can see all theses (for learning/reference) but can only modify their own
            return Thesis.objects.all().select_related('group','proposer','group__adviser')

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        thesis = self.get_object()
        thesis.submit()
        if thesis.group.adviser:
            create_notification(thesis.group.adviser, f'New thesis submitted: {thesis.title}', link=f'/thesis/{thesis.id}')
        return Response(self.get_serializer(thesis).data)

    @action(detail=True, methods=['post'])
    def adviser_review(self, request, pk=None):
        thesis = self.get_object()
        action = request.data.get('action')
        feedback = request.data.get('feedback','')
        
        if action == 'approve_topic':
            # Approve the topic proposal - status becomes CONCEPT_APPROVED
            thesis.status = 'CONCEPT_APPROVED'
            thesis.adviser_feedback = feedback
            thesis.save()
            create_notification(thesis.proposer, f'Topic proposal approved: {thesis.title}', body='Your topic has been approved. You can now start working on the full thesis.')
            return Response(self.get_serializer(thesis).data)
        elif action == 'request_revision':
            # Request revision for the topic proposal
            thesis.status = 'REVISIONS_REQUIRED'
            thesis.adviser_feedback = feedback
            thesis.save()
            create_notification(thesis.proposer, f'Revision requested for topic: {thesis.title}', body=feedback)
            return Response(self.get_serializer(thesis).data)
        elif action == 'reject':
            # Reject the topic proposal
            thesis.status = 'REJECTED'
            thesis.adviser_feedback = feedback
            thesis.save()
            create_notification(thesis.proposer, f'Topic proposal rejected: {thesis.title}', body=feedback)
            return Response(self.get_serializer(thesis).data)
        elif action == 'approve_thesis':
            # Approve the full thesis (after topic was approved)
            thesis.status = 'PROPOSAL_APPROVED'
            thesis.adviser_feedback = feedback
            thesis.save()
            for p in thesis.group.panels.all():
                create_notification(p, f'Thesis ready for panel review: {thesis.title}', link=f'/thesis/{thesis.id}')
            return Response(self.get_serializer(thesis).data)
            
        return Response({'detail':'invalid action'}, status=status.HTTP_400_BAD_REQUEST)
