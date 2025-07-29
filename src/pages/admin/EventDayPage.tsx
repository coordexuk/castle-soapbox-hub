import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, FileText, Printer, CheckCircle2, XCircle, Download, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateTeamListPDF, generateRaceSchedulePDF, generateRulesPDF } from '@/lib/pdfService';
import { toast } from 'sonner';

export type Team = {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  contactNumber: string;
  checkedIn: boolean;
  checkInTime?: string;
};

export type RaceHeat = {
  id: string;
  time: string;
  track: string;
  team1: string;
  team2: string;
  completed: boolean;
};

const mockTeams: Team[] = [
  { id: '1', name: 'Team Rocket', category: 'Youth', checkedIn: true, checkInTime: '08:30 AM', contactPerson: 'Ash Ketchum', contactNumber: '555-0123' },
  { id: '2', name: 'Speed Demons', category: 'Adult', checkedIn: false, contactPerson: 'Barry Allen', contactNumber: '555-0456' },
  { id: '3', name: 'Gravity Racers', category: 'Family', checkedIn: true, checkInTime: '09:15 AM', contactPerson: 'Sarah Connor', contactNumber: '555-0789' },
  { id: '4', name: 'The A-Team', category: 'Adult', checkedIn: false, contactPerson: 'John Smith', contactNumber: '555-0321' },
];

const mockSchedule: RaceHeat[] = [
  { id: '1', time: '10:00 AM', team1: 'Team Rocket', team2: 'Speed Demons', track: 'Track 1', completed: false },
  { id: '2', time: '10:15 AM', team1: 'Gravity Racers', team2: 'The A-Team', track: 'Track 2', completed: false },
  { id: '3', time: '10:30 AM', team1: 'Team Rocket', team2: 'The A-Team', track: 'Track 1', completed: false },
  { id: '4', time: '10:45 AM', team1: 'Speed Demons', team2: 'Gravity Racers', track: 'Track 2', completed: false },
];

export function EventDayPage() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [schedule, setSchedule] = useState<RaceHeat[]>(mockSchedule);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('checkin');

  const handleCheckIn = (teamId: string) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { ...team, checkedIn: true, checkInTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
        : team
    ));
  };

  const markHeatComplete = (heatId: string) => {
    setSchedule(schedule.map(heat => 
      heat.id === heatId ? { ...heat, completed: true } : heat
    ));
  };

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [printFormat, setPrintFormat] = useState('standard');
  const [documentType, setDocumentType] = useState('Full Rulebook');

  const handlePrintMaterials = (type: 'teams' | 'schedule' | 'rules') => {
    try {
      switch (type) {
        case 'teams':
          const teamsToPrint = selectedTeams.size > 0 
            ? teams.filter(team => selectedTeams.has(team.id))
            : teams;
          
          if (teamsToPrint.length === 0) {
            toast.warning('No teams selected');
            return;
          }
          
          generateTeamListPDF(
            teamsToPrint,
            selectedTeams.size > 0 ? 'Selected Teams' : 'All Teams'
          );
          break;
          
        case 'schedule':
          generateRaceSchedulePDF(
            schedule,
            `Race Schedule - ${printFormat === 'standard' ? 'Standard' : 'Detailed'}`
          );
          break;
          
        case 'rules':
          generateRulesPDF(documentType);
          break;
      }
      
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  const toggleTeamSelection = (teamId: string) => {
    const newSelection = new Set(selectedTeams);
    if (newSelection.has(teamId)) {
      newSelection.delete(teamId);
    } else {
      newSelection.add(teamId);
    }
    setSelectedTeams(newSelection);
  };
  
  const selectAllTeams = () => {
    if (selectedTeams.size === teams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(teams.map(team => team.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Event Day Management</h1>
        <p className="text-muted-foreground">
          Tools and resources for managing the event day
        </p>
      </div>

      <Tabs defaultValue="checkin" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkin">
            <Users className="w-4 h-4 mr-2" />
            Team Check-in
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Race Schedule
          </TabsTrigger>
          <TabsTrigger value="print">
            <Printer className="w-4 h-4 mr-2" />
            Print Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Check-in</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage team check-ins and attendance
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    className="pl-8"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      setTeams(
                        mockTeams.filter(team => 
                          team.name.toLowerCase().includes(searchTerm) ||
                          team.contactPerson.toLowerCase().includes(searchTerm)
                        )
                      );
                    }}
                  />
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.category}</TableCell>
                        <TableCell>
                          <div className="text-sm">{team.contactPerson}</div>
                          <div className="text-xs text-muted-foreground">{team.contactNumber}</div>
                        </TableCell>
                        <TableCell>
                          {team.checkedIn ? (
                            <div className="flex items-center">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                              <span>Checked in at {team.checkInTime}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              <span>Not checked in</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!team.checkedIn && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckIn(team.id)}
                            >
                              Check In
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {teams.filter(t => t.checkedIn).length} of {teams.length} teams checked in
              </div>
              <Button 
                variant="outline" 
                onClick={() => handlePrintMaterials('teams')}
                disabled={teams.length === 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                {teams.length === 0 ? 'No Teams' : 'Print Check-in List'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Race Schedule</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View and manage the race schedule
                  </p>
                </div>
                <Button variant="outline" onClick={() => handlePrintMaterials('schedule')}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Team 1</TableHead>
                    <TableHead>Team 2</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((heat) => (
                    <TableRow key={heat.id} className={heat.completed ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{heat.time}</TableCell>
                      <TableCell>{heat.track}</TableCell>
                      <TableCell>{heat.team1}</TableCell>
                      <TableCell>{heat.team2}</TableCell>
                      <TableCell>
                        {heat.completed ? (
                          <span className="text-green-600">Completed</span>
                        ) : (
                          <span className="text-amber-600">Upcoming</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!heat.completed && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markHeatComplete(heat.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="print" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  <CardTitle>Team Sheets</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Print team information sheets with all details
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Teams</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                      <div className="flex items-center space-x-2 p-1 border-b">
                        <Checkbox 
                          id="select-all"
                          checked={selectedTeams.size === teams.length && teams.length > 0}
                          onCheckedChange={selectAllTeams}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium leading-none"
                        >
                          Select All ({teams.length} teams)
                        </label>
                      </div>
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                          <Checkbox 
                            id={`team-${team.id}`} 
                            checked={selectedTeams.has(team.id)}
                            onCheckedChange={() => toggleTeamSelection(team.id)}
                          />
                          <label
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            <div>{team.name}</div>
                            <div className="text-xs text-muted-foreground">{team.category}</div>
                          </label>
                        </div>
                      ))}
                      {teams.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No teams available
                        </div>
                      )}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handlePrintMaterials('teams')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Selected Teams
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-green-500" />
                  <CardTitle>Race Schedule</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Print the race schedule for officials and volunteers
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={printFormat}
                      onChange={(e) => setPrintFormat(e.target.value)}
                    >
                      <option value="standard">Standard (1 page)</option>
                      <option value="detailed">Detailed (with team info)</option>
                      <option value="large">Large Print</option>
                    </select>
                  </div>
                  <Button className="w-full" onClick={() => handlePrintMaterials('schedule')}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-purple-500" />
                  <CardTitle>Race Rules</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Print rule sheets for teams and officials
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <option>Full Rulebook</option>
                      <option>Quick Reference</option>
                      <option>Safety Guidelines</option>
                    </select>
                  </div>
                  <Button className="w-full" onClick={() => handlePrintMaterials('rules')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
