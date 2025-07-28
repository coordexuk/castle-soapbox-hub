
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, Edit, Trophy } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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
        <TeamRegistrationForm />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Derby!</h2>
        <p className="text-gray-600 mb-6">
          You haven't registered your team yet. Click the button below to get started.
        </p>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Register Your Team
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>Edit Registration</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-orange-600" />
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
              <Users className="h-5 w-5 text-blue-600" />
              <span>Team Size</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registration.participants_count}</div>
            <p className="text-sm text-gray-600">participants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Registered</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(registration.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700">Team Name</h4>
              <p className="text-gray-900">{registration.team_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Team Captain</h4>
              <p className="text-gray-900">{registration.captain_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Contact</h4>
              <p className="text-gray-900">{registration.email}</p>
              <p className="text-gray-900">{registration.phone_number}</p>
            </div>
            {registration.age_range && (
              <div>
                <h4 className="font-semibold text-gray-700">Age Range</h4>
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
              <h4 className="font-semibold text-gray-700">Soapbox Name</h4>
              <p className="text-gray-900">{registration.soapbox_name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Dimensions</h4>
              <p className="text-gray-900">{registration.dimensions}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Design Description</h4>
              <p className="text-gray-900 text-sm">{registration.design_description}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700">Brakes & Steering</h4>
              <p className="text-gray-900 text-sm">{registration.brakes_steering}</p>
            </div>
            {registration.file_url && (
              <div>
                <h4 className="font-semibold text-gray-700">Uploaded File</h4>
                <a
                  href={registration.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
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
                    <h4 className="font-semibold text-gray-900">{member.member_name}</h4>
                    <p className="text-sm text-gray-600">Age: {member.member_age}</p>
                  </div>
                  <Badge variant="outline">Member {index + 1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
