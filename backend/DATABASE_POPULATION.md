# Database Population Scripts

This document explains how to populate the database with sample data for testing and development purposes.

## Available Scripts

### 1. Comprehensive Database Population (All Tables)
**File**: `backend/backend/api/management/commands/populate_database.py`

This Django management command populates all database tables with comprehensive sample data including:
- Users (students, advisers, panel members, admins)
- Groups with memberships
- Topic proposals
- Theses
- Documents
- Defense schedules
- Panel actions
- Notifications
- Archive records

#### Usage:
```bash
cd backend
python manage.py populate_database
```

#### Options:
```bash
# Clear existing data before populating
python manage.py populate_database --clear-first
```

### 2. Core Tables Population (Recommended for Quick Setup)
**File**: `backend/populate_core_tables.py`

This standalone script populates only the core tables needed for basic functionality:
- Users (students, advisers, admins)
- Groups with memberships
- Theses
- Documents

#### Usage:
```bash
cd backend
python populate_core_tables.py
```

### 3. Archive Records Only
**File**: `backend/create_sample_archives.py`

This script creates sample archive records for testing the download functionality.

#### Usage:
```bash
cd backend
python create_sample_archives.py
```

## What Each Script Creates

### populate_database.py (Complete Population)
- **Users**: 9 users (1 admin, 4 students, 2 advisers, 2 panel members)
- **Groups**: 3 research groups with proper memberships
- **Topic Proposals**: 2 proposals linked to groups
- **Theses**: 2 theses with different statuses
- **Documents**: 5 documents (concept papers, proposals, final manuscripts)
- **Schedules**: 2 defense schedules
- **Panel Actions**: 3 panel evaluations
- **Notifications**: 3 system notifications
- **Archive Records**: 2 archived theses

### populate_core_tables.py (Core Only)
- **Users**: 4 users (1 admin, 2 students, 1 adviser)
- **Groups**: 2 research groups
- **Theses**: 2 theses
- **Documents**: 3 documents

### create_sample_archives.py (Archives Only)
- **Archive Records**: 11 archived theses across multiple years (2020-2025)

## Running the Scripts

### Prerequisites
1. Make sure the Django application is properly set up
2. Database migrations should be applied:
   ```bash
   cd backend
   python manage.py migrate
   ```

### Method 1: Using Django Management Commands
```bash
cd backend
python manage.py populate_database
```

### Method 2: Using Standalone Scripts
```bash
cd backend
python populate_core_tables.py
python create_sample_archives.py
```

## Customization

You can modify any of these scripts to:
- Change the number of sample records
- Modify sample data values
- Add new related entities
- Adjust relationships between entities

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Make sure you have proper database permissions
2. **Module Not Found**: Ensure Django is properly installed and configured
3. **Database Connection**: Verify database settings in `backend/settings.py`

### Clearing Data:
If you need to clear sample data, you can:
1. Use the `--clear-first` flag with the management command
2. Manually delete records from the database
3. Reset the database and reapply migrations

## Best Practices

1. **Development Only**: These scripts are intended for development and testing environments
2. **Backup Production Data**: Never run these scripts on production databases
3. **Customize for Needs**: Modify the sample data to match your testing requirements
4. **Regular Updates**: Update scripts when database schema changes

## Verification

After running the scripts, you can verify the data was created by:

1. Checking the Django admin interface
2. Using Django shell:
   ```bash
   cd backend
   python manage.py shell
   ```
   
   Then in the shell:
   ```python
   from api.models.user_models import User
   from api.models.group_models import Group
   from api.models.thesis_models import Thesis
   
   print(f"Users: {User.objects.count()}")
   print(f"Groups: {Group.objects.count()}")
   print(f"Theses: {Thesis.objects.count()}")
   ```

3. Querying the database directly using your database client