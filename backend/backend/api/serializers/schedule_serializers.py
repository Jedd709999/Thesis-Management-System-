import uuid
from rest_framework import serializers
from django.utils import timezone
from .user_serializers import UserSerializer
from api.models.schedule_models import OralDefenseSchedule, ApprovalSheet, Evaluation
from api.models.panel_action_models import PanelAction
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.models.document_models import Document


class OralDefenseScheduleSerializer(serializers.ModelSerializer):
    thesis_title = serializers.CharField(source='thesis.title', read_only=True)
    thesis_group_name = serializers.CharField(source='thesis.group.name', read_only=True)
    panel_member_emails = serializers.SerializerMethodField()
    organizer_email = serializers.CharField(source='organizer.email', read_only=True)
    conflicts = serializers.SerializerMethodField()
    
    class Meta:
        model = OralDefenseSchedule
        fields = (
            'id', 'thesis', 'thesis_title', 'thesis_group_name', 'title', 'start', 'end',
            'location', 'meeting_url', 'status', 'notes', 'organizer', 'organizer_email',
            'panel_members', 'panel_member_emails', 'created_at', 'updated_at', 'conflicts'
        )
        read_only_fields = ('created_at', 'updated_at')
    
    def get_panel_member_emails(self, obj):
        """Get emails of all panel members"""
        return [member.email for member in obj.panel_members.all()]
    
    def get_conflicts(self, obj):
        """Check for scheduling conflicts with panel members"""
        conflicts = obj.check_panel_availability(obj.start, obj.end)
        conflict_data = []
        for member in conflicts:
            conflict_data.append({
                'id': str(member.id),
                'email': member.email,
                'full_name': member.get_full_name()
            })
        return {
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflict_data
        }


class ApprovalSheetSerializer(serializers.ModelSerializer):
    schedule_title = serializers.CharField(source='schedule.title', read_only=True)
    panel_member_email = serializers.CharField(source='panel_member.email', read_only=True)
    thesis_title = serializers.CharField(source='schedule.thesis.title', read_only=True)
    
    class Meta:
        model = ApprovalSheet
        fields = (
            'id', 'schedule', 'schedule_title', 'panel_member', 'panel_member_email',
            'decision', 'comments', 'submitted_at', 'document', 'thesis_title',
            'created_at', 'updated_at'
        )
        read_only_fields = ('submitted_at', 'created_at', 'updated_at')


class EvaluationSerializer(serializers.ModelSerializer):
    schedule_title = serializers.CharField(source='schedule.title', read_only=True)
    evaluator_email = serializers.CharField(source='evaluator.email', read_only=True)
    thesis_title = serializers.CharField(source='schedule.thesis.title', read_only=True)
    
    class Meta:
        model = Evaluation
        fields = (
            'id', 'schedule', 'schedule_title', 'evaluator', 'evaluator_email',
            'rubric_scores', 'total_score', 'recommendation', 'comments', 
            'document', 'thesis_title', 'submitted_at', 'created_at', 'updated_at'
        )
        read_only_fields = ('submitted_at', 'created_at', 'updated_at')


class PanelActionSerializer(serializers.ModelSerializer):
    schedule_title = serializers.CharField(source='schedule.title', read_only=True)
    panel_member_email = serializers.CharField(source='panel_member.email', read_only=True)
    thesis_title = serializers.CharField(source='schedule.thesis.title', read_only=True)
    
    class Meta:
        model = PanelAction
        fields = (
            'id', 'schedule', 'schedule_title', 'panel_member', 'panel_member_email',
            'action', 'comments', 'thesis_title', 'created_at'
        )
        read_only_fields = ('created_at',)


class ScheduleAvailabilitySerializer(serializers.Serializer):
    """
    Serializer for checking schedule availability
    """
    thesis = serializers.PrimaryKeyRelatedField(queryset=Thesis.objects.all())
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    panel_members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='PANEL'), 
        many=True, 
        required=False
    )
    
    def check_availability(self):
        """
        Check for scheduling conflicts
        """
        thesis = self.validated_data.get('thesis')
        start = self.validated_data.get('start')
        end = self.validated_data.get('end')
        panel_members = self.validated_data.get('panel_members', [])
        
        # Check for conflicts with existing schedules
        conflicts = []
        
        # Check thesis adviser conflicts
        adviser = thesis.adviser
        if adviser:
            adviser_conflicts = OralDefenseSchedule.objects.filter(
                models.Q(start__lt=end) & models.Q(end__gt=start)
            ).filter(
                models.Q(thesis__adviser=adviser) | 
                models.Q(panel_members=adviser)
            ).distinct()
            
            for conflict in adviser_conflicts:
                conflicts.append({
                    'user_id': str(adviser.id),
                    'user_email': adviser.email,
                    'user_role': 'adviser',
                    'conflict_schedule_id': str(conflict.id),
                    'conflict_schedule_title': conflict.title
                })
        
        # Check panel member conflicts
        for panel_member in panel_members:
            member_conflicts = OralDefenseSchedule.objects.filter(
                models.Q(start__lt=end) & models.Q(end__gt=start)
            ).filter(
                models.Q(thesis__adviser=panel_member) | 
                models.Q(panel_members=panel_member)
            ).distinct()
            
            for conflict in member_conflicts:
                conflicts.append({
                    'user_id': str(panel_member.id),
                    'user_email': panel_member.email,
                    'user_role': 'panel_member',
                    'conflict_schedule_id': str(conflict.id),
                    'conflict_schedule_title': conflict.title
                })
        
        return {
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        }
