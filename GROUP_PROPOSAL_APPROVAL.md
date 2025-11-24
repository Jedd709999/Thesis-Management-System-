# Group Proposal Approval Workflow

This document explains how the group proposal approval/rejection workflow works in the Thesis Management System.

## Overview

When students propose a new research group, the proposal goes through an approval process where administrators can either approve or reject the proposal.

## Workflow Steps

### 1. Student Submits Group Proposal
- Students create a group proposal through the "Propose Group" button in the Groups section
- The proposal includes:
  - Group name
  - Research topics
  - Proposed group members
  - Preferred adviser (optional)
- The proposal status is automatically set to "PENDING"

### 2. Admin Reviews Pending Proposals
- Administrators can access pending proposals through:
  - The "Pending Proposals" tab in the Groups section
  - The "Review Proposals" quick action on the dashboard
- Each pending proposal displays:
  - Group name
  - Research topics
  - List of proposed members
  - Name of the proposing leader
  - Creation date

### 3. Admin Decision
Administrators have two options for each pending proposal:

#### Approve Proposal
- Click the "Approve" button to accept the proposal
- The group status changes to "APPROVED"
- A thesis record is automatically created for the group
- Group members can now access the group and begin work

#### Reject Proposal
- Click the "Reject" button to open the rejection dialog
- Optionally provide a reason for rejection
- The group status changes to "REJECTED"
- Students can view the rejection reason and may resubmit a revised proposal

### 4. Notification
- Students receive notifications about the status of their proposals
- Approved groups become visible to all relevant parties
- Rejected proposals remain visible to students with their rejection status and reason

## Technical Implementation

### Frontend Components
- `PendingProposalsPage.tsx` - Dedicated page for reviewing proposals
- `GroupManagementPage.tsx` - Contains a tab for pending proposals (admin only)
- Added "Review Proposals" quick action to the admin dashboard

### API Functions
- `fetchPendingProposals()` - Retrieves all pending group proposals (admin only)
- `approveGroup(groupId)` - Approves a pending group proposal (admin only)
- `rejectGroup(groupId, reason?)` - Rejects a pending group proposal with optional reason (admin only)

### Backend Endpoints
- `GET /api/groups/pending_proposals/` - Returns all pending group proposals (admin only)
- `POST /api/groups/{id}/approve/` - Approves a group proposal (admin only)
- `POST /api/groups/{id}/reject/` - Rejects a group proposal (admin only)

## User Experience

### For Students
- Can view the status of their proposals (Pending/Approved/Rejected)
- Can see rejection reasons for rejected proposals
- Cannot modify a proposal once submitted (must resubmit if rejected)

### For Administrators
- Dedicated interface for reviewing all pending proposals
- One-click approval
- Rejection with optional reason
- Real-time updates after decisions are made

## Error Handling

The system includes proper error handling for:
- Network failures
- Unauthorized access attempts
- Invalid proposal states
- Duplicate thesis creation prevention