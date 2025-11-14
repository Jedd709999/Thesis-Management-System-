from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models.thesis_models import Thesis
from api.serializers.thesis_serializers import ThesisSerializer
from rest_framework.permissions import IsAuthenticated
from api.utils.notifications import create_notification

class ThesisViewSet(viewsets.ModelViewSet):
    queryset = Thesis.objects.all().select_related('group','proposer')
    serializer_class = ThesisSerializer
    permission_classes = [IsAuthenticated]

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
        if action == 'approve':
            thesis.status = 'UNDER_REVIEW'
            thesis.adviser_feedback = feedback
            thesis.save()
            for p in thesis.group.panels.all():
                create_notification(p, f'Thesis ready for panel review: {thesis.title}', link=f'/thesis/{thesis.id}')
            return Response(self.get_serializer(thesis).data)
        elif action == 'reject':
            thesis.status = 'REJECTED'
            thesis.adviser_feedback = feedback
            thesis.save()
            create_notification(thesis.proposer, f'Thesis rejected by adviser: {thesis.title}', body=feedback)
            return Response(self.get_serializer(thesis).data)
        return Response({'detail':'invalid action'}, status=status.HTTP_400_BAD_REQUEST)
