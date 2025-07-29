import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, Search, ArrowUpDown } from 'lucide-react';

type Application = {
  id: string;
  teamName: string;
  captain: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  submittedAt: Date;
  hasFiles: boolean;
  ageGroup: string;
};

type SortField = 'teamName' | 'captain' | 'submittedAt' | 'status';

export function ApplicationsTable() {
  const [sortConfig, setSortConfig] = useState<{
    key: SortField;
    direction: 'asc' | 'desc';
  }>({ key: 'submittedAt', direction: 'desc' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [ageGroupFilter, setAgeGroupFilter] = useState<string[]>([]);

  // Mock data - replace with real data from your API
  const applications: Application[] = [
    // Add your application data here
  ];

  const handleSort = (key: SortField) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredApplications = applications
    .filter(app => 
      app.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.captain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(app => 
      statusFilter.length === 0 || statusFilter.includes(app.status)
    )
    .filter(app =>
      ageGroupFilter.length === 0 || ageGroupFilter.includes(app.ageGroup)
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pending', variant: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', variant: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', variant: 'bg-red-100 text-red-800' },
      incomplete: { label: 'Incomplete', variant: 'bg-gray-100 text-gray-800' },
    };
    
    const { label, variant } = statusMap[status] || { label: status, variant: 'bg-gray-100' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant}`}>{label}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search teams, captains, or emails..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {['pending', 'approved', 'rejected', 'incomplete'].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) => {
                    setStatusFilter(prev =>
                      checked
                        ? [...prev, status]
                        : prev.filter(s => s !== status)
                    );
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('teamName')}
              >
                <div className="flex items-center">
                  Team Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Captain</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('submittedAt')}
              >
                <div className="flex items-center">
                  Submitted
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.teamName}</TableCell>
                <TableCell>{app.captain}</TableCell>
                <TableCell>{app.ageGroup}</TableCell>
                <TableCell>
                  {new Date(app.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
