from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from api.models.schedule_models import OralDefenseSchedule, PanelMemberAvailability
from api.models.thesis_models import Thesis
from api.models.user_models import User
from api.serializers.schedule_serializers import ScheduleSerializer, ScheduleAvailabilitySerializer
from api.permissions.role_permissions import IsAdviser, IsAdviserOrPanelForSchedule, CanCreateSchedule
from api.services.notification_service import NotificationService
from api.utils.scheduling_utils import (
    auto_schedule_oral_defense,
    check_panel_member_availability,
    find_free_time_slots,
    detect_scheduling_conflicts
)

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = OralDefenseSchedule.objects.all().select_related('thesis__group','organizer')
    serializer_class = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateSchedule]

    def get_queryset(self):
        queryset = super().get_queryset()
        thesis_id = self.request.query_params.get('thesis_id')
        if thesis_id:
            queryset = queryset.filter(thesis_id=thesis_id)
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(start__gte=start_date)
        if end_date:
            queryset = queryset.filter(end__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            schedule = serializer.save(organizer=self.request.user)
            # Send notifications for the newly created schedule
            NotificationService.notify_schedule_created(schedule, schedule.thesis)

    def perform_update(self, serializer):
        with transaction.atomic():
            # Store original values for notification
            original_schedule = self.get_object()
            original_date = original_schedule.scheduled_date
            original_status = original_schedule.status

            schedule = serializer.save()

            # Check if date changed and send update notification
            if original_date != schedule.scheduled_date:
                NotificationService.notify_schedule_updated(schedule, schedule.thesis, original_date)

            # Check if schedule was cancelled
            if original_status != 'cancelled' and schedule.status == 'cancelled':
                reason = getattr(schedule, 'cancellation_reason', '')
                NotificationService.notify_schedule_cancelled(schedule, schedule.thesis, reason)

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
        user_schedules = OralDefenseSchedule.objects.filter(
            models.Q(thesis__adviser=user) | 
            models.Q(panel_members=user)
        ).distinct()
        
        if start_date:
            user_schedules = user_schedules.filter(start__gte=start_date)
        if end_date:
            user_schedules = user_schedules.filter(end__lte=end_date)
        
        for schedule in user_schedules:
            conflicting_schedules = OralDefenseSchedule.objects.filter(
                models.Q(start__lt=schedule.end) & 
                models.Q(end__gt=schedule.start)
            ).exclude(id=schedule.id).filter(
                models.Q(thesis__adviser=user) | 
                models.Q(panel_members=user)
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
            thesis = serializer.validated_data.get('thesis', schedule.thesis)
            start = serializer.validated_data.get('start', schedule.start)
            end = serializer.validated_data.get('end', schedule.end)
            
            # Check for conflicts
            conflict_result = detect_scheduling_conflicts(schedule)
            
            return Response({
                'valid_update': not conflict_result['has_conflicts'],
                'conflicts': conflict_result['conflicts'],
                'message': 'Update is valid' if not conflict_result['has_conflicts'] else 'Update would create conflicts'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='auto-schedule')
    def auto_schedule(self, request):
        """
        Automatically schedule an oral defense for a thesis.
        """
        try:
            thesis_id = request.data.get('thesis_id')
            panel_member_ids = request.data.get('panel_members', [])
            preferred_date = request.data.get('preferred_date')
            duration_minutes = request.data.get('duration_minutes', 60)
            
            if not thesis_id:
                return Response(
                    {'error': 'thesis_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get thesis
            thesis = get_object_or_404(Thesis, id=thesis_id)
            
            # Get panel members
            panel_members = User.objects.filter(id__in=panel_member_ids, role='PANEL')
            if len(panel_members) != len(panel_member_ids):
                return Response(
                    {'error': 'Some panel members not found or not valid panel members'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert preferred_date string to date object if provided
            if preferred_date:
                from datetime import datetime
                try:
                    preferred_date = datetime.strptime(preferred_date, '%Y-%m-%d').date()
                except ValueError:
                    return Response(
                        {'error': 'Invalid preferred_date format. Use YYYY-MM-DD'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Run auto-scheduling
            result = auto_schedule_oral_defense(
                thesis, 
                panel_members, 
                preferred_date, 
                duration_minutes
            )
            
            if result['success']:
                serializer = self.get_serializer(result['schedule'])
                return Response({
                    'message': result['message'],
                    'schedule': serializer.data,
                    'run_id': str(result['run'].id)
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': result['message'],
                    'conflicts': result['conflicts']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Auto-scheduling failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='check-panel-availability')
    def check_panel_availability(self, request):
        """
        Check availability of panel members for a specific time slot.
        """
        try:
            panel_member_ids = request.data.get('panel_members', [])
            date_str = request.data.get('date')
            start_time_str = request.data.get('start_time')
            end_time_str = request.data.get('end_time')
            
            if not all([panel_member_ids, date_str, start_time_str, end_time_str]):
                return Response(
                    {'error': 'panel_members, date, start_time, and end_time are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse inputs
            from datetime import datetime
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                start_time = datetime.strptime(start_time_str, '%H:%M').time()
                end_time = datetime.strptime(end_time_str, '%H:%M').time()
            except ValueError as e:
                return Response(
                    {'error': f'Invalid date/time format: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get panel members
            panel_members = User.objects.filter(id__in=panel_member_ids, role='PANEL')
            
            # Check availability
            availability = check_panel_member_availability(
                panel_members, 
                start_time, 
                end_time, 
                date
            )
            
            return Response({
                'available': len(availability['unavailable_members']) == 0,
                'available_members': [str(member) for member in availability['available_members']],
                'unavailable_members': [str(member) for member in availability['unavailable_members']],
                'conflicts': availability['conflicts']
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to check panel availability: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='free-slots')
    def get_free_slots(self, request):
        """
        Get free time slots for panel members on a specific date.
        """
        try:
            panel_member_ids = request.query_params.getlist('panel_members')
            date_str = request.query_params.get('date')
            duration_minutes = int(request.query_params.get('duration', 60))
            
            if not all([panel_member_ids, date_str]):
                return Response(
                    {'error': 'panel_members and date are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse date
            from datetime import datetime
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get panel members
            panel_members = User.objects.filter(id__in=panel_member_ids, role='PANEL')
            
            # Find free slots
            free_slots = find_free_time_slots(panel_members, date, duration_minutes)
            
            return Response({
                'date': date_str,
                'duration_minutes': duration_minutes,
                'free_slots': free_slots
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get free slots: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )