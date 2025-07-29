import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import { fetchTeamRegistrations, exportToCsv, exportToJson } from '@/services/soapbox';
import type { TeamRegistrationWithMembers, SortField, SortDirection } from '@/types/soapbox';

export function SoapboxDashboard() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const {
    data: registrationsData = { data: [], count: 0, page: 1, pageSize, totalPages: 0 },
    isLoading,
    isError,
    error,
  } = useQuery<{
    data: TeamRegistrationWithMembers[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    queryKey: ['teamRegistrations', { search, sortField, sortDirection, page, pageSize }],
    queryFn: () =>
      fetchTeamRegistrations({
        search,
        sortField,
        sortDirection,
        page,
        pageSize,
      }),
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const handleExportCsv = () => {
    const csv = exportToCsv(registrationsData.data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `soapbox-registrations-${new Date().toISOString()}.csv`);
  };

  const handleExportJson = () => {
    const json = exportToJson(registrationsData.data);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `soapbox-registrations-${new Date().toISOString()}.json`);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load registrations'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight">Soapbox Derby 2026 - Admin Dashboard</h1>
        <div className="flex items-center space-x-2
        ">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search registrations..."
              className="pl-8 sm:w-[300px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJson}>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('team_name')}
              >
                <div className="flex items-center">
                  Team Name
                  <SortIcon field="team_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleSort('captain_name')}
              >
                <div className="flex items-center">
                  Captain
                  <SortIcon field="captain_name" />
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">
                <div 
                  className="flex items-center justify-end cursor-pointer hover:bg-accent"
                  onClick={() => handleSort('created_at')}
                >
                  Registered
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : registrationsData?.data.length ? (
              registrationsData.data.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.team_name}</TableCell>
                  <TableCell>{registration.captain_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{registration.contact_email}</div>
                      <div className="text-sm text-muted-foreground">
                        {registration.contact_phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {registration.members.map((member, i) => (
                        <div key={i} className="text-sm">
                          {member.name} ({member.age})
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {format(new Date(registration.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {registrationsData && registrationsData.count > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
            <strong>
              {Math.min(page * pageSize, registrationsData?.count || 0)}
            </strong>{' '}
            of <strong>{registrationsData?.count}</strong> registrations
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (registrationsData?.totalPages || 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
