from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from api.models.user_models import User
from api.models.group_models import Group
from api.serializers.user_serializers import UserSerializer, ProfileUpdateSerializer, ChangePasswordSerializer
from rest_framework.permissions import IsAuthenticated
from api.permissions.role_permissions import CanViewUsers, IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [CanViewUsers]  # Allow read access for dropdown, write access for admins
    
    def get_queryset(self):
        """
        Filter users based on role parameter for dropdown functionality.
        Students and advisers can see user lists for group creation.
        """
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        
        if role:
            queryset = queryset.filter(role=role.upper())
            
        # If requesting students and exclude_in_group parameter is set,
        # filter out students who are already in a group
        if role and role.upper() == 'STUDENT':
            exclude_in_group = self.request.query_params.get('exclude_in_group', '').lower() == 'true'
            if exclude_in_group:
                # Get all student IDs that are currently in groups
                students_in_groups = Group.objects.values_list('members', flat=True)
                # Exclude these students from the queryset
                queryset = queryset.exclude(id__in=students_in_groups)
            
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user information.
        """
        serializer = self.get_serializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        """
        Approve a user account (Admin only).
        """
        try:
            user = self.get_object()
            user.is_approved = True
            user.save()
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        """
        Reject a user account (Admin only).
        """
        try:
            user = self.get_object()
            user.is_approved = False
            user.save()
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """
        Update current user's profile.
        """
        user = request.user
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """
        Change current user's password.
        """
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
