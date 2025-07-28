
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id?: string;
  member_name: string;
  member_age: number;
}

interface RegistrationData {
  team_name: string;
  captain_name: string;
  phone_number: string;
  age_range: string;
  soapbox_name: string;
  design_description: string;
  dimensions: string;
  brakes_steering: string;
  terms_accepted: boolean;
}

interface TeamRegistrationFormProps {
  onSuccess?: () => void;
}

export function TeamRegistrationForm({ onSuccess }: TeamRegistrationFormProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    team_name: '',
    captain_name: '',
    phone_number: '',
    age_range: '',
    soapbox_name: '',
    design_description: '',
    dimensions: '',
    brakes_steering: '',
    terms_accepted: false,
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { member_name: '', member_age: 0 }
  ]);

  useEffect(() => {
    if (user) {
      fetchExistingRegistration();
    }
  }, [user]);

  const fetchExistingRegistration = async () => {
    try {
      const { data: registration, error } = await supabase
        .from('team_registrations')
        .select('*, team_members(*)')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (registration) {
        setExistingRegistration(registration);
        setFormData({
          team_name: registration.team_name,
          captain_name: registration.captain_name,
          phone_number: registration.phone_number,
          age_range: registration.age_range || '',
          soapbox_name: registration.soapbox_name,
          design_description: registration.design_description,
          dimensions: registration.dimensions,
          brakes_steering: registration.brakes_steering,
          terms_accepted: registration.terms_accepted,
        });
        
        if (registration.team_members && registration.team_members.length > 0) {
          setTeamMembers(registration.team_members);
        }
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      age_range: value
    }));
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string | number) => {
    setTeamMembers(prev => 
      prev.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const addMember = () => {
    setTeamMembers(prev => [...prev, { member_name: '', member_age: 0 }]);
  };

  const removeMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File too large. Please select a file smaller than 10MB.");
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Invalid file type. Please select a JPG, PNG, or PDF file.");
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const uploadFile = async () => {
    if (!file || !user) return null;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('team-files')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('team-files')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload file. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const sendNotificationEmail = async (registrationData: any, teamMembers: TeamMember[]) => {
    try {
      const { error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          registrationData,
          teamMembers
        }
      });

      if (error) {
        console.error('Error sending notification email:', error);
        toast.error("Registration saved, but failed to send notification email.");
      } else {
        console.log('Notification email sent successfully');
      }
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate team members
    const validMembers = teamMembers.filter(member => 
      member.member_name.trim() && member.member_age > 0
    );
    
    if (validMembers.length === 0) {
      toast.error("Please add at least one team member.");
      return;
    }
    
    if (!formData.terms_accepted) {
      toast.error("Please accept the terms and conditions.");
      return;
    }
    
    setLoading(true);
    
    try {
      let fileUrl = existingRegistration?.file_url;
      
      // Upload file if selected
      if (file) {
        fileUrl = await uploadFile();
        if (!fileUrl) {
          setLoading(false);
          return;
        }
      }
      
      const registrationData = {
        ...formData,
        user_id: user.id,
        email: user.email!,
        participants_count: validMembers.length,
        file_url: fileUrl,
      };
      
      let registrationId;
      
      if (existingRegistration) {
        // Update existing registration
        const { error } = await supabase
          .from('team_registrations')
          .update(registrationData)
          .eq('id', existingRegistration.id);
        
        if (error) throw error;
        registrationId = existingRegistration.id;
        
        // Delete existing team members
        await supabase
          .from('team_members')
          .delete()
          .eq('registration_id', registrationId);
      } else {
        // Create new registration
        const { data, error } = await supabase
          .from('team_registrations')
          .insert(registrationData)
          .select()
          .single();
        
        if (error) throw error;
        registrationId = data.id;
      }
      
      // Insert team members
      const membersToInsert = validMembers.map(member => ({
        registration_id: registrationId,
        member_name: member.member_name,
        member_age: member.member_age,
      }));
      
      const { error: membersError } = await supabase
        .from('team_members')
        .insert(membersToInsert);
      
      if (membersError) throw membersError;
      
      // Send notification email
      await sendNotificationEmail(registrationData, validMembers);
      
      toast.success(existingRegistration 
        ? "Your team registration has been updated successfully!"
        : "Your team has been registered successfully for the Castle Douglas Soapbox Derby 2026!");
      
      // Call onSuccess callback to trigger redirect
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      toast.error(error.message || "Failed to save registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {existingRegistration ? 'Update Team Registration' : 'Team Registration'}
        </CardTitle>
        <CardDescription>
          Register your team for the Castle Douglas Soapbox Derby 2026
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Team Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Team Name *</Label>
                <Input
                  id="team_name"
                  name="team_name"
                  value={formData.team_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your team name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="captain_name">Team Captain Name *</Label>
                <Input
                  id="captain_name"
                  name="captain_name"
                  value={formData.captain_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter team captain name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age_range">Age Range</Label>
                <Select value={formData.age_range} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under 12">Under 12</SelectItem>
                    <SelectItem value="12-16">12-16</SelectItem>
                    <SelectItem value="17-21">17-21</SelectItem>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Team Members */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
            
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-end space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`member_name_${index}`}>Member Name *</Label>
                  <Input
                    id={`member_name_${index}`}
                    value={member.member_name}
                    onChange={(e) => handleMemberChange(index, 'member_name', e.target.value)}
                    required
                    placeholder="Enter member name"
                  />
                </div>
                
                <div className="w-32 space-y-2">
                  <Label htmlFor={`member_age_${index}`}>Age *</Label>
                  <Input
                    id={`member_age_${index}`}
                    type="number"
                    min="1"
                    max="99"
                    value={member.member_age || ''}
                    onChange={(e) => handleMemberChange(index, 'member_age', parseInt(e.target.value) || 0)}
                    required
                    placeholder="Age"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMember(index)}
                  disabled={teamMembers.length === 1}
                  className="mb-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addMember}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Team Member</span>
            </Button>
          </div>
          
          {/* Soapbox Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Soapbox Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="soapbox_name">Soapbox Name *</Label>
              <Input
                id="soapbox_name"
                name="soapbox_name"
                value={formData.soapbox_name}
                onChange={handleInputChange}
                required
                placeholder="Enter your soapbox name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="design_description">Design Description *</Label>
              <Textarea
                id="design_description"
                name="design_description"
                value={formData.design_description}
                onChange={handleInputChange}
                required
                placeholder="Describe your soapbox design"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dimensions">Estimated Dimensions *</Label>
              <Input
                id="dimensions"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleInputChange}
                required
                placeholder="Length x Width x Height (e.g., 2m x 1m x 0.5m)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brakes_steering">Brakes & Steering Description *</Label>
              <Textarea
                id="brakes_steering"
                name="brakes_steering"
                value={formData.brakes_steering}
                onChange={handleInputChange}
                required
                placeholder="Describe your braking and steering system"
                rows={3}
              />
            </div>
          </div>
          
          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Upload Sketch/Photo</h3>
            
            <div className="space-y-2">
              <Label htmlFor="file">Upload Design Sketch or Photo (JPG, PNG, PDF - Max 10MB)</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {existingRegistration?.file_url && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>File uploaded successfully</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Terms & Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))
                }
              />
              <Label htmlFor="terms" className="text-sm">
                I accept the terms and conditions for the Castle Douglas Soapbox Derby 2026 *
              </Label>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-castle-red hover:bg-red-700 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingRegistration ? 'Update Registration' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
