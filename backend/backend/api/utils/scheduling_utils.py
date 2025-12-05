import json
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from api.models.schedule_models import OralDefenseSchedule, PanelMemberAvailability
from api.models.auto_schedule_models import AutoScheduleRun
from api.models.user_models import User
from api.models.thesis_models import Thesis
from api.utils.notification_utils import create_notification

def check_panel_member_availability(panel_members, start_time, end_time, date):
    """
    Check if panel members are available at the given time.
    
    Args:
        panel_members: List of User objects (panel members)
        start_time: datetime.time object
        end_time: datetime.time object
        date: datetime.date object
        
    Returns:
        dict: {
            'available_members': list of available User objects,
            'unavailable_members': list of unavailable User objects,
            'conflicts': list of conflict details
        }
    """
    available_members = []
    unavailable_members = []
    conflicts = []
    
    day_of_week = date.weekday()  # 0=Monday, 6=Sunday
    
    for member in panel_members:
        # Check if member has any availability records
        availabilities = PanelMemberAvailability.objects.filter(user=member)
        
        if not availabilities.exists():
            # No availability set, assume available but log as warning
            available_members.append(member)
            continue
            
        # Check member's availability for this day and time
        available = availabilities.filter(
            day_of_week=day_of_week,
            start_time__lte=start_time,
            end_time__gte=end_time
        ).exists()
        
        if available:
            available_members.append(member)
        else:
            unavailable_members.append(member)
            conflicts.append({
                'member': str(member),
                'member_id': str(member.id),
                'reason': f'Not available on {date.strftime("%A")} at {start_time}-{end_time}'
            })
    
    return {
        'available_members': available_members,
        'unavailable_members': unavailable_members,
        'conflicts': conflicts
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

def auto_schedule_oral_defense(thesis, panel_members, preferred_date=None, duration_minutes=60):
    """
    Automatically schedule an oral defense for a thesis.
    
    Args:
        thesis: Thesis object
        panel_members: List of User objects (panel members)
        preferred_date: datetime.date object (optional)
        duration_minutes: int, duration of the defense in minutes
        
    Returns:
        dict: {
            'success': bool,
            'schedule': OralDefenseSchedule object or None,
            'run': AutoScheduleRun object,
            'message': str,
            'conflicts': list
        }
    """
    # Create auto schedule run record
    auto_run = AutoScheduleRun.objects.create(
        thesis=thesis,
        status='in_progress',
        details={
            'thesis_id': str(thesis.id),
            'panel_member_count': len(panel_members),
            'preferred_date': preferred_date.isoformat() if preferred_date else None,
            'duration_minutes': duration_minutes
        }
    )
    
    try:
        # If preferred date is provided, try to schedule on that date first
        dates_to_check = []
        if preferred_date:
            dates_to_check.append(preferred_date)
        
        # Add next 7 days if no preferred date or if preferred date fails
        base_date = preferred_date or timezone.now().date()
        for i in range(7):
            check_date = base_date + timedelta(days=i)
            if check_date not in dates_to_check:
                dates_to_check.append(check_date)
        
        # Try to find a suitable time slot
        for check_date in dates_to_check:
            free_slots = find_free_time_slots(panel_members, check_date, duration_minutes)
            
            if free_slots:
                # Found a free slot, use the first one
                slot = free_slots[0]
                start_datetime = timezone.make_aware(datetime.fromisoformat(slot['start']))
                end_datetime = timezone.make_aware(datetime.fromisoformat(slot['end']))
                
                # Create the oral defense schedule
                with transaction.atomic():
                    schedule = OralDefenseSchedule.objects.create(
                        thesis=thesis,
                        title=f"Defense for {thesis.title}",
                        start=start_datetime,
                        end=end_datetime,
                        location="TBD",
                        status='scheduled',
                        organizer=None  # Could be set to admin or adviser
                    )
                    
                    # Add panel members to the schedule
                    schedule.panel_members.set(panel_members)
                    schedule.save()
                    
                    # Generate notification events
                    generate_schedule_notifications(schedule)
                    
                    # Update auto schedule run
                    auto_run.status = 'completed'
                    auto_run.details['scheduled_date'] = check_date.isoformat()
                    auto_run.details['scheduled_time'] = f"{slot['start_time']}-{slot['end_time']}"
                    auto_run.details['schedule_id'] = str(schedule.id)
                    auto_run.save()
                    
                    return {
                        'success': True,
                        'schedule': schedule,
                        'run': auto_run,
                        'message': f'Successfully scheduled defense on {check_date} at {slot["start_time"]}',
                        'conflicts': []
                    }
        
        # If we get here, no suitable time slots were found
        auto_run.status = 'failed'
        auto_run.details['failure_reason'] = 'No available time slots found for panel members'
        auto_run.save()
        
        return {
            'success': False,
            'schedule': None,
            'run': auto_run,
            'message': 'Failed to schedule defense: No available time slots found',
            'conflicts': []
        }
        
    except Exception as e:
        # Handle any errors during scheduling
        auto_run.status = 'failed'
        auto_run.details['failure_reason'] = str(e)
        auto_run.save()
        
        return {
            'success': False,
            'schedule': None,
            'run': auto_run,
            'message': f'Failed to schedule defense: {str(e)}',
            'conflicts': []
        }

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