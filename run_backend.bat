@echo off
cd backend
set DATABASE_HOST=localhost
set DATABASE_PORT=33306
set DATABASE_NAME=thesis_db
set DATABASE_USER=thesis_user
set DATABASE_PASSWORD=thesis_pass
set DJANGO_SECRET_KEY=your-secret-key-here
set DEBUG=True
set GOOGLE_CLIENT_ID=47765248404-3cio0hk7oasn17dfg86grrf3sh69okgg.apps.googleusercontent.com
set GOOGLE_CLIENT_SECRET=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
python manage.py runserver 0.0.0.0:8001