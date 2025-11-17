# Generated migration for schedule constraints

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='defenseschedule',
            constraint=models.CheckConstraint(
                check=models.Q(start_at__lt=models.F('end_at')), name='start_before_end'
            ),
        ),
    ]
