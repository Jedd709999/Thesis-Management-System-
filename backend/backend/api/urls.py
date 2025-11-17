from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import user_views, thesis_views, schedule_views, notification_views, group_views, document_views, google_docs_views

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'users', user_views.UserViewSet)
router.register(r'theses', thesis_views.ThesisViewSet)
router.register(r'schedules', schedule_views.ScheduleViewSet)
router.register(r'notifications', notification_views.NotificationViewSet)
router.register(r'groups', group_views.GroupViewSet)
router.register(r'documents', document_views.DocumentViewSet)

@api_view(['GET'])
def api_root(request):
    """
    API Root endpoint showing all available endpoints
    """
    return Response({
        'users': router.get_api_root_view()(request).data.get('users'),
        'theses': router.get_api_root_view()(request).data.get('theses'),
        'schedules': router.get_api_root_view()(request).data.get('schedules'),
        'notifications': router.get_api_root_view()(request).data.get('notifications'),
        'groups': router.get_api_root_view()(request).data.get('groups'),
        'documents': router.get_api_root_view()(request).data.get('documents'),
        'google-docs': {
            'oauth-url': '/api/google-docs/oauth-url/',
            'oauth-callback': '/api/google-docs/oauth-callback/',
            'create': '/api/google-docs/create/',
            'content': '/api/google-docs/<document_id>/content/',
            'update': '/api/google-docs/<document_id>/update/',
            'share': '/api/google-docs/<document_id>/share/'
        }
    })

urlpatterns = [
    path('', api_root),
    path('', include(router.urls)),
    path('google-docs/oauth-url/', google_docs_views.google_oauth_url, name='google_oauth_url'),
    path('google-docs/oauth-callback/', google_docs_views.google_oauth_callback, name='google_oauth_callback'),
    path('google-docs/create/', google_docs_views.create_google_doc, name='create_google_doc'),
    path('google-docs/<str:document_id>/content/', google_docs_views.get_google_doc_content, name='get_google_doc_content'),
    path('google-docs/<str:document_id>/update/', google_docs_views.update_google_doc, name='update_google_doc'),
    path('google-docs/<str:document_id>/share/', google_docs_views.share_google_doc, name='share_google_doc'),
]
