@echo off
echo Thesis Management System - Database Population Scripts
echo ======================================================

REM Check if we're in the right directory
if not exist "manage.py" (
    echo Error: manage.py not found. Please run this script from the backend directory.
    pause
    exit /b 1
)

echo Select which script to run:
echo 1. Populate core tables only (recommended for quick setup)
echo 2. Populate all database tables (comprehensive)
echo 3. Create sample archive records only
echo 4. Exit
echo.

choice /c 1234 /m "Enter your choice"

if errorlevel 4 goto :exit
if errorlevel 3 goto :archives
if errorlevel 2 goto :all
if errorlevel 1 goto :core

:core
echo Populating core tables...
python populate_core_tables.py
goto :end

:all
echo Populating all database tables...
python manage.py populate_database
goto :end

:archives
echo Creating sample archive records...
python create_sample_archives.py
goto :end

:end
echo.
echo Script execution completed.
pause

:exit
echo Exiting...