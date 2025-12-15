from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from api.models.notification_models import Notification
from api.serializers.notification_serializers import NotificationSerializer
from api.permissions.role_permissions import CanManageNotifications
from api.utils.notification_utils import mark_notification_as_read, delete_notification_and_send_websocket

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().select_related('recipient', 'sender', 'related_content_type')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageNotifications]

    def get_queryset(self):
        # Users can only see their own notifications
        return Notification.objects.filter(recipient=self.request.user)

    def perform_create(self, serializer):
        # Users can only create notifications for themselves
        serializer.save(recipient=self.request.user)

    @action(detail=False, methods=['get'], url_path='mine')
    def mine(self, request):
        """
        Get current user's notifications
        """
        queryset = self.get_queryset().order_by('-created_at')
        
        # Filter by read status if specified
        read_status = request.query_params.get('read')
        if read_status is not None:
            if read_status.lower() == 'true':
                queryset = queryset.filter(is_read=True)
            elif read_status.lower() == 'false':
                queryset = queryset.filter(is_read=False)
        
        # Filter by notification type if specified
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        # Use the utility function that also sends WebSocket updates
        notification = mark_notification_as_read(pk, request.user)
        if notification:
            serializer = self.get_serializer(notification)
            return Response(serializer.data)
        else:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='mark-unread')
    def mark_unread(self, request, pk=None):
        """Mark a notification as unread"""
        notification = self.get_object()
        notification.mark_as_unread()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        updated_count = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({
            'message': f'Marked {updated_count} notifications as read',
            'updated_count': updated_count
        })

    def destroy(self, request, *args, **kwargs):
        """Delete a notification and send WebSocket notification"""
        instance = self.get_object()
        notification_id = str(instance.id)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        """Override to send WebSocket notification when deleting"""
        # Use the utility function that also sends WebSocket updates
        delete_notification_and_send_websocket(str(instance.id), self.request.user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get count of unread notifications for the current user"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
