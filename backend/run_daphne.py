#!/usr/bin/env python
"""
Script to run the Django application with Daphne ASGI server.
This is useful for development and production deployments that require WebSocket support.
"""

import os
import sys
import subprocess
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    
    # Check if we're in the backend directory
    if not os.path.exists("manage.py"):
        print("Error: manage.py not found. Please run this script from the backend directory.")
        sys.exit(1)
    
    try:
        # Run migrations
        print("Running migrations...")
        subprocess.run([sys.executable, "manage.py", "migrate"], check=True)
        
        # Collect static files
        print("Collecting static files...")
        subprocess.run([sys.executable, "manage.py", "collectstatic", "--noinput"], check=True)
        
        # Run Daphne
        print("Starting Daphne server...")
        subprocess.run([
            "daphne", 
            "-b", "0.0.0.0", 
            "-p", "8000", 
            "backend.asgi:application"
        ])
        
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)