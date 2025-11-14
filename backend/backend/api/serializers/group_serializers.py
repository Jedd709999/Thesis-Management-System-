from rest_framework import serializers
from api.models.group_models import Group
from api.models.user_models import User

class GroupSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    adviser = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(role='ADVISER'), allow_null=True, required=False)
    panels = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.filter(role='PANEL'), required=False)
    class Meta:
        model = Group
        fields = ('id','name','members','adviser','panels','created_at')
    def create(self, validated):
        members = validated.pop('members', [])
        panels = validated.pop('panels', [])
        group = Group.objects.create(**validated)
        if members:
            group.members.set(members)
        if panels:
            group.panels.set(panels)
        group.save()
        return group
