from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'  # Changed back from 'backend.api' to 'api'

    def ready(self):
        import api.signals.audit_signals  # Changed back from 'backend.api.signals.audit_signals'
        import api.signals.group_signals  # Changed back from 'backend.api.signals.group_signals'
