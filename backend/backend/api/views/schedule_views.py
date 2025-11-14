from rest_framework import viewsets
from api.models.schedule_models import DefenseSchedule
from api.serializers.schedule_serializers import ScheduleSerializer
from rest_framework.permissions import IsAuthenticated

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = DefenseSchedule.objects.all().select_related('group','created_by')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
