from rest_framework import serializers
from api.models.group_models import Group, GroupMember
from api.models.user_models import User
from api.models.thesis_models import Thesis
from django.db import models

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = ('email', 'first_name', 'last_name', 'role')

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='STUDENT'),
        write_only=True,
        source='user'
    )
    role_in_group_display = serializers.CharField(source='get_role_in_group_display', read_only=True)

    class Meta:
        model = GroupMember
        fields = ('id', 'user', 'user_id', 'role_in_group', 'role_in_group_display', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'group')

class ThesisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thesis
        fields = ('id', 'title', 'status')

class GroupSerializer(serializers.ModelSerializer):
    group_members = GroupMemberSerializer(source='group_memberships', many=True, read_only=True)
    leader = UserSerializer(read_only=True, allow_null=True)
    adviser = UserSerializer(read_only=True, allow_null=True)
    panels = UserSerializer(many=True, read_only=True)
    thesis = ThesisSerializer(read_only=True, allow_null=True)
    preferred_adviser = serializers.SerializerMethodField()
    
    def __init__(self, *args, **kwargs):
        print("DEBUG: GroupSerializer initialized")
        super().__init__(*args, **kwargs)
        print("DEBUG: GroupSerializer instance:", self)
        if hasattr(self, 'context') and 'request' in self.context:
            print("DEBUG: Request in context:", self.context['request'])
    
    def to_representation(self, instance):
        """Override to add debug information"""
        try:
            print(f"DEBUG: Serializing group {instance.name} (ID: {instance.id})")
            print(f"DEBUG: Group leader: {instance.leader}")
            if instance.leader:
                print(f"DEBUG: Leader details - ID: {instance.leader.id}, Email: {instance.leader.email}, Name: {instance.leader.first_name} {instance.leader.last_name}")
            representation = super().to_representation(instance)
            print(f"DEBUG: Serialized representation keys: {list(representation.keys())}")
            if 'leader' in representation:
                print(f"DEBUG: Leader in representation: {representation['leader']}")
            else:
                print("DEBUG: Leader field missing from representation")
            return representation
        except Exception as e:
            print(f"DEBUG: Error in to_representation: {e}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            # Return a minimal representation even if there's an error
            return {
                'id': str(instance.id) if instance.id else None,
                'name': getattr(instance, 'name', ''),
                'status': getattr(instance, 'status', 'PENDING'),
                'error': 'Serialization error occurred'
            }
    
    def get_preferred_adviser(self, obj):
        """Get the preferred adviser details if preferred_adviser_id is set"""
        if obj.preferred_adviser_id:
            try:
                preferred_adviser = User.objects.get(pk=obj.preferred_adviser_id)
                return UserSerializer(preferred_adviser).data
            except User.DoesNotExist:
                # Preferred adviser no longer exists
                return None
            except Exception as e:
                # Handle any other errors gracefully
                print(f"DEBUG: Error getting preferred adviser: {e}")
                return None
        return None
    
    # Write-only fields for updates
    member_ids = serializers.ListField(
        child=serializers.CharField(),  # Changed from IntegerField to CharField for UUIDs
        write_only=True,
        required=False,
        help_text="List of user IDs to be added as members"
    )
    leader_id = serializers.CharField(  # Changed from IntegerField to CharField for UUIDs
        write_only=True,
        required=False,
        help_text="ID of the group leader"
    )
    # For group creation, adviser_id represents a preferred adviser, not a direct assignment
    # Actual adviser assignment should only happen through the admin assign_adviser endpoint
    adviser_id = serializers.CharField(
        write_only=True, 
        allow_null=True, 
        required=False,
        help_text="Preferred adviser ID (not directly assigned)"
    )
    
    def validate_adviser_id(self, value):
        """Convert empty string to None for adviser_id"""
        if value == '':
            return None
        return value
    
    panel_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.filter(role='PANEL'), 
        write_only=True, 
        required=False,
        source='panels'
    )
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'status', 'possible_topics', 'rejection_reason', 
            'leader', 'group_members', 'adviser', 'panels', 'member_ids', 
            'adviser_id', 'panel_ids', 'thesis', 'created_at', 'updated_at', 'leader_id',
            'preferred_adviser'  # Include preferred adviser details in serialized output
        ]
        read_only_fields = ['status', 'created_at', 'updated_at', 'preferred_adviser']  # Make preferred_adviser read-only
    
    def is_valid(self, raise_exception=False):
        print("DEBUG: GroupSerializer is_valid called")
        print("DEBUG: Initial data:", self.initial_data)
        try:
            result = super().is_valid(raise_exception=raise_exception)
            print("DEBUG: Validation result:", result)
            if not result:
                print("DEBUG: Validation errors:", self.errors)
            return result
        except Exception as e:
            print("DEBUG: Exception during validation:", str(e))
            print("DEBUG: Exception type:", type(e))
            raise
    
    def validate(self, attrs):
        print("DEBUG: Validating group data:", attrs)
        try:
            # Ensure possible_topics is provided
            if not attrs.get('possible_topics'):
                print("DEBUG: possible_topics validation failed")
                raise serializers.ValidationError({
                    'possible_topics': 'Possible topics must be provided.'
                })
                
            # Ensure member_ids are provided when creating a new group
            if self.instance is None and 'member_ids' not in attrs:
                print("DEBUG: member_ids validation failed")
                raise serializers.ValidationError({
                    'member_ids': 'At least one member must be provided.'
                })
                
            member_ids = attrs.get('member_ids', [])
            print("DEBUG: member_ids:", member_ids)
            
            # For partial updates, if member_ids is not provided, get current members
            if self.partial and 'member_ids' not in attrs and self.instance:
                member_ids = list(self.instance.members.values_list('id', flat=True))
            
            # Check if the user creating the group (request user) already has a group
            # This applies only to students creating new groups
            if self.context.get('request') and not self.instance:  # Only for new groups
                request_user = self.context['request'].user
                if request_user.role == 'STUDENT':
                    # Check if user is already in any group (as member, leader, adviser, or panel)
                    existing_groups = Group.objects.filter(
                        models.Q(members=request_user) | 
                        models.Q(leader=request_user) | 
                        models.Q(adviser=request_user) | 
                        models.Q(panels=request_user)
                    )
                    if existing_groups.exists():
                        raise serializers.ValidationError({
                            'non_field_errors': 'You are already a member of a group. You can only be in one group at a time.'
                        })
            
            # Check if any student members are already in another group
            error_messages = []
            for user_id in member_ids:
                try:
                    # user_id is already a UUID string, no conversion needed
                    user = User.objects.get(pk=user_id)
                    print(f"DEBUG: Checking user {user.email} (ID: {user_id}) with role {user.role}")
                    if user.role == 'STUDENT':
                        existing_groups = Group.objects.filter(members=user)
                        # Exclude current group if updating
                        if self.instance:
                            existing_groups = existing_groups.exclude(id=self.instance.id)
                        if existing_groups.exists():
                            print(f"DEBUG: Student {user.email} is already in another group")
                            error_messages.append(f"Student {user.first_name} {user.last_name} ({user.email}) is already a member of another group")
                except User.DoesNotExist:
                    print(f"DEBUG: User with ID {user_id} does not exist")
                    raise serializers.ValidationError(f"User with ID {user_id} does not exist")
            
            # If we found any students already in groups, raise a validation error
            if error_messages:
                # Create a more user-friendly error message
                if len(error_messages) == 1:
                    message = error_messages[0]
                else:
                    message = "The following students are already members of other groups:\n" + "\n".join(error_messages)
                
                raise serializers.ValidationError({
                    'member_ids': message,
                    'non_field_errors': message  # Also add to non_field_errors for broader compatibility
                })
            
            print("DEBUG: Validation passed")
            return attrs
        except Exception as e:
            print("DEBUG: Exception in validate method:", str(e))
            print("DEBUG: Exception type:", type(e))
            raise
    
    def create(self, validated_data):
        print("DEBUG: Creating group with validated_data:", validated_data)
        try:
            # Extract special fields that need separate handling
            member_ids = validated_data.pop('member_ids', [])
            # adviser_id now represents a preferred adviser, not a direct assignment
            preferred_adviser_id = validated_data.pop('adviser_id', None)
            panel_ids = validated_data.pop('panel_ids', [])  # Fixed: was 'panels', should be 'panel_ids'
            leader_id = validated_data.pop('leader_id', None)
            
            print("DEBUG: Extracted member_ids:", member_ids)
            print("DEBUG: Extracted preferred_adviser_id:", preferred_adviser_id)
            print("DEBUG: Extracted panel_ids:", panel_ids)
            print("DEBUG: Extracted leader_id:", leader_id)
            
            # Store preferred adviser ID in the group (but don't assign as actual adviser)
            if preferred_adviser_id:
                validated_data['preferred_adviser_id'] = preferred_adviser_id
            
            # Create the group (without assigning adviser)
            group = Group.objects.create(**validated_data)
            print("DEBUG: Group created with ID:", group.id)
            
            # Set leader if provided
            if leader_id:
                try:
                    # leader_id is already a UUID string, no conversion needed
                    leader_user = User.objects.get(pk=leader_id)
                    group.leader = leader_user
                    print("DEBUG: Set leader to user ID:", leader_id)
                except User.DoesNotExist:
                    print(f"DEBUG: Leader user with ID {leader_id} does not exist")
                    raise serializers.ValidationError({"leader_id": f"Leader user with ID {leader_id} does not exist"})
            
            # Add members with their roles
            if member_ids:
                for i, user_id in enumerate(member_ids):
                    role = 'member'
                    # Set role to leader for the leader member
                    if group.leader and str(group.leader.id) == str(user_id):
                        role = 'leader'
                    
                    try:
                        # user_id is already a UUID string, no conversion needed
                        user = User.objects.get(pk=user_id)
                        GroupMember.objects.create(
                            group=group,
                            user=user,
                            role_in_group=role
                        )
                        print("DEBUG: Added member with user ID:", user_id, "with role:", role)
                    except User.DoesNotExist:
                        print(f"DEBUG: Member user with ID {user_id} does not exist")
                        raise serializers.ValidationError({"member_ids": f"Member user with ID {user_id} does not exist"})
                
                # Save the group if leader was set
                if leader_id:
                    group.save()
                    print("DEBUG: Saved group with leader")
            
            # Note: We no longer assign adviser directly during group creation
            # Only admins should assign advisers through the assign_adviser endpoint
            # The preferred_adviser_id is stored for admin reference but not used for assignment
            
            # Add panels if provided
            if panel_ids:
                # Convert panel IDs to User objects
                panel_users = []
                for panel_id in panel_ids:
                    try:
                        # panel_id is already a UUID string, no conversion needed
                        if panel_id:  # Check if panel_id is not empty
                            panel_user = User.objects.get(pk=panel_id)
                            panel_users.append(panel_user)
                        else:
                            print(f"DEBUG: Skipping empty panel ID: {panel_id}")
                    except User.DoesNotExist:
                        print(f"DEBUG: Panel user with ID {panel_id} does not exist")
                        raise serializers.ValidationError({"panel_ids": f"Panel user with ID {panel_id} does not exist"})
                
                group.panels.set(panel_users)
                print("DEBUG: Set panels and saved group")
            
            print("DEBUG: Group creation completed successfully")
            return group
        except serializers.ValidationError:
            # Re-raise validation errors as they are
            raise
        except Exception as e:
            print("DEBUG: Exception in create method:", str(e))
            print("DEBUG: Exception type:", type(e))
            import traceback
            print("DEBUG: Traceback:", traceback.format_exc())
            # Return a more user-friendly error message
            raise serializers.ValidationError({"non_field_errors": "An error occurred while creating the group. Please check the data and try again."})

    def update(self, instance, validated_data):
        print("DEBUG: Updating group with validated_data:", validated_data)
        try:
            # Handle the update normally
            for attr, value in validated_data.items():
                # Special handling for status changes by students
                if attr == 'status' and self.context['request'].user.role == 'STUDENT':
                    # Students can only change status from REJECTED back to PENDING
                    if instance.status == 'REJECTED' and value == 'PENDING':
                        setattr(instance, attr, value)
                        # Clear the rejection reason when resubmitting
                        instance.rejection_reason = ''
                    else:
                        # For all other status changes, ignore the request
                        continue
                elif attr == 'members':
                    instance.members.set(value)
                elif attr == 'panels':
                    instance.panels.set(value)
                else:
                    setattr(instance, attr, value)
            
            instance.save()
            print("DEBUG: Group update completed successfully")
            return instance
        except Exception as e:
            print("DEBUG: Exception in update method:", str(e))
            print("DEBUG: Exception type:", type(e))
            import traceback
            print("DEBUG: Traceback:", traceback.format_exc())
            raise
