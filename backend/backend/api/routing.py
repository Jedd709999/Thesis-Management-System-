from django.urls import re_path
from api.consumers import DocumentEditConsumer  # Changed from 'backend.api.consumers'

websocket_urlpatterns = [
    re_path(r'ws/document/(?P<document_id>\d+)/$', DocumentEditConsumer.as_asgi()),
]
