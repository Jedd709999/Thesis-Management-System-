from rest_framework import serializers
from api.models.user_models import User
from api.models.group_models import Group
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    # Add a field to show the count of groups assigned to this user as an adviser
    assigned_groups_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id','email','first_name','last_name','bio','avatar','role','is_staff','is_approved','created_at','assigned_groups_count')
    
    def get_assigned_groups_count(self, obj):
        # Only calculate for adviser users
        if obj.role == 'ADVISER':
            return Group.objects.filter(adviser=obj).count()
        return 0

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    class Meta:
        model = User
        fields = ('email','password','first_name','last_name','role')
    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role','STUDENT')
        # Automatically approve all accounts
        is_approved = True
        user = User.objects.create_user(password=password, role=role, is_approved=is_approved, **validated_data)
        return user

class PublicRegisterSerializer(serializers.ModelSerializer):
    """Serializer for public registration - users are automatically approved"""
    password = serializers.CharField(write_only=True, min_length=6)
    class Meta:
        model = User
        fields = ('email','password','first_name','last_name','role')
    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role','STUDENT')
        # Automatically approve all accounts
        is_approved = True
        user = User.objects.create_user(password=password, role=role, is_approved=is_approved, **validated_data)
        return user

class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    email = serializers.EmailField(read_only=True)  # Email should not be changed easily

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'bio', 'avatar')

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match")
        return data

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value