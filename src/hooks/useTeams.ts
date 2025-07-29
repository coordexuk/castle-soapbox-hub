import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define types based on the actual database schema
interface TeamRegistration {
  id: string;
  user_id: string;
  team_name: string;
  captain_name: string;
  email: string;
  phone_number: string;
  participants_count: number;
  age_range: string;
  soapbox_name: string;
  design_description: string;
  dimensions: string;
  brakes_steering: string;
  file_url?: string;
  terms_accepted: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  registration_id: string;
  member_name: string;
  member_age: number;
  created_at: string;
}

interface TeamDocument {
  id: string;
  name: string;
  url: string;
  created_at: string;
  size?: number;
  type?: string;
}

interface TeamWithMembers extends TeamRegistration {
  members: TeamMember[];
  documents?: TeamDocument[];
  // Computed properties for UI
  team_leader_name: string;
  team_leader_email: string;
  team_leader_phone: string;
  team_size: number;
}

interface UseTeamsReturn {
  teams: TeamWithMembers[];
  loading: boolean;
  error: string | null;
  uploadTeamDocument: (teamId: string, file: File) => Promise<{
    success: boolean;
    file?: TeamDocument;
    error?: string;
    details?: unknown;
  }>;
  refreshTeams: () => Promise<TeamWithMembers[]>;
  updateTeamStatus: (teamId: string, status: 'pending' | 'approved' | 'rejected') => Promise<{
    success: boolean;
    error?: string;
    details?: unknown;
  }>;
}

export function useTeams(): UseTeamsReturn {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch team registrations
      const { data: teamsData, error: teamsError } = await supabase
        .from('team_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;
      if (!teamsData) return [];

      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('*')
            .eq('registration_id', team.id);

          if (membersError) console.error('Error fetching members:', membersError);

          // Fetch documents for each team
          const { data: documents, error: docsError } = await supabase
            .storage
            .from('team-documents')
            .list(team.id);

          const docsWithUrl = await Promise.all(
            (documents || []).map(async (doc) => {
              const { data: { publicUrl } } = supabase
                .storage
                .from('team-documents')
                .getPublicUrl(`${team.id}/${doc.name}`);
              
              return {
                id: doc.id,
                name: doc.name,
                url: publicUrl,
                created_at: doc.created_at,
                size: doc.metadata?.size,
                type: doc.metadata?.mimetype
              };
            })
          );

          const teamSize = team.participants_count || (members?.length || 0) + 1; // +1 for captain
          
          return {
            ...team,
            // Map members to the expected format
            members: members?.map(member => ({
              id: member.id,
              registration_id: member.registration_id,
              member_name: member.member_name,
              member_age: member.member_age,
              created_at: member.created_at
            })) || [],
            documents: docsWithUrl,
            // Add computed properties for UI
            team_leader_name: team.captain_name,
            team_leader_email: team.email,
            team_leader_phone: team.phone_number,
            team_size: teamSize
          } as TeamWithMembers;
        })
      );

      setTeams(teamsWithMembers);
      return teamsWithMembers;
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const uploadTeamDocument = async (teamId: string, file: File): Promise<{
    success: boolean;
    file?: TeamDocument;
    error?: string;
    details?: unknown;
  }> => {
    try {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a PDF, Word, or Excel document.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File is too large. Maximum size is 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
      const filePath = `${teamId}/${fileName}`;

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('team-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          throw new Error('A file with this name already exists. Please rename your file and try again.');
        }
        throw uploadError;
      }

      // Make the file publicly accessible
      const { data: publicUrlData } = supabase.storage
        .from('team-documents')
        .getPublicUrl(filePath);

      // Get file metadata
      const { data: fileData } = await supabase.storage
        .from('team-documents')
        .getPublicUrl(filePath);

      // Update team data with the new document
      setTeams(prevTeams => 
        prevTeams.map(team => {
          if (team.id === teamId) {
            const newDocument: TeamDocument = {
              id: uploadData.path,
              name: file.name,
              url: publicUrlData.publicUrl,
              created_at: new Date().toISOString(),
              size: file.size,
              type: file.type
            };
            return {
              ...team,
              documents: [...(team.documents || []), newDocument]
            } as TeamWithMembers;
          }
          return team;
        })
      );

      return { 
        success: true,
        file: {
          id: uploadData.path,
          name: file.name,
          url: publicUrlData.publicUrl,
          created_at: new Date().toISOString(),
          size: file.size,
          type: file.type
        }
      };
    } catch (err) {
      console.error('Error uploading document:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to upload document',
        details: err
      };
    }
  };

  const updateTeamStatus = async (teamId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('team_registrations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      // Update local state
      setTeams(prevTeams =>
        prevTeams.map(team =>
          team.id === teamId 
            ? { 
                ...team, 
                status,
                updated_at: new Date().toISOString()
              } 
            : team
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error updating team status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update status',
        details: err
      };
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    loading,
    error,
    uploadTeamDocument,
    updateTeamStatus,
    refreshTeams: fetchTeams,
  };
}
