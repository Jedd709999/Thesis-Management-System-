from rest_framework import serializers
from api.models.thesis_models import Thesis
from api.models.group_models import Group

class ThesisSerializer(serializers.ModelSerializer):
    group = serializers.SerializerMethodField(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), write_only=True, source='group')
    proposer = serializers.PrimaryKeyRelatedField(read_only=True)
    adviser = serializers.SerializerMethodField(read_only=True)
    progress = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Thesis
        fields = ('id','title','abstract','group','group_id','proposer','adviser','status','adviser_feedback','progress','created_at','updated_at')
        read_only_fields = ('status','proposer','created_at','updated_at')
    
    def get_group(self, obj):
        if obj.group:
            return {
                'id': obj.group.id,
                'name': obj.group.name
            }
        return None
    
    def get_adviser(self, obj):
        try:
            if obj.group and hasattr(obj.group, 'adviser') and obj.group.adviser:
                adviser = obj.group.adviser
                if hasattr(adviser, 'first_name') and hasattr(adviser, 'last_name'):
                    name = f"{adviser.first_name} {adviser.last_name}".strip()
                    # Fall back to email if name is empty
                    return name if name else adviser.email
                else:
                    return str(adviser)
            return None
        except Exception as e:
            print(f"Error getting adviser: {e}")
            return None
    
    def get_progress(self, obj):
        """Calculate progress based on thesis status"""
        status_progress = {
            'DRAFT': 25,
            'SUBMITTED': 50,
            'UNDER_REVIEW': 75,
            'APPROVED': 100,
            'REJECTED': 0
        }
        return status_progress.get(obj.status, 0)
    
    def validate(self, attrs):
        group = attrs.get('group_id')
        
        # Check if group already has a thesis
        if group and hasattr(group, 'thesis'):
            raise serializers.ValidationError(f"Group {group.name} already has a thesis")
        
        return attrs
    
    def create(self, validated_data):
        # Extract group_id from validated_data
        group = validated_data.pop('group', None)
        
        # Create thesis with group
        thesis = Thesis.objects.create(
            title=validated_data['title'],
            abstract=validated_data.get('abstract', ''),
            group=group,
            proposer=self.context['request'].user
        )
        
        return thesis
