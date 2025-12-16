import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Handle email configuration for Render deployments to prevent startup errors
if 'RENDER' in os.environ:
    # Set dummy email values if not configured to prevent startup errors
    if not os.environ.get('EMAIL_HOST'):
        os.environ['EMAIL_HOST'] = 'localhost'
    if not os.environ.get('EMAIL_HOST_USER'):
        os.environ['EMAIL_HOST_USER'] = 'dummy'
    if not os.environ.get('EMAIL_HOST_PASSWORD'):
        os.environ['EMAIL_HOST_PASSWORD'] = 'dummy'

django.setup()

# Import routing after Django setup
from api.routing import websocket_urlpatterns  # Changed back from 'backend.api.routing'

# Import custom JWT auth middleware
from api.middleware.jwt_auth_middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(  # Use JWT auth middleware instead of standard AuthMiddlewareStack
        URLRouter(
            websocket_urlpatterns
        )
    ),
})