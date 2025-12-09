from rest_framework import serializers
from api.models.document_models import Document
from api.models.thesis_models import Thesis
from api.serializers.thesis_serializers import ThesisSerializer

class DocumentSerializer(serializers.ModelSerializer):
    embed_url = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    thesis_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = (
            'id', 'thesis', 'thesis_detail', 'uploaded_by', 'title', 'document_type', 'status', 'file', 'version',
            'is_google_doc', 'google_doc_id', 'google_doc_edit_url', 'viewer_url',
            'doc_embed_url', 'google_drive_file_id', 'provider',
            'file_size', 'mime_type', 'last_synced_at', 'created_at', 
            'embed_url', 'file_url', 'file_size_display', 'versions'
        )
        read_only_fields = (
            'uploaded_by', 'created_at', 'embed_url', 'file_url', 
            'file_size_display', 'versions', 'thesis_detail'
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
    
    def get_thesis_detail(self, obj):
        """Get detailed thesis information including group and adviser data"""
        if obj.thesis:
            serializer = ThesisSerializer(obj.thesis)
            return serializer.data
        return None
    
    def validate_thesis(self, value):
        """Validate that the thesis exists and belongs to the user"""
        if not value:
            raise serializers.ValidationError("Thesis is required")
        
        # Check if thesis exists
        try:
            thesis = Thesis.objects.get(id=value.id if hasattr(value, 'id') else value)
        except Thesis.DoesNotExist:
            raise serializers.ValidationError("Thesis does not exist")
        
        # Check if user is a member of the group associated with the thesis
        user = self.context['request'].user
        if user.role == 'STUDENT' and not thesis.group.members.filter(id=user.id).exists():
            raise serializers.ValidationError("You are not a member of the group associated with this thesis")
        
        return value
    
    def validate_document_type(self, value):
        """Validate document type"""
        if not value:
            raise serializers.ValidationError("Document type is required")
        
        # Check if document type is valid
        valid_types = [choice[0] for choice in Document.DOCUMENT_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid document type. Valid types are: {', '.join(valid_types)}")
        
        return value
    
    def validate_status(self, value):
        """Validate document status"""
        if not value:
            raise serializers.ValidationError("Document status is required")
        
        # Check if document status is valid
        valid_statuses = [choice[0] for choice in Document.DOCUMENT_STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Invalid document status. Valid statuses are: {', '.join(valid_statuses)}")
        
        return value
    
    def validate_file(self, value):
        """Validate that only document files are uploaded"""
        if value:
            # Check file size (100MB limit)
            if value.size > 100 * 1024 * 1024:
                raise serializers.ValidationError("File size must be less than 100MB")
            
            # Check MIME type for document files only
            valid_mime_types = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            
            if value.content_type not in valid_mime_types:
                raise serializers.ValidationError("Only PDF and Word documents are allowed")
        
        return value
    
    def validate(self, attrs):
        """Validate the entire document"""
        # Remove the workflow validation to allow students to upload any document type
        # after their thesis is approved
        return attrs
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['uploaded_by'] = user
        
        # Ensure thesis is provided
        if 'thesis' not in validated_data or not validated_data['thesis']:
            raise serializers.ValidationError({"thesis": "Thesis is required"})
        
        return super().create(validated_data)
