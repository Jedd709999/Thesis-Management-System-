export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'adviser' | 'panel' | 'admin' | 'STUDENT' | 'ADVISER' | 'PANEL' | 'ADMIN';
}

export interface GroupMember extends Pick<User, 'id' | 'first_name' | 'last_name' | 'email'> {}

// Add Thesis interface
export interface Thesis {
  id: string;
  title: string;
  status: string;
  // Add other thesis properties as needed
}

export interface Group {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  possible_topics?: string;
  members: GroupMember[];
  leader?: User;
  adviser?: User;
  panels?: User[];
  created_at: string;
  updated_at: string;
  abstract?: string;
  keywords?: string;
  description?: string;
  // Add thesis property
  thesis?: Thesis;
  // Add progress tracking fields
  proposal_status?: string;
  thesis_progress?: number;
  // Add preferred adviser for pending groups
  preferred_adviser?: User;
}

export interface GroupFormData {
  name: string;
  possible_topics: string;
  adviser_id?: string | null;
  member_ids: (string | number)[];
  leader_id?: string;
  keywords?: string;
  description?: string;
}

export interface FormErrors {
  name?: string;
  possible_topics?: string;
  members?: string;
  general?: string;
  description?: string;
  [key: string]: string | undefined;
}