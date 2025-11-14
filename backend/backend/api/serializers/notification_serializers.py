from rest_framework import serializers
from api.models.notification_models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id','user','title','body','link','is_read','created_at')
        read_only_fields = ('created_at',)
