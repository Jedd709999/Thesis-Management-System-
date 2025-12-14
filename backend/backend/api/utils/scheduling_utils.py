import json
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from api.models.schedule_models import OralDefenseSchedule
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.utils.notification_utils import create_notification

def check_panel_member_availability(panel_members, start_time, end_time, date):
    """
    Check if panel members are available at the given time.
    NOTE: Panel member availability tracking has been removed from the system.
    This function now assumes all panel members are available.
    
    Args:
        panel_members: List of User objects (panel members)
        start_time: datetime.time object
        end_time: datetime.time object
        date: datetime.date object
        
    Returns:
        dict: {
            'available_members': list of available User objects,
            'unavailable_members': list of unavailable User objects (empty in this implementation),
            'conflicts': list of conflict details (empty in this implementation)
        }
    """
    # All panel members are assumed to be available since we removed availability tracking
    return {
        'available_members': list(panel_members),
        'unavailable_members': [],
        'conflicts': []
    }

def find_free_time_slots(panel_members, date, duration_minutes=60, start_hour=9, end_hour=17):
    """
    Find free time slots for panel members on a specific date.
    
    Args:
        panel_members: List of User objects (panel members)
        date: datetime.date object
        duration_minutes: int, duration of the defense in minutes
        start_hour: int, start of working hours (24-hour format)
        end_hour: int, end of working hours (24-hour format)
        
    Returns:
        list: List of available time slots
    """
    available_slots = []
    
    # Create datetime objects for the start and end of the working day
    start_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time().replace(hour=start_hour)))
    end_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time().replace(hour=end_hour)))
    
    # Check each time slot
    current_time = start_datetime
    slot_duration = timedelta(minutes=duration_minutes)
    
    while current_time + slot_duration <= end_datetime:
        next_time = current_time + slot_duration
        
        # Check if all panel members are available for this time slot
        availability_check = check_panel_member_availability(
            panel_members, 
            current_time.time(), 
            next_time.time(), 
            date
        )
        
        if not availability_check['unavailable_members']:
            # All members are available
            available_slots.append({
                'start': current_time.isoformat(),
                'end': next_time.isoformat(),
                'start_time': current_time.time().strftime('%H:%M'),
                'end_time': next_time.time().strftime('%H:%M')
            })
        
        current_time = next_time
    
    return available_slots

def detect_scheduling_conflicts(schedule):
    """
    Detect conflicts for a given schedule.
    
    Args:
        schedule: OralDefenseSchedule object
        
    Returns:
        dict: {
            'has_conflicts': bool,
            'conflicts': list of conflicting schedules
        }
    """
    conflicts = []
    
    # Check for overlapping schedules with the same panel members
    overlapping_schedules = OralDefenseSchedule.objects.filter(
        panel_members__in=schedule.panel_members.all(),
        start__lt=schedule.end,
        end__gt=schedule.start
    ).exclude(id=schedule.id).distinct()
    
    for conflicting_schedule in overlapping_schedules:
        conflicts.append({
            'schedule_id': str(conflicting_schedule.id),
            'thesis': str(conflicting_schedule.thesis),
            'start': conflicting_schedule.start.isoformat(),
            'end': conflicting_schedule.end.isoformat(),
            'conflicting_panel_members': list(
                conflicting_schedule.panel_members.filter(
                    id__in=schedule.panel_members.values_list('id', flat=True)
                ).values_list('email', flat=True)
            )
        })
    
    return {
        'has_conflicts': len(conflicts) > 0,
        'conflicts': conflicts
    }

def generate_schedule_notifications(schedule):
    """
    Generate notification events for a scheduled defense.
    
    Args:
        schedule: OralDefenseSchedule object
    """
    # Notify thesis author(s) - students in the group
    if schedule.thesis.group:
        students = schedule.thesis.group.members.filter(role='STUDENT')
        for student in students:
            create_notification(
                recipient=student,
                notification_type='defense_scheduled',
                title='Defense Scheduled',
                message=f'Your thesis defense has been scheduled for {schedule.start.strftime("%B %d, %Y at %I:%M %p")}',
                related_object=schedule,
                priority='high'
            )
    
    # Notify adviser
    if schedule.thesis.adviser:
        create_notification(
            recipient=schedule.thesis.adviser,
            notification_type='defense_scheduled',
            title='Defense Scheduled',
            message=f'Defense scheduled for thesis: {schedule.thesis.title}',
            related_object=schedule,
            priority='normal'
        )
    
    # Notify panel members
    for panel_member in schedule.panel_members.all():
        create_notification(
            recipient=panel_member,
            notification_type='defense_scheduled',
            title='Defense Scheduled',
            message=f'You have been assigned to a defense panel for: {schedule.thesis.title}',
            related_object=schedule,
            priority='normal'
        )

def convert_to_timezone_aware(dt, target_timezone='UTC'):
    """
    Convert a datetime to timezone-aware format.
    
    Args:
        dt: datetime object (naive or aware)
        target_timezone: str, target timezone name
        
    Returns:
        timezone-aware datetime object
    """
    from django.utils.timezone import is_aware, make_aware
    import pytz
    
    if not is_aware(dt):
        dt = make_aware(dt)
    
    if target_timezone != 'UTC':
        target_tz = pytz.timezone(target_timezone)
        dt = dt.astimezone(target_tz)
    
    return dt
