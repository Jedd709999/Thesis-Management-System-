#!/bin/bash

# Exit on error
set -e

# Check if we're running in docker-compose (with db service) or standalone
if nc -z db 3306 2>/dev/null; then
    # Running in docker-compose with db service
    echo "Running in docker-compose environment with db service"
    
    # Wait for database to be ready
    echo "Waiting for database..."
    retry_count=0
    max_retries=30
    while ! nc -z db 3306; do
      retry_count=$((retry_count + 1))
      if [ $retry_count -gt $max_retries ]; then
        echo "Failed to connect to database after $max_retries attempts"
        exit 1
      fi
      echo "Attempt $retry_count: Database not ready yet, waiting..."
      sleep 2
    done
    echo "Database is ready!"
    
    # Apply database migrations
    echo "Applying database migrations..."
    export DJANGO_SETTINGS_MODULE=backend.settings
    
    # Handle email configuration for Render deployments to prevent startup errors
    if [ -n "$RENDER" ]; then
        # Set dummy email values if not configured to prevent startup errors
        if [ -z "$EMAIL_HOST" ]; then
            export EMAIL_HOST="localhost"
        fi
        if [ -z "$EMAIL_HOST_USER" ]; then
            export EMAIL_HOST_USER="dummy"
        fi
        if [ -z "$EMAIL_HOST_PASSWORD" ]; then
            export EMAIL_HOST_PASSWORD="dummy"
        fi
    fi
    
    python -c "import pymysql; pymysql.install_as_MySQLdb(); import django; django.setup()" && python manage.py migrate --noinput
    
    # Collect static files
    echo "Collecting static files..."
    python -c "import pymysql; pymysql.install_as_MySQLdb(); import django; django.setup()" && python manage.py collectstatic --noinput --clear
    
    # Create superuser if it doesn't exist
    echo "Creating superuser if needed..."
    python -c "import pymysql; pymysql.install_as_MySQLdb(); import django; django.setup()" && python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@example.com', password='admin');
    print('Superuser created.');
else:
    print('Superuser already exists.');
"
else
    # Running standalone - skip database operations
    echo "Running in standalone mode - skipping database operations"
    echo "Make sure to set DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, and DATABASE_PASSWORD environment variables"
    echo "if you want to connect to an external database."
fi

# Start the application
exec "$@"