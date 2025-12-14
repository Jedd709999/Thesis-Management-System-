# Thesis Management System Database Schema

## Core Entities and Relationships

### 1. Users
The foundation of the system with role-based access control.

**Table: User**
- Primary Key: `id` (UUID)
- Fields:
  - `email` (unique)
  - `first_name`, `last_name`
  - `bio`, `avatar`
  - `role` (STUDENT, ADVISER, PANEL, ADMIN)
  - `is_active`, `is_staff`, `is_approved`, `is_email_verified`
  - `email_verification_token`, `email_verification_sent_at`
  - `created_at`, `date_joined`

### 2. Groups
Students form groups to work on theses together.

**Table: Group**
- Primary Key: `id` (UUID)
- Fields:
  - `name`
  - `status` (PENDING, APPROVED, REJECTED)
  - `possible_topics`
  - `rejection_reason`
  - `leader` (FK to User)
  - `adviser` (FK to User)
  - `preferred_adviser_id`
  - `drive_folder_id`
  - `created_at`, `updated_at`, `deleted_at`

**Table: GroupMember** (Join table)
- Primary Key: `id` (UUID)
- Fields:
  - `group` (FK to Group)
  - `user` (FK to User)
  - `role_in_group` (member, leader)
  - `created_at`, `updated_at`

### 3. Theses
Theses represent the core academic work in the system, including topic proposals which are now represented as theses with a "TOPIC_SUBMITTED" status.

**Table: Thesis**
- Primary Key: `id` (UUID)
- Fields:
  - `title`
  - `abstract`
  - `keywords`
  - `group` (OneToOne FK to Group)
  - `proposer` (FK to User)
  - `adviser` (FK to User)
  - `status` (complex workflow with 20+ statuses)
  - `adviser_feedback`
  - `drive_folder_id`
  - `archived_document` (OneToOne FK to Document)
  - `created_at`, `updated_at`

### 4. Documents
Files associated with theses at various stages.

**Table: Document**
- Primary Key: `id` (UUID)
- Fields:
  - `thesis` (FK to Thesis)
  - `uploaded_by` (FK to User)
  - `document_type` (concept_paper, research_proposal, final_manuscript, approval_sheet, evaluation_form)
  - `status` (draft, submitted, revision, approved, rejected)
  - `provider` (local, drive, google)
  - `file`, `file_storage_id`
  - `viewer_url`, `mime_type`, `file_size`
  - `version`
  - `google_drive_file_id`, `google_doc_id`, `is_google_doc`
  - `google_doc_edit_url`, `doc_embed_url`
  - `last_synced_at`
  - `created_at`, `updated_at`, `deleted_at`

**Table: DocumentVersion**
- Primary Key: `id` (UUID)
- Fields:
  - `document` (FK to Document)
  - `file_storage_id`
  - `version`
  - `google_doc_id`, `is_google_doc`
  - `created_at`
  - `created_by` (FK to User)

### 5. Schedules and Defenses
Management of oral defense schedules.

**Table: OralDefenseSchedule**
- Primary Key: `id` (UUID)
- Fields:
  - `thesis` (FK to Thesis)
  - `title`
  - `start`, `end`
  - `location`, `meeting_url`
  - `status` (pending, scheduled, in_progress, completed, cancelled, rescheduled)
  - `notes`
  - `organizer` (FK to User)
  - `created_at`, `updated_at`, `deleted_at`

### 6. Evaluations and Approvals
Panel member evaluations and approvals.

**Table: ApprovalSheet**
- Primary Key: `id` (UUID)
- Fields:
  - `schedule` (FK to OralDefenseSchedule)
  - `panel_member` (FK to User)
  - `decision` (pending, approved, rejected, needs_revision)
  - `comments`
  - `submitted_at`
  - `document` (FK to Document)
  - `created_at`, `updated_at`

**Table: Evaluation**
- Primary Key: `id` (UUID)
- Fields:
  - `schedule` (FK to OralDefenseSchedule)
  - `evaluator` (FK to User)
  - `rubric_scores` (JSON)
  - `total_score`
  - `recommendation` (pass, pass_with_revision, fail, conditional_pass)
  - `comments`
  - `document` (FK to Document)
  - `submitted_at`
  - `created_at`, `updated_at`

**Table: PanelAction**
- Primary Key: `id` (UUID)
- Fields:
  - `schedule` (FK to OralDefenseSchedule)
  - `panel_member` (FK to User)
  - `action` (approved, needs_revision, rejected)
  - `comments`
  - `created_at`

### 7. Google Drive Integration
Management of Google Drive credentials and folders.

**Table: DriveCredential**
- Primary Key: `id` (UUID)
- Fields:
  - `user` (OneToOne FK to User)
  - `credential_type` (user)
  - `token` (JSON)
  - `refresh_token`, `token_uri`
  - `client_id`, `client_secret`
  - `scopes`
  - `expires_at`
  - `is_active`
  - `last_used_at`
  - `created_at`, `updated_at`

**Table: DriveFolder**
- Primary Key: `id` (UUID)
- Fields:
  - `folder_id` (unique)
  - `name`
  - `folder_type` (thesis, group, submission, archive, other)
  - `parent_folder` (FK to self)
  - `owner` (FK to User)
  - `web_view_link`
  - `created_in_drive_at`
  - `created_at`, `updated_at`

### 8. Notifications
System notifications to users.

**Table: Notification**
- Primary Key: `id` (UUID)
- Fields:
  - `recipient` (FK to User)
  - `sender` (FK to User)
  - `notification_type` (20+ types)
  - `priority` (low, normal, high, urgent)
  - `title`, `message`
  - `payload` (JSON)
  - `is_read`, `read_at`
  - `is_email_sent`, `email_sent_at`
  - `action_url`
  - `related_content_type`, `related_object_id`
  - `created_at`, `updated_at`, `expires_at`

**Table: NotificationPreference**
- Primary Key: `user` (OneToOne FK to User)
- Fields:
  - `email_enabled`, `in_app_enabled`, `push_enabled`
  - `digest_enabled`, `digest_frequency`
  - `last_digest_sent`
  - `created_at`, `updated_at`

### 9. Archiving and Compliance
Records for data retention and compliance.

**Table: ArchiveRecord**
- Primary Key: `id` (UUID)
- Fields:
  - `content_type` (thesis, document, evaluation, group, user, other)
  - `original_id`
  - `data` (JSON)
  - `archived_by` (FK to User)
  - `reason`
  - `retention_period_years`
  - `archived_at`, `expires_at`
  - `created_at`, `updated_at`

### 10. Audit Trail
Tracking of system actions for security and compliance.

**Table: AuditLog**
- Primary Key: `id` (UUID)
- Fields:
  - `action` (create, read, update, delete, login, logout, etc.)
  - `user` (FK to User)
  - `ip_address`, `user_agent`
  - `content_type`, `object_id`
  - `old_values`, `new_values` (JSON)
  - `request_path`
  - `status_code`
  - `created_at`

## Key Relationships Summary

1. **Users ↔ Groups**: Many-to-many through GroupMember table
2. **Groups → Theses**: One-to-one relationship
3. **Theses → Documents**: One-to-many relationship
4. **Theses → OralDefenseSchedules**: One-to-many relationship
5. **OralDefenseSchedules → Evaluations**: One-to-many relationship
6. **OralDefenseSchedules → ApprovalSheets**: One-to-many relationship
7. **Documents → DocumentVersions**: One-to-many relationship
8. **Users → DriveCredentials**: One-to-one relationship
9. **Groups/Theses → DriveFolders**: Many-to-one relationship

## Workflow Integration Points

1. **Topic Proposal Workflow**: Groups create Theses with "TOPIC_SUBMITTED" status
2. **Document Management**: Thesis → Documents → DocumentVersions
3. **Defense Scheduling**: Thesis → OralDefenseSchedule → Panel Members
4. **Evaluation Process**: OralDefenseSchedule → Evaluations/ApprovalSheets
5. **Google Integration**: Users/Documents/Groups → DriveCredentials/Folders
6. **Notifications**: Various actions trigger Notification entries
7. **Audit Trail**: All significant actions logged in AuditLog
8. **Archiving**: Completed items stored in ArchiveRecord

## Note on Database Migration Status

As of December 11, 2025, the following changes have been prepared but not yet applied to the database:

1. **TopicProposal model removal** - This model will be removed as topic proposals are now handled as Thesis entities with "TOPIC_SUBMITTED" status. Migration files have been created to remove the `origin_proposal` field from the Thesis model and the `topic_proposal` field from the Document model.

2. **PanelMemberAvailability model removal** - This model will be removed as panel member availability tracking is no longer part of the system. Migration files have been created to delete this model.

3. **Document relationship cleanup** - Foreign key relationships to TopicProposal will be removed. Migration files have been created to remove these relationships.

Migration files have been created and are ready to be applied:
- `0045_remove_topic_proposal_dependencies.py` - Removes foreign key relationships before deleting models
- `0046_remove_unused_models.py` - Deletes the TopicProposal and PanelMemberAvailability models

See DATABASE_MIGRATION_GUIDE.md for detailed instructions on applying these migrations.