# Running the Thesis Management System Without Docker

This guide explains how to run the Thesis Management System locally without using Docker containers.

## Prerequisites

1. Python 3.8 or higher
2. Node.js 16 or higher
3. MySQL 8.0
4. Redis (optional, but recommended)

## Setup Instructions

### 1. Database Setup

1. Install MySQL 8.0 on your system
2. Create a database and user:
   ```sql
   CREATE DATABASE thesis_db;
   CREATE USER 'thesis_user'@'localhost' IDENTIFIED BY 'thesis_pass';
   GRANT ALL PRIVILEGES ON thesis_db.* TO 'thesis_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # or
   source venv/bin/activate  # On macOS/Linux
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up the database by running migrations:
   ```
   run_setup_database.bat
   ```
   Or manually set the environment variables and run:
   ```
   set DATABASE_HOST=localhost
   set DATABASE_PORT=33306
   set DATABASE_NAME=thesis_db
   set DATABASE_USER=thesis_user
   set DATABASE_PASSWORD=thesis_pass
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install Node dependencies:
   ```
   npm install
   ```

## Running the Application

### Option 1: Using the provided batch files

1. Start the backend:
   ```
   run_backend.bat
   ```

2. In a separate terminal, start the frontend:
   ```
   run_frontend.bat
   ```

### Option 2: Manual startup

1. Start the backend:
   ```
   cd backend
   set DATABASE_HOST=localhost
   set DATABASE_PORT=33306
   set DATABASE_NAME=thesis_db
   set DATABASE_USER=thesis_user
   set DATABASE_PASSWORD=thesis_pass
   set DJANGO_SECRET_KEY=your-secret-key-here
   set DEBUG=True
   python manage.py runserver 0.0.0.0:8001
   ```

2. In a separate terminal, start the frontend:
   ```
   cd frontend
   set VITE_API_BASE_URL=http://localhost:8001/api
   npm run dev -- --host 0.0.0.0 --port 8080
   ```

## Accessing the Application

Once both services are running:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8001/api
- Admin Panel: http://localhost:8001/admin

## Notes

- The system expects MySQL to be running on port 33306
- Google OAuth is configured but requires proper credentials in production
- For development, you can use the existing Google OAuth credentials, but be aware of usage limits