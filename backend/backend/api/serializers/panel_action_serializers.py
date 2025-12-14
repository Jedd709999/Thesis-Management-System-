from rest_framework import serializers
from api.models.panel_action_models import PanelAction
from api.serializers.user_serializers import UserSerializer

class PanelActionSerializer(serializers.ModelSerializer):
    """Serializer for PanelAction model."""
    panel_member = UserSerializer(read_only=True)
    panel_member_id = serializers.UUIDField(write_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = PanelAction
        fields = [
            'id', 'schedule', 'panel_member', 'panel_member_id', 
            'action', 'action_display', 'comments', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'panel_member']
    
    def validate_panel_member_id(self, value):
        """Validate that the panel member ID matches the requesting user."""
        if value != self.context['request'].user.id:
            raise serializers.ValidationError("You can only create actions for yourself.")
        return value
    
    def create(self, validated_data):
        # Remove panel_member_id as we'll set it from the request user
        validated_data.pop('panel_member_id', None)
        return super().create(validated_data)
