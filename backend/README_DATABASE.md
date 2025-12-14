# Database Population Scripts

This directory contains scripts to populate the Thesis Management System database with sample data for testing and development.

## Available Scripts

1. **populate_database.py** - Django management command that populates ALL tables
2. **populate_core_tables.py** - Standalone script that populates core tables only
3. **create_sample_archives.py** - Existing script for archive records
4. **run_population_scripts.bat** - Windows batch file for easy execution

## How to Use

### Method 1: Using the Batch File (Windows)
Double-click on `run_population_scripts.bat` and follow the prompts.

### Method 2: Manual Execution

First, make sure you're in the backend directory:
```cmd
cd backend
```

Then run one of the following:

#### Populate Core Tables Only (Quick Setup)
```cmd
python populate_core_tables.py
```

#### Populate All Database Tables (Comprehensive)
```cmd
python manage.py populate_database
```

#### Create Sample Archive Records Only
```cmd
python create_sample_archives.py
```

## What Each Script Creates

### populate_core_tables.py (Recommended for Quick Testing)
- 4 Users (1 admin, 2 students, 1 adviser)
- 2 Research Groups
- 2 Theses
- 3 Documents

### populate_database.py (Complete Population)
- 9 Users (admin, students, advisers, panel members)
- 3 Research Groups with memberships
- 2 Topic Proposals
- 2 Theses with documents
- Defense schedules
- Panel actions
- Notifications
- Archive records

## Prerequisites

1. Django must be properly installed
2. Database migrations must be applied:
   ```cmd
   python manage.py migrate
   ```

## Notes

- These scripts are designed for development/testing environments
- They will not overwrite existing data with the same identifiers
- Use with caution on production databases
- Check DATABASE_POPULATION.md for more detailed information