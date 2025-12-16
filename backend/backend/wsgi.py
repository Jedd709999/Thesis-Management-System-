"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import django
from django.core.wsgi import get_wsgi_application

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

application = get_wsgi_application()