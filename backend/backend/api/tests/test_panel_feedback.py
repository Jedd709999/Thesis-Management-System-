from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models.thesis_models import Thesis
from api.models.group_models import Group
from api.models.schedule_models import OralDefenseSchedule
from api.models.panel_action_models import PanelAction

class PanelFeedbackTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        User = get_user_model()
        
        # Create test users
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            role='STUDENT'
        )
        
        self.panel_member = User.objects.create_user(
            email='panel@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Panel',
            role='PANEL'
        )
        
        self.adviser = User.objects.create_user(
            email='adviser@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Adviser',
            role='ADVISER'
        )
        
        # Create a group
        self.group = Group.objects.create(
            name='Test Group'
        )
        self.group.members.add(self.student)
        self.group.panels.add(self.panel_member)
        self.group.adviser = self.adviser
        self.group.save()
        
        # Create a thesis
        self.thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=self.group,
            proposer=self.student,
            status='TOPIC_APPROVED'
        )
        
        # Create a schedule
        self.schedule = OralDefenseSchedule.objects.create(
            thesis=self.thesis,
            title='Test Defense',
            start_at='2023-01-01T10:00:00Z',
            end_at='2023-01-01T11:00:00Z',
            location='Test Location',
            status='scheduled'
        )
        self.schedule.panel_members.add(self.panel_member)
        
        # Create a panel action
        self.panel_action = PanelAction.objects.create(
            schedule=self.schedule,
            panel_member=self.panel_member,
            action='approved',
            comments='Good work!'
        )
    
    def test_student_can_access_panel_actions(self):
        """Test that students can access panel actions for their theses"""
        # Test that student can access the panel action
        student_actions = PanelAction.objects.filter(
            schedule__thesis__group__members=self.student
        )
        
        self.assertEqual(student_actions.count(), 1)
        action = student_actions.first()
        self.assertEqual(action.action, 'approved')
        self.assertEqual(action.comments, 'Good work!')
        self.assertEqual(action.panel_member, self.panel_member)
        self.assertEqual(action.schedule.thesis, self.thesis)
    
    def test_panel_member_can_access_own_actions(self):
        """Test that panel members can access their own actions"""
        panel_actions = PanelAction.objects.filter(panel_member=self.panel_member)
        self.assertEqual(panel_actions.count(), 1)
    
    def test_adviser_can_access_actions_for_advised_theses(self):
        """Test that advisers can access actions for theses they advise"""
        adviser_actions = PanelAction.objects.filter(
            schedule__thesis__adviser=self.adviser
        )
        self.assertEqual(adviser_actions.count(), 1)
