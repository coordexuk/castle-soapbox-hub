import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Team, RaceHeat } from '@/pages/admin/EventDayPage';

const FONT_SIZE = 10;
const HEADER_FONT_SIZE = 16;
const SUBHEADER_FONT_SIZE = 12;
const MARGIN = 20;
const LOGO_URL = '/logo.png'; // Update with your logo path

export const generateTeamListPDF = (teams: Team[], title: string) => {
  const doc = new jsPDF();
  
  // Add logo and header
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text('Castle Douglas Soapbox Derby', MARGIN, MARGIN);
  doc.setFontSize(SUBHEADER_FONT_SIZE);
  doc.text(title, MARGIN, MARGIN + 10);
  
  // Add date
  doc.setFontSize(FONT_SIZE);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, MARGIN + 20);
  
  // Prepare data for the table
  const tableData = teams.map(team => [
    team.name,
    team.category,
    team.contactPerson,
    team.contactNumber,
    team.checkedIn ? `Checked In (${team.checkInTime || 'N/A'})` : 'Not Checked In'
  ]);
  
  // Generate table
  (doc as any).autoTable({
    head: [['Team Name', 'Category', 'Contact', 'Phone', 'Status']],
    body: tableData,
    startY: MARGIN + 30,
    styles: {
      fontSize: FONT_SIZE - 1,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246], // gray-100
    },
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - MARGIN,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // Save the PDF
  doc.save(`teams-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateRaceSchedulePDF = (schedule: RaceHeat[], title: string) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text('Castle Douglas Soapbox Derby', MARGIN, MARGIN);
  doc.setFontSize(SUBHEADER_FONT_SIZE);
  doc.text(title, MARGIN, MARGIN + 10);
  
  // Add date
  doc.setFontSize(FONT_SIZE);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, MARGIN + 20);
  
  // Prepare data for the table
  const tableData = schedule.map(heat => [
    heat.time,
    heat.track,
    heat.team1,
    heat.team2,
    heat.completed ? '✅ Completed' : '⏳ Upcoming'
  ]);
  
  // Generate table
  (doc as any).autoTable({
    head: [['Time', 'Track', 'Team 1', 'Team 2', 'Status']],
    body: tableData,
    startY: MARGIN + 30,
    styles: {
      fontSize: FONT_SIZE - 1,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: 255,
      fontStyle: 'bold',
    },
    didDrawPage: (data: any) => {
      // Add track headers for multi-page tables
      if (data.pageNumber === 1) return;
      
      doc.setFontSize(SUBHEADER_FONT_SIZE);
      doc.text('Race Schedule (continued)', MARGIN, MARGIN);
    },
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - MARGIN,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // Save the PDF
  doc.save(`schedule-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateRulesPDF = (type: string) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(HEADER_FONT_SIZE);
  doc.text('Castle Douglas Soapbox Derby', MARGIN, MARGIN);
  doc.setFontSize(SUBHEADER_FONT_SIZE);
  doc.text(`${type} - ${new Date().getFullYear()}`, MARGIN, MARGIN + 10);
  
  // Add content based on type
  doc.setFontSize(FONT_SIZE);
  let content: string[] = [];
  
  switch (type) {
    case 'Full Rulebook':
      content = [
        '1. GENERAL RULES',
        '  1.1 All participants must wear helmets at all times during the race.',
        '  1.2 Soapbox cars must not exceed 6 feet in width or 10 feet in length.',
        '  1.3 All cars must have functional brakes that can stop the vehicle.',
        '  1.4 No engines or power-assisted devices allowed.',
        '  1.5 All participants must sign a waiver before racing.',
        '\n2. SAFETY REQUIREMENTS',
        '  2.1 Helmets must be DOT, SNELL, or CE certified.',
        '  2.2 Drivers must wear long pants, long-sleeved shirts, and closed-toe shoes.',
        '  2.3 Cars must have a roll cage or roll bar if over 4 feet tall.',
        '  2.4 All sharp edges must be covered with padding.',
      ];
      break;
      
    case 'Quick Reference':
      content = [
        'QUICK REFERENCE',
        '• Race Day: August 15, 2025',
        '• Check-in: 8:00 AM - 9:30 AM',
        '• Driver Meeting: 9:45 AM',
        '• First Heat: 10:00 AM',
        '\nKEY RULES',
        '• Helmets required at all times',
        '• No pushing after start line',
        '• Stay in your lane',
        '• No intentional contact',
        '• Follow marshal instructions',
      ];
      break;
      
    case 'Safety Guidelines':
      content = [
        'SAFETY FIRST',
        '1. PRE-RACE INSPECTION',
        '  • All cars must pass technical inspection',
        '  • Check brakes and steering',
        '  • Verify all bolts are tight',
        '  • Ensure helmet fits properly',
        '\n2. DURING THE RACE',
        '  • Keep hands and feet inside the car',
        '  • No standing in the car',
        '  • Stop immediately if directed by officials',
        '  • Report any accidents immediately',
      ];
      break;
  }
  
  // Add content to PDF
  let y = MARGIN + 20;
  content.forEach(line => {
    if (line.startsWith('\n')) {
      y += 5; // Add extra space for new sections
      return;
    }
    
    if (line.match(/^[0-9]+\./)) {
      // Main section heading
      doc.setFont('helvetica', 'bold');
      doc.text(line, MARGIN, y);
    } else if (line.match(/^\s+[0-9]+\.[0-9]+/)) {
      // Subsection
      doc.setFont('helvetica', 'bold');
      doc.text(line, MARGIN, y);
    } else if (line.startsWith('  •')) {
      // Bullet points
      doc.setFont('helvetica', 'normal');
      doc.text(line, MARGIN + 5, y);
    } else {
      // Regular text
      doc.setFont('helvetica', 'normal');
      doc.text(line, MARGIN, y);
    }
    
    y += 7; // Line height
    
    // Add new page if needed
    if (y > doc.internal.pageSize.getHeight() - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - MARGIN,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }
  
  // Save the PDF
  doc.save(`${type.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
};
