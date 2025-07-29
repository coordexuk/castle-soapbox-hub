import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamSubmissions } from './TeamSubmissions';
import { Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white shadow-md">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-blue-100 opacity-90 mt-2">Manage team applications and event details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Total Teams" 
          value="24" 
          change="+5 from last week" 
          icon="users"
        />
        <DashboardCard 
          title="Pending Review" 
          value="8" 
          change="2 new today" 
          icon="clock"
          variant="warning"
        />
        <DashboardCard 
          title="Approved" 
          value="12" 
          change="+3 this week" 
          icon="check"
          variant="success"
        />
        <DashboardCard 
          title="Missing Info" 
          value="4" 
          change="Needs attention" 
          icon="alert"
          variant="danger"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamSubmissions />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardCard({ title, value, change, icon, variant = 'default' }) {
  const iconMap = {
    users: <Users className="h-4 w-4 text-muted-foreground" />,
    clock: <Clock className="h-4 w-4 text-amber-500" />,
    check: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    alert: <AlertCircle className="h-4 w-4 text-red-500" />,
  };

  const variantClasses = {
    default: 'bg-white',
    warning: 'bg-amber-50 border-amber-100',
    success: 'bg-green-50 border-green-100',
    danger: 'bg-red-50 border-red-100',
  };

  return (
    <Card className={`${variantClasses[variant]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconMap[icon]}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  );
}
