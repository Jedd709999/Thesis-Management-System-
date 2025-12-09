from rest_framework import permissions
from api.models.group_models import Group
from api.models.thesis_models import Thesis
from api.models.document_models import Document
from api.models.schedule_models import OralDefenseSchedule

class IsStudentOfGroup(permissions.BasePermission):
    """
    Custom permission to only allow students who are members of a specific group.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated and is a student
        return bool(request.user and request.user.role == 'STUDENT')
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.role == 'ADMIN':
            return True
            
        # Check if the object is related to a group and the user is a member
        if hasattr(obj, 'group'):
            group = obj.group
        elif isinstance(obj, Group):
            group = obj
        else:
            # If object doesn't have a group, check if user is trying to access their own data
            return self._check_user_ownership(request, obj)
            
        # Check if user is a member of the group
        return request.user in group.members.all()
    
    def _check_user_ownership(self, request, obj):
        """Helper method to check if user owns the object"""
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        elif hasattr(obj, 'proposer'):
            return obj.proposer == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False


class IsAdviser(permissions.BasePermission):
    """
    Custom permission to only allow advisers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADVISER')
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.role == 'ADMIN':
            return True
            
        # Check if the object is related to a thesis and the user is the adviser
        if hasattr(obj, 'thesis'):
            thesis = obj.thesis
        elif isinstance(obj, Thesis):
            thesis = obj
        else:
            # If object doesn't have a thesis, check if user is trying to access their own data
            return self._check_user_ownership(request, obj)
            
        # Check if user is the adviser for this thesis
        return request.user == thesis.adviser
    
    def _check_user_ownership(self, request, obj):
        """Helper method to check if user owns the object"""
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        elif hasattr(obj, 'proposer'):
            return obj.proposer == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False


class IsPanel(permissions.BasePermission):
    """
    Custom permission to only allow panel members.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'PANEL')
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.role == 'ADMIN':
            return True
            
        # Check if the object is related to a group and the user is a panel member
        if hasattr(obj, 'group'):
            group = obj.group
        elif isinstance(obj, Group):
            group = obj
        elif hasattr(obj, 'thesis') and hasattr(obj.thesis, 'group'):
            group = obj.thesis.group
        elif hasattr(obj, 'schedule') and hasattr(obj.schedule, 'group'):
            group = obj.schedule.group
        else:
            # If object doesn't have a group, check if user is trying to access their own data
            return self._check_user_ownership(request, obj)
            
        # Check if user is a panel member for this group
        return request.user in group.panels.all()
    
    def _check_user_ownership(self, request, obj):
        """Helper method to check if user owns the object"""
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        elif hasattr(obj, 'proposer'):
            return obj.proposer == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADMIN')
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        return True


class IsDocumentUploader(permissions.BasePermission):
    """
    Custom permission to only allow the uploader of a document.
    """
    def has_permission(self, request, view):
        # All authenticated users can access document endpoints
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Admins can access everything
        if request.user.role == 'ADMIN':
            return True
            
        # Check if the object is a document and the user is the uploader
        if isinstance(obj, Document):
            return obj.uploaded_by == request.user
            
        # If object has a document attribute, check that
        if hasattr(obj, 'document'):
            return obj.document.uploaded_by == request.user
            
        # If object has an uploaded_by attribute, check that
        if hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
            
        return False
