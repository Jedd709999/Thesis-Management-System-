from rest_framework import serializers
from api.models.schedule_models import ApprovalSheet, OralDefenseSchedule
from api.models.user_models import User
from api.models.document_models import Document
from api.serializers.schedule_serializers import OralDefenseScheduleSerializer
from api.serializers.user_serializers import UserSerializer
from api.serializers.document_serializers import DocumentSerializer

class ApprovalSheetSerializer(serializers.ModelSerializer):
    schedule_detail = serializers.SerializerMethodField()
    panel_member_detail = serializers.SerializerMethodField()
    document_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = ApprovalSheet
        fields = (
            'id', 'schedule', 'schedule_detail', 'panel_member', 'panel_member_detail',
            'decision', 'comments', 'submitted_at', 'document', 'document_detail',
            'created_at', 'updated_at'
        )
        read_only_fields = ('submitted_at', 'created_at', 'updated_at')
    
    def get_schedule_detail(self, obj):
        """Get detailed information about the schedule"""
        if obj.schedule:
            return OralDefenseScheduleSerializer(obj.schedule).data
        return None
    
    def get_panel_member_detail(self, obj):
        """Get detailed information about the panel member"""
        if obj.panel_member:
            return UserSerializer(obj.panel_member).data
        return None
    
    def get_document_detail(self, obj):
        """Get detailed information about the document"""
        if obj.document:
            return DocumentSerializer(obj.document).data
        return None
    
    def to_representation(self, instance):
        """Customize the representation of the serializer"""
        representation = super().to_representation(instance)
        
        # Format dates properly
        if instance.submitted_at:
            representation['submitted_at'] = instance.submitted_at.isoformat()
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        return representation
