# Backend Deployment Guide (Render with PostgreSQL)

This guide explains how to deploy the backend Django application to Render with a PostgreSQL database.

## Prerequisites

1. A Render account
2. A GitHub/GitLab/Bitbucket repository with the backend code
3. Google OAuth credentials for production

## Database Migration

Since Render's free tier provides PostgreSQL (not MySQL), we need to modify the Django settings to use PostgreSQL.

### 1. Update requirements.txt

Add the PostgreSQL adapter to `backend/requirements.txt`:

```txt
psycopg2-binary==2.9.9
```

### 2. Update settings.py

Modify `backend/backend/settings.py` to support both MySQL (for development) and PostgreSQL (for production):

```python
import os
import sys


# Database
# Use PostgreSQL for production, MySQL for development
if os.getenv('DATABASE_URL'):  # Render sets this for PostgreSQL
    # Parse the DATABASE_URL for PostgreSQL
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL')),
    }
else:
    # Default to MySQL for local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DATABASE_NAME', 'thesis_db'),
            'USER': os.getenv('DATABASE_USER', 'thesis_user'),
            'PASSWORD': os.getenv('DATABASE_PASSWORD', 'thesis_pass'),
            'HOST': os.getenv('DATABASE_HOST', 'localhost'),
            'PORT': os.getenv('DATABASE_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
            },
        }
    }

```

### 3. Update requirements.txt

Add the required package for parsing DATABASE_URL:

```txt
dj-database-url==2.5.0
```

So the complete requirements.txt additions should look like:

```txt
psycopg2-binary==2.9.9
dj-database-url==2.5.0
```

## Render Configuration

### 1. Create render.yaml

Create a `render.yaml` file in the project root:

```yaml
services:
  - type: web
    name: thesis-backend
    runtime: python
    buildCommand: "./build.sh"
    startCommand: "gunicorn backend.wsgi:application"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: thesis-db
          property: connectionString
      - key: DJANGO_SECRET_KEY
        sync: false
      - key: DEBUG
        value: False
      - key: WEB_CONCURRENCY
        value: 4

databases:
  - name: thesis-db
    databaseName: thesis_db
    user: thesis_user
```

### 2. Create build.sh

Create a `build.sh` file in the project root:

```bash
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
```

Make it executable:
```bash
chmod +x build.sh
```

## Environment Variables

Set the following environment variables in Render:

1. `DJANGO_SECRET_KEY` - A random secret key for Django
2. `DEBUG` - Set to `False` for production
3. `GOOGLE_OAUTH2_CLIENT_ID` - Your Google OAuth client ID
4. `GOOGLE_OAUTH2_CLIENT_SECRET` - Your Google OAuth client secret
5. `EMAIL_HOST` - SMTP server for sending emails
6. `EMAIL_HOST_USER` - SMTP username
7. `EMAIL_HOST_PASSWORD` - SMTP password
8. `DEFAULT_FROM_EMAIL` - Default sender email address

## Deployment Steps

1. Push all changes to your Git repository
2. Go to [render.com](https://render.com) and sign up/sign in
3. Click "New+" and select "Web Service"
4. Connect your Git repository
5. Configure the service:
   - Name: thesis-backend
   - Region: Choose the closest region
   - Branch: main (or your default branch)
   - Root Directory: Leave empty
   - Environment: Python
   - Build Command: `./build.sh`
   - Start Command: `gunicorn backend.wsgi:application`
6. Add environment variables
7. Click "Create Web Service"

## Important Notes

1. Render will automatically create the PostgreSQL database
2. The build process will run migrations and collect static files
3. Make sure to update your frontend to point to the new backend URL
4. Configure Google OAuth credentials for production URLs