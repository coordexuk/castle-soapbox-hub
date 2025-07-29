import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamRegistration } from '@/hooks/useTeamRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  member_name: string;
  member_age: number;
  email?: string;
  phone?: string;
  is_team_leader?: boolean;
}

interface FormData {
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

import { useAuth as useAppAuth, type UserProfile } from '@/hooks/useAuth';

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
  };
  profile?: {
    full_name?: string | null;
    phone?: string | null;
    role?: 'user' | 'admin';
  };
}

const useAuth = (): { user: AuthUser | null } => {
  const { user, profile } = useAppAuth();
  
  if (!user) return { user: null };
  
  return {
    user: {
      id: user.id,
      email: user.email || '',
      user_metadata: {
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        phone: user.user_metadata?.phone || null
      },
      profile: {
        full_name: profile?.full_name || null,
        phone: profile?.phone || null,
        role: profile?.role || 'user'
      }
    }
  };
};

export function TeamRegistrationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitRegistration, isSubmitting } = useTeamRegistration();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to register a team');
      navigate('/login', { state: { from: '/register' } });
    }
  }, [user, navigate]);
  
  const [formData, setFormData] = useState<FormData>(() => ({
    team_name: '',
    captain_name: user?.profile?.full_name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone_number: user?.profile?.phone || user?.user_metadata?.phone || '',
    age_range: '', // Not stored in profile yet
    soapbox_name: '',
    design_description: '',
    dimensions: '',
    brakes_steering: 'No',
    terms_accepted: false,
  }));
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    // Only pre-fill if we have a user
    if (!user?.email) return [];
    
    return [{
      member_name: user.profile?.full_name || user.user_metadata?.full_name || 'Team Captain',
      member_age: 18, // Default age, can be updated
      email: user.email,
      phone: user.profile?.phone || user.user_metadata?.phone || '',
      is_team_leader: true
    }];
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const initialMember: TeamMember = {
    member_name: '',
    member_age: 18,
    email: '',
    phone: '',
    is_team_leader: false
  };
  
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        captain_name: user.user_metadata?.full_name || ''
      }));
      
      setTeamMembers(prev => {
        if (prev.length === 1 && prev[0].is_team_leader) {
          return [{
            ...prev[0],
            email: user.email,
            member_name: user.user_metadata?.full_name || ''
          }];
        }
        return prev;
      });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleMemberChange = (index: number, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => {
      const updatedMembers = [...prev];
      updatedMembers[index] = { 
        ...updatedMembers[index], 
        [field]: field === 'member_age' ? Number(value) : value 
      };
      
      if (field === 'is_team_leader' && value) {
        updatedMembers.forEach((member, i) => {
          if (i !== index && member.is_team_leader) {
            updatedMembers[i] = { ...member, is_team_leader: false };
          }
        });
      }
      
      return updatedMembers;
    });
  };
  
  const addTeamMember = () => {
    if (teamMembers.length >= 6) {
      toast.error('Maximum of 6 team members allowed');
      return;
    }
    setTeamMembers(prev => [...prev, { ...initialMember }]);
  };
  
  const removeTeamMember = (index: number) => {
    if (teamMembers.length <= 1) {
      toast.error('At least one team member is required');
      return;
    }
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileError('Please upload a PDF, JPG, or PNG file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      return;
    }
    
    setFile(file);
    setFileError('');
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.terms_accepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    if (teamMembers.length === 0) {
      toast.error('Please add at least one team member');
      return;
    }
    
    const hasCaptain = teamMembers.some(member => member.is_team_leader);
    if (!hasCaptain) {
      toast.error('Please designate a team captain');
      return;
    }
    
    const submissionData = {
      ...formData,
      user_id: user?.id, // Add user ID to track who submitted
      submitted_at: new Date().toISOString(),
      // Include profile completion status
      profile_complete: !!(user?.profile?.phone || user?.user_metadata?.phone)
    };
    
    try {
      setIsLoading(true);
      
      const updatedTeamMembers = teamMembers.map(member => 
        member.is_team_leader 
          ? { ...member, member_name: formData.captain_name }
          : member
      );
      
      const formDataToSubmit = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSubmit.append(key, String(value));
        }
      });
      
      formDataToSubmit.append('team_members', JSON.stringify(updatedTeamMembers));
      
      if (file) {
        formDataToSubmit.append('design_file', file);
      }
      
      const result = await submitRegistration(formDataToSubmit);
      
      if (result?.success) {
        toast.success('Team registration submitted successfully!');
        navigate('/dashboard');
      } else if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderTeamInfoSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Team Information</CardTitle>
        <CardDescription>Enter your team details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team_name">Team Name *</Label>
            <Input
              id="team_name"
              name="team_name"
              value={formData.team_name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="captain_name">Captain's Name *</Label>
            <Input
              id="captain_name"
              name="captain_name"
              value={formData.captain_name}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={!!user?.email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
            />
          </div>
<<<<<<< Updated upstream
          
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
=======
        </div>
        <div className="space-y-2">
          <Label>Age Range *</Label>
          <Select
            value={formData.age_range}
            onValueChange={(value) => handleSelectChange(value, 'age_range')}
            required
>>>>>>> Stashed changes
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under_18">Under 18</SelectItem>
              <SelectItem value="18_25">18-25</SelectItem>
              <SelectItem value="26_35">26-35</SelectItem>
              <SelectItem value="36_50">36-50</SelectItem>
              <SelectItem value="over_50">50+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderTeamMembersSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Add up to 5 additional team members (including yourself)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">
                {member.is_team_leader ? 'Team Captain' : `Team Member ${index + 1}`}
              </h3>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeamMember(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`member_name_${index}`}>Name *</Label>
                <Input
                  id={`member_name_${index}`}
                  value={member.member_name}
                  onChange={(e) => handleMemberChange(index, 'member_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`member_age_${index}`}>Age *</Label>
                <Input
                  id={`member_age_${index}`}
                  type="number"
                  min="1"
                  max="120"
                  value={member.member_age}
                  onChange={(e) => handleMemberChange(index, 'member_age', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`member_email_${index}`}>Email</Label>
                <Input
                  id={`member_email_${index}`}
                  type="email"
                  value={member.email || ''}
                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`member_phone_${index}`}>Phone</Label>
                <Input
                  id={`member_phone_${index}`}
                  type="tel"
                  value={member.phone || ''}
                  onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`is_team_leader_${index}`}
                checked={member.is_team_leader || false}
                onCheckedChange={(checked) => handleMemberChange(index, 'is_team_leader', checked)}
              />
              <Label htmlFor={`is_team_leader_${index}`} className="font-normal">
                Team Captain
              </Label>
            </div>
          </div>
        ))}
        
        {teamMembers.length < 6 && (
          <Button
            type="button"
            variant="outline"
            onClick={addTeamMember}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </CardContent>
    </Card>
  );
  
  const renderDesignDetailsSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Design Details</CardTitle>
        <CardDescription>Tell us about your soapbox design</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="soapbox_name">Soapbox Name *</Label>
          <Input
            id="soapbox_name"
            name="soapbox_name"
            value={formData.soapbox_name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="design_description">Design Description *</Label>
          <Textarea
            id="design_description"
            name="design_description"
            value={formData.design_description}
            onChange={handleInputChange}
            rows={4}
            required
            placeholder="Describe your soapbox design, materials, and any special features..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions (L x W x H) *</Label>
            <Input
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              placeholder="e.g., 2m x 1m x 1.5m"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Brakes & Steering *</Label>
            <Select
              value={formData.brakes_steering}
              onValueChange={(value) => handleSelectChange(value, 'brakes_steering')}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Upload Design (Optional)</Label>
          <div className="flex items-center space-x-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, JPG, or PNG (max. 10MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
            
            {filePreview && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={filePreview}
                  alt="Design preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          {fileError && <p className="text-sm text-red-500">{fileError}</p>}
          
          {file && !fileError && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  
  const renderTermsSection = () => (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              name="terms_accepted"
              checked={formData.terms_accepted}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, terms_accepted: !!checked }))
              }
              required
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terms" className="font-normal">
                I agree to the{' '}
                <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </Label>
              <p className="text-sm text-muted-foreground">
                You must accept the terms and conditions to proceed with your registration.
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Team Registration</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {renderTeamInfoSection()}
        {renderTeamMembersSection()}
        {renderDesignDetailsSection()}
        {renderTermsSection()}
      </form>
    </div>
  );
}
