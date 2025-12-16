@echo off
cd backend
set DATABASE_HOST=localhost
set DATABASE_PORT=33306
set DATABASE_NAME=thesis_db
set DATABASE_USER=thesis_user
set DATABASE_PASSWORD=thesis_pass
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate
echo "Creating superuser..."
python manage.py createsuperuser
echo "Collecting static files..."
python manage.py collectstatic --noinput