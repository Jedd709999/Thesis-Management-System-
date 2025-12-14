# Core Entities in the Thesis Management System

## 1. User System
The User entity is the foundation of the entire system with role-based access control.

**Roles:**
- STUDENT: Can join groups, submit proposals, upload documents
- ADVISER: Assigned to groups to guide their thesis work
- PANEL: Evaluate defenses and provide feedback
- ADMIN: Manage the system, approve users and groups

**Key Features:**
- Email-based authentication with verification
- Profile information (name, bio, avatar)
- Approval workflow for new accounts
- Integration with Google Drive credentials

## 2. Group Structure
Groups are formed by students to collaborate on thesis projects.

**Workflow:**
1. Students form groups (1 student can only be in 1 group)
2. Groups select a leader
3. Groups create Theses with initial status "TOPIC_SUBMITTED" to propose topics
4. Groups are assigned advisers
5. Theses evolve through different phases as they are approved by advisers

**Constraints:**
- Each student can only be a member of one group
- Groups must be approved by administrators
- Groups can have multiple panel members for evaluation

## 3. Thesis Lifecycle
Theses represent the core academic work in the system.

**Phases:**
1. Topic Phase (TOPIC_SUBMITTED → TOPIC_APPROVED/REJECTED)
2. Concept Phase (CONCEPT_SUBMITTED → READY_FOR_CONCEPT_DEFENSE → CONCEPT_SCHEDULED → CONCEPT_APPROVED)
3. Proposal Phase (PROPOSAL_SUBMITTED → READY_FOR_PROPOSAL_DEFENSE → PROPOSAL_SCHEDULED → PROPOSAL_APPROVED)
4. Research Phase (RESEARCH_IN_PROGRESS)
5. Final Phase (FINAL_SUBMITTED → READY_FOR_FINAL_DEFENSE → FINAL_SCHEDULED → FINAL_APPROVED)
6. Archival (ARCHIVED)

**Relationships:**
- Each Thesis is tied to exactly one Group
- Each Thesis has one Adviser
- Each Thesis can have multiple Documents
- Each Thesis can have multiple OralDefenseSchedules

## 4. Document Management
Documents track all files related to theses throughout their lifecycle.

**Types:**
- Concept Paper
- Research Proposal
- Final Manuscript
- Approval Sheet
- Evaluation Form

**Features:**
- Version control system
- Multiple storage providers (local, Google Drive, Google Docs)
- File metadata tracking
- Integration with Google Docs for collaborative editing

## 5. Defense Scheduling
Oral defenses are scheduled events that require coordination.

**Components:**
- OralDefenseSchedule: Main defense event with timing and location
- ApprovalSheet: Individual panel member approvals
- Evaluation: Detailed scoring and feedback from panel members
- PanelAction: Simple approval/rejection actions

## 6. Google Drive Integration
The system integrates deeply with Google Drive for document storage and collaboration.

**Components:**
- DriveCredential: OAuth tokens for accessing Google APIs
- DriveFolder: Tracking of folders created in Google Drive

## 7. Communication & Notifications
The system keeps users informed through multiple channels.

**Components:**
- Notification: Individual alerts to users
- NotificationPreference: How users want to receive notifications
- NotificationTemplate: Standardized message formats

## 8. Compliance & Auditing
The system maintains logs for security and compliance.

**Components:**
- AuditLog: Detailed tracking of all system actions
- ArchiveRecord: Long-term storage of important data

## Key Business Rules

1. **Single Group Constraint**: Each student can only be a member of one group
2. **Thesis Ownership**: Each group can only have one thesis
3. **Adviser Assignment**: Theses must have an assigned adviser
4. **Document Versioning**: All document changes create new versions
5. **Defense Coordination**: Panel members must be available for scheduled defenses
6. **Workflow Enforcement**: Theses must progress through specific status sequences
7. **Data Retention**: Archived records are kept for compliance periods
8. **Access Control**: Different roles have different permissions throughout the system

## Integration Points

1. **Authentication**: Users authenticate via email/password with Google Drive integration
2. **Storage**: Documents can be stored locally or in Google Drive/Docs
3. **Notifications**: System events trigger email and in-app notifications
4. **Scheduling**: Defense scheduling considers panel member availability
5. **Auditing**: All significant actions are logged for compliance
6. **Archiving**: Completed theses are archived for long-term retention

## Note on Database Migration Status

As of December 11, 2025, the following changes have been prepared but not yet applied to the database:

1. **TopicProposal model removal** - This model will be removed as topic proposals are now handled as Thesis entities with "TOPIC_SUBMITTED" status
2. **PanelMemberAvailability model removal** - This model will be removed as panel member availability tracking is no longer part of the system
3. **Document relationship cleanup** - Foreign key relationships to TopicProposal will be removed

Migration files have been created and are ready to be applied. See DATABASE_MIGRATION_GUIDE.md for detailed instructions.