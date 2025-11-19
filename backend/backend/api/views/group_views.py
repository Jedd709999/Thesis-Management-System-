from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from api.models.group_models import Group
from api.models.user_models import User
from api.serializers.group_serializers import GroupSerializer
from api.permissions.role_permissions import IsAdviserForGroup, IsGroupMemberOrAdmin

print("DEBUG: group_views.py module loaded!")

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related('members','panels')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdviserForGroup, IsGroupMemberOrAdmin]
    
    def __init__(self, *args, **kwargs):
        print("DEBUG: GroupViewSet initialized!")
        super().__init__(*args, **kwargs)
    
    def perform_create(self, serializer):
        # Set status based on user role
        user = self.request.user
        if user.role == 'STUDENT':
            serializer.save(status='PENDING')
        elif user.role in ['ADMIN', 'ADVISER']:
            serializer.save(status='APPROVED')
        else:
            serializer.save(status='PENDING')
    
    def get_object(self):
        print(f"DEBUG: get_object called for pk={self.kwargs.get('pk')}, action: {self.action}")
        
        # For approve and reject actions, always use unfiltered queryset
        if self.action in ['approve', 'reject']:
            print(f"DEBUG: Using unfiltered queryset for {self.action}")
            queryset = Group.objects.all()
            obj = get_object_or_404(queryset, pk=self.kwargs.get('pk'))
            print(f"DEBUG: Found object: {obj.name}, ID: {obj.id}, Status: {obj.status}")
            return obj
        
        # For all other actions, use the parent's get_object
        try:
            obj = super().get_object()
            print(f"DEBUG: Found object: {obj.name}, ID: {obj.id}")
            return obj
        except Exception as e:
            print(f"DEBUG: get_object failed: {e}")
            raise
    
    def get_queryset(self):
        # For approve and reject actions, don't filter at all
        if self.action in ['approve', 'reject']:
            print(f"DEBUG: {self.action} action - using unfiltered queryset")
            return Group.objects.all()
        
        queryset = super().get_queryset()
        
        # Debug logging
        print(f"get_queryset called for: {self.request.user.email}, Role: {self.request.user.role}")
        print(f"Action: {self.action}")
        print(f"Original queryset count: {queryset.count()}")
        
        # For detail views (retrieve, update, delete), apply special student logic
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if self.request.user.role != 'ADMIN':
                if self.request.user.role == 'STUDENT':
                    # Students can see approved groups AND their own pending proposals
                    # First get all groups where user is member/adviser/panel
                    user_groups = Group.objects.filter(
                        models.Q(members=self.request.user) | 
                        models.Q(adviser=self.request.user) | 
                        models.Q(panels=self.request.user)
                    )
                    print(f"Groups where user is member/adviser/panel: {user_groups.count()}")
                    
                    # Then filter those groups by status (APPROVED or PENDING)
                    filtered_groups = user_groups.filter(
                        models.Q(status='APPROVED') | 
                        models.Q(status='PENDING')
                    )
                    print(f"After status filtering: {filtered_groups.count()}")
                    for group in filtered_groups:
                        print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
                    
                    queryset = filtered_groups
                else:
                    # Advisers and panels can only see approved groups
                    queryset = queryset.filter(status='APPROVED')
                    print(f"Adviser/Panel filtered queryset count: {queryset.count()}")
        else:
            # For list views, only show approved groups to everyone except for special endpoints
            # The main groups list should only show approved groups for all users
            # Admins can see pending groups in the "Group Proposals" tab
            print(f"Checking action: {self.action}")
            print(f"Is action in excluded list? {self.action not in ['pending_proposals', 'get_current_user_groups', 'approve', 'reject']}")
            if self.action not in ['pending_proposals', 'get_current_user_groups', 'approve', 'reject']:
                queryset = queryset.filter(status='APPROVED')
                print(f"List view filtered queryset count: {queryset.count()}")
        
        search_query = self.request.query_params.get('search', None)
        keywords = self.request.query_params.get('keywords', None)
        topics = self.request.query_params.get('topics', None)
        
        if search_query:
            queryset = Group.objects.search(search_query)
        elif keywords:
            queryset = Group.objects.search_by_keywords(keywords)
        elif topics:
            queryset = Group.objects.search_by_topics(topics)
            
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a group proposal (Admin only)"""
        print(f"DEBUG: approve action called for pk={pk}")
        print(f"DEBUG: User role: {request.user.role}")
        
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can approve groups'}, status=403)
        
        try:
            group = self.get_object()
            print(f"DEBUG: Found group: {group.name}, Status: {group.status}")
            if group.status != 'PENDING':
                return Response({'error': 'Only pending groups can be approved'}, status=400)
            
            group.status = 'APPROVED'
            group.save()
            serializer = self.get_serializer(group)
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: approve failed: {e}")
            return Response({'error': str(e)}, status=404)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a group proposal (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can reject groups'}, status=403)
        
        group = self.get_object()
        if group.status != 'PENDING':
            return Response({'error': 'Only pending groups can be rejected'}, status=400)
        
        group.status = 'REJECTED'
        group.save()
        serializer = self.get_serializer(group)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def pending_proposals(self, request):
        """Get all pending group proposals (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can view pending proposals'}, status=403)
        
        pending_groups = Group.objects.filter(status='PENDING').prefetch_related('members', 'panels')
        serializer = self.get_serializer(pending_groups, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_current_user_groups(self, request):
        print("DEBUG: get_current_user_groups called!")
        user = request.user
        print(f"get_current_user_groups called for: {user.email}, Role: {user.role}")
        
        # Get groups where user is a member, adviser, or panel
        groups = Group.objects.filter(
            models.Q(members=user) | 
            models.Q(adviser=user) | 
            models.Q(panels=user)
        )
        print(f"Groups where user is member/adviser/panel: {groups.count()}")
        for group in groups:
            print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
        
        # Non-admin users can only see approved groups, 
        # but students can see their own pending proposals
        if user.role != 'ADMIN':
            if user.role == 'STUDENT':
                # Students can see approved groups AND their own pending proposals
                # Since we already filtered for groups where user is a member/adviser/panel,
                # we just need to filter by status
                groups = groups.filter(
                    models.Q(status='APPROVED') | 
                    models.Q(status='PENDING')
                )
                print(f"After status filtering: {groups.count()}")
                for group in groups:
                    print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
            else:
                # Advisers and panels can only see approved groups
                groups = groups.filter(status='APPROVED')
            
        groups = groups.prefetch_related('members', 'panels')
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=status.HTTP_404_NOT_FOUND)
        group.members.add(user)
        group.save()
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=status.HTTP_404_NOT_FOUND)
        group.members.remove(user)
        group.save()
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_adviser(self, request, pk=None):
        """Assign an adviser to a group (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can assign advisers'}, status=status.HTTP_403_FORBIDDEN)
        
        group = self.get_object()
        adviser_id = request.data.get('adviser_id')
        
        if not adviser_id:
            return Response({'error': 'adviser_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            adviser = User.objects.get(pk=adviser_id, role='ADVISER')
        except User.DoesNotExist:
            return Response({'error': 'Adviser not found or user is not an adviser'}, status=status.HTTP_404_NOT_FOUND)
        
        group.adviser = adviser
        group.save()
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_panel(self, request, pk=None):
        """Assign panel members to a group (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can assign panel members'}, status=status.HTTP_403_FORBIDDEN)
        
        group = self.get_object()
        panel_ids = request.data.get('panel_ids', [])
        
        if not panel_ids:
            return Response({'error': 'panel_ids is required and must be a non-empty list'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(panel_ids, list):
            return Response({'error': 'panel_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate that all panel_ids belong to PANEL role users
        panel_users = User.objects.filter(pk__in=panel_ids, role='PANEL')
        
        if panel_users.count() != len(panel_ids):
            return Response({'error': 'One or more panel members not found or not a panel user'}, status=status.HTTP_404_NOT_FOUND)
        
        # Assign panel members (this replaces existing panel members)
        group.panels.set(panel_users)
        group.save()
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_panel(self, request, pk=None):
        """Remove a specific panel member from a group (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can remove panel members'}, status=status.HTTP_403_FORBIDDEN)
        
        group = self.get_object()
        panel_id = request.data.get('panel_id')
        
        if not panel_id:
            return Response({'error': 'panel_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            panel_user = User.objects.get(pk=panel_id, role='PANEL')
        except User.DoesNotExist:
            return Response({'error': 'Panel member not found or user is not a panel user'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the panel user is actually assigned to this group
        if not group.panels.filter(pk=panel_id).exists():
            return Response({'error': 'Panel member is not assigned to this group'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove the panel member
        group.panels.remove(panel_user)
        group.save()
        
        serializer = self.get_serializer(group)
        return Response(serializer.data)
