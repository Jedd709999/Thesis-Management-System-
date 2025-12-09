from django.core.management.base import BaseCommand
from api.models.group_models import Group

class Command(BaseCommand):
    help = 'Fix groups where leader is not a member'

    def handle(self, *args, **options):
        # Find groups where leader is not in members
        groups_fixed = 0
        for group in Group.objects.all():
            if group.leader and group.leader not in group.members.all():
                group.members.add(group.leader)
                group.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Fixed group "{group.name}" (ID: {group.id}) - added leader as member'
                    )
                )
                groups_fixed += 1
        
        if groups_fixed == 0:
            self.stdout.write(
                self.style.SUCCESS('No groups needed fixing - all group leaders are members')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Fixed {groups_fixed} groups')
            )
