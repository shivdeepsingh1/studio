"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown, Search, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Employee, Leave, Duty } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  const [pnoInput, setPnoInput] = useState<string>("");
  const [mainSearchQuery, setMainSearchQuery] = useState<string>("");
  const [searchedEmployee, setSearchedEmployee] = useState<Employee | null>(null);
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

  const handlePnoSearch = () => {
    if (!pnoInput) {
      setSearchedEmployee(null);
      return;
    }
    const employee = employees.find(e => e.pno === pnoInput);
    setSearchedEmployee(employee || null);
    if (!employee) {
        toast({
            variant: 'destructive',
            title: t.duty.employeeNotFound,
        })
    }
  };

  const handleMarkAbsent = () => {
    if (!searchedEmployee) {
      toast({ variant: 'destructive', title: t.duty.noEmployeeSelected, description: t.duty.noEmployeeSelectedDescription });
      return;
    }

    const existingStatus = employeesWithStatus.find(e => e.employee.id === searchedEmployee.id)?.status;
    if (existingStatus === 'Absent') {
      toast({ variant: 'destructive', title: t.absentEmployeesPage.alreadyAbsentTitle, description: t.absentEmployeesPage.alreadyAbsentDescription(searchedEmployee.name) });
      return;
    }
    if (existingStatus === 'On Leave' || existingStatus === 'On Duty' || existingStatus === 'Suspended') {
      toast({ variant: 'destructive', title: t.duty.actionProhibited, description: t.absentEmployeesPage.actionProhibitedDescription(searchedEmployee.name, existingStatus) });
      return;
    }

    const absentLeave: Leave = {
      id: Date.now().toString(),
      employeeId: searchedEmployee.id,
      employeeName: searchedEmployee.name,
      type: 'Absent',
      startDate: todayString,
      endDate: todayString,
      reason: 'Marked absent from Daily Attendance page.',
      status: 'Approved'
    };
    updateLeaves([...leaves, absentLeave]);
    toast({ title: t.duty.employeeMarkedAbsent, description: t.duty.employeeMarkedAbsentDescription(searchedEmployee.name, format(new Date(), 'dd-MM-yyyy')) });
    setSearchedEmployee(null);
    setPnoInput("");
  }
  
  const handleMarkPresent = () => {
    if (!searchedEmployee) {
        toast({ variant: 'destructive', title: t.duty.noEmployeeSelected, description: t.duty.noEmployeeSelectedDescription });
        return;
    }
    
    const absentLeaveRecord = leaves.find(l => 
      l.employeeId === searchedEmployee.id && 
      l.type === 'Absent' && 
      l.startDate === todayString
    );

    if (!absentLeaveRecord) {
        toast({ variant: 'default', title: t.absentEmployeesPage.alreadyPresentTitle, description: t.absentEmployeesPage.alreadyPresentDescription(searchedEmployee.name) });
        return;
    }

    const updatedLeaves = leaves.filter(l => l.id !== absentLeaveRecord.id);
    updateLeaves(updatedLeaves);
    toast({ title: t.absentEmployeesPage.markedPresentTitle, description: t.absentEmployeesPage.markedPresentDescription(searchedEmployee.name) });
    setSearchedEmployee(null);
    setPnoInput("");
  }

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.absentEmployeesPage.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.name, t.pno, t.rank, t.absentEmployeesPage.contactNumber, t.absentEmployeesPage.employeeStatus]],
      body: filteredEmployees.map((e, index) => [
        index + 1,
        e.employee.name,
        e.employee.pno,
        t.ranks[e.employee.rank],
        e.employee.contact,
        e.details,
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`daily_attendance_${todayString}.pdf`);
  };
  
  const getStatusBadgeVariant = (status: EmployeeWithStatus['status']) => {
    switch (status) {
      case "On Duty": return "default";
      case "Available": return "secondary";
      case "On Leave": return "outline";
      case "Absent": return "destructive";
      case "Suspended": return "destructive";
      default: return "secondary";
    }
  }

  const filteredEmployees = useMemo(() => {
    return employeesWithStatus.filter(
      (e) =>
        e.employee.name.toLowerCase().includes(mainSearchQuery.toLowerCase()) ||
        e.employee.pno.includes(mainSearchQuery) ||
        e.employee.badgeNumber.toLowerCase().includes(mainSearchQuery.toLowerCase())
    ).filter(emp => emp.employee.rank !== 'Administrator');
  }, [employeesWithStatus, mainSearchQuery]);


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
        title={t.absentEmployeesPage.title}
        description={t.absentEmployeesPage.description}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.absentEmployeesPage.updateAttendance}</CardTitle>
                    <CardContent className="pt-4 px-0 pb-0">{t.absentEmployeesPage.updateAttendanceDescription}</CardContent>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="pno-search">{t.absentEmployeesPage.employeePno}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="pno-search"
                                    placeholder={t.absentEmployeesPage.enterEmployeePno}
                                    value={pnoInput}
                                    onChange={(e) => setPnoInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePnoSearch()}
                                />
                                <Button onClick={handlePnoSearch}>
                                    <Search className="mr-2 h-4 w-4" /> {t.search}
                                </Button>
                            </div>
                        </div>
                        {searchedEmployee && (
                             <Card className="bg-muted">
                                <CardContent className="pt-6">
                                     <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={searchedEmployee.avatarUrl} alt={searchedEmployee.name} />
                                            <AvatarFallback>{searchedEmployee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{searchedEmployee.name}</p>
                                            <p className="text-sm text-muted-foreground">{t.ranks[searchedEmployee.rank]}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                      <Button className="w-full" onClick={handleMarkPresent} variant="secondary">
                                          <UserCheck className="mr-2" /> {t.absentEmployeesPage.markAsPresentButton}
                                      </Button>
                                      <Button className="w-full" onClick={handleMarkAbsent}>
                                          <UserX className="mr-2" /> {t.absentEmployeesPage.markAsAbsentButton}
                                      </Button>
                                    </div>
                                </CardContent>
                             </Card>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t.absentEmployeesPage.todaysAttendanceList}</CardTitle>
                  <CardContent className="text-sm text-muted-foreground p-0 pt-1">
                    {t.absentEmployeesPage.attendanceListDescription(format(new Date(), 'dd-MM-yyyy'))}
                  </CardContent>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input 
                      placeholder={t.employees.searchPlaceholder}
                      value={mainSearchQuery}
                      onChange={(e) => setMainSearchQuery(e.target.value)}
                      className="w-full md:w-64"
                    />
                    <Button variant="outline" onClick={handleExportPdf} disabled={filteredEmployees.length === 0}>
                        <FileDown className="mr-2" /> {t.exportPdf}
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
                            <TableHead>{t.absentEmployeesPage.employeeStatus}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(({ employee, status, details }, index) => (
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
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(status)}>
                                    {t.statusTypes[status.replace(/\s/g, '') as keyof typeof t.statusTypes] || status}: {details}
                                  </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                                {t.absentEmployeesPage.noEmployeesFound}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}

    