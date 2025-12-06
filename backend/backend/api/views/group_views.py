from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from django.shortcuts import get_object_or_404
from django.db import models, transaction
from api.models.group_models import Group, GroupMember
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.serializers.group_serializers import GroupSerializer, GroupMemberSerializer
from api.permissions.role_permissions import IsAdviserForGroup, IsGroupMemberOrAdmin, IsGroupLeaderOrAdmin
from api.services.notification_service import NotificationService

print("DEBUG: group_views.py module loaded!")

class GroupMemberViewSet(mixins.ListModelMixin,
                        mixins.CreateModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.UpdateModelMixin,
                        mixins.DestroyModelMixin,
                        GenericViewSet):
    """
    API endpoint for managing group members.
    """
    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupLeaderOrAdmin]
    
    def get_queryset(self):
        group_id = self.kwargs.get('group_id')
        return GroupMember.objects.filter(group_id=group_id).select_related('user')
    
    def perform_create(self, serializer):
        group = get_object_or_404(Group, id=self.kwargs['group_id'])
        serializer.save(group=group)
        
        # If this is the first member, make them the leader
        if not group.leader and group.members.count() == 1:
            group.leader = serializer.instance.user
            serializer.instance.role_in_group = 'leader'
            serializer.instance.save()
            group.save()
        elif group.leader == serializer.instance.user:
            # If this member is already the leader, make sure their role is set to leader
            serializer.instance.role_in_group = 'leader'
            serializer.instance.save()
    
    @action(detail=True, methods=['post'])
    def set_role(self, request, group_id, pk=None):
        """Set a member's role in the group."""
        member = self.get_object()
        role = request.data.get('role')
        
        if role not in dict(GroupMember.ROLES).keys():
            return Response(
                {'error': 'Invalid role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # If setting role to leader, update the group's leader field
        if role == 'leader':
            member.group.leader = member.user
            member.group.save()
        # If removing leader role from current leader, clear the group's leader field
        elif member.role_in_group == 'leader' and role != 'leader':
            member.group.leader = None
            member.group.save()
            
        member.role_in_group = role
        member.save()
        
        return Response(GroupMemberSerializer(member).data)


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing research groups.
    """
    queryset = Group.objects.all().prefetch_related('group_memberships__user', 'panels', 'leader', 'adviser')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdviserForGroup, IsGroupMemberOrAdmin]
    
    def __init__(self, *args, **kwargs):
        print("DEBUG: GroupViewSet initialized!")
        super().__init__(*args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        print("DEBUG: GroupViewSet create called")
        print("DEBUG: Request data:", request.data)
        print("DEBUG: Request user:", request.user)
        print("DEBUG: Request user role:", getattr(request.user, 'role', 'No role'))
        return super().create(request, *args, **kwargs)
    
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        user = self.request.user
        print(f"DEBUG: perform_create called for user {user.email} (ID: {user.id}) with role {user.role}")
        
        try:
            # Prepare data for group creation
            validated_data = serializer.validated_data.copy()
            print("DEBUG: validated_data:", validated_data)
            
            # Set status based on user role
            if user.role == 'STUDENT':
                validated_data['status'] = 'PENDING'
            elif user.role in ['ADMIN', 'ADVISER']:
                validated_data['status'] = 'APPROVED'
            else:
                validated_data['status'] = 'PENDING'
                
            print("DEBUG: Final validated_data:", validated_data)
            # Save the group - the serializer handles member and leader assignment
            group = serializer.save(**validated_data)
            print("DEBUG: Group saved with ID:", group.id)
            
            print("DEBUG: perform_create completed successfully")
        except Exception as e:
            print("DEBUG: Exception in perform_create:", str(e))
            print("DEBUG: Exception type:", type(e))
            import traceback
            print("DEBUG: Traceback:", traceback.format_exc())
            raise
    
    def get_object(self):
        print(f"DEBUG: get_object called for pk={self.kwargs.get('pk')}, action: {self.action}")
        
        # For approve, reject, resubmit, assign_adviser, assign_panel, and remove_panel actions, always use unfiltered queryset
        if self.action in ['approve', 'reject', 'resubmit', 'assign_adviser', 'assign_panel', 'remove_panel']:
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
        # For approve, reject, resubmit, assign_adviser, assign_panel, and remove_panel actions, don't filter at all
        if self.action in ['approve', 'reject', 'resubmit', 'assign_adviser', 'assign_panel', 'remove_panel']:
            print(f"DEBUG: {self.action} action - using unfiltered queryset")
            return Group.objects.all()
        
        queryset = super().get_queryset()
        
        # Debug logging
        print(f"get_queryset called for: {self.request.user.email}, Role: {self.request.user.role}")
        print(f"Action: {self.action}")
        print(f"Original queryset count: {queryset.count()}")

        user = self.request.user
        
        # Apply role-based filtering
        if user.role == 'STUDENT':
            # For students, apply special logic based on action type
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
                # For detail views, students can see approved groups AND their own pending proposals
                # First get all groups where user is member/adviser/panel/leader
                user_groups = Group.objects.filter(
                    models.Q(members=self.request.user) | 
                    models.Q(adviser=self.request.user) | 
                    models.Q(panels=self.request.user) |
                    models.Q(leader=self.request.user)
                ).distinct()
                print(f"Groups where user is member/adviser/panel/leader: {user_groups.count()}")
                
                # Then filter those groups by status (APPROVED or PENDING)
                filtered_groups = user_groups.filter(
                    models.Q(status='APPROVED') | 
                    models.Q(status='PENDING')
                ).distinct()
                print(f"After status filtering: {filtered_groups.count()}")
                for group in filtered_groups:
                    print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
                
                queryset = filtered_groups
            else:
                # For list views, students only see their own groups (member or leader)
                queryset = queryset.filter(
                    models.Q(members=user) | 
                    models.Q(leader=user)
                ).distinct()
                print(f"Student list view filtered queryset count: {queryset.count()}")
                
        elif user.role == 'ADVISER':
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
                # Advisers can see approved groups they advise or are panel members of
                queryset = queryset.filter(
                    models.Q(adviser=user) |
                    models.Q(panels=user)
                ).distinct()
                print(f"Adviser detail view filtered queryset count: {queryset.count()}")
            else:
                # For list views, only show approved groups
                queryset = queryset.filter(status='APPROVED').distinct()
                print(f"Adviser list view filtered queryset count: {queryset.count()}")
                
        elif user.role == 'PANEL':
            # Panel members can see all approved groups
            if self.action not in ['pending_proposals', 'get_current_user_groups', 'approve', 'reject', 'resubmit', 'assign_adviser', 'assign_panel', 'remove_panel']:
                queryset = queryset.filter(status='APPROVED').distinct()
                print(f"Panel list view filtered queryset count: {queryset.count()}")
            else:
                print(f"Panel accessing special endpoint: {self.action}")
                
        elif user.role == 'ADMIN':
            # Admin can see all groups for detail views
            # For list views, apply standard filtering
            if self.action not in ['pending_proposals', 'get_current_user_groups', 'approve', 'reject', 'resubmit', 'assign_adviser', 'assign_panel', 'remove_panel']:
                queryset = queryset.filter(status='APPROVED').distinct()
                print(f"Admin list view filtered queryset count: {queryset.count()}")
            else:
                print(f"Admin accessing special endpoint: {self.action}")
        else:
            # For other roles (PANEL), apply appropriate filtering
            if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
                queryset = queryset.filter(
                    models.Q(members=user) | 
                    models.Q(adviser=user) | 
                    models.Q(panels=user) |
                    models.Q(leader=user)
                ).distinct().distinct()
                print(f"Other role detail view filtered queryset count: {queryset.count()}")
            else:
                queryset = queryset.filter(status='APPROVED').distinct()
                print(f"Other role list view filtered queryset count: {queryset.count()}")
        
        # Apply search filters
        search_query = self.request.query_params.get('search', None)
        keywords = self.request.query_params.get('keywords', None)
        topics = self.request.query_params.get('topics', None)
        
        if search_query:
            queryset = Group.objects.search(search_query).distinct()
        elif keywords:
            queryset = Group.objects.search_by_keywords(keywords).distinct()
        elif topics:
            queryset = Group.objects.search_by_topics(topics).distinct()
            
        # Ensure proper prefetching for all queryset results
        queryset = queryset.prefetch_related('group_memberships__user', 'panels', 'leader', 'adviser').distinct()
        
        # Add debug information about the prefetched data
        print(f"Final queryset count: {queryset.count()}")
        for group in queryset:
            print(f"Group: {group.name} (ID: {group.id})")
            print(f"  Leader: {group.leader}")
            if group.leader:
                print(f"    Leader details - ID: {group.leader.id}, Email: {group.leader.email}")
            print(f"  Members count: {group.members.count()}")
            print(f"  Group memberships count: {group.group_memberships.count()}")
        
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
            
            # Check if an adviser has been assigned to the group
            if not group.adviser:
                return Response({'error': 'An adviser must be assigned to the group before it can be approved'}, status=400)
            
            # Approve the group without creating a thesis
            group.status = 'APPROVED'
            group.save()
            serializer = self.get_serializer(group)
            return Response(serializer.data)
        except Exception as e:
            print(f"DEBUG: approve failed: {e}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def resubmit(self, request, pk=None):
        """Resubmit a rejected group proposal (Student only)"""
        if request.user.role != 'STUDENT':
            return Response({'error': 'Only students can resubmit group proposals'}, status=403)
        
        group = self.get_object()
        # Check if the user is the leader of this group
        if group.leader != request.user:
            return Response({'error': 'Only the group leader can resubmit the proposal'}, status=403)
        
        if group.status != 'REJECTED':
            return Response({'error': 'Only rejected groups can be resubmitted'}, status=400)
        
        group.status = 'PENDING'
        group.rejection_reason = ''  # Clear the rejection reason when resubmitting
        group.save()
        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def pending_proposals(self, request):
        """Get all pending group proposals (Admin only)"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can view pending proposals'}, status=403)
        
        pending_groups = Group.objects.filter(status='PENDING').prefetch_related('members', 'panels', 'leader', 'adviser')
        serializer = self.get_serializer(pending_groups, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_current_user_groups(self, request):
        print("DEBUG: get_current_user_groups called!")
        user = request.user
        print(f"get_current_user_groups called for: {user.email}, Role: {user.role}")
        
        # Get groups where user is a member, adviser, panel, or leader
        groups = Group.objects.filter(
            models.Q(members=user) | 
            models.Q(adviser=user) | 
            models.Q(panels=user) |
            models.Q(leader=user)  # Also include groups where user is the leader
        )
        print(f"Groups where user is member/adviser/panel/leader: {groups.count()}")
        for group in groups:
            print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
        
        # Non-admin users can only see approved groups, 
        # but students can see their own pending proposals and rejected proposals
        if user.role != 'ADMIN':
            if user.role == 'STUDENT':
                # Students can see approved groups AND their own pending/rejected proposals
                # Since we already filtered for groups where user is a member/adviser/panel/leader,
                # we just need to filter by status
                groups = groups.filter(
                    models.Q(status='APPROVED') | 
                    models.Q(status='PENDING') |
                    models.Q(status='REJECTED')
                )
                print(f"After status filtering: {groups.count()}")
                for group in groups:
                    print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
            else:
                # Advisers and panels can only see approved groups
                groups = groups.filter(status='APPROVED')
            
        groups = groups.prefetch_related('group_memberships__user', 'panels', 'leader', 'adviser')
        
        # Add debug information about the prefetched data
        print(f"Final groups count: {groups.count()}")
        for group in groups:
            print(f"Group: {group.name} (ID: {group.id})")
            print(f"  Leader: {group.leader}")
            if group.leader:
                print(f"    Leader details - ID: {group.leader.id}, Email: {group.leader.email}")
            print(f"  Members count: {group.members.count()}")
            print(f"  Group memberships count: {group.group_memberships.count()}")
        
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_other_groups(self, request):
        """Get all approved groups except those where the user is a member, adviser, panel, or leader"""
        user = request.user
        print(f"get_other_groups called for: {user.email}, Role: {user.role}")
        
        # For students, get all approved groups except their own
        if user.role == 'STUDENT':
            # Get all approved groups
            groups = Group.objects.filter(status='APPROVED')
            
            # Exclude groups where user is a member, adviser, panel, or leader
            groups = groups.exclude(
                models.Q(members=user) | 
                models.Q(adviser=user) | 
                models.Q(panels=user) |
                models.Q(leader=user)
            )
            
            print(f"Other groups count: {groups.count()}")
            for group in groups:
                print(f"  - ID: {group.id}, Name: {group.name}, Status: {group.status}")
            
            groups = groups.prefetch_related('group_memberships__user', 'panels', 'leader', 'adviser')
            
            # Add debug information about the prefetched data
            print(f"Final other groups count: {groups.count()}")
            for group in groups:
                print(f"Group: {group.name} (ID: {group.id})")
                print(f"  Leader: {group.leader}")
                if group.leader:
                    print(f"    Leader details - ID: {group.leader.id}, Email: {group.leader.email}")
                print(f"  Members count: {group.members.count()}")
                print(f"  Group memberships count: {group.group_memberships.count()}")
            
            serializer = self.get_serializer(groups, many=True)
            return Response(serializer.data)
        
        # For advisers, panel users and other roles, return all approved groups except their own
        groups = Group.objects.filter(status='APPROVED')
        
        # Exclude groups where user is a member, adviser, panel, or leader
        groups = groups.exclude(
            models.Q(members=user) | 
            models.Q(adviser=user) | 
            models.Q(panels=user) |
            models.Q(leader=user)
        )
        
        groups = groups.prefetch_related('group_memberships__user', 'panels', 'leader', 'adviser')
        
        # Add debug information about the prefetched data
        print(f"Other groups count for panel/adviser: {groups.count()}")
        for group in groups:
            print(f"Group: {group.name} (ID: {group.id})")
            print(f"  Leader: {group.leader}")
            if group.leader:
                print(f"    Leader details - ID: {group.leader.id}, Email: {group.leader.email}")
            print(f"  Members count: {group.members.count()}")
            print(f"  Group memberships count: {group.group_memberships.count()}")
        
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
        print(f"DEBUG: assign_adviser called for pk={pk}")
        print(f"DEBUG: User: {request.user.email}, Role: {request.user.role}")
        
        if request.user.role != 'ADMIN':
            print(f"DEBUG: User is not admin, returning 403")
            return Response({'error': 'Only admins can assign advisers'}, status=status.HTTP_403_FORBIDDEN)
        
        print(f"DEBUG: About to call get_object()")
        group = self.get_object()
        print(f"DEBUG: Found group: {group.name if group else 'None'}")
        adviser_id = request.data.get('adviser_id')
        print(f"DEBUG: adviser_id from request: {adviser_id}")
        
        if not adviser_id:
            print(f"DEBUG: adviser_id is required, returning 400")
            return Response({'error': 'adviser_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            adviser = User.objects.get(pk=adviser_id, role='ADVISER')
            print(f"DEBUG: Found adviser: {adviser.email}")
        except User.DoesNotExist:
            print(f"DEBUG: Adviser not found, returning 404")
            return Response({'error': 'Adviser not found or user is not an adviser'}, status=status.HTTP_404_NOT_FOUND)
        
        print(f"DEBUG: About to assign adviser to group")
        group.adviser = adviser
        group.save()
        print(f"DEBUG: Adviser assigned successfully")

        # Send notifications for adviser assignment
        NotificationService.notify_adviser_assigned(group)

        serializer = self.get_serializer(group)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_panel(self, request, pk=None):
        """Assign panel members to a group (Admin or Adviser for their groups)"""
        print(f"DEBUG: assign_panel called with pk={pk}")
        print(f"DEBUG: request.user: {request.user.email}, role: {request.user.role}")
        
        try:
            group = self.get_object()
            print(f"DEBUG: Found group: {group.name}, ID: {group.id}")
        except Exception as e:
            print(f"DEBUG: Error getting group: {e}")
            return Response({'error': f'Group not found: {e}'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is admin or adviser of this specific group
        is_admin = request.user.role == 'ADMIN'
        is_adviser = request.user.role == 'ADVISER' and group.adviser == request.user
        
        print(f"DEBUG: is_admin={is_admin}, is_adviser={is_adviser}")
        
        if not (is_admin or is_adviser):
            return Response({'error': 'Only admins or the group adviser can assign panel members'}, status=status.HTTP_403_FORBIDDEN)
        
        panel_ids = request.data.get('panel_ids', [])
        print(f"DEBUG: panel_ids from request: {panel_ids}")
        
        if not panel_ids:
            return Response({'error': 'panel_ids is required and must be a non-empty list'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(panel_ids, list):
            return Response({'error': 'panel_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate that all panel_ids belong to PANEL role users
        panel_users = []
        for panel_id in panel_ids:
            try:
                # Try to get user by primary key (works for both integer and UUID primary keys)
                user = User.objects.get(pk=panel_id, role='PANEL')
                panel_users.append(user)
            except User.DoesNotExist:
                print(f"DEBUG: Panel member with ID {panel_id} not found or not a panel user")
                return Response({'error': f'Panel member with ID {panel_id} not found or not a panel user'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"DEBUG: Error looking up panel member with ID {panel_id}: {e}")
                return Response({'error': f'Error looking up panel member with ID {panel_id}: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Assign panel members (this replaces existing panel members)
        print(f"DEBUG: About to set panel members")
        try:
            group.panels.set(panel_users)
            group.save()
            print(f"DEBUG: Panel members set successfully")
        except Exception as e:
            print(f"DEBUG: Error setting panel members: {e}")
            return Response({'error': f'Error setting panel members: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        print(f"DEBUG: About to serialize group")
        try:
            serializer = self.get_serializer(group)
            print(f"DEBUG: Group serialized successfully")
        except Exception as e:
            print(f"DEBUG: Error serializing group: {e}")
            return Response({'error': f'Error serializing group: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        print(f"DEBUG: About to return response")
        try:
            response = Response(serializer.data)
            print(f"DEBUG: Response created successfully")
            return response
        except Exception as e:
            print(f"DEBUG: Error creating response: {e}")
            return Response({'error': f'Error creating response: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_panel(self, request, pk=None):
        """Remove a specific panel member from a group (Admin or Adviser for their groups)"""
        print(f"DEBUG: remove_panel called with pk={pk}")
        print(f"DEBUG: request.user: {request.user.email}, role: {request.user.role}")

        try:
            group = self.get_object()
            print(f"DEBUG: Found group: {group.name}, ID: {group.id}")
        except Exception as e:
            print(f"DEBUG: Error getting group: {e}")
            return Response({'error': f'Group not found: {e}'}, status=status.HTTP_404_NOT_FOUND)

        # Check if user is admin or adviser of this specific group
        is_admin = request.user.role == 'ADMIN'
        is_adviser = request.user.role == 'ADVISER' and group.adviser == request.user

        print(f"DEBUG: is_admin={is_admin}, is_adviser={is_adviser}")

        if not (is_admin or is_adviser):
            return Response({'error': 'Only admins or the group adviser can remove panel members'}, status=status.HTTP_403_FORBIDDEN)

        panel_id = request.data.get('panel_id')
        print(f"DEBUG: panel_id from request: {panel_id}")

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
        print(f"DEBUG: About to remove panel member")
        try:
            group.panels.remove(panel_user)
            group.save()
            print(f"DEBUG: Panel member removed successfully")
        except Exception as e:
            print(f"DEBUG: Error removing panel member: {e}")
            return Response({'error': f'Error removing panel member: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        print(f"DEBUG: About to serialize group for remove_panel")
        try:
            serializer = self.get_serializer(group)
            print(f"DEBUG: Group serialized successfully for remove_panel")
        except Exception as e:
            print(f"DEBUG: Error serializing group in remove_panel: {e}")
            return Response({'error': f'Error serializing group: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        print(f"DEBUG: About to return response for remove_panel")
        try:
            response = Response(serializer.data)
            print(f"DEBUG: Response created successfully for remove_panel")
            return response
        except Exception as e:
            print(f"DEBUG: Error creating response in remove_panel: {e}")
            return Response({'error': f'Error creating response: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def statistics(self, request):
        """Get group statistics for admin dashboard"""
        if request.user.role != 'ADMIN':
            return Response({'error': 'Only admins can view group statistics'}, status=status.HTTP_403_FORBIDDEN)

        # Get all groups (no filtering for admin statistics)
        total_groups = Group.objects.count()
        active_groups = Group.objects.filter(status='APPROVED').count()
        pending_groups = Group.objects.filter(status='PENDING').count()
        rejected_groups = Group.objects.filter(status='REJECTED').count()

        return Response({
            'total_registered_groups': total_groups,
            'active_groups': active_groups,
            'pending_groups': pending_groups,
            'rejected_groups': rejected_groups
        })
