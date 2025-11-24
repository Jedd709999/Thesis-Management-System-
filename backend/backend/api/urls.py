from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import user_views, thesis_views, schedule_views, notification_views, group_views, document_views, google_docs_views
from .views.panel_views import PanelMemberAvailabilityViewSet
from .views.topic_proposal_views import TopicProposalViewSet
from .views.approval_sheet_views import ApprovalSheetViewSet
from .views.evaluation_views import EvaluationViewSet
from .views.archive_views import ArchiveRecordViewSet
from .views.drive_views import DriveCredentialViewSet, DriveFolderViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'users', user_views.UserViewSet)
router.register(r'theses', thesis_views.ThesisViewSet)
router.register(r'schedules', schedule_views.ScheduleViewSet)
router.register(r'panel-availability', PanelMemberAvailabilityViewSet)
router.register(r'notifications', notification_views.NotificationViewSet)

# Group and group member endpoints
router.register(r'groups', group_views.GroupViewSet)
router.register(
    r'groups/(?P<group_id>[^/.]+)/members', 
    group_views.GroupMemberViewSet, 
    basename='group-members'
)

router.register(r'documents', document_views.DocumentViewSet)
router.register(r'topic-proposals', TopicProposalViewSet)
router.register(r'approval-sheets', ApprovalSheetViewSet)
router.register(r'evaluations', EvaluationViewSet)
router.register(r'archives', ArchiveRecordViewSet)
router.register(r'drive-credentials', DriveCredentialViewSet)
router.register(r'drive-folders', DriveFolderViewSet)

@api_view(['GET'])
def api_root(request):
    """
    API Root endpoint showing all available endpoints
    """
    return Response({
        'users': router.get_api_root_view()(request).data.get('users'),
        'theses': router.get_api_root_view()(request).data.get('theses'),
        'schedules': router.get_api_root_view()(request).data.get('schedules'),
        'panel-availability': router.get_api_root_view()(request).data.get('panel-availability'),
        'notifications': router.get_api_root_view()(request).data.get('notifications'),
        'groups': router.get_api_root_view()(request).data.get('groups'),
        'documents': router.get_api_root_view()(request).data.get('documents'),
        'topic-proposals': router.get_api_root_view()(request).data.get('topic-proposals'),
        'approval-sheets': router.get_api_root_view()(request).data.get('approval-sheets'),
        'evaluations': router.get_api_root_view()(request).data.get('evaluations'),
        'archives': router.get_api_root_view()(request).data.get('archives'),
        'drive-credentials': router.get_api_root_view()(request).data.get('drive-credentials'),
        'drive-folders': router.get_api_root_view()(request).data.get('drive-folders'),
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