from rest_framework import viewsets
from api.models.document_models import Document
from api.serializers.document_serializers import DocumentSerializer
from rest_framework.permissions import IsAuthenticated

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('thesis','uploaded_by')
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
