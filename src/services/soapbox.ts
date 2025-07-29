import { supabase } from '@/integrations/supabase/client';
import { TeamRegistration, TeamRegistrationWithMembers, SortDirection, SortField } from '@/types/soapbox';

export const fetchTeamRegistrations = async ({
  search = '',
  sortField = 'created_at',
  sortDirection = 'desc',
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('team_registrations')
    .select('*', { count: 'exact' })
    .order(sortField, { ascending: sortDirection === 'asc' });

  if (search) {
    query = query.or(
      `team_name.ilike.%${search}%,captain_name.ilike.%${search}%,contact_email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching team registrations:', error);
    throw error;
  }

  return {
    data: data as unknown as TeamRegistrationWithMembers[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

export const deleteTeamRegistration = async (id: string) => {
  // First delete team members
  const { error: membersError } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', id);
    
  if (membersError) {
    console.error('Error deleting team members:', membersError);
    throw membersError;
  }
  
  // Then delete the team
  const { error: teamError } = await supabase
    .from('team_registrations')
    .delete()
    .eq('id', id);
    
  if (teamError) {
    console.error('Error deleting team registration:', teamError);
    throw teamError;
  }
};

export const exportToCsv = (data: TeamRegistrationWithMembers[]) => {
  const headers = [
    'Team Name',
    'Captain Name',
    'Contact Email',
    'Contact Phone',
    'File URL',
    'Members',
    'Created At',
  ];

  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const members = row.members
      .map((m) => `${m.name} (${m.age})`)
      .join('; ');

    const values = [
      `"${row.team_name.replace(/"/g, '""')}"`,
      `"${row.captain_name.replace(/"/g, '""')}"`,
      `"${row.contact_email}"`,
      `"${row.contact_phone}"`,
      `"${row.file_url || ''}"`,
      `"${members}"`,
      `"${new Date(row.created_at).toLocaleString()}"`,
    ];

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

export const exportToJson = (data: TeamRegistrationWithMembers[]) => {
  return JSON.stringify(
    data.map((row) => ({
      ...row,
      members: row.members.map(({ id, name, age }) => ({ name, age })),
    })),
    null,
    2
  );
};
