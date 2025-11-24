from rest_framework import serializers
from api.models.user_models import User
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','email','first_name','last_name','role','is_staff','is_approved','created_at')

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