from django.core.management.base import BaseCommand
from api.models.thesis_models import Thesis  # Changed back from 'backend.api.models.thesis_models'

class Command(BaseCommand):
    help = 'Debug thesis adviser assignments'

    def handle(self, *args, **options):
        self.stdout.write("=== Debugging Thesis Adviser Assignments ===")
        
        # Check all theses
        theses = Thesis.objects.all()
        self.stdout.write(f"Total theses: {theses.count()}")
        
        for thesis in theses:
            self.stdout.write(f"\n--- Thesis: {thesis.title} (ID: {thesis.id}) ---")
            self.stdout.write(f"Status: {thesis.status}")
            self.stdout.write(f"Thesis adviser: {thesis.adviser}")
            
            if thesis.group:
                self.stdout.write(f"Group: {thesis.group.name} (ID: {thesis.group.id})")
                self.stdout.write(f"Group adviser: {thesis.group.adviser}")
                
                # Check if they match
                if thesis.adviser == thesis.group.adviser:
                    self.stdout.write("✓ Thesis adviser matches group adviser")
                else:
                    self.stdout.write("✗ Thesis adviser does NOT match group adviser")
            else:
                self.stdout.write("No group assigned to this thesis")
        
        self.stdout.write("\n=== Debug Completed ===")
