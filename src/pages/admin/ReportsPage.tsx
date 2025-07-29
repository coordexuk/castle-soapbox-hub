import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Users, FileSpreadsheet, BarChart2 } from 'lucide-react';

export function ReportsPage() {
  const reports = [
    {
      title: 'Team Roster',
      description: 'Complete list of all registered teams and members',
      icon: <Users className="h-5 w-5" />,
      action: () => console.log('Exporting Team Roster')
    },
    {
      title: 'Age Group Breakdown',
      description: 'Statistics by age group categories',
      icon: <BarChart2 className="h-5 w-5" />,
      action: () => console.log('Exporting Age Group Breakdown')
    },
    {
      title: 'Document Status',
      description: 'Status of all required documents and waivers',
      icon: <FileText className="h-5 w-5" />,
      action: () => console.log('Exporting Document Status')
    },
    {
      title: 'Full Data Export',
      description: 'Complete dataset in CSV format',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      action: () => console.log('Exporting Full Data')
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Exports</h1>
        <p className="text-muted-foreground">
          Generate and download various reports
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {report.title}
              </CardTitle>
              <div className="text-muted-foreground">
                {report.icon}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {report.description}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={report.action}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
