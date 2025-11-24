from rest_framework import permissions
from api.models.group_models import Group
from api.models.thesis_models import Thesis
from api.models.schedule_models import OralDefenseSchedule

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADMIN')

class IsAdviser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADVISER')

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'STUDENT')

class IsPanel(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'PANEL')

class CanViewUsers(permissions.BasePermission):
    """
    Allows authenticated users to view user lists for dropdown functionality,
    but restricts write operations to admins only.
    """
    def has_permission(self, request, view):
        # Allow read access (GET, HEAD, OPTIONS) for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        # Allow write access (POST, PUT, PATCH, DELETE) for admins only
        return bool(request.user and request.user.role == 'ADMIN')

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user
        elif hasattr(obj, 'proposer'):
            return obj.proposer == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
            
        return False

class IsGroupMemberOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
            
        # Check if user is group member, adviser, or panel
        if hasattr(obj, 'group'):
            group = obj.group
        elif isinstance(obj, Group):
            group = obj
        else:
            return False
            
        return (
            request.user in group.members.all() or
            request.user == group.adviser or
            request.user in group.panels.all()
        )

class IsAdviserOrPanelForSchedule(permissions.BasePermission):
    def has_permission(self, request, view):
        # For list view, all authenticated users can access
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        # For create action, advisers, panel members, students, and admins can access
        if view.action == 'create':
            return request.user and request.user.role in ['ADVISER', 'PANEL', 'STUDENT', 'ADMIN']
        # For other actions, advisers, panel members, students, and admins can access
        return request.user and request.user.role in ['ADVISER', 'PANEL', 'STUDENT', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
            
        # Students can view schedules for their own group
        if request.user.role == 'STUDENT':
            return request.user in obj.group.members.all()
            
        # Check if user is the adviser or panel member for this schedule
        return (
            request.user == obj.group.adviser or
            request.user in obj.group.panels.all()
        )

class IsStudentOrAdviserForThesis(permissions.BasePermission):
    def has_permission(self, request, view):
        # For create action, only students can create theses
        if view.action == 'create':
            return request.user and request.user.role in ['STUDENT', 'ADMIN']
        # For list view, all authenticated users can access (to see other theses)
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        # For other actions, students, advisers, panel members, and admins can access
        return request.user and request.user.role in ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
            
        # For read-only methods, allow broader access
        if request.method in permissions.SAFE_METHODS:
            # Students can view their own theses
            if request.user.role == 'STUDENT':
                return request.user == obj.proposer
            
            # Advisers can view theses of their groups
            if request.user.role == 'ADVISER':
                return request.user == obj.group.adviser
            
            # Panel members can view theses of groups they're assigned to
            if request.user.role == 'PANEL':
                return request.user in obj.group.panels.all()
            
        # For write operations, be more restrictive
        # Students can only modify their own theses
        if request.user.role == 'STUDENT':
            return request.user == obj.proposer
            
        # Advisers can modify theses of their groups
        if request.user.role == 'ADVISER':
            return request.user == obj.group.adviser
            
        return False

class IsAdviserForGroup(permissions.BasePermission):
    def has_permission(self, request, view):
        # For list view, all authenticated users can access
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        # For detail view, advisers, admins, panel members, and students can access
        return request.user and request.user.role in ['ADVISER', 'ADMIN', 'PANEL', 'STUDENT']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
            
        # Check if user is the adviser for this group
        if hasattr(obj, 'group'):
            group = obj.group
        elif isinstance(obj, Group):
            group = obj
        else:
            return False
            
        # Allow adviser, panel members, and student members
        return (
            request.user == group.adviser or
            request.user in group.panels.all() or
            request.user in group.members.all()
        )

class IsGroupLeaderOrAdmin(permissions.BasePermission):
    """
    Permission class that allows only group leaders or admins to perform actions.
    """
    def has_permission(self, request, view):
        # Allow admins to do anything
        if request.user.role == 'ADMIN':
            return True
            
        # For create action, allow students to create groups (they'll be the leader)
        if view.action == 'create':
            return request.user.role == 'STUDENT'
            
        # For group member operations, check if the user is the group leader
        group_id = view.kwargs.get('group_id') or view.kwargs.get('pk')
        if not group_id:
            return False
            
        try:
            from api.models.group_models import Group, GroupMember
            # Check if the user is the leader of the group
            return Group.objects.filter(
                id=group_id,
                leader=request.user
            ).exists()
        except (ValueError, Group.DoesNotExist):
            return False
    
    def has_object_permission(self, request, view, obj):
        # Allow admins to do anything
        if request.user.role == 'ADMIN':
            return True
            
        # For group member objects, check if the user is the group leader
        if hasattr(obj, 'group'):
            return obj.group.leader == request.user
            
        # For group objects, check if the user is the leader
        if hasattr(obj, 'leader'):
            return obj.leader == request.user
            
        return False

class CanManageNotifications(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Users can only manage their own notifications
        return obj.user == request.user or request.user.role == 'ADMIN'

class IsDocumentOwnerOrGroupMember(permissions.BasePermission):
    def has_permission(self, request, view):
        # For list view, all authenticated users can access
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        # For detail view, students, admins, advisers, and panel members can access
        return request.user and request.user.role in ['STUDENT', 'ADMIN', 'ADVISER', 'PANEL']
    
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
            
        # Document uploader can manage
        if obj.uploaded_by == request.user:
            return True
            
        # Group members can view documents
        thesis = obj.thesis
        if thesis:
            group = thesis.group
            return (
                request.user in group.members.all() or
                request.user == group.adviser or
                request.user in group.panels.all()
            )
            
        return False

# Combined permission classes for common use cases
class IsStudentOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'STUDENT')
    
    def has_object_permission(self, request, view, obj):
        # Students can only access their own objects
        return obj.user == request.user

class IsAdviserOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == 'ADVISER')
    
    def has_object_permission(self, request, view, obj):
        # Advisers can only access objects related to their groups
        if hasattr(obj, 'group') and obj.group.adviser == request.user:
            return True
        return False