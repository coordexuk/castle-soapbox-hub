export interface TeamMember {
  id: string;
  name: string;
  age: number;
  created_at: string;
}

export interface TeamRegistration {
  id: string;
  team_name: string;
  captain_name: string;
  contact_email: string;
  contact_phone: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
}

export interface TeamRegistrationWithMembers extends Omit<TeamRegistration, 'members'> {
  members: Array<{
    id: string;
    name: string;
    age: number;
    created_at: string;
  }>;
}

export type SortDirection = 'asc' | 'desc';

export type SortField = keyof Pick<TeamRegistration, 'team_name' | 'captain_name' | 'created_at'>;
