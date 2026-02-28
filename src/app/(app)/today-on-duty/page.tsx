
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Printer, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, Duty, Leave } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

type OnDutyEmployee = {
  employee: Employee;
  duty: Duty;
};

export default function TodayOnDutyPage() {
  const { user } = useAuth();
  const { employees, duties, leaves, updateDuties, updateLeaves } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const todayString = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const onDutyEmployees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeaveTodayIds = new Set(leaves.filter(l => {
        if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
        const startDate = new Date(l.startDate.replace(/-/g, '/'));
        const endDate = new Date(l.endDate.replace(/-/g, '/'));
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
    }).map(l => l.employeeId));


    const dutiesToday = duties.filter(d => 
        d.date === todayString && 
        d.location.toLowerCase() !== 'reserve' &&
        d.status !== 'Completed' &&
        !onLeaveTodayIds.has(d.employeeId)
    );
    
    return dutiesToday.map(duty => {
      const employee = employees.find(e => e.id === duty.employeeId);
      return { employee, duty };
    }).filter(item => item.employee) as OnDutyEmployee[];

  }, [duties, employees, leaves, todayString]);

  const handleEndDuty = (dutyId: string, employeeName: string) => {
    updateDuties(prevDuties =>
      prevDuties.map(duty =>
        duty.id === dutyId ? { ...duty, status: 'Completed' } : duty
      )
    );
    toast({
      title: t.duty.dutyEnded,
      description: t.duty.dutyEndedDescription(employeeName),
    });
  };

  const handleMarkAbsent = (duty: Duty, employee: Employee) => {
    const todayString = format(new Date(), "yyyy-MM-dd");

    const isAlreadyAbsent = leaves.some(
      (l) =>
        l.employeeId === employee.id &&
        l.type === "Absent" &&
        l.startDate === todayString
    );

    if (isAlreadyAbsent) {
      toast({
        variant: "destructive",
        title: t.absentEmployeesPage.alreadyAbsentTitle,
        description: t.absentEmployeesPage.alreadyAbsentDescription(employee.name),
      });
      return;
    }
    
    updateDuties(prevDuties =>
      prevDuties.map(d =>
        d.id === duty.id ? { ...d, status: 'Completed' } : d
      )
    );
    
    const absentLeave: Leave = {
      id: Date.now().toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      type: "Absent",
      startDate: todayString,
      endDate: todayString,
      reason: "Marked absent from duty.",
      status: "Approved",
    };

    updateLeaves((prevLeaves) => [...prevLeaves, absentLeave]);

    toast({
      title: t.duty.employeeMarkedAbsent,
      description: t.duty.employeeMarkedAbsentDescription(
        employee.name,
        format(new Date(), "dd-MM-yyyy")
      ),
    });
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.todayOnDuty.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.absentEmployeesPage.contactNumber, t.location, t.date]],
      body: onDutyEmployees.map(({ employee, duty }, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
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
            <Printer className="mr-2" /> {t.exportPdf}
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
                          <TableHead>{t.rank}</TableHead>
                          <TableHead>{t.badgeNumber}</TableHead>
                          <TableHead>{t.pno}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.absentEmployeesPage.contactNumber}</TableHead>
                          <TableHead>{t.location}</TableHead>
                          <TableHead>{t.date}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {onDutyEmployees.length > 0 ? (
                      onDutyEmployees.map(({ employee, duty }, index) => (
                          <TableRow key={employee.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{t.ranks[employee.rank]}</TableCell>
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
                              <TableCell>{employee.contact}</TableCell>
                              <TableCell>{duty.location}</TableCell>
                              <TableCell>{format(new Date(duty.date.replace(/-/g, '/')), 'dd-MM-yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleEndDuty(duty.id, employee.name)}
                                    >
                                      {t.duty.endDutyAndMarkReserve}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleMarkAbsent(duty, employee)}>
                                      {t.duty.absentFromDuty}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={9} className="text-center h-24">
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
