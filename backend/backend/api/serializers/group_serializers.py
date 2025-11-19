from rest_framework import serializers
from api.models.group_models import Group
from api.models.user_models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    adviser = UserSerializer(read_only=True, allow_null=True)
    panels = UserSerializer(many=True, read_only=True)
    
    # Write-only fields for updates
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.all(), 
        write_only=True, 
        required=False,
        source='members'
    )
    adviser_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='ADVISER'), 
        write_only=True, 
        allow_null=True, 
        required=False,
        source='adviser'
    )
    panel_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=User.objects.filter(role='PANEL'), 
        write_only=True, 
        required=False,
        source='panels'
    )
    class Meta:
        model = Group
        fields = ('id','name','status','possible_topics','keywords','members','adviser','panels','member_ids','adviser_id','panel_ids','created_at')
    
    def validate(self, attrs):
        members = attrs.get('members', [])
        
        # For partial updates, if members is not provided, get current members
        if self.partial and 'members' not in attrs and self.instance:
            members = list(self.instance.members.all())
        
        # Check if any student members are already in another group
        for member in members:
            if member.role == 'STUDENT':
                existing_groups = Group.objects.filter(members=member)
                # Exclude current group if updating
                if self.instance:
                    existing_groups = existing_groups.exclude(id=self.instance.id)
                if existing_groups.exists():
                    raise serializers.ValidationError(f"Student {member.email} is already a member of another group")
        
        return attrs
    
    def create(self, validated):
        members = validated.pop('members', [])
        panels = validated.pop('panels', [])
        
        # Ensure status is set, use default if not provided
        if 'status' not in validated:
            validated['status'] = 'PENDING'
        
        group = Group.objects.create(**validated)
        if members:
            group.members.set(members)
        if panels:
            group.panels.set(panels)
        group.save()
        return group
    
    def update(self, instance, validated):
        # Handle the update normally
        for attr, value in validated.items():
            if attr == 'members':
                instance.members.set(value)
            elif attr == 'panels':
                instance.panels.set(value)
            else:
                setattr(instance, attr, value)
        
        instance.save()
        return instance
