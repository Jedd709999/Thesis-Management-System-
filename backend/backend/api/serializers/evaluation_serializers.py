from rest_framework import serializers
from api.models.schedule_models import Evaluation, OralDefenseSchedule
from api.models.user_models import User
from api.models.document_models import Document
from api.serializers.schedule_serializers import OralDefenseScheduleSerializer
from api.serializers.user_serializers import UserSerializer
from api.serializers.document_serializers import DocumentSerializer

class EvaluationSerializer(serializers.ModelSerializer):
    schedule_detail = serializers.SerializerMethodField()
    evaluator_detail = serializers.SerializerMethodField()
    document_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Evaluation
        fields = (
            'id', 'schedule', 'schedule_detail', 'evaluator', 'evaluator_detail',
            'rubric_scores', 'total_score', 'recommendation', 'comments',
            'document', 'document_detail', 'submitted_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('total_score', 'submitted_at', 'created_at', 'updated_at')
    
    def get_schedule_detail(self, obj):
        """Get detailed information about the schedule"""
        if obj.schedule:
            return OralDefenseScheduleSerializer(obj.schedule).data
        return None
    
    def get_evaluator_detail(self, obj):
        """Get detailed information about the evaluator"""
        if obj.evaluator:
            return UserSerializer(obj.evaluator).data
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
