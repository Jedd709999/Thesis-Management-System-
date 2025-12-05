from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from api.models.user_models import User
from api.serializers.user_serializers import UserSerializer
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
            
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Get current user information.
        """
        serializer = self.get_serializer(request.user)
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