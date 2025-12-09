from django.core.management.base import BaseCommand
from api.models.thesis_models import Thesis
from api.serializers.thesis_serializers import ThesisSerializer

class Command(BaseCommand):
    help = 'Test adviser assignment in thesis serializer'

    def handle(self, *args, **options):
        self.stdout.write("=== Testing Adviser Assignment ===")
        
        # Get a thesis to test with
        thesis = Thesis.objects.first()
        if not thesis:
            self.stdout.write("No thesis found in database")
            return
        
        self.stdout.write(f"Testing with thesis: {thesis.title}")
        self.stdout.write(f"Thesis ID: {thesis.id}")
        
        if thesis.group:
            self.stdout.write(f"Group: {thesis.group.name}")
            self.stdout.write(f"Group ID: {thesis.group.id}")
            
            if thesis.group.adviser:
                adviser = thesis.group.adviser
                self.stdout.write(f"Adviser: {adviser.first_name} {adviser.last_name} ({adviser.email})")
                self.stdout.write(f"Adviser ID: {adviser.id}")
            else:
                self.stdout.write("No adviser assigned to this group")
        else:
            self.stdout.write("No group assigned to this thesis")
        
        # Test serializer
        self.stdout.write("\n--- Testing Serializer ---")
        serializer = ThesisSerializer(thesis)
        serialized_data = serializer.data
        self.stdout.write(f"Serialized data keys: {list(serialized_data.keys())}")
        
        # Check group data
        group_data = serialized_data.get('group')
        if group_data:
            self.stdout.write(f"Group data: {group_data}")
            if 'adviser' in group_data:
                self.stdout.write(f"Group adviser data: {group_data['adviser']}")
            else:
                self.stdout.write("No adviser data in group")
        else:
            self.stdout.write("No group data in serialized thesis")
        
        # Check adviser data
        adviser_data = serialized_data.get('adviser')
        self.stdout.write(f"Adviser data: {adviser_data}")
        
        self.stdout.write("\n=== Test Completed ===")
