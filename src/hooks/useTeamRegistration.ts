import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeamMember {
  member_name: string;
  member_age: number;
  email?: string;
  phone?: string;
  is_team_leader?: boolean;
}

interface RegistrationData {
  team_name: string;
  captain_name: string;
  email: string;
  phone_number: string;
  age_range: string;
  soapbox_name: string;
  design_description: string;
  dimensions: string;
  brakes_steering: string;
  terms_accepted: boolean;
  status?: string;
}

export function useTeamRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submitRegistration = async (
    formData: RegistrationData,
    teamMembers: TeamMember[],
    file?: File
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create the team registration
      const { data: registration, error: regError } = await supabase.rpc('create_team_registration', {
        p_team_name: formData.team_name,
        p_captain_name: formData.captain_name,
        p_email: formData.email,
        p_phone_number: formData.phone_number,
        p_age_range: formData.age_range,
        p_soapbox_name: formData.soapbox_name,
        p_design_description: formData.design_description,
        p_dimensions: formData.dimensions,
        p_brakes_steering: formData.brakes_steering,
        p_members: teamMembers.map(member => ({
          member_name: member.member_name,
          member_age: member.member_age,
          email: member.email || '',
          phone: member.phone || '',
          is_team_leader: member.is_team_leader || false
        }))
      });

      if (regError) throw regError;
      if (!registration) throw new Error('Failed to create registration');

      // 2. Upload file if provided
      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
        const filePath = `${registration.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('team-files')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Update registration with file URL
        const { error: updateError } = await supabase
          .from('team_registrations')
          .update({ file_url: filePath })
          .eq('id', registration.id);
          
        if (updateError) throw updateError;
        
        fileUrl = filePath;
      }

      // 3. Show success and redirect
      toast.success('Registration submitted successfully!', {
        description: 'Your team has been registered for the Castle Douglas Soapbox Derby.'
      });

      return { 
        success: true, 
        registration: { ...registration, file_url: fileUrl } 
      };
      
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error('Registration failed', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitRegistration,
    isSubmitting,
    error
  };
}
