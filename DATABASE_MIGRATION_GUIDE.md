# Database Migration Guide

This guide outlines the steps needed to migrate the Thesis Management System database to match the updated design where TopicProposal and PanelMemberAvailability models have been removed.

## Overview of Changes

The following changes have been made to align the database schema with the updated workflow:

1. **Removed TopicProposal model** - Topic proposals are now handled as Thesis entities with "TOPIC_SUBMITTED" status
2. **Removed PanelMemberAvailability model** - Panel member availability tracking has been removed
3. **Cleaned up Document relationships** - Removed foreign key relationships to TopicProposal

## Migration Files Created

Three migration files have been created to implement these changes:

1. `0045_remove_topic_proposal_dependencies.py` - Removes foreign key relationships before deleting models
2. `0046_remove_unused_models.py` - Deletes the TopicProposal and PanelMemberAvailability models
3. (Future) Data migration to convert existing TopicProposal records to Thesis records

## Steps to Apply Migrations

1. **Backup your database** - Always backup your database before applying migrations
   ```
   # Example for PostgreSQL
   pg_dump thesis_management > thesis_management_backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Example for SQLite
   cp db.sqlite3 db.sqlite3.backup_$(date +%Y%m%d_%H%M%S)
   ```

2. **Verify the migration files** - Review the migration files to ensure they match your requirements

3. **Apply the migrations** - Run the Django migration command
   ```
   cd backend
   python manage.py migrate
   ```

4. **Handle data migration** - If you have existing TopicProposal records, you'll need to create a data migration to convert them to Thesis records with "TOPIC_SUBMITTED" status

## Data Migration Considerations

If you have existing TopicProposal records, you'll need to create a data migration to convert them to Thesis records. This would involve:

1. Creating a new migration file
2. Writing code to iterate through existing TopicProposal records
3. Creating corresponding Thesis records with "TOPIC_SUBMITTED" status
4. Preserving relevant data (title, abstract, keywords, etc.)

## Rollback Procedure

If you need to rollback these changes:

1. Reverse the migrations in reverse order:
   ```
   python manage.py migrate api 0044_alter_oraldefenseschedule_status_and_more
   ```

2. Restore your database from the backup if needed

## Testing

After applying the migrations:

1. Verify that the application starts without errors
2. Check that existing Thesis records are still accessible
3. Confirm that Document records are still accessible
4. Test creating new Thesis records with "TOPIC_SUBMITTED" status
5. Ensure that all related functionality still works as expected

## Important Notes

1. **Data Loss Warning** - Removing the TopicProposal model will result in loss of any data stored in that table unless a data migration is performed first.

2. **Code Updates** - Any code that references the TopicProposal or PanelMemberAvailability models will need to be updated.

3. **Frontend Updates** - The frontend may need updates to remove any UI components related to the removed models.

4. **Testing Required** - Thorough testing is required after applying these migrations to ensure no functionality is broken.