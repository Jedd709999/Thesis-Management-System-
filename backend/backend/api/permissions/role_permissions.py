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
        # Admins can access everything
        if request.user.role == 'ADMIN':
            return True
            
        # For create action, only students can create theses
        if view.action == 'create':
            return request.user and request.user.role in ['STUDENT', 'ADMIN']
        # For list view, all authenticated users can access (to see other theses)
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        # For other actions, students, advisers, panel members, and admins can access
        return request.user and request.user.role in ['STUDENT', 'ADVISER', 'PANEL', 'ADMIN']
    
    def has_object_permission(self, request, view, obj):
        # Admins can access all theses
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
            
            # Admins have already been handled above, but just in case
            if request.user.role == 'ADMIN':
                return True
                
        # For write operations, be more restrictive
        # Students can only modify their own theses
        if request.user.role == 'STUDENT':
            # Allow thesis proposer to modify
            if request.user == obj.proposer:
                return True
            # Allow group leader to delete thesis when status is TOPIC_SUBMITTED or TOPIC_REJECTED
            if view.action == 'destroy' and hasattr(obj.group, 'leader') and request.user == obj.group.leader:
                return obj.status in ['TOPIC_SUBMITTED', 'TOPIC_REJECTED']
            return False
            
        # Advisers can modify theses of their groups
        if request.user.role == 'ADVISER':
            return request.user == obj.group.adviser
            
        # Admins have already been handled above
        if request.user.role == 'ADMIN':
            return True
            
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
            from backend.api.models.group_models import Group, GroupMember
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
            is_member = (
                request.user in group.members.all() or
                request.user == group.adviser or
                request.user in group.panels.all()
            )
            
            print(f"DEBUG: IsDocumentOwnerOrGroupMember.has_object_permission")
            print(f"  - Document: {obj.title} (ID: {obj.id})")
            print(f"  - Uploaded by: {obj.uploaded_by.email} (ID: {obj.uploaded_by.id})")
            print(f"  - Current user: {request.user.email} (ID: {request.user.id})")
            print(f"  - Thesis: {thesis.title} (ID: {thesis.id})")
            print(f"  - Group: {group.name} (ID: {group.id})")
            print(f"  - User is uploader: {obj.uploaded_by == request.user}")
            print(f"  - User is member: {request.user in group.members.all()}")
            print(f"  - User is adviser: {request.user == group.adviser}")
            print(f"  - User is panel: {request.user in group.panels.all()}")
            print(f"  - Overall access: {is_member}")
            
            return is_member
            
        return False

class CanCreateSchedule(permissions.BasePermission):
    """
    Permission class for schedule creation.
    Admins can create schedules directly.
    Advisers can propose schedules that require admin approval (pending status).
    Students and panel members cannot create schedules.
    """
    def has_permission(self, request, view):
        # For create action, allow admins and advisers to create schedules
        if view.action == 'create':
            user = request.user
            if not user or not user.is_authenticated:
                return False
            # Admins can create schedules directly
            if user.role == 'ADMIN':
                return True
            # Advisers can propose schedules (will be set to pending status)
            if user.role == 'ADVISER':
                return True
            # Students and panel members cannot create schedules
            return False
        # For other actions, all authenticated users can access
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.role == 'ADMIN':
            return True
        
        # Advisers can view schedules for their groups
        if request.user.role == 'ADVISER':
            return request.user == obj.thesis.group.adviser
        
        # Students and panel members can only view
        if request.method in permissions.SAFE_METHODS:
            if request.user.role == 'STUDENT':
                return request.user in obj.thesis.group.members.all()
            if request.user.role == 'PANEL':
                return request.user in obj.thesis.group.panels.all()
        
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


class CanViewDraftDocuments(permissions.BasePermission):
    """
    Permission class that restricts viewing of draft documents.
    Only students can view draft documents. Advisers, panels, and admins cannot.
    """
    def has_object_permission(self, request, view, obj):
        # If document is not draft, everyone can view it
        if obj.status != 'draft':
            return True
            
        # Only students can view draft documents
        return request.user.role == 'STUDENT'
