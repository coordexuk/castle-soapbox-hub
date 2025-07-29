import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationsTable } from '@/components/admin/ApplicationsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Filter } from 'lucide-react';

export function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Applications</h1>
          <p className="text-muted-foreground">
            Review and manage all team applications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-7">
          <div className="flex items-center justify-between">
            <CardTitle>Applications</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter applications..."
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem>
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Rejected
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    Incomplete
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ApplicationsTable />
        </CardContent>
      </Card>
    </div>
  );
}
