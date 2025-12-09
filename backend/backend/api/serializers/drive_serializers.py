from rest_framework import serializers
from api.models.drive_models import DriveCredential, DriveFolder
from api.models.user_models import User
from api.serializers.user_serializers import UserSerializer

class DriveCredentialSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = DriveCredential
        fields = (
            'id', 'user', 'user_detail', 'credential_type', 'token', 'refresh_token',
            'token_uri', 'client_id', 'client_secret', 'scopes', 'expires_at',
            'is_active', 'last_used_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('expires_at', 'last_used_at', 'created_at', 'updated_at')
    
    def get_user_detail(self, obj):
        """Get detailed information about the user"""
        if obj.user:
            return UserSerializer(obj.user).data
        return None
    
    def to_representation(self, instance):
        """Customize the representation of the serializer"""
        representation = super().to_representation(instance)
        
        # Format dates properly
        if instance.expires_at:
            representation['expires_at'] = instance.expires_at.isoformat()
        if instance.last_used_at:
            representation['last_used_at'] = instance.last_used_at.isoformat()
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        return representation


class DriveFolderSerializer(serializers.ModelSerializer):
    owner_detail = serializers.SerializerMethodField()
    parent_folder_detail = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = DriveFolder
        fields = (
            'id', 'folder_id', 'name', 'folder_type', 'parent_folder', 'parent_folder_detail',
            'owner', 'owner_detail', 'web_view_link', 'created_in_drive_at',
            'full_path', 'created_at', 'updated_at'
        )
        read_only_fields = ('created_in_drive_at', 'created_at', 'updated_at')
    
    def get_owner_detail(self, obj):
        """Get detailed information about the owner"""
        if obj.owner:
            return UserSerializer(obj.owner).data
        return None
    
    def get_parent_folder_detail(self, obj):
        """Get detailed information about the parent folder"""
        if obj.parent_folder:
            return DriveFolderSerializer(obj.parent_folder).data
        return None
    
    def get_full_path(self, obj):
        """Get the full path of the folder"""
        return obj.get_path()
    
    def to_representation(self, instance):
        """Customize the representation of the serializer"""
        representation = super().to_representation(instance)
        
        # Format dates properly
        if instance.created_in_drive_at:
            representation['created_in_drive_at'] = instance.created_in_drive_at.isoformat()
        if instance.created_at:
            representation['created_at'] = instance.created_at.isoformat()
        if instance.updated_at:
            representation['updated_at'] = instance.updated_at.isoformat()
            
        return representation
