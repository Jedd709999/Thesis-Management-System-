from rest_framework import viewsets
from api.models.user_models import User
from api.serializers.user_serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from api.permissions.role_permissions import IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
