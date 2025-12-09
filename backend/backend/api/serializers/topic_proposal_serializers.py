from rest_framework import serializers
from api.models.group_models import TopicProposal, Group
from api.models.user_models import User
from api.serializers.group_serializers import GroupSerializer
from api.serializers.user_serializers import UserSerializer

class TopicProposalSerializer(serializers.ModelSerializer):
    group_detail = serializers.SerializerMethodField()
    preferred_adviser_detail = serializers.SerializerMethodField()
    keywords_list = serializers.SerializerMethodField()
    
    class Meta:
        model = TopicProposal
        fields = (
            'id', 'group', 'group_detail', 'title', 'abstract', 'keywords', 'keywords_list',
            'preferred_adviser', 'preferred_adviser_detail', 'status', 'submitted_at',
            'reviewed_at', 'review_comments', 'created_at', 'updated_at'
        )
        read_only_fields = ('submitted_at', 'reviewed_at', 'created_at', 'updated_at')
    
    def get_group_detail(self, obj):
        """Get detailed information about the group"""
        if obj.group:
            return GroupSerializer(obj.group).data
        return None
    
    def get_preferred_adviser_detail(self, obj):
        """Get detailed information about the preferred adviser"""
        if obj.preferred_adviser:
            return UserSerializer(obj.preferred_adviser).data
        return None
    
    def get_keywords_list(self, obj):
        """Get keywords as a list"""
        if obj.keywords:
            return obj.keywords
        return []
    
    def validate(self, attrs):
        group = attrs.get('group')
        
        # Check if the group is approved (only for creation)
        if self.context['request'].method == 'POST':
            if group and group.status != 'APPROVED':
                raise serializers.ValidationError("The group must be approved before creating a topic proposal")
        
        return attrs
    
    def to_representation(self, instance):
        """Customize the representation of the serializer"""
        representation = super().to_representation(instance)
        
        # Format dates properly
        if instance.submitted_at:
            representation['submitted_at'] = instance.submitted_at.isoformat()
        if instance.reviewed_at:
            representation['reviewed_at'] = instance.reviewed_at.isoformat()
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        return representation
