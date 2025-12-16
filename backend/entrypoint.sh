#!/bin/bash

# Exit on error
set -e

# Wait for database to be ready
# Skip database waiting for Render deployments as Render handles this
if [ -z "$RENDER" ]; then
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
else
  echo "Skipping database wait for Render deployment"
fi

# Apply database migrations
echo "Applying database migrations..."
export DJANGO_SETTINGS_MODULE=backend.settings

# Handle database setup differently for Render vs local development
if [ -z "$RENDER" ]; then
  # Local development with MySQL
  python -c "import pymysql; pymysql.install_as_MySQLdb(); import django; django.setup()" && python manage.py migrate --noinput
else
  # Render deployment with PostgreSQL
  python -c "import django; django.setup()" && python manage.py migrate --noinput
fi

# Collect static files
echo "Collecting static files..."
if [ -z "$RENDER" ]; then
  # Local development with MySQL
  python -c "import pymysql; pymysql.install_as_MySQLdb(); import django; django.setup()" && python manage.py collectstatic --noinput
else
  # Render deployment with PostgreSQL
  python -c "import django; django.setup()" && python manage.py collectstatic --noinput
fi

# Create superuser if it doesn't exist
echo "Creating superuser if needed..."
if [ -z "$RENDER" ]; then
  # Local development with MySQL
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
  # Render deployment - skip superuser creation or handle differently
  echo "Skipping superuser creation for Render deployment"
fi

# Start the application
exec "$@"