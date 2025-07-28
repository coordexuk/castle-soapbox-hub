
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Users, Trophy, FileText, Eye } from 'lucide-react';

export function AdminPanel() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchRegistrations();
    }
  }, [profile]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('team_registrations')
        .select('*, team_members(*)')
        .order(sortBy, { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load registrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('team_registrations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Registration status updated to ${status}.`,
      });

      await fetchRegistrations();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update registration status.",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const csvData = registrations.map(reg => ({
      team_name: reg.team_name,
      captain_name: reg.captain_name,
      email: reg.email,
      phone_number: reg.phone_number,
      participants_count: reg.participants_count,
      age_range: reg.age_range,
      soapbox_name: reg.soapbox_name,
      status: reg.status,
      created_at: new Date(reg.created_at).toLocaleDateString(),
      team_members: reg.team_members?.map((m: any) => `${m.member_name} (${m.member_age})`).join('; ') || '',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `derby-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.captain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <Button
          onClick={exportData}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {registrations.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {registrations.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.reduce((sum, r) => sum + r.participants_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search teams, captains, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="team_name">Team Name</SelectItem>
                <SelectItem value="captain_name">Captain Name</SelectItem>
                <SelectItem value="participants_count">Team Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Registrations</CardTitle>
          <CardDescription>
            {filteredRegistrations.length} of {registrations.length} registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div key={registration.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{registration.team_name}</h3>
                    <p className="text-sm text-gray-600">
                      Captain: {registration.captain_name} | {registration.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {registration.phone_number} | 
                      Registered: {new Date(registration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(registration.status)}>
                      {registration.status}
                    </Badge>
                    <Badge variant="outline">
                      {registration.participants_count} members
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Soapbox Details</h4>
                    <p className="text-sm"><strong>Name:</strong> {registration.soapbox_name}</p>
                    <p className="text-sm"><strong>Dimensions:</strong> {registration.dimensions}</p>
                    {registration.age_range && (
                      <p className="text-sm"><strong>Age Range:</strong> {registration.age_range}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Team Members</h4>
                    <div className="space-y-1">
                      {registration.team_members?.map((member: any) => (
                        <p key={member.id} className="text-sm">
                          {member.member_name} (Age: {member.member_age})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    {registration.file_url && (
                      <a
                        href={registration.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-orange-600 hover:text-orange-700"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">View File</span>
                      </a>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={registration.status}
                      onValueChange={(value) => updateRegistrationStatus(registration.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRegistrations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No registrations found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
