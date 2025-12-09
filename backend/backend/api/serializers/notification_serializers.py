from rest_framework import serializers
from api.models.notification_models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_detail = serializers.SerializerMethodField()
    related_object_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'sender', 'sender_detail', 'notification_type', 
            'priority', 'title', 'message', 'payload', 'is_read', 'read_at',
            'is_email_sent', 'email_sent_at', 'action_url', 'related_content_type',
            'related_object_id', 'related_object_detail', 'created_at', 'updated_at', 'expires_at'
        )
        read_only_fields = (
            'created_at', 'updated_at', 'read_at', 'email_sent_at'
        )
    
    def get_sender_detail(self, obj):
        """Get detailed information about the sender"""
        if obj.sender:
            return {
                'id': obj.sender.id,
                'email': obj.sender.email,
                'first_name': obj.sender.first_name,
                'last_name': obj.sender.last_name,
            }
        return None
    
    def get_related_object_detail(self, obj):
        """Get detailed information about the related object"""
        if obj.related_object:
            related = obj.related_object
            try:
                # Try to get a meaningful string representation
                if hasattr(related, 'title'):
                    name = related.title
                elif hasattr(related, 'name'):
                    name = related.name
                elif hasattr(related, '__str__'):
                    name = str(related)
                else:
                    name = f"{related._meta.verbose_name} {related.id}"
                
                return {
                    'id': related.id,
                    'type': related._meta.model_name,
                    'name': name,
                }
            except Exception:
                return {
                    'id': related.id,
                    'type': related._meta.model_name,
                }
        return None
