
"use client";

import { useMemo, useState } from "react";
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
import { Employee, Leave } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type OnLeaveEmployee = {
  employee: Employee;
  leave: Leave;
};

export default function TodayOnLeavePage() {
  const { user } = useAuth();
  const { employees, leaves, updateLeaves, updateEmployees } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const today = useMemo(() => new Date(), []);
  
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [employeeToSuspend, setEmployeeToSuspend] = useState<OnLeaveEmployee | null>(null);
  const [suspensionDetails, setSuspensionDetails] = useState({ letterNumber: '', date: '' });


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

  const handleReturnFromLeave = (leaveId: string, employeeName: string) => {
    const yesterday = subDays(new Date(), 1);
    const yesterdayString = format(yesterday, "yyyy-MM-dd");

    updateLeaves(prevLeaves =>
      prevLeaves.map(l =>
        l.id === leaveId ? { ...l, endDate: yesterdayString } : l
      )
    );

    toast({
      title: t.leave.leaveEnded,
      description: t.leave.employeeMarkedReserve(employeeName),
    });
  };
  
  const handleAbsentFromLeave = (employeeId: string, employeeName: string) => {
    const todayString = format(new Date(), "yyyy-MM-dd");

    const isAlreadyAbsent = leaves.some(
      (l) =>
        l.employeeId === employeeId &&
        l.type === "Absent" &&
        l.startDate === todayString
    );

    if (isAlreadyAbsent) {
      toast({
        variant: "destructive",
        title: t.absentEmployeesPage.alreadyAbsentTitle,
        description: t.absentEmployeesPage.alreadyAbsentDescription(employeeName),
      });
      return;
    }

    const absentLeave: Leave = {
      id: Date.now().toString(),
      employeeId: employeeId,
      employeeName: employeeName,
      type: "Absent",
      startDate: todayString,
      endDate: todayString,
      reason: "Marked absent from leave.",
      status: "Approved",
    };

    updateLeaves((prevLeaves) => [...prevLeaves, absentLeave]);
    toast({
      title: t.duty.employeeMarkedAbsent,
      description: t.duty.employeeMarkedAbsentDescription(
        employeeName,
        format(new Date(), "dd-MM-yyyy")
      ),
    });
  };

  const handleOpenSuspendDialog = (employeeData: OnLeaveEmployee) => {
    setEmployeeToSuspend(employeeData);
    setSuspensionDetails({ letterNumber: '', date: format(new Date(), 'yyyy-MM-dd') });
    setIsSuspendDialogOpen(true);
  };
  
  const handleConfirmSuspension = () => {
    if (!employeeToSuspend || !suspensionDetails.date || !suspensionDetails.letterNumber) {
      toast({
        variant: "destructive",
        title: t.leave.fillAllFields,
      });
      return;
    }
    
    const { employee, leave } = employeeToSuspend;

    // End the leave one day before suspension
    const suspensionDate = new Date(suspensionDetails.date.replace(/-/g, '/'));
    const leaveEndDate = subDays(suspensionDate, 1);
    const leaveEndDateString = format(leaveEndDate, "yyyy-MM-dd");
    
    // Check if the new leave end date is valid
    const leaveStartDate = new Date(leave.startDate.replace(/-/g, '/'));
    if (leaveEndDate < leaveStartDate) {
         updateLeaves(prevLeaves => prevLeaves.filter(l => l.id !== leave.id));
    } else {
        updateLeaves(prevLeaves =>
          prevLeaves.map(l =>
            l.id === leave.id ? { ...l, endDate: leaveEndDateString } : l
          )
        );
    }
    
    // Update employee status to suspended
    updateEmployees(prevEmployees =>
      prevEmployees.map(e =>
        e.id === employee.id
          ? {
              ...e,
              status: 'Suspended',
              suspensionDate: suspensionDetails.date,
              suspensionLetterNumber: suspensionDetails.letterNumber,
            }
          : e
      )
    );

    toast({
      title: t.leave.suspensionSuccessTitle,
      description: t.leave.suspensionSuccessDescription(employee.name),
    });

    setIsSuspendDialogOpen(false);
    setEmployeeToSuspend(null);
  };


  const handleExportPdf = () => {
    const doc = new jsPDF();
    const todayString = format(new Date(), "yyyy-MM-dd");
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.pageHeaders.todayOnLeave.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.absentEmployeesPage.contactNumber, t.leave.leaveType, t.leave.endDate]],
      body: onLeaveEmployees.map(({ employee, leave }, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.contact,
        t.leaveTypes[leave.type],
        format(new Date(leave.endDate.replace(/-/g, '/')), 'dd-MM-yyyy'),
      ]),
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
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
            <Printer className="mr-2" /> {t.exportPdf}
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
                          <TableHead>{t.rank}</TableHead>
                          <TableHead>{t.badgeNumber}</TableHead>
                          <TableHead>{t.pno}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.absentEmployeesPage.contactNumber}</TableHead>
                          <TableHead>{t.leave.leaveType}</TableHead>
                          <TableHead>{t.leave.endDate}</TableHead>
                          <TableHead>{t.leave.reason}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {onLeaveEmployees.length > 0 ? (
                      onLeaveEmployees.map(({ employee, leave }, index) => (
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
                              <TableCell>{t.leaveTypes[leave.type]}</TableCell>
                              <TableCell>{format(new Date(leave.endDate.replace(/-/g, '/')), 'dd-MM-yyyy')}</TableCell>
                              <TableCell>{leave.reason}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleReturnFromLeave(leave.id, employee.name)}>
                                      {t.leave.markAsReserve}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleAbsentFromLeave(employee.id, employee.name)}>
                                      {t.leave.absentFromLeave}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleOpenSuspendDialog({ employee, leave })}>
                                      {t.leave.suspendFromLeave}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={10} className="text-center h-24">
                              {t.leave.noLeaveRecords}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>
      
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.leave.suspendEmployeeTitle}</DialogTitle>
            <DialogDescription>
              {employeeToSuspend ? t.leave.suspendEmployeeDescription(employeeToSuspend.employee.name) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="suspension-letter-number" className="text-right">
                {t.leave.suspensionLetterNumber}
              </Label>
              <Input
                id="suspension-letter-number"
                value={suspensionDetails.letterNumber}
                onChange={(e) => setSuspensionDetails(prev => ({...prev, letterNumber: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="suspension-date" className="text-right">
                {t.leave.suspensionDate}
              </Label>
              <Input
                id="suspension-date"
                type="date"
                value={suspensionDetails.date}
                onChange={(e) => setSuspensionDetails(prev => ({...prev, date: e.target.value}))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSuspendDialogOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleConfirmSuspension} variant="destructive">{t.leave.suspendFromLeave}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
