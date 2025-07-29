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

// Simple auth context for development - replace with your actual auth implementation
const useAuth = () => ({
  user: {
    email: 'user@example.com',
    user_metadata: {
      full_name: 'Test User'
    }
  }
});

export function TeamRegistrationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitRegistration, isSubmitting } = useTeamRegistration();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    team_name: '',
    captain_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone_number: '',
    age_range: '',
    soapbox_name: '',
    design_description: '',
    dimensions: '',
    brakes_steering: 'No',
    terms_accepted: false,
  });
  
  // Team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { 
      member_name: user?.user_metadata?.full_name || '',
      member_age: 18,
      email: user?.email,
      is_team_leader: true 
    }
  ]);
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initial member template
  const initialMember: TeamMember = {
    member_name: '',
    member_age: 18,
    email: '',
    phone: '',
    is_team_leader: false
  };
  
  // Sync user data on mount
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        captain_name: user.user_metadata?.full_name || ''
      }));
      
      // Update captain info if needed
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
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (value: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle team member changes
  const handleMemberChange = (index: number, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => {
      const updatedMembers = [...prev];
      updatedMembers[index] = { 
        ...updatedMembers[index], 
        [field]: field === 'member_age' ? Number(value) : value 
      };
      
      // If making this member the team leader, unset any existing team leader
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
  
  // Add a new team member
  const addTeamMember = () => {
    if (teamMembers.length >= 6) {
      toast.error('Maximum of 6 team members allowed');
      return;
    }
    
    setTeamMembers(prev => [...prev, { ...initialMember }]);
  };
  
  // Remove a team member
  const removeTeamMember = (index: number) => {
    if (teamMembers.length <= 1) {
      toast.error('At least one team member is required');
      return;
    }
    
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileError('Please upload a PDF, JPG, or PNG file');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      return;
    }
    
    setFile(file);
    setFileError('');
    
    // Create preview for images
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
  
  // Handle file upload for submission
  const handleFileUpload = async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    
    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // File upload logic will be handled by the useTeamRegistration hook
      return fileName;
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.terms_accepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    // Validate team members
    if (teamMembers.length === 0) {
      toast.error('Please add at least one team member');
      return;
    }
    
    // Check if captain is set
    const hasCaptain = teamMembers.some(member => member.is_team_leader);
    if (!hasCaptain) {
      toast.error('Please designate a team captain');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update captain name from form data
      const updatedTeamMembers = teamMembers.map(member => 
        member.is_team_leader 
          ? { ...member, member_name: formData.captain_name }
          : member
      );
      
      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSubmit.append(key, String(value));
        }
      });
      
      // Append team members as JSON
      formDataToSubmit.append('team_members', JSON.stringify(updatedTeamMembers));
      
      // Append file if exists
      if (file) {
        formDataToSubmit.append('design_file', file);
      }
      
      // Submit the form
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.terms_accepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    // Validate team members
    if (teamMembers.length === 0) {
      toast.error('Please add at least one team member');
      return;
    }
    
    // Check if captain is set
    const hasCaptain = teamMembers.some(member => member.is_team_leader);
    if (!hasCaptain) {
      toast.error('Please designate a team captain');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update captain name from form data
      const updatedTeamMembers = teamMembers.map(member => 
        member.is_team_leader 
          ? { ...member, member_name: formData.captain_name }
          : member
      );
      
      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSubmit.append(key, String(value));
        }
      });
      
      // Append team members as JSON
      formDataToSubmit.append('team_members', JSON.stringify(updatedTeamMembers));
      
      // Append file if exists
      if (file) {
        formDataToSubmit.append('design_file', file);
      }
      
      // Submit the form
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
  };


        [field]: field === 'member_age' ? Number(value) : value
      };
      
      return updatedMembers;
    });
  };

  // Add a new team member
  const addTeamMember = () => {
    if (teamMembers.length < 6) {
      setTeamMembers(prev => [...prev, { 
        member_name: '',
        member_age: 18,
        email: '',
        phone: '',
        is_team_leader: false 
      }]);
    } else {
      toast.error('Maximum of 6 team members allowed');
    }
  };

  // Remove a team member
  const removeTeamMember = (index: number) => {
    if (teamMembers.length <= 1) return;
    
    const memberToRemove = teamMembers[index];
    if (memberToRemove.is_team_leader) {
      toast.error('Cannot remove the team captain. Please assign a new captain first.');
      return;
    }
    
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setFileError('Please upload a PDF, JPG, or PNG file');
      return;
    }
    
    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setFileError('');
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  // Render the form
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Team Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Information Section */}
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
                <Label htmlFor="captain_name">Team Captain Name *</Label>
                <Input
                  id="captain_name"
                  name="captain_name"
                  value={formData.captain_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
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
              
              <div className="space-y-2">
                <Label htmlFor="age_range">Age Range *</Label>
                <Select 
                  value={formData.age_range}
                  onValueChange={(value) => handleSelectChange(value, 'age_range')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_16">Under 16</SelectItem>
                    <SelectItem value="16_18">16-18</SelectItem>
                    <SelectItem value="19_25">19-25</SelectItem>
                    <SelectItem value="26_35">26-35</SelectItem>
                    <SelectItem value="36_50">36-50</SelectItem>
                    <SelectItem value="51_plus">51+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Add up to 5 additional team members (including yourself)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">
                    {member.is_team_leader ? 'Team Captain' : `Team Member ${index + 1}`}
                  </h4>
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
                    <Label htmlFor={`member_name_${index}`}>
                      {member.is_team_leader ? 'Captain Name' : 'Member Name'} *
                    </Label>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor={`member_email_${index}`}>Email</Label>
                    <Input
                      id={`member_email_${index}`}
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      disabled={member.is_team_leader && !!user?.email}
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
                  
                  {!member.is_team_leader && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`is_team_leader_${index}`}
                        checked={!!member.is_team_leader}
                        onCheckedChange={(checked) => handleMemberChange(index, 'is_team_leader', !!checked)}
                      />
                      <Label htmlFor={`is_team_leader_${index}`} className="text-sm font-medium">
                        Team Captain
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addTeamMember}
              disabled={teamMembers.length >= 6}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>

        {/* Design Details Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
            <CardDescription>Tell us about your soapbox design</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="dimensions">Dimensions (L x W x H in cm) *</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  placeholder="e.g., 200x100x80"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="design_description">Design Description *</Label>
              <Textarea
                id="design_description"
                name="design_description"
                value={formData.design_description}
                onChange={handleInputChange}
                placeholder="Describe your soapbox design, materials, and any special features..."
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Brakes & Steering *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="brakes_steering_yes"
                    name="brakes_steering"
                    value="Yes"
                    checked={formData.brakes_steering === 'Yes'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="brakes_steering_yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="brakes_steering_no"
                    name="brakes_steering"
                    value="No"
                    checked={formData.brakes_steering === 'No'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="brakes_steering_no">No</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Design File (Optional)</Label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="design_file"
                  className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="design_file"
                    name="design_file"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, or PNG up to 10MB
              </p>
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
              {filePreview && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Preview:</p>
                  <img 
                    src={filePreview} 
                    alt="Design preview" 
                    className="mt-2 max-h-40 rounded border"
                  />
                </div>
              )}
              {file && !filePreview && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms and Submit */}
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
              <Label htmlFor="terms" className="text-sm font-medium leading-none">
                I agree to the terms and conditions *
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this box, you confirm that all information provided is accurate and you agree to the event rules.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full sm:w-auto"
}

interface FormData {
  team_name: string;
  captain_name: string;
  email: string;
  phone_number: string;
  age_range: string;
  soapbox_name: string;
  dimensions: string;
  design_description: string;
  brakes_steering: string;
  design_file: File | null;
  terms_accepted: boolean;
}

interface User {
  email: string;
}

const TeamRegistrationForm = () => {
  const [formData, setFormData] = React.useState<FormData>({
    team_name: '',
    captain_name: '',
    email: '',
    phone_number: '',
    age_range: '',
    soapbox_name: '',
    dimensions: '',
    design_description: '',
    brakes_steering: '',
    design_file: null,
    terms_accepted: false,
  });

  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([
    {
      member_name: '',
      member_age: 0,
      email: '',
      phone: '',
      is_team_leader: true,
    },
  ]);

  const [fileError, setFileError] = React.useState<string | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const user: User = { email: 'user@example.com' };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFormData((prevFormData) => ({ ...prevFormData, design_file: event.target.files[0] }));
      setFilePreview(URL.createObjectURL(event.target.files[0]));
    }
  };

  const handleMemberChange = (index: number, field: string, value: string | number) => {
    setTeamMembers((prevTeamMembers) =>
      prevTeamMembers.map((member, i) => (i === index ? { ...member, [field]: value } : member))
    );
  };

  const addMember = () => {
    setTeamMembers((prevTeamMembers) => [
      ...prevTeamMembers,
      {
        member_name: '',
        member_age: 0,
        email: '',
        phone: '',
        is_team_leader: false,
      },
    ]);
  };

  const removeMember = (index: number) => {
    setTeamMembers((prevTeamMembers) => prevTeamMembers.filter((_, i) => i !== index));
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
            <Label htmlFor="captain_name">Captain Name *</Label>
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
              disabled={!!user.email}
              required
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="age_range">Age Range *</Label>
          <Select
            value={formData.age_range}
            onValueChange={(value) => handleSelectChange(value, 'age_range')}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="13-17">13-17</SelectItem>
              <SelectItem value="18-25">18-25</SelectItem>
              <SelectItem value="26-35">26-35</SelectItem>
              <SelectItem value="36-45">36-45</SelectItem>
              <SelectItem value="46+">46+</SelectItem>
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
              <h4 className="font-medium">
                {member.is_team_leader ? 'Team Captain' : `Team Member ${index + 1}`}
              </h4>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`member_name_${index}`}>
                  {member.is_team_leader ? 'Captain Name' : 'Member Name'} *
                </Label>
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
                  onChange={(e) => handleMemberChange(index, 'member_age', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`member_email_${index}`}>Email</Label>
                <Input
                  id={`member_email_${index}`}
                  type="email"
                  value={member.email || ''}
                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                  disabled={member.is_team_leader && !!user?.email}
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
              
              {!member.is_team_leader && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`is_team_leader_${index}`}
                    checked={!!member.is_team_leader}
                    onCheckedChange={(checked) => handleMemberChange(index, 'is_team_leader', !!checked)}
                  />
                  <Label htmlFor={`is_team_leader_${index}`} className="text-sm font-medium">
                    Team Captain
                  </Label>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addMember}
          disabled={teamMembers.length >= 6}
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="dimensions">Dimensions (L x W x H in cm) *</Label>
            <Input
              id="dimensions"
              name="dimensions"
              placeholder="e.g., 200x100x80"
              value={formData.dimensions}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="design_description">Design Description *</Label>
          <Textarea
            id="design_description"
            name="design_description"
            value={formData.design_description}
            onChange={handleInputChange}
            placeholder="Describe your soapbox design, materials, and any special features..."
            className="min-h-[100px]"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Brakes & Steering *</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="brakes_steering_yes"
                name="brakes_steering"
                value="Yes"
                checked={formData.brakes_steering === 'Yes'}
                onChange={() => setFormData(prev => ({ ...prev, brakes_steering: 'Yes' }))}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label htmlFor="brakes_steering_yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="brakes_steering_no"
                name="brakes_steering"
                value="No"
                checked={formData.brakes_steering === 'No'}
                onChange={() => setFormData(prev => ({ ...prev, brakes_steering: 'No' }))}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label htmlFor="brakes_steering_no">No</Label>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Design File (Optional)</Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
              {fileError && (
                <p className="text-sm text-red-500">{fileError}</p>
              )}
              {filePreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-900">{file?.name}</p>
                  {filePreview.startsWith('data:image/') && (
                    <img
                      src={filePreview}
                      alt="Design preview"
                      className="mt-2 max-h-40 max-w-full rounded-md"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTermsSection = () => (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms_accepted"
            checked={formData.terms_accepted}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, terms_accepted: !!checked }))
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="terms_accepted" className="text-sm font-medium">
              I agree to the terms and conditions *
            </Label>
            <p className="text-sm text-gray-500">
              By checking this box, you acknowledge that you have read and agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSubmitButton = () => (
    <div className="flex justify-end">
      <Button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full sm:w-auto"
      >
        {isSubmitting || isLoading ? 'Submitting...' : 'Submit Registration'}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Team Registration</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="captain_name">Captain Name *</Label>
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
                  disabled={!!user?.email}
                  required
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range *</Label>
              <Select 
                value={formData.age_range} 
                onValueChange={(value) => handleSelectChange(value, 'age_range')}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="13-17">13-17</SelectItem>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46+">46+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Add up to 5 additional team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {member.is_team_leader ? 'Team Captain' : `Team Member ${index + 1}`}
                  </h3>
                  {!member.is_team_leader && (
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
                    <Label htmlFor={`member_name_${index}`}>
                      {member.is_team_leader ? 'Captain Name' : 'Member Name'} *
                    </Label>
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
                      min="13"
                      value={member.member_age}
                      onChange={(e) => handleMemberChange(index, 'member_age', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`member_email_${index}`}>Email</Label>
                    <Input
                      id={`member_email_${index}`}
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      disabled={member.is_team_leader}
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
                
                {!member.is_team_leader && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`is_team_leader_${index}`}
                      checked={!!member.is_team_leader}
                      onCheckedChange={(checked) => handleMemberChange(index, 'is_team_leader', !!checked)}
                    />
                    <Label htmlFor={`is_team_leader_${index}`} className="font-normal">
                      Make Team Captain
                    </Label>
                  </div>
                )}
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
            <CardDescription>Tell us about your soapbox design</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="dimensions">Dimensions (L x W x H) *</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleInputChange}
                  placeholder="e.g., 6ft x 3ft x 4ft"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="design_description">Design Description *</Label>
              <Textarea
                id="design_description"
                name="design_description"
                value={formData.design_description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your soapbox design, materials, and any special features..."
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
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No brakes or steering</SelectItem>
                  <SelectItem value="Brakes only">Brakes only</SelectItem>
                  <SelectItem value="Steering only">Steering only</SelectItem>
                  <SelectItem value="Both">Both brakes and steering</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Design File (Optional)</Label>
              <div className="flex items-center space-x-4">
                <Label
                  htmlFor="design_file"
                  className="flex-1 cursor-pointer border rounded-md p-4 flex flex-col items-center justify-center space-y-2 hover:bg-accent/50"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">
                    {file ? 'Change file' : 'Upload design file (PDF, JPG, PNG up to 10MB)'}
                  </span>
                  {file && <span className="text-xs text-muted-foreground">{file.name}</span>}
                  <Input
                    id="design_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
                
                {filePreview && (
                  <div className="w-24 h-24 border rounded-md overflow-hidden">
                    <img
                      src={filePreview}
                      alt="Design preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              <p className="text-xs text-muted-foreground">
                Upload a design sketch, CAD file, or photo of your soapbox design.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
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
              <div className="space-y-1">
                <Label htmlFor="terms" className="font-normal">
                  I agree to the terms and conditions *
                </Label>
                <p className="text-sm text-muted-foreground">
                  By checking this box, you confirm that all information provided is accurate and you agree to the event rules and regulations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full sm:w-auto"
          >
            {isSubmitting || isLoading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
};

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
            <Label htmlFor="captain_name">Team Captain Name *</Label>
            <Input
              id="captain_name"
              name="captain_name"
              value={formData.captain_name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
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
          
          <div className="space-y-2">
            <Label htmlFor="age_range">Age Range *</Label>
            <Select
              name="age_range"
              value={formData.age_range}
              onValueChange={(value) => handleInputChange({ target: { name: 'age_range', value } })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-18">Under 18</SelectItem>
                <SelectItem value="18-25">18-25</SelectItem>
                <SelectItem value="26-35">26-35</SelectItem>
                <SelectItem value="36-50">36-50</SelectItem>
                <SelectItem value="51+">51+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Team Members */}
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Add up to 5 additional team members (including yourself)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">
                {member.is_team_leader ? 'Team Captain' : `Team Member ${index}`}
              </h3>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeamMember(index)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`member_name_${index}`}>
                  {member.is_team_leader ? 'Captain' : 'Member'} Name *
                </Label>
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
                  value={member.member_age}
                  onChange={(e) => handleMemberChange(index, 'member_age', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              
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
                checked={member.is_team_leader}
                onCheckedChange={(checked) => handleMemberChange(index, 'is_team_leader', checked === true)}
                disabled={member.is_team_leader}
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
    
    {/* Design Details */}
    <Card>
      <CardHeader>
        <CardTitle>Design Details</CardTitle>
        <CardDescription>Tell us about your soapbox design</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="soapbox_name">Soapbox Name</Label>
          <Input
            id="soapbox_name"
            name="soapbox_name"
            value={formData.soapbox_name}
            onChange={handleInputChange}
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
        
        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions (L x W x H) *</Label>
          <Input
            id="dimensions"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleInputChange}
            placeholder="e.g., 2.5m x 1.2m x 1.5m"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brakes_steering">Brakes & Steering *</Label>
          <Textarea
            id="brakes_steering"
            name="brakes_steering"
            value={formData.brakes_steering}
            onChange={handleInputChange}
            rows={2}
            required
            placeholder="Describe your braking and steering system..."
          />
        </div>
        
        <div className="space-y-2">
          <Label>Design Sketch (Optional)</Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
          </div>
          {fileError && (
            <p className="mt-1 text-sm text-red-600">{fileError}</p>
          )}
          {file && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    
    {/* Terms and Conditions */}
    <Card>
      <CardHeader>
        <CardTitle>Terms and Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms_accepted"
            checked={formData.terms_accepted}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, terms_accepted: checked === true })
            }
            required
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms_accepted"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{' '}
              <a href="/terms" className="text-primary-600 hover:underline">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>
              . *
            </label>
            <p className="text-sm text-gray-500">
              By checking this box, you confirm that all information provided is accurate and
              that you have read and agree to the competition rules.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Submit Button */}
    <div className="flex justify-end">
      <Button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="w-full sm:w-auto"
      >
        {isSubmitting || isLoading ? (
          <>
            <span className="mr-2">Submitting...</span>
          </>
        ) : (
          'Submit Registration'
        )}
      </Button>
    </div>
  </form>
</div>
