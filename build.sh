#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r backend/requirements.txt

# Set Django settings module explicitly
export DJANGO_SETTINGS_MODULE=backend.settings

# Collect static files
python backend/manage.py collectstatic --no-input

# Apply database migrations
python backend/manage.py migrate