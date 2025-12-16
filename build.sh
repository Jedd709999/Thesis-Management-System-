#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r backend/requirements.txt

# Set Django settings module explicitly
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

# Handle database setup differently for Render vs local development
if [ -z "$RENDER" ]; then
  # Local development
  echo "Running local development setup"
  
  # Collect static files
  python backend/manage.py collectstatic --no-input
  
  # Apply database migrations
  python backend/manage.py migrate
else
  # Render deployment
  echo "Running Render deployment setup"
  echo "RENDER environment detected"
  echo "DATABASE_URL: ${DATABASE_URL}"
  
  # Collect static files
  python backend/manage.py collectstatic --no-input
  
  # Apply database migrations
  python backend/manage.py migrate
fi