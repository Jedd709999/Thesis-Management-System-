#!/bin/bash

# Exit on error
set -e

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
python -c "import pymysql; pymysql.install_as_MySQLdb()" && python backend/manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python -c "import pymysql; pymysql.install_as_MySQLdb()" && python backend/manage.py collectstatic --noinput

# Create superuser if it doesn't exist
echo "Creating superuser if needed..."
python -c "import pymysql; pymysql.install_as_MySQLdb()" && python backend/manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@example.com', password='admin');
    print('Superuser created.');
else:
    print('Superuser already exists.');
"

# Start the application
exec "$@"