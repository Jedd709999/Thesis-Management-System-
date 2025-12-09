import uuid
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.contrib.auth import logout

User = get_user_model()

class UUIDCompatibleModelBackend(ModelBackend):
    """
    A custom authentication backend that handles both integer and UUID user IDs.
    This is needed when migrating from integer to UUID primary keys.
    """
    
    def get_user(self, user_id):
        """
        Override the get_user method to handle both integer and UUID user IDs.
        """
        try:
            # First, try to parse as UUID (new format)
            if isinstance(user_id, str):
                uuid.UUID(user_id)
            elif isinstance(user_id, uuid.UUID):
                pass  # Already a UUID object
            else:
                # Convert to string if it's an integer
                user_id = str(user_id)
                uuid.UUID(user_id)
            
            # If we get here, it's a valid UUID
            return super().get_user(user_id)
        except (ValueError, ValidationError):
            # If it's not a valid UUID, it might be an old integer ID
            # In this case, we return None to indicate the user doesn't exist
            # This will force the user to log in again
            return None
