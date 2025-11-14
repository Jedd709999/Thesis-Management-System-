from django.urls import path, include
from rest_framework import routers
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer
from rest_framework.response import Response
from api.views.group_views import GroupViewSet
from api.views.thesis_views import ThesisViewSet
from api.views.document_views import DocumentViewSet
from api.views.schedule_views import ScheduleViewSet
from api.views.notification_views import NotificationViewSet
from api.views.user_views import UserViewSet

@api_view(['GET'])
@renderer_classes([JSONRenderer, BrowsableAPIRenderer])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        'message': 'Thesis Management System API',
        'version': '1.0.0',
        'endpoints': [
            '/api/users/',
            '/api/groups/',
            '/api/thesis/',
            '/api/documents/',
            '/api/schedules/',
            '/api/notifications/',
        ]
    })

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'groups', GroupViewSet, basename='groups')
router.register(r'thesis', ThesisViewSet, basename='thesis')
router.register(r'documents', DocumentViewSet, basename='documents')
router.register(r'schedules', ScheduleViewSet, basename='schedules')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', api_root),
    path('', include(router.urls)),
]
