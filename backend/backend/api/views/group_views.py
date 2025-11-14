from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models.group_models import Group
from api.serializers.group_serializers import GroupSerializer
from rest_framework.permissions import IsAuthenticated
from api.models.user_models import User

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related('members','panels')
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=status.HTTP_404_NOT_FOUND)
        group.members.add(user)
        group.save()
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail':'User not found'}, status=status.HTTP_404_NOT_FOUND)
        group.members.remove(user)
        group.save()
        return Response(self.get_serializer(group).data)
