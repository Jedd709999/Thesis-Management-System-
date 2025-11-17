from django.db import models, transaction
from django.core.exceptions import ValidationError
from .group_models import Group

class DefenseSchedule(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='schedules')
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    location = models.CharField(max_length=256, blank=True)
    created_by = models.ForeignKey('api.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_at']
        constraints = [
            models.CheckConstraint(
                check=models.Q(start_at__lt=models.F('end_at')),
                name='start_before_end'
            )
        ]

    def clean(self):
        if self.start_at >= self.end_at:
            raise ValidationError('Start time must be before end time')
        
        if self.pk:
            existing_conflicts = self.check_conflicts(self.group, self.start_at, self.end_at, exclude_id=self.pk)
        else:
            existing_conflicts = self.check_conflicts(self.group, self.start_at, self.end_at)
        
        if existing_conflicts:
            conflict_details = []
            for conflict in existing_conflicts:
                conflict_details.append(
                    f"Group {conflict.group.name} has schedule from {conflict.start_at} to {conflict.end_at}"
                )
            raise ValidationError(f'Scheduling conflict detected: {"; ".join(conflict_details)}')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @staticmethod
    def check_conflicts(group, start_at, end_at, exclude_id=None):
        from django.db.models import Q
        adviser = group.adviser
        panels = group.panels.all()
        
        overlapping = DefenseSchedule.objects.filter(
            Q(start_at__lt=end_at) & Q(end_at__gt=start_at)
        )
        
        if exclude_id:
            overlapping = overlapping.exclude(id=exclude_id)
        
        conflicts = []
        for schedule in overlapping:
            if (schedule.group.adviser == adviser or 
                schedule.group.panels.filter(id__in=panels.values_list('id', flat=True)).exists()):
                conflicts.append(schedule)
        return conflicts

    @staticmethod
    def validate_schedule_availability(group, start_at, end_at, exclude_id=None):
        conflicts = DefenseSchedule.check_conflicts(group, start_at, end_at, exclude_id)
        if conflicts:
            return {
                'has_conflicts': True,
                'conflicts': [
                    {
                        'id': conflict.id,
                        'group': conflict.group.name,
                        'start_at': conflict.start_at,
                        'end_at': conflict.end_at,
                        'location': conflict.location
                    }
                    for conflict in conflicts
                ]
            }
        return {'has_conflicts': False, 'conflicts': []}
