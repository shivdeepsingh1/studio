
"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "@/lib/fonts/Hind-Regular";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Employee, Leave } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmployeeWithStatus = {
  employee: Employee;
  status: 'On Duty' | 'On Leave' | 'Absent' | 'Suspended' | 'Available';
  details: string;
};

export default function AbsentEmployeesPage() {
  const { user } = useAuth();
  const { employees, leaves, updateLeaves, duties } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [mainSearchQuery, setMainSearchQuery] = useState<string>("");
  const [employeesWithStatus, setEmployeesWithStatus] = useState<EmployeeWithStatus[]>([]);

  const todayString = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dutiesToday = duties.filter(d => d.date === todayString);
    const onLeaveToday = leaves.filter(l => {
      if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
      const startDate = new Date(l.startDate.replace(/-/g, '/'));
      const endDate = new Date(l.endDate.replace(/-/g, '/'));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return today >= startDate && today <= endDate;
    });

    const statusList = employees.map((employee): EmployeeWithStatus => {
      if (employee.status === 'Suspended') {
        return { employee, status: 'Suspended', details: t.employees.suspended };
      }

      const leaveRecord = onLeaveToday.find(l => l.employeeId === employee.id);
      if (leaveRecord) {
        if (leaveRecord.type === 'Absent') {
          return { employee, status: 'Absent', details: t.leaveTypes.Absent };
        }
        return { employee, status: 'On Leave', details: `${t.leaveTypes[leaveRecord.type]}` };
      }

      const dutyRecord = dutiesToday.find(d => d.employeeId === employee.id);
      if (dutyRecord) {
        return { employee, status: 'On Duty', details: dutyRecord.location };
      }

      return { employee, status: 'Available', details: t.statusTypes.available };
    });

    setEmployeesWithStatus(statusList);
  }, [employees, leaves, duties, todayString, t]);


  const handleMarkAsReserve = (employeeId: string, employeeName: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const absentLeaveRecord = leaves.find(l => {
      if (l.employeeId !== employeeId || l.type !== 'Absent' || l.status !== 'Approved') {
        return false;
      }
      const startDate = new Date(l.startDate.replace(/-/g, '/'));
      const endDate = new Date(l.endDate.replace(/-/g, '/'));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return today >= startDate && today <= endDate;
    });

    if (!absentLeaveRecord) {
        toast({ variant: 'default', title: t.absentEmployeesPage.alreadyPresentTitle, description: t.absentEmployeesPage.alreadyPresentDescription(employeeName) });
        return;
    }

    const yesterday = subDays(new Date(), 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    updateLeaves(prevLeaves => prevLeaves.map(l =>
        l.id === absentLeaveRecord.id
        ? { ...l, endDate: yesterdayString }
        : l
    ));

    toast({ title: t.absentEmployeesPage.markedPresentTitle, description: t.leave.employeeMarkedReserve(employeeName) });
  };
  

  const absentEmployees = useMemo(() => {
    return employeesWithStatus.filter(e => e.status === 'Absent' && e.employee.rank !== 'Administrator');
  }, [employeesWithStatus]);

  const filteredAbsentEmployees = useMemo(() => {
    if (!mainSearchQuery) {
        return absentEmployees;
    }
    return absentEmployees.filter(
      (e) =>
        e.employee.name.toLowerCase().includes(mainSearchQuery.toLowerCase()) ||
        e.employee.pno.includes(mainSearchQuery) ||
        e.employee.badgeNumber.toLowerCase().includes(mainSearchQuery.toLowerCase())
    );
  }, [absentEmployees, mainSearchQuery]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.absentEmployeesPage.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.name, t.pno, t.rank, t.absentEmployeesPage.contactNumber]],
      body: filteredAbsentEmployees.map((e, index) => [
        index + 1,
        e.employee.name,
        e.employee.pno,
        t.ranks[e.employee.rank],
        e.employee.contact,
      ]),
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    });
    doc.save(`absent_employees_${todayString}.pdf`);
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
        title={t.pageHeaders.absentEmployees.title}
        description={t.pageHeaders.absentEmployees.description}
      />
        
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t.absentEmployeesPage.title}</CardTitle>
                  <CardContent className="text-sm text-muted-foreground p-0 pt-1">
                    {t.absentEmployeesPage.description(format(new Date(), 'dd-MM-yyyy'))}
                  </CardContent>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input 
                      placeholder={t.employees.searchPlaceholder}
                      value={mainSearchQuery}
                      onChange={(e) => setMainSearchQuery(e.target.value)}
                      className="w-full md:w-64"
                    />
                    <Button variant="outline" onClick={handleExportPdf} disabled={filteredAbsentEmployees.length === 0}>
                        <Printer className="mr-2" /> {t.exportPdf}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t.serialNumber}</TableHead>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.pno}</TableHead>
                            <TableHead>{t.rank}</TableHead>
                            <TableHead>{t.absentEmployeesPage.contactNumber}</TableHead>
                            <TableHead className="text-right">{t.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAbsentEmployees.length > 0 ? (
                        filteredAbsentEmployees.map(({ employee }, index) => (
                            <TableRow key={employee.id}>
                                <TableCell>{index + 1}</TableCell>
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
                                <TableCell>{employee.pno}</TableCell>
                                <TableCell>{t.ranks[employee.rank]}</TableCell>
                                <TableCell>{employee.contact}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                          <span className="sr-only">{t.employees.openMenu}</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleMarkAsReserve(employee.id, employee.name)}>
                                          {t.leave.markAsReserve}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                                {t.absentEmployeesPage.noAbsentees}
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
