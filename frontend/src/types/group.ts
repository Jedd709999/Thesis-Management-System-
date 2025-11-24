export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'adviser' | 'panel' | 'admin';
}

export interface GroupMember extends Pick<User, 'id' | 'first_name' | 'last_name' | 'email'> {}

export interface Group {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  possible_topics: string;
  members: GroupMember[];
  leader?: GroupMember;
  adviser?: GroupMember;
  panels?: GroupMember[];
  created_at: string;
  updated_at: string;
  abstract?: string;
  keywords?: string;
}

export interface GroupFormData {
  name: string;
  possible_topics: string;
  adviser_id: string;
  member_ids: string[];
  leader_id?: string;
  keywords?: string;
}

export interface FormErrors {
  name?: string;
  possible_topics?: string;
  members?: string;
  general?: string;
  [key: string]: string | undefined;
}
