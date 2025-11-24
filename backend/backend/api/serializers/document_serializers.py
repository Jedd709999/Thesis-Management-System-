from rest_framework import serializers
from api.models.document_models import Document

class DocumentSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = (
            'id', 'thesis', 'uploaded_by', 'document_type', 'file', 'version',
            'is_google_doc', 'google_doc_id', 'google_doc_edit_url', 'viewer_url',
            'doc_embed_url', 'google_drive_file_id', 'provider',
            'file_size', 'mime_type', 'last_synced_at', 'created_at', 
            'embed_url', 'file_url', 'file_size_display', 'versions'
        )
        read_only_fields = (
            'uploaded_by', 'created_at', 'embed_url', 'file_url', 
            'file_size_display', 'google_drive_file_id', 'google_doc_id',
            'google_doc_edit_url', 'viewer_url', 'doc_embed_url', 'last_synced_at',
            'versions'
        )
    
    def get_embed_url(self, obj):
        return obj.get_embed_url()
    
    def get_file_url(self, obj):
        return obj.get_absolute_url()
    
    def get_file_size_display(self, obj):
        return obj.get_file_size_display()
    
    def get_versions(self, obj):
        """Get document versions"""
        versions = obj.versions.all()
        return [{
            'id': version.id,
            'version': version.version,
            'created_at': version.created_at,
            'created_by': version.created_by.email if version.created_by else None,
            'is_google_doc': version.is_google_doc,
            'google_doc_id': version.google_doc_id
        } for version in versions]
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['uploaded_by'] = user
        return super().create(validated_data)