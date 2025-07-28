
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, Edit, Trophy, Download } from 'lucide-react';
import { TeamRegistrationForm } from './TeamRegistrationForm';

export function Dashboard() {
  const { user } = useAuth();
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRegistration();
    }
  }, [user]);

  const fetchRegistration = async () => {
    try {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*, team_members(*)')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setRegistration(data);
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchRegistration();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <Button
          onClick={() => setShowForm(false)}
          variant="outline"
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>
        <TeamRegistrationForm onSuccess={handleFormSuccess} />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-castle-red mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-castle-red mb-2">Welcome to the Derby!</h2>
        <p className="text-castle-gray mb-6">
          You haven't registered your team yet. Click the button below to get started.
        </p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-castle-red hover:bg-red-700 text-white"
        >
          Register Your Team
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-castle-red">Team Dashboard</h1>
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="flex items-center space-x-2 border-castle-red text-castle-red hover:bg-castle-red hover:text-white"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Registration</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-castle-red" />
              <span>Team Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(registration.status)}>
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-castle-blue" />
              <span>Team Size</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-castle-red">{registration.participants_count}</div>
            <p className="text-sm text-castle-gray">participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-castle-green" />
              <span>Registered</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-castle-gray">
              {new Date(registration.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-castle-red" />
            <span>Event Documents</span>
          </CardTitle>
          <CardDescription>
            Download important documents for the Castle Douglas Soapbox Derby 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-castle-red">Rules & Regulations</h4>
                  <p className="text-sm text-castle-gray">Official competition rules</p>
                </div>
                <Button variant="outline" size="sm" className="border-castle-red text-castle-red hover:bg-castle-red hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-castle-red">Event Schedule</h4>
                  <p className="text-sm text-castle-gray">Race day timeline</p>
                </div>
                <Button variant="outline" size="sm" className="border-castle-red text-castle-red hover:bg-castle-red hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-castle-red">Safety Guidelines</h4>
                  <p className="text-sm text-castle-gray">Important safety information</p>
                </div>
                <Button variant="outline" size="sm" className="border-castle-red text-castle-red hover:bg-castle-red hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-castle-red">Course Map</h4>
                  <p className="text-sm text-castle-gray">Derby course layout</p>
                </div>
                <Button variant="outline" size="sm" className="border-castle-red text-castle-red hover:bg-castle-red hover:text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-castle-blue" />
            <span>Latest Announcements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-castle-blue/10 border-l-4 border-castle-blue rounded-r-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-castle-blue">Weather Update</h4>
                  <p className="text-sm text-castle-blue/80 mt-1">
                    Current forecast shows clear skies for race day. All systems go!
                  </p>
                </div>
                <span className="text-xs text-castle-blue">2 days ago</span>
              </div>
            </div>
            
            <div className="p-4 bg-castle-green/10 border-l-4 border-castle-green rounded-r-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-castle-green">Registration Deadline Reminder</h4>
                  <p className="text-sm text-castle-green/80 mt-1">
                    Don't forget - final registration deadline is approaching fast!
                  </p>
                </div>
                <span className="text-xs text-castle-green">1 week ago</span>
              </div>
            </div>
            
            <div className="p-4 bg-castle-red/10 border-l-4 border-castle-red rounded-r-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-castle-red">Safety Inspection Required</h4>
                  <p className="text-sm text-castle-red/80 mt-1">
                    All soapboxes must pass safety inspection before race day. Schedule yours now!
                  </p>
                </div>
                <span className="text-xs text-castle-red">1 week ago</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-castle-gray">Team Name</h4>
              <p className="text-castle-red font-medium">{registration.team_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-castle-gray">Team Captain</h4>
              <p className="text-gray-900">{registration.captain_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-castle-gray">Contact</h4>
              <p className="text-gray-900">{registration.email}</p>
              <p className="text-gray-900">{registration.phone_number}</p>
            </div>
            {registration.age_range && (
              <div>
                <h4 className="font-semibold text-castle-gray">Age Range</h4>
                <p className="text-gray-900">{registration.age_range}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soapbox Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-castle-gray">Soapbox Name</h4>
              <p className="text-castle-red font-medium">{registration.soapbox_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-castle-gray">Dimensions</h4>
              <p className="text-gray-900">{registration.dimensions}</p>
            </div>
            <div>
              <h4 className="font-semibold text-castle-gray">Design Description</h4>
              <p className="text-gray-900 text-sm">{registration.design_description}</p>
            </div>
            <div>
              <h4 className="font-semibold text-castle-gray">Brakes & Steering</h4>
              <p className="text-gray-900 text-sm">{registration.brakes_steering}</p>
            </div>
            {registration.file_url && (
              <div>
                <h4 className="font-semibold text-castle-gray">Uploaded File</h4>
                <a
                  href={registration.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-castle-red hover:text-red-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>View File</span>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registration.team_members?.map((member: any, index: number) => (
              <div key={member.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-castle-red">{member.member_name}</h4>
                    <p className="text-sm text-castle-gray">Age: {member.member_age}</p>
                  </div>
                  <Badge variant="outline" className="border-castle-red text-castle-red">Member {index + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
