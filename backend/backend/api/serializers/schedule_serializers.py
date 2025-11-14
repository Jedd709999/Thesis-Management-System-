from rest_framework import serializers
from api.models.schedule_models import DefenseSchedule
from api.models.group_models import Group

class ScheduleSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    class Meta:
        model = DefenseSchedule
        fields = ('id','group','start_at','end_at','location','created_by','created_at')
        read_only_fields = ('created_by','created_at')
    def create(self, validated):
        request = self.context['request']
        user = request.user
        group = validated['group']
        start_at = validated['start_at']
        end_at = validated['end_at']
        conflicts = DefenseSchedule.check_conflicts(group, start_at, end_at)
        if conflicts:
            raise serializers.ValidationError({'conflicts':'Scheduling conflict detected', 'conflicting_ids':[c.id for c in conflicts]})
        validated['created_by'] = user
        return super().create(validated)
