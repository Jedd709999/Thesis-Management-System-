#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r backend/requirements.txt

# Set Django settings module explicitly
export DJANGO_SETTINGS_MODULE=backend.settings

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
  
  # Collect static files
  python backend/manage.py collectstatic --no-input
  
  # Apply database migrations
  python backend/manage.py migrate
fi