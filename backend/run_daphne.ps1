# PowerShell script to run the Django application with Daphne ASGI server
# This script is designed for Windows environments

Write-Host "🚀 Starting Thesis Management System with Daphne..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "manage.py")) {
    Write-Host "Error: manage.py not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    .\venv\Scripts\Activate.ps1
}

# Install/update dependencies
Write-Host "Installing/Updating dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate

# Collect static files
Write-Host "Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput

# Start Daphne server
Write-Host "Starting Daphne server on http://0.0.0.0:8000" -ForegroundColor Green
daphne -b 0.0.0.0 -p 8000 backend.asgi:application