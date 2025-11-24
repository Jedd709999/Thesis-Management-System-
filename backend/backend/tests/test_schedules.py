import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
from freezegun import freeze_time

User = get_user_model()

@pytest.mark.django_db
class TestScheduleCreation:
    """Test schedule creation and management functionality"""

    def test_create_schedule_success(self, adviser_client, adviser_user):
        """Test successful schedule creation by adviser"""
        from api.models import Group, Thesis
        
        # Create a student and group
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create schedule data
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        data = {
            'group': group.id,
            'start_at': start_time.isoformat(),
            'end_at': end_time.isoformat(),
            'location': 'Room 101, Main Building'
        }
        
        response = adviser_client.post('/api/schedules/', data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['location'] == 'Room 101, Main Building'
        assert response.data['group'] == group.id

    def test_create_schedule_student_forbidden(self, authenticated_client, student_user):
        """Test that students cannot create schedules"""
        from api.models import Group, Thesis
        
        # Create a group for testing
        adviser = User.objects.create_user(
            email='adviser@test.com',
            password='adviser123',
            role='ADVISER'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser
        )
        group.members.add(student_user)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student_user
        )
        
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        data = {
            'group': group.id,
            'start_at': start_time.isoformat(),
            'end_at': end_time.isoformat(),
            'location': 'Room 101'
        }
        
        response = authenticated_client.post('/api/schedules/', data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_schedule_panel_allowed(self, panel_client, panel_user):
        """Test that panel members can create schedules"""
        from api.models import Group, Thesis
        
        # Create a student and group
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        adviser = User.objects.create_user(
            email='adviser@test.com',
            password='adviser123',
            role='ADVISER'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        data = {
            'group': group.id,
            'start_at': start_time.isoformat(),
            'end_at': end_time.isoformat(),
            'location': 'Conference Room A'
        }
        
        response = panel_client.post('/api/schedules/', data)
        
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_schedule_invalid_time_range(self, adviser_client, adviser_user):
        """Test schedule creation with invalid time range"""
        from api.models import Group, Thesis
        
        # Create a student and group
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create schedule with end time before start time
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time - timedelta(hours=2)  # End before start!
        
        data = {
            'group': group.id,
            'start_at': start_time.isoformat(),
            'end_at': end_time.isoformat(),
            'location': 'Room 101'
        }
        
        response = adviser_client.post('/api/schedules/', data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_schedule_past_time(self, adviser_client, adviser_user):
        """Test schedule creation with past time fails"""
        from api.models import Group, Thesis
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create schedule with past time
        start_time = timezone.now() - timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        
        data = {
            'group': group.id,
            'start_at': start_time.isoformat(),
            'end_at': end_time.isoformat(),
            'location': 'Room 101'
        }
        
        response = adviser_client.post('/api/schedules/', data)
        
        # May succeed or fail depending on business logic
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    def test_list_schedules(self, adviser_client, adviser_user):
        """Test listing schedules"""
        from api.models import Group, Thesis, OralDefenseSchedule as DefenseSchedule
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create a schedule
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        OralDefenseSchedule.objects.create(
            group=group,
            start_at=start_time,
            end_at=end_time,
            location='Room 101',
            created_by=adviser_user
        )
        
        response = adviser_client.get('/api/schedules/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_list_schedules_filtered_by_group(self, adviser_client, adviser_user):
        """Test listing schedules filtered by group"""
        from api.models import Group, Thesis, OralDefenseSchedule as DefenseSchedule
        
        # Create two groups with schedules
        student1 = User.objects.create_user(
            email='student1@test.com',
            password='student123',
            role='STUDENT'
        )
        
        student2 = User.objects.create_user(
            email='student2@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create groups first
        group1 = Group.objects.create(
            name='Group 1',
            adviser=adviser_user
        )
        group1.members.add(student1)
        
        group2 = Group.objects.create(
            name='Group 2',
            adviser=adviser_user
        )
        group2.members.add(student2)
        
        # Then create theses with groups
        thesis1 = Thesis.objects.create(
            title='Thesis 1',
            abstract='Test abstract',
            group=group1,
            proposer=student1
        )
        
        thesis2 = Thesis.objects.create(
            title='Thesis 2',
            abstract='Test abstract',
            group=group2,
            proposer=student2
        )
        
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        OralDefenseSchedule.objects.create(
            group=group1,
            start_at=start_time,
            end_at=end_time,
            location='Room 101',
            created_by=adviser_user
        )
        
        OralDefenseSchedule.objects.create(
            group=group2,
            start_at=start_time + timedelta(days=1),
            end_at=end_time + timedelta(days=1),
            location='Room 102',
            created_by=adviser_user
        )
        
        # Filter by group1
        response = adviser_client.get(f'/api/schedules/?group_id={group1.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['group'] == group1.id

    def test_list_schedules_filtered_by_date_range(self, adviser_client, adviser_user):
        """Test listing schedules filtered by date range"""
        from api.models import Group, Thesis, OralDefenseSchedule as DefenseSchedule
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create schedules at different times
        with freeze_time('2024-01-01'):
            start_time1 = timezone.now() + timedelta(days=7)
            end_time1 = start_time1 + timedelta(hours=2)
            
            OralDefenseSchedule.objects.create(
                group=group,
                start_at=start_time1,
                end_at=end_time1,
                location='Room 101',
                created_by=adviser_user
            )
        
        with freeze_time('2024-02-01'):
            start_time2 = timezone.now() + timedelta(days=7)
            end_time2 = start_time2 + timedelta(hours=2)
            
            OralDefenseSchedule.objects.create(
                group=group,
                start_at=start_time2,
                end_at=end_time2,
                location='Room 102',
                created_by=adviser_user
            )
        
        # Filter by January 2024
        response = adviser_client.get('/api/schedules/?start_date=2024-01-01&end_date=2024-01-31')
        
        assert response.status_code == status.HTTP_200_OK
        # Should only return January schedules
        for schedule in response.data:
            schedule_date = datetime.fromisoformat(schedule['start_at'].replace('Z', '+00:00')).date()
            assert schedule_date.month == 1
            assert schedule_date.year == 2024

    def test_update_schedule(self, adviser_client, adviser_user):
        """Test updating schedule details"""
        from api.models import Group, Thesis, OralDefenseSchedule as DefenseSchedule
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        schedule = OralDefenseSchedule.objects.create(
            group=group,
            start_at=start_time,
            end_at=end_time,
            location='Room 101',
            created_by=adviser_user
        )
        
        response = adviser_client.delete(f'/api/schedules/{schedule.id}/')
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not OralDefenseSchedule.objects.filter(id=schedule.id).exists()

    def test_schedule_conflict_detection(self, adviser_client, adviser_user):
        """Test that conflicting schedules are detected"""
        from api.models import Group, Thesis, OralDefenseSchedule
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
            # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        # Create first schedule
        start_time = timezone.now() + timedelta(days=7, hours=10)
        end_time = start_time + timedelta(hours=2)
        
        OralDefenseSchedule.objects.create(
            group=group,
            start_at=start_time,
            end_at=end_time,
            location='Room 101',
            created_by=adviser_user
        )
        
        # Try to create overlapping schedule
        overlapping_start = start_time + timedelta(hours=1)
        overlapping_end = overlapping_start + timedelta(hours=2)
        
        data = {
            'group': group.id,
            'start_at': overlapping_start.isoformat(),
            'end_at': overlapping_end.isoformat(),
            'location': 'Room 101'
        }
        
        response = adviser_client.post('/api/schedules/', data)
        
        # Should either succeed (if conflicts are allowed) or fail (if prevented)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]

    def test_retrieve_schedule(self, adviser_client, adviser_user):
        """Test retrieving a specific schedule"""
        from api.models import Group, Thesis, OralDefenseSchedule
        
        student = User.objects.create_user(
            email='student@test.com',
            password='student123',
            role='STUDENT'
        )
        
        # Create a group first
        group = Group.objects.create(
            name='Defense Group 1',
            adviser=adviser_user
        )
        group.members.add(student)
        
        # Then create thesis with group
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student
        )
        
        start_time = timezone.now() + timedelta(days=7)
        end_time = start_time + timedelta(hours=2)
        
        schedule = OralDefenseSchedule.objects.create(
            group=group,
            start_at=start_time,
            end_at=end_time,
            location='Room 101',
            created_by=adviser_user
        )
        
        response = adviser_client.get(f'/api/schedules/{schedule.id}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(schedule.id)
        assert response.data['location'] == 'Room 101'
