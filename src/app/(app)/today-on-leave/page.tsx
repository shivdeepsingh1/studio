"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, Leave } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type OnLeaveEmployee = {
  employee: Employee;
  leave: Leave;
};

export default function TodayOnLeavePage() {
  const { user } = useAuth();
  const { employees, leaves } = useData();
  const { t } = useLanguage();

  const today = useMemo(() => new Date(), []);

  const onLeaveEmployees = useMemo(() => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const leavesToday = leaves.filter(l => {
      if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
      const startDate = new Date(l.startDate.replace(/-/g, '/'));
      const endDate = new Date(l.endDate.replace(/-/g, '/'));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return todayStart >= startDate && todayStart <= endDate;
    });
    
    return leavesToday.map(leave => {
      const employee = employees.find(e => e.id === leave.employeeId);
      return { employee, leave };
    }).filter(item => item.employee) as OnLeaveEmployee[];

  }, [leaves, employees, today]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const todayString = format(new Date(), "yyyy-MM-dd");
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.todayOnLeave.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.badgeNumber, t.pno, t.name, t.rank, t.absentEmployeesPage.contactNumber, t.leave.leaveType, t.leave.endDate]],
      body: onLeaveEmployees.map(({ employee, leave }, index) => [
        index + 1,
        employee.badgeNumber,
        employee.pno,
        employee.name,
        t.ranks[employee.rank],
        employee.contact,
        t.leaveTypes[leave.type],
        format(new Date(leave.endDate.replace(/-/g, '/')), 'dd-MM-yyyy'),
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`on_leave_employees_${todayString}.pdf`);
  };
  
  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full">
              <p>{t.pageHeaders.permissionDenied}</p>
          </div>
      )
  }

  return (
    <>
      <PageHeader
        title={t.pageHeaders.todayOnLeave.title}
        description={t.pageHeaders.todayOnLeave.description(format(new Date(), 'dd-MM-yyyy'))}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={onLeaveEmployees.length === 0}>
            <FileDown className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.todayOnLeave.title}</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>{t.serialNumber}</TableHead>
                          <TableHead>{t.badgeNumber}</TableHead>
                          <TableHead>{t.pno}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.rank}</TableHead>
                          <TableHead>{t.absentEmployeesPage.contactNumber}</TableHead>
                          <TableHead>{t.leave.leaveType}</TableHead>
                          <TableHead>{t.leave.endDate}</TableHead>
                          <TableHead>{t.leave.reason}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {onLeaveEmployees.length > 0 ? (
                      onLeaveEmployees.map(({ employee, leave }, index) => (
                          <TableRow key={employee.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{employee.badgeNumber}</TableCell>
                              <TableCell>{employee.pno}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={employee.avatarUrl}
                                      alt={employee.name}
                                      data-ai-hint="person portrait"
                                    />
                                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium">{employee.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>{t.ranks[employee.rank]}</TableCell>
                              <TableCell>{employee.contact}</TableCell>
                              <TableCell>{t.leaveTypes[leave.type]}</TableCell>
                              <TableCell>{format(new Date(leave.endDate.replace(/-/g, '/')), 'dd-MM-yyyy')}</TableCell>
                              <TableCell>{leave.reason}</TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={9} className="text-center h-24">
                              {t.leave.noLeaveRecords}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>
    </>
  );
}
