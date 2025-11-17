from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models.notification_models import Notification
from api.serializers.notification_serializers import NotificationSerializer
from api.permissions.role_permissions import CanManageNotifications

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().select_related('user')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageNotifications]

    def get_queryset(self):
        # Admins can see all notifications, users can only see their own
        if self.request.user.role == 'ADMIN':
            return Notification.objects.all()
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        n = self.get_object()
        n.is_read = True
        n.save()
        return Response(self.get_serializer(n).data)
