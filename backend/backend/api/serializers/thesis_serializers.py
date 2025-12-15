from rest_framework import serializers
from api.models.thesis_models import Thesis
from api.models.group_models import Group

class ThesisSerializer(serializers.ModelSerializer):
    group = serializers.SerializerMethodField(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), write_only=True, source='group')
    proposer = serializers.PrimaryKeyRelatedField(read_only=True)
    adviser = serializers.SerializerMethodField(read_only=True)
    progress = serializers.SerializerMethodField(read_only=True)
    drive_folder_url = serializers.SerializerMethodField(read_only=True)
    keywords = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = Thesis
        fields = ('id','title','abstract','keywords','group','group_id','proposer','adviser','status','adviser_feedback','progress','drive_folder_id','drive_folder_url','created_at','updated_at')
        read_only_fields = ('status','proposer','drive_folder_id','drive_folder_url','created_at','updated_at')
        extra_kwargs = {
            'keywords': {'required': False}
        }
    
    def get_group(self, obj):
        if obj.group:
            group_data = {
                'id': obj.group.id,
                'name': obj.group.name
            }
            
            # Include adviser information if available
            if hasattr(obj.group, 'adviser') and obj.group.adviser:
                adviser = obj.group.adviser
                group_data['adviser'] = {
                    'id': adviser.id,
                    'first_name': getattr(adviser, 'first_name', ''),
                    'last_name': getattr(adviser, 'last_name', ''),
                    'email': getattr(adviser, 'email', '')
                }
            
            # Include panel members information if available
            if hasattr(obj.group, 'panels'):
                panels = []
                for panel in obj.group.panels.all():
                    panels.append({
                        'id': panel.id,
                        'first_name': getattr(panel, 'first_name', ''),
                        'last_name': getattr(panel, 'last_name', ''),
                        'email': getattr(panel, 'email', '')
                    })
                group_data['panels'] = panels
            
            # Include group members information if available
            if hasattr(obj.group, 'members'):
                members = []
                for member in obj.group.members.all():
                    members.append({
                        'id': member.id,
                        'first_name': getattr(member, 'first_name', ''),
                        'last_name': getattr(member, 'last_name', ''),
                        'email': getattr(member, 'email', '')
                    })
                group_data['members'] = members
            
            # Include group leader information if available
            if hasattr(obj.group, 'leader') and obj.group.leader:
                leader = obj.group.leader
                group_data['leader'] = {
                    'id': leader.id,
                    'first_name': getattr(leader, 'first_name', ''),
                    'last_name': getattr(leader, 'last_name', ''),
                    'email': getattr(leader, 'email', '')
                }
            
            return group_data
        return None
    
    def get_adviser(self, obj):
        try:
            # First check if thesis has its own adviser field set
            if obj.adviser:
                adviser = obj.adviser
                if hasattr(adviser, 'first_name') and hasattr(adviser, 'last_name'):
                    name = f"{adviser.first_name} {adviser.last_name}".strip()
                    # Fall back to email if name is empty
                    return name if name else adviser.email
                else:
                    return str(adviser)
            
            # Fallback to group adviser if thesis adviser is not set
            if obj.group and hasattr(obj.group, 'adviser') and obj.group.adviser:
                adviser = obj.group.adviser
                if hasattr(adviser, 'first_name') and hasattr(adviser, 'last_name'):
                    name = f"{adviser.first_name} {adviser.last_name}".strip()
                    # Fall back to email if name is empty
                    return name if name else adviser.email
                else:
                    return str(adviser)
            return None
        except Exception as e:
            print(f"Error getting adviser: {e}")
            return None
    
    def get_progress(self, obj):
        """Calculate progress based on thesis status"""
        status_progress = {
            'TOPIC_SUBMITTED': 5,
            'TOPIC_APPROVED': 10,
            'TOPIC_REJECTED': 0,
            'CONCEPT_SUBMITTED': 15,
            'CONCEPT_SCHEDULED': 20,
            'CONCEPT_DEFENDED': 25,
            'CONCEPT_APPROVED': 30,
            'PROPOSAL_SUBMITTED': 35,
            'PROPOSAL_SCHEDULED': 40,
            'PROPOSAL_DEFENDED': 45,
            'PROPOSAL_APPROVED': 50,
            'RESEARCH_IN_PROGRESS': 75,
            'FINAL_SUBMITTED': 80,
            'FINAL_SCHEDULED': 85,
            'FINAL_DEFENDED': 90,
            'FINAL_APPROVED': 100,
            'REVISIONS_REQUIRED': 45,
            'REJECTED': 0,
            'ARCHIVED': 100
        }
        return status_progress.get(obj.status, 0)
    
    def get_drive_folder_url(self, obj):
        """Get the Google Drive folder URL."""
        return obj.get_drive_folder_url()
    
    def validate(self, attrs):
        print(f"Attrs in validate: {attrs}")
        group = attrs.get('group_id')
        
        # Check if group already has a thesis
        if group and hasattr(group, 'thesis'):
            raise serializers.ValidationError(f"Group {group.name} already has a thesis")
        
        # Check if the group is approved (only for creation)
        if self.context['request'].method == 'POST':
            if group and group.status != 'APPROVED':
                raise serializers.ValidationError("The group must be approved before creating a thesis")
        
        return attrs
    
    def create(self, validated_data):
        # Debug logging
        print(f"Validated data received: {validated_data}")
        
        # Extract group_id from validated_data
        group = validated_data.pop('group', None)
        
        # Extract keywords from validated_data
        keywords = validated_data.pop('keywords', None)
        print(f"Extracted keywords: {keywords}")
        
        # Set adviser from group if available
        adviser = None
        if group and hasattr(group, 'adviser'):
            adviser = group.adviser
        
        # Create thesis with group and adviser
        thesis = Thesis.objects.create(
            title=validated_data['title'],
            abstract=validated_data.get('abstract', ''),
            group=group,
            adviser=adviser,
            proposer=self.context['request'].user
        )
        
        # Set keywords if provided
        if keywords is not None:
            # Convert array to comma-separated string
            if isinstance(keywords, list):
                thesis.set_keywords_from_list(keywords)
                print(f"Setting keywords from list: {keywords}")
            else:
                thesis.keywords = keywords
                print(f"Setting keywords directly: {keywords}")
            thesis.save()
            print(f"Saved thesis keywords: {thesis.keywords}")
        
        return thesis
    
    def update(self, instance, validated_data):
        # Handle keywords update
        keywords = validated_data.pop('keywords', None)
        if keywords is not None:
            if isinstance(keywords, list):
                instance.set_keywords_from_list(keywords)
                print(f"Updating keywords from list: {keywords}")
            else:
                instance.keywords = keywords
                print(f"Updating keywords directly: {keywords}")
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        print(f"Updated thesis keywords: {instance.keywords}")
        return instance
