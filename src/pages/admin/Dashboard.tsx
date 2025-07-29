import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamSubmissions } from "@/components/admin/TeamSubmissions";
import { useTeams } from "@/hooks/useTeams";
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

export function Dashboard() {
  const { teams, loading } = useTeams();

  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const submissionsWithDocuments = teams.filter(team => team.documents && team.documents.length > 0).length;
  const pendingSubmissions = teams.filter(team => !team.documents || team.documents.length === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              {totalMembers} total members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : `${submissionsWithDocuments}/${totalTeams}`}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((submissionsWithDocuments / (totalTeams || 1)) * 100)}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : submissionsWithDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Teams with documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Teams without documents
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <TeamSubmissions />
      </div>
    </div>
  );
}
