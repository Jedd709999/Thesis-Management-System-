from rest_framework import serializers
from api.models.schedule_models import DefenseSchedule
from api.models.group_models import Group
from django.core.exceptions import ValidationError

class ScheduleSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = DefenseSchedule
        fields = ('id','group','group_name','start_at','end_at','location','created_by','created_at')
        read_only_fields = ('created_by','created_at')

    def validate(self, attrs):
        start_at = attrs.get('start_at')
        end_at = attrs.get('end_at')
        group = attrs.get('group')

        if start_at and end_at:
            if start_at >= end_at:
                raise serializers.ValidationError({
                    'time_validation': 'Start time must be before end time'
                })

        if self.instance:
            exclude_id = self.instance.id
        else:
            exclude_id = None

        if group and start_at and end_at:
            conflict_result = DefenseSchedule.validate_schedule_availability(
                group, start_at, end_at, exclude_id
            )
            
            if conflict_result['has_conflicts']:
                conflict_details = []
                for conflict in conflict_result['conflicts']:
                    conflict_details.append(
                        f"Group '{conflict['group']}' has schedule from {conflict['start_at']} to {conflict['end_at']}"
                    )
                
                raise serializers.ValidationError({
                    'conflicts': f'Scheduling conflict detected: {"; ".join(conflict_details)}',
                    'conflicting_schedules': conflict_result['conflicts']
                })

        return attrs

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        validated_data['created_by'] = user
        
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
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField()
    exclude_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        start_at = attrs.get('start_at')
        end_at = attrs.get('end_at')
        
        if start_at >= end_at:
            raise serializers.ValidationError('Start time must be before end time')
        
        return attrs

    def check_availability(self):
        group = self.validated_data['group']
        start_at = self.validated_data['start_at']
        end_at = self.validated_data['end_at']
        exclude_id = self.validated_data.get('exclude_id')
        
        return DefenseSchedule.validate_schedule_availability(group, start_at, end_at, exclude_id)
