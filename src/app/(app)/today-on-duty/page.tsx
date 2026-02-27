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
import { Employee, Duty } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type OnDutyEmployee = {
  employee: Employee;
  duty: Duty;
};

export default function TodayOnDutyPage() {
  const { user } = useAuth();
  const { employees, duties } = useData();
  const { t } = useLanguage();

  const todayString = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const onDutyEmployees = useMemo(() => {
    const dutiesToday = duties.filter(d => d.date === todayString && d.location.toLowerCase() !== 'reserve');
    
    return dutiesToday.map(duty => {
      const employee = employees.find(e => e.id === duty.employeeId);
      return { employee, duty };
    }).filter(item => item.employee) as OnDutyEmployee[];

  }, [duties, employees, todayString]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.todayOnDuty.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.badgeNumber, t.pno, t.name, t.rank, t.absentEmployeesPage.contactNumber, t.location, t.date]],
      body: onDutyEmployees.map(({ employee, duty }, index) => [
        index + 1,
        employee.badgeNumber,
        employee.pno,
        employee.name,
        t.ranks[employee.rank],
        employee.contact,
        duty.location,
        format(new Date(duty.date.replace(/-/g, '/')), 'dd-MM-yyyy'),
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`on_duty_employees_${todayString}.pdf`);
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
        title={t.pageHeaders.todayOnDuty.title}
        description={t.pageHeaders.todayOnDuty.description(format(new Date(), 'dd-MM-yyyy'))}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={onDutyEmployees.length === 0}>
            <FileDown className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.todayOnDuty.title}</CardTitle>
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
                          <TableHead>{t.location}</TableHead>
                          <TableHead>{t.date}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {onDutyEmployees.length > 0 ? (
                      onDutyEmployees.map(({ employee, duty }, index) => (
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
                              <TableCell>{duty.location}</TableCell>
                              <TableCell>{format(new Date(duty.date.replace(/-/g, '/')), 'dd-MM-yyyy')}</TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={8} className="text-center h-24">
                              {t.duty.noOnDutyEmployees}
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
