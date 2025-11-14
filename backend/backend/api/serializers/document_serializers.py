from rest_framework import serializers
from api.models.document_models import Document

class DocumentSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    class Meta:
        model = Document
        fields = ('id','thesis','uploaded_by','file','google_doc_url','provider','created_at','embed_url')
        read_only_fields = ('uploaded_by','created_at','embed_url')
    def get_embed_url(self,obj):
        return obj.embed_url()
    def create(self, validated):
        user = self.context['request'].user
        validated['uploaded_by'] = user
        return super().create(validated)
