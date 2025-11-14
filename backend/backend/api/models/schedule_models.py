from django.db import models
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

    def overlaps(self, other_start, other_end):
        return not (self.end_at <= other_start or self.start_at >= other_end)

    @staticmethod
    def check_conflicts(group, start_at, end_at):
        from django.db.models import Q
        adviser = group.adviser
        panels = group.panels.all()
        overlapping = DefenseSchedule.objects.filter(Q(start_at__lt=end_at) & Q(end_at__gt=start_at))
        conflicts = []
        for s in overlapping:
            if s.group.adviser == adviser or s.group.panels.filter(id__in=panels.values_list('id', flat=True)).exists():
                conflicts.append(s)
        return conflicts
