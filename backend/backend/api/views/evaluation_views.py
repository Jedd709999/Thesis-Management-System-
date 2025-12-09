from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.schedule_models import Evaluation, OralDefenseSchedule
from api.models.user_models import User
from api.models.document_models import Document
from api.serializers.evaluation_serializers import EvaluationSerializer
from api.permissions.custom_permissions import IsPanel

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all().select_related('schedule', 'evaluator', 'document')
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Panel members can only see their own evaluations
        if self.request.user.role == 'PANEL':
            queryset = queryset.filter(evaluator=self.request.user)
            
        # Students can only see evaluations for their group's schedules
        elif self.request.user.role == 'STUDENT':
            queryset = queryset.filter(schedule__thesis__group__members=self.request.user)
            
        # Advisers can only see evaluations for their advised theses
        elif self.request.user.role == 'ADVISER':
            queryset = queryset.filter(schedule__thesis__adviser=self.request.user)
            
        return queryset

    def perform_create(self, serializer):
        # Panel members can only create evaluations for schedules they're assigned to
        if self.request.user.role == 'PANEL':
            schedule_id = self.request.data.get('schedule')
            if schedule_id:
                try:
                    schedule = OralDefenseSchedule.objects.get(id=schedule_id)
                    if self.request.user not in schedule.panel_members.all():
                        raise PermissionError("You are not assigned to this defense schedule")
                    serializer.save(evaluator=self.request.user)
                except OralDefenseSchedule.DoesNotExist:
                    raise PermissionError("Invalid schedule ID")
            else:
                raise PermissionError("Schedule ID is required")
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsPanel])
    def submit(self, request, pk=None):
        """Submit an evaluation"""
        evaluation = self.get_object()
        
        # Only the evaluator can submit their own evaluation
        if evaluation.evaluator != request.user:
            return Response(
                {'detail': 'You are not the evaluator for this evaluation'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        recommendation = request.data.get('recommendation')
        rubric_scores = request.data.get('rubric_scores', {})
        comments = request.data.get('comments', '')
        document_id = request.data.get('document_id')
        
        if recommendation not in ['pass', 'pass_with_revision', 'fail', 'conditional_pass']:
            return Response(
                {'detail': 'Invalid recommendation. Must be pass, pass_with_revision, fail, or conditional_pass'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        evaluation.recommendation = recommendation
        evaluation.rubric_scores = rubric_scores
        evaluation.comments = comments
        
        # Calculate total score from rubric scores
        if rubric_scores:
            total = sum(score for score in rubric_scores.values() if isinstance(score, (int, float)))
            evaluation.total_score = total
        
        if document_id:
            try:
                document = Document.objects.get(id=document_id)
                evaluation.document = document
            except Document.DoesNotExist:
                return Response(
                    {'detail': 'Invalid document ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        evaluation.save()
        
        return Response(
            {'detail': 'Evaluation submitted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending evaluations for the current user"""
        if request.user.role != 'PANEL':
            return Response(
                {'detail': 'Only panel members can view pending evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_evaluations = Evaluation.objects.filter(
            evaluator=request.user,
            recommendation__isnull=True
        ).select_related('schedule', 'schedule__thesis')
        
        serializer = self.get_serializer(pending_evaluations, many=True)
        return Response(serializer.data)
