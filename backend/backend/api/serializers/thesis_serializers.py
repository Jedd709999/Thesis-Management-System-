from rest_framework import serializers
from api.models.thesis_models import Thesis
from api.models.group_models import Group

class ThesisSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all())
    proposer = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Thesis
        fields = ('id','title','abstract','group','proposer','status','adviser_feedback','created_at','updated_at')
        read_only_fields = ('status','proposer','created_at','updated_at')
    def create(self, validated):
        user = self.context['request'].user
        thesis = Thesis.objects.create(proposer=user, **validated)
        return thesis
