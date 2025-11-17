from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from api.models.group_models import Group
from api.models.user_models import User
from api.serializers.group_serializers import GroupSerializer
from api.permissions.role_permissions import IsAdviserForGroup, IsGroupMemberOrAdmin

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().prefetch_related('members','panels')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdviserForGroup, IsGroupMemberOrAdmin]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_current_user_groups(self, request):
        user = request.user
        # Get groups where user is a member, adviser, or panel
        groups = Group.objects.filter(
            models.Q(members=user) | 
            models.Q(adviser=user) | 
            models.Q(panels=user)
        ).prefetch_related('members', 'panels')
        serializer = self.get_serializer(groups, many=True)
        return Response(serializer.data)

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
