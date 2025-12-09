from rest_framework import serializers
from api.models.schedule_models import OralDefenseSchedule, PanelMemberAvailability
from api.models.thesis_models import Thesis
from api.models.user_models import User
from django.core.exceptions import ValidationError

class ScheduleSerializer(serializers.ModelSerializer):
    thesis_title = serializers.CharField(source='thesis.title', read_only=True)
    panel_members_detail = serializers.SerializerMethodField()
    date_time = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = OralDefenseSchedule
        fields = (
            'id', 'thesis', 'thesis_title', 'title', 'start', 'end', 'location', 
            'meeting_url', 'status', 'notes', 'organizer', 'panel_members',
            'panel_members_detail', 'created_at', 'updated_at', 'date_time', 'duration_minutes'
        )
        read_only_fields = ('organizer', 'created_at', 'updated_at')
    
    def get_date_time(self, obj):
        """Return the start time as date_time for frontend compatibility"""
        return obj.start.isoformat() if obj.start else None
    
    def get_duration_minutes(self, obj):
        """Calculate duration in minutes from start and end times"""
        if obj.start and obj.end:
            duration = obj.end - obj.start
            return int(duration.total_seconds() / 60)
        return 0

    def get_panel_members_detail(self, obj):
        """Get detailed information about panel members"""
        return [
            {
                'id': member.id,
                'email': member.email,
                'first_name': member.first_name,
                'last_name': member.last_name
            }
            for member in obj.panel_members.all()
        ]

    def validate(self, attrs):
        start = attrs.get('start')
        end = attrs.get('end')
        thesis = attrs.get('thesis')

        if start and end:
            if start >= end:
                raise serializers.ValidationError({
                    'time_validation': 'Start time must be before end time'
                })

        if self.instance:
            exclude_id = self.instance.id
        else:
            exclude_id = None

        if thesis and start and end:
            # Check for scheduling conflicts
            conflicts = self.check_schedule_conflicts(thesis, start, end, exclude_id)
            
            if conflicts:
                conflict_details = []
                for conflict in conflicts:
                    conflict_details.append(
                        f"Thesis '{conflict['thesis']}' has schedule from {conflict['start']} to {conflict['end']}"
                    )
                
                raise serializers.ValidationError({
                    'conflicts': f'Scheduling conflict detected: {"; ".join(conflict_details)}',
                    'conflicting_schedules': conflicts
                })

        return attrs

    def check_schedule_conflicts(self, thesis, start, end, exclude_id=None):
        """Check for scheduling conflicts"""
        queryset = OralDefenseSchedule.objects.filter(
            thesis__adviser=thesis.adviser,
            start__lt=end,
            end__gt=start
        )
        
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
            
        conflicts = []
        for schedule in queryset:
            conflicts.append({
                'id': str(schedule.id),
                'thesis': str(schedule.thesis.title),
                'start': schedule.start.isoformat(),
                'end': schedule.end.isoformat()
            })
            
        return conflicts

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        validated_data['organizer'] = user
        
        try:
            return super().create(validated_data)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))

class ScheduleAvailabilitySerializer(serializers.Serializer):
    thesis = serializers.PrimaryKeyRelatedField(queryset=Thesis.objects.all())
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    exclude_id = serializers.CharField(required=False, allow_null=True)

    def validate(self, attrs):
        start = attrs.get('start')
        end = attrs.get('end')
        
        if start >= end:
            raise serializers.ValidationError('Start time must be before end time')
        
        return attrs

    def check_availability(self):
        thesis = self.validated_data['thesis']
        start = self.validated_data['start']
        end = self.validated_data['end']
        exclude_id = self.validated_data.get('exclude_id')
        
        conflicts = OralDefenseSchedule.objects.filter(
            thesis__adviser=thesis.adviser,
            start__lt=end,
            end__gt=start
        )
        
        if exclude_id:
            conflicts = conflicts.exclude(id=exclude_id)
            
        conflict_data = []
        for conflict in conflicts:
            conflict_data.append({
                'id': str(conflict.id),
                'thesis': str(conflict.thesis.title),
                'start': conflict.start.isoformat(),
                'end': conflict.end.isoformat()
            })
            
        return {
            'has_conflicts': conflicts.exists(),
            'conflicts': conflict_data
        }

class PanelMemberAvailabilitySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = PanelMemberAvailability
        fields = (
            'id', 'user', 'user_email', 'day_of_week', 'start_time', 'end_time',
            'is_recurring', 'valid_from', 'valid_until', 'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_at', 'updated_at')
