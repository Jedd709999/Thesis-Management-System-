from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.models.schedule_models import DefenseSchedule
from api.serializers.schedule_serializers import ScheduleSerializer, ScheduleAvailabilitySerializer
from api.permissions.role_permissions import IsAdviser, IsAdviserOrPanelForSchedule

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = DefenseSchedule.objects.all().select_related('group','created_by')
    serializer_class = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdviserOrPanelForSchedule]

    def get_queryset(self):
        queryset = super().get_queryset()
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(start_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_at__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()

    @action(detail=False, methods=['post'], url_path='check-availability')
    def check_availability(self, request):
        serializer = ScheduleAvailabilitySerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = serializer.check_availability()
                return Response({
                    'available': not result['has_conflicts'],
                    'conflicts': result['conflicts'],
                    'message': 'Schedule is available' if not result['has_conflicts'] else 'Schedule conflicts detected'
                })
            except Exception as e:
                return Response({
                    'error': str(e),
                    'available': False
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='user-conflicts')
    def get_user_conflicts(self, request):
        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        conflicts = []
        user_schedules = DefenseSchedule.objects.filter(
            models.Q(group__adviser=user) | 
            models.Q(group__panels=user)
        ).distinct()
        
        if start_date:
            user_schedules = user_schedules.filter(start_at__gte=start_date)
        if end_date:
            user_schedules = user_schedules.filter(end_at__lte=end_date)
        
        for schedule in user_schedules:
            conflicting_schedules = DefenseSchedule.objects.filter(
                models.Q(start_at__lt=schedule.end_at) & 
                models.Q(end_at__gt=schedule.start_at)
            ).exclude(id=schedule.id).filter(
                models.Q(group__adviser=user) | 
                models.Q(group__panels=user)
            ).distinct()
            
            if conflicting_schedules.exists():
                conflicts.append({
                    'schedule': ScheduleSerializer(schedule).data,
                    'conflicts': ScheduleSerializer(conflicting_schedules, many=True).data
                })
        
        return Response({
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        })

    @action(detail=True, methods=['post'], url_path='validate-update')
    def validate_schedule_update(self, request, pk=None):
        schedule = self.get_object()
        serializer = ScheduleAvailabilitySerializer(data=request.data)
        
        if serializer.is_valid():
            group = serializer.validated_data.get('group', schedule.group)
            start_at = serializer.validated_data.get('start_at', schedule.start_at)
            end_at = serializer.validated_data.get('end_at', schedule.end_at)
            
            result = DefenseSchedule.validate_schedule_availability(
                group, start_at, end_at, exclude_id=schedule.id
            )
            
            return Response({
                'valid_update': not result['has_conflicts'],
                'conflicts': result['conflicts'],
                'message': 'Update is valid' if not result['has_conflicts'] else 'Update would create conflicts'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
