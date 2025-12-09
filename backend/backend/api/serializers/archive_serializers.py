from rest_framework import serializers
from api.models.archive_record_models import ArchiveRecord
from api.models.user_models import User
from api.serializers.user_serializers import UserSerializer

class ArchiveRecordSerializer(serializers.ModelSerializer):
    archived_by_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = ArchiveRecord
        fields = (
            'id', 'content_type', 'original_id', 'data', 'archived_by', 'archived_by_detail',
            'reason', 'retention_period_years', 'archived_at', 'expires_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('archived_at', 'expires_at', 'created_at', 'updated_at')
    
    def get_archived_by_detail(self, obj):
        """Get detailed information about the user who archived the record"""
        if obj.archived_by:
            return UserSerializer(obj.archived_by).data
        return None
    
    def to_representation(self, instance):
        """Customize the representation of the serializer"""
        representation = super().to_representation(instance)
        
        # Format dates properly
        if instance.archived_at:
            representation['archived_at'] = instance.archived_at.isoformat()
        if instance.expires_at:
            representation['expires_at'] = instance.expires_at.isoformat()
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        return representation
