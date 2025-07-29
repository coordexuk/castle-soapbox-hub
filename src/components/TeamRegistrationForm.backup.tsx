
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
import { useAuth } from '@/hooks/useAuth';

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

export function TeamRegistrationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitRegistration, isSubmitting } = useTeamRegistration();
  
  const [formData, setFormData] = useState<FormData>({
    team_name: '',
    captain_name: user?.profile?.full_name || user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone_number: user?.profile?.phone || user?.user_metadata?.phone || '',
    age_range: '',
    soapbox_name: '',
    design_description: '',
    dimensions: '',
    brakes_steering: 'No',
    terms_accepted: false,
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (!user?.email) return [];
    
    return [{
      member_name: user.profile?.full_name || user.user_metadata?.full_name || 'Team Captain',
      member_age: 18,
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
        captain_name: user.profile?.full_name || user.user_metadata?.full_name || ''
      }));
      
      setTeamMembers(prev => {
        if (prev.length === 1 && prev[0].is_team_leader) {
          return [{
            ...prev[0],
            email: user.email,
            member_name: user.profile?.full_name || user.user_metadata?.full_name || ''
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
    
    try {
      setIsLoading(true);
      
      const updatedTeamMembers = teamMembers.map(member => 
        member.is_team_leader 
          ? { ...member, member_name: formData.captain_name }
          : member
      );
      
      const result = await submitRegistration(formData, updatedTeamMembers, file || undefined);
      
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Team Registration</h1>
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
            >
              {isSubmitting || isLoading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
