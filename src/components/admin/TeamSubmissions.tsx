import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Upload, Users, Mail, Phone, Eye, Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useTeams } from '@/hooks/useTeams';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TeamSubmissions() {
  const { 
    teams, 
    loading, 
    error, 
    uploadTeamDocument, 
    refreshTeams,
    updateTeamStatus 
  } = useTeams();
  
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!activeTeam || acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    const file = acceptedFiles[0];
    
    try {
      const result = await uploadTeamDocument(activeTeam, file);
      
      if (result.success) {
        toast.success('Document uploaded successfully', {
          description: `File ${file.name} has been uploaded.`,
          action: result.file?.url ? {
            label: 'View',
            onClick: () => window.open(result.file?.url, '_blank')
          } : undefined,
        });
        
        await refreshTeams();
      } else {
        toast.error('Upload failed', {
          description: result.error || 'An unknown error occurred during upload.',
          action: {
            label: 'Retry',
            onClick: () => onDrop(acceptedFiles)
          },
        });
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Upload failed', {
        description: 'An error occurred while uploading the file.'
      });
    } finally {
      setIsUploading(false);
    }
  }, [activeTeam, uploadTeamDocument, refreshTeams]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    disabled: isUploading || !activeTeam,
  });

  // Filter teams based on search and status
  const filteredTeams = teams.filter(team => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      team.team_name.toLowerCase().includes(searchLower) ||
      team.captain_name.toLowerCase().includes(searchLower) ||
      team.email.toLowerCase().includes(searchLower) ||
      team.phone_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get unique status values for filter
  const statusOptions = ['all', 'pending', 'approved', 'rejected'];
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Team Submissions</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search teams..."
              className="pl-8 w-full md:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Team Leader</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Team Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div className="font-medium">{team.team_name}</div>
                    <div className="text-sm text-gray-500">
                      {team.soapbox_name && `Soapbox: ${team.soapbox_name}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{team.captain_name}</div>
                    <div className="text-sm text-gray-500">{team.phone_number}</div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`mailto:${team.email}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {team.email}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {team.participants_count || 1} {team.participants_count === 1 ? 'member' : 'members'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      team.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : team.status === 'rejected' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {team.status ? (team.status.charAt(0).toUpperCase() + team.status.slice(1)) : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-nowrap">
                      {format(new Date(team.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(team.created_at), 'h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Select 
                        value={team.status || 'pending'}
                        onValueChange={async (newStatus) => {
                          if (!team.id) return;
                          
                          try {
                            setUpdatingStatus(prev => ({ ...prev, [team.id]: true }));
                            const result = await updateTeamStatus(team.id, newStatus as 'pending' | 'approved' | 'rejected');
                            
                            if (result.success) {
                              toast.success(`Status updated to ${newStatus}`);
                            } else {
                              toast.error(result.error || 'Failed to update status');
                            }
                          } catch (err) {
                            console.error('Error updating status:', err);
                            toast.error('An error occurred while updating status');
                          } finally {
                            setUpdatingStatus(prev => ({ ...prev, [team.id]: false }));
                          }
                        }}
                        disabled={updatingStatus[team.id]}
                      >
                        <SelectTrigger className="w-[120px]">
                          {updatingStatus[team.id] ? (
                            <div className="flex items-center">
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Status" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTeam(team.id === activeTeam ? null : team.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {activeTeam === team.id ? 'Hide' : 'View'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No teams found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Team Details Panel */}
      {activeTeam && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Team Members Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Team Captain */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{teams.find(t => t.id === activeTeam)?.captain_name}</h4>
                        <p className="text-sm text-gray-500">Team Captain</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Members */}
                  {teams
                    .find(t => t.id === activeTeam)
                    ?.members?.map((member, index) => (
                      <div key={member.id || index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{member.member_name}</h4>
                            <p className="text-sm text-gray-500">
                              Age: {member.member_age}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onDrop([e.target.files[0]]);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>

                <div 
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <p>Uploading...</p>
                    </div>
                  ) : isDragActive ? (
                    <p>Drop the file here...</p>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Drag and drop a file here, or click to select
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX, XLS, XLSX (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Document List */}
                <div className="mt-4 space-y-2">
                  {teams.find(t => t.id === activeTeam)?.documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.size ? formatFileSize(doc.size) : 'Unknown size'}
                            {doc.type && ` • ${doc.type}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Team Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Soapbox Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Design Description</h4>
                    <p className="mt-1">
                      {teams.find(t => t.id === activeTeam)?.design_description || 'No description provided.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Dimensions</h4>
                    <p className="mt-1">
                      {teams.find(t => t.id === activeTeam)?.dimensions || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Brakes & Steering</h4>
                    <p className="mt-1">
                      {teams.find(t => t.id === activeTeam)?.brakes_steering || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Age Range</h4>
                    <p className="mt-1">
                      {teams.find(t => t.id === activeTeam)?.age_range || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
