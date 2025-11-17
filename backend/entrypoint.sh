#!/bin/bash

# Run migrations
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

# Seed initial data
echo "🌱 Seeding initial data..."
python manage.py seed_data --verbose

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "🚀 Starting application..."
exec "$@"
