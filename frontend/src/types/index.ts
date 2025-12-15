// Core TypeScript types for the Thesis Management System
// Generated from backend DBML schema

export type UserRole = 'STUDENT' | 'ADVISER' | 'PANEL' | 'ADMIN'

export type GroupStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ThesisStatus = 
  | 'DRAFT' 
  | 'TOPIC_SUBMITTED'
  | 'TOPIC_APPROVED'
  | 'TOPIC_REJECTED'
  | 'CONCEPT_SUBMITTED'
  | 'READY_FOR_CONCEPT_DEFENSE'
  | 'CONCEPT_SCHEDULED'
  | 'CONCEPT_DEFENDED'
  | 'CONCEPT_APPROVED'
  | 'PROPOSAL_SUBMITTED'
  | 'READY_FOR_PROPOSAL_DEFENSE'
  | 'PROPOSAL_SCHEDULED'
  | 'PROPOSAL_DEFENDED'
  | 'PROPOSAL_APPROVED'
  | 'RESEARCH_IN_PROGRESS'
  | 'FINAL_SUBMITTED'
  | 'READY_FOR_FINAL_DEFENSE'
  | 'FINAL_SCHEDULED'
  | 'FINAL_DEFENDED'
  | 'FINAL_APPROVED'
  | 'CONCEPT_REVISIONS_REQUIRED'
  | 'PROPOSAL_REVISIONS_REQUIRED'
  | 'FINAL_REVISIONS_REQUIRED'
  | 'REJECTED'
  | 'ARCHIVED'

export type ProposalStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'needs_revision'

export type ScheduleStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'

export type NotificationType = 
  | 'thesis_update' 
  | 'schedule_reminder' 
  | 'document_shared' 
  | 'approval_request' 
  | 'evaluation_submitted'
  | 'group_update'
  | 'proposal_update'

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  bio?: string
  avatar?: string
  role: UserRole
  is_active: boolean
  is_staff: boolean
  profile_picture?: string
  timezone?: string
  notification_preferences?: Record<string, boolean>;
  assigned_groups_count: number;
}

export interface Group {
  id: string
  name: string
  status: GroupStatus
  possible_topics?: string
  abstract?: string
  keywords?: string
  description?: string
  rejection_reason?: string
  leader: User | null
  members: User[]
  adviser: User | null
  panels: User[]
  thesis?: Thesis | null
  drive_folder_id?: string
  created_at: string
  updated_at: string
}

export interface TopicProposal {
  id: string
  group: string | Group
  title: string
  abstract: string
  keywords: string[]
  preferred_adviser: User | null
  status: ProposalStatus
  submitted_at?: string
  reviewed_at?: string
  review_comments?: string
  created_at: string
  updated_at: string
}

export interface Thesis {
  id: string
  title: string
  abstract: string
  keywords: string
  group: string | Group
  proposer: User
  status: ThesisStatus
  adviser_feedback?: string
  created_at: string
  updated_at: string
  drive_folder_id?: string
  drive_folder_url?: string
  documents?: Document[]
}

export interface Document {
  id: string
  thesis: string | Thesis
  thesis_detail?: Thesis | null  // Added thesis_detail field
  title: string
  file_path?: string
  google_doc_id?: string
  mime_type?: string
  version: number
  file_size?: number
  uploaded_by: User
  uploaded_at: string
  last_synced?: string
  is_latest: boolean
  parent_version?: string
  // Added missing fields from backend serializer
  document_type: string
  status: 'draft' | 'submitted' | 'revision' | 'approved' | 'rejected'
  provider: string
  is_google_doc: boolean
  google_doc_edit_url?: string
  viewer_url?: string
  doc_embed_url?: string
  last_synced_at?: string
  created_at: string
  updated_at: string
  google_drive_file_id?: string
  file?: string
  file_url?: string
  embed_url?: string
  file_size_display?: string
  versions?: DocumentVersion[]
}

export interface DocumentVersion {
  id: string;
  version: number;
  created_at: string;
  created_by: string | null;
  is_google_doc: boolean;
  google_doc_id: string | null;
}

export interface Schedule {
  id: string;
  thesis: string | Thesis;
  date_time: string;
  location: string;
  status: ScheduleStatus;
  panels: User[];
  notes?: string;
  duration_minutes?: number;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface PanelAvailability {
  id: string
  panel_member: User
  available_date: string
  start_time: string
  end_time: string
  is_available: boolean
  notes?: string
}

export interface ScheduleCandidate {
  thesis_id: string
  proposed_datetime: string
  location: string
  panel_members: number[]
  score: number
  conflicts: string[]
}

export interface ApprovalSheet {
  id: string
  thesis: string | Thesis
  panel_member: User
  decision: 'approved' | 'rejected' | 'needs_revision'
  comments: string
  signature?: string
  approved_at?: string
  created_at: string
  updated_at: string
  attached_file?: string
}

export interface Evaluation {
  id: string
  thesis: string | Thesis
  evaluator: User
  rubric_scores: Record<string, number>
  total_score: number
  comments: string
  submitted_at: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  recipient: User
  type: string  // Backend returns notification_type as a string
  title: string
  body: string
  link?: string
  is_read: boolean
  created_at: string
  read_at?: string
}

export interface ArchiveRecord {
  id: string;
  content_type: 'thesis' | 'document' | 'evaluation' | 'group' | 'user' | 'other';
  original_id: string;
  data: Record<string, any>;
  archived_by: User;
  archived_by_detail?: User;
  reason: string;
  retention_period_years: number;
  archived_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DriveCredential {
  id: string
  name: string
  credential_type: 'oauth'
  client_id?: string
  credentials_json: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DriveFolder {
  id: string
  folder_id: string
  folder_name: string
  parent_folder?: string
  credential: DriveCredential
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
}

// Form data types
export interface GroupFormData {
  name: string
  possible_topics: string
  abstract?: string
  keywords?: string
  description?: string
  adviser_id?: string
  leader_id?: string | number
  member_ids?: (string | number)[]
}

export interface ProposalFormData {
  title: string
  abstract: string
  keywords: string[]
  preferred_adviser_id: number | null
}

export interface ThesisFormData {
  title: string;
  abstract: string;
  keywords: string[];
  group_id: string;
}

export interface ScheduleFormData {
  thesis_id: string
  date_time: string
  location: string
  panel_ids: number[]
  duration_minutes: number
  notes?: string
  status?: ScheduleStatus
}

export interface DocumentUploadData {
  thesis_id: string
  title: string
  file: File
  convert_to_google_doc: boolean
}

export interface ApprovalFormData {
  thesis_id: string
  decision: 'approved' | 'rejected' | 'needs_revision'
  comments: string
  attached_file?: File
}

export interface EvaluationFormData {
  thesis_id: string
  rubric_scores: Record<string, number>
  comments: string
}

// UI State types
export interface LoadingState {
  [key: string]: boolean
}

export interface ErrorState {
  [key: string]: string | null
}

export interface FilterState {
  search?: string
  status?: string
  role?: UserRole
  date_from?: string
  date_to?: string
}

export interface PanelAction {
  id: string;
  schedule: string;
  panel_member: User;
  action: 'approved' | 'needs_revision' | 'rejected';
  action_display: string;
  comments: string;
  created_at: string;
}
