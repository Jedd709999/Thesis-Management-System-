from rest_framework import serializers
from api.models.document_models import Document

class DocumentSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = (
            'id', 'thesis', 'uploaded_by', 'file', 'google_doc_url', 
            'google_drive_file_id', 'google_drive_embed_url', 'provider',
            'file_size', 'mime_type', 'created_at', 'embed_url', 
            'file_url', 'file_size_display'
        )
        read_only_fields = (
            'uploaded_by', 'created_at', 'embed_url', 'file_url', 
            'file_size_display', 'google_drive_file_id', 'google_drive_embed_url'
        )
    
    def get_embed_url(self, obj):
        return obj.embed_url()
    
    def get_file_url(self, obj):
        return obj.get_file_url()
    
    def get_file_size_display(self, obj):
        return obj.get_file_size_display()
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['uploaded_by'] = user
        return super().create(validated_data)
