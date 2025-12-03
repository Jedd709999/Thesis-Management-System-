@echo off
echo Testing Thesis Management System Docker Setup

echo Checking if Docker is installed...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo Checking if Docker Compose is installed...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Desktop which includes Docker Compose.
    exit /b 1
)

echo Docker and Docker Compose are installed.

echo Checking if docker-compose.yml exists...
if not exist "docker-compose.yml" (
    echo docker-compose.yml not found. Please run this script from the project root directory.
    exit /b 1
)

echo docker-compose.yml found.

echo Checking if backend entrypoint.sh exists...
if not exist "backend\entrypoint.sh" (
    echo backend\entrypoint.sh not found.
    exit /b 1
)

echo backend\entrypoint.sh found.

echo Setup validation complete. You can now run:
echo   docker-compose up --build
echo to start the application.