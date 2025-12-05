from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from api.models.schedule_models import PanelMemberAvailability
from api.models.user_models import User
from api.serializers.schedule_serializers import PanelMemberAvailabilitySerializer

class PanelMemberAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = PanelMemberAvailability.objects.all().select_related('user')
    serializer_class = PanelMemberAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Panel members can only see their own availability
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        user_id = self.request.query_params.get('user_id')
        if user_id and self.request.user.is_staff:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset
    
    def perform_create(self, serializer):
        # Regular users can only create availability for themselves
        if self.request.user.is_staff:
            serializer.save()
        else:
            serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='my-availability')
    def my_availability(self, request):
        """Get current user's availability"""
        availability = PanelMemberAvailability.objects.filter(user=request.user)
        serializer = self.get_serializer(availability, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Create multiple availability records at once"""
        availability_data = request.data.get('availability', [])
        
        if not availability_data:
            return Response(
                {'error': 'No availability data provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_records = []
        
        try:
            with transaction.atomic():
                for data in availability_data:
                    # Add user to data if not provided (for non-staff users)
                    if 'user' not in data and not request.user.is_staff:
                        data['user'] = request.user.id
                    
                    serializer = self.get_serializer(data=data)
                    if serializer.is_valid():
                        availability = serializer.save()
                        created_records.append(serializer.data)
                    else:
                        return Response(
                            {'error': 'Invalid data', 'details': serializer.errors}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            return Response({
                'message': f'Successfully created {len(created_records)} availability records',
                'records': created_records
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create availability records: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )