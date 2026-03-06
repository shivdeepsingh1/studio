"use client";

import { useMemo, useState } from "react";
import { format, differenceInCalendarDays, getYear } from "date-fns";
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
import { Employee, Duty, Leave, LeaveType, leaveTypes, EmployeeRank } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TodayReservePage() {
  const { user } = useAuth();
  const { employees, duties, leaves, updateDuties, updateLeaves, updateEmployees } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isAssignDutyDialogOpen, setIsAssignDutyDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [employeeToSuspend, setEmployeeToSuspend] = useState<Employee | null>(null);
  const [suspensionDetails, setSuspensionDetails] = useState({ letterNumber: '', date: '' });

  const [newDuty, setNewDuty] = useState<{
    shift: 'Morning' | 'Afternoon' | 'Night';
    location: string;
    details: string;
  }>({
    shift: 'Morning',
    location: '',
    details: '',
  });

  const initialNewLeaveState = {
    employeeId: "",
    type: "Casual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
    status: "Approved" as const,
  };
  const [newLeave, setNewLeave] = useState(initialNewLeaveState);


  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  const reserveEmployees = useMemo(() => {
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

    const onActiveDutyIds = new Set(duties.filter(d => d.date === todayString && d.status !== 'Completed').map(d => d.employeeId));

    const reserve = employees.filter(employee =>
        employee.status === 'Active' &&
        employee.rank !== 'Administrator' &&
        !onLeaveTodayIds.has(employee.id) &&
        !onActiveDutyIds.has(employee.id)
    );
    
    return reserve;
  }, [duties, employees, leaves, todayString]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.pageHeaders.todayReserve.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.absentEmployeesPage.contactNumber, t.status]],
      body: reserveEmployees.map((employee, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.contact,
        t.statement.reserve,
      ]),
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    });
    doc.save(`reserve_employees_${todayString}.pdf`);
  };

  const handleOpenAssignDutyDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewDuty({ shift: 'Morning', location: '', details: '' });
    setIsAssignDutyDialogOpen(true);
  };
  
  const handleAssignDuty = () => {
    if (!selectedEmployee || !newDuty.location) {
        toast({ variant: 'destructive', title: t.duty.incompleteInformation, description: t.duty.incompleteInformationDescription });
        return;
    }
    
    const alreadyOnDuty = duties.find(d => 
        d.employeeId === selectedEmployee.id &&
        d.date === todayString &&
        d.status !== 'Completed'
    );

    if (alreadyOnDuty) {
        toast({
            variant: 'destructive',
            title: t.duty.employeeAlreadyOnDutyTitle,
            description: t.duty.employeeAlreadyOnDutyDescription(selectedEmployee.name, format(new Date(todayString.replace(/-/g, '\/')), 'dd-MM-yyyy')),
        });
        setIsAssignDutyDialogOpen(false);
        return;
    }

    const dutyToAdd: Duty = {
        id: Date.now().toString(),
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        date: todayString,
        shift: newDuty.shift,
        location: newDuty.location,
        details: newDuty.details,
        status: 'Active',
    };

    updateDuties(prevDuties => [...prevDuties, dutyToAdd]);
    toast({ title: t.duty.dutyAssigned, description: t.duty.dutyAssignedDescription(selectedEmployee.name, format(new Date(), 'dd-MM-yyyy')) });
    setIsAssignDutyDialogOpen(false);
    setSelectedEmployee(null);
  };
  
  const handleOpenLeaveDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    const today = new Date().toISOString().split("T")[0];
    setNewLeave({
      ...initialNewLeaveState,
      employeeId: employee.id,
      startDate: today,
      endDate: today,
      status: 'Approved'
    });
    setIsLeaveDialogOpen(true);
  };

  const handleSaveLeave = () => {
    if (!selectedEmployee || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
        toast({ variant: 'destructive', title: t.leave.fillAllFields });
        return;
    }

    const leaveStartDate = new Date(newLeave.startDate.replace(/-/g, '/'));
    const leaveEndDate = new Date(newLeave.endDate.replace(/-/g, '/'));

    if (leaveEndDate < leaveStartDate) {
        toast({ variant: 'destructive', title: t.leave.invalidDateRange, description: t.leave.invalidDateRangeDescription });
        return;
    }

    const currentYear = getYear(leaveStartDate);
    const newLeaveDuration = differenceInCalendarDays(leaveEndDate, leaveStartDate) + 1;

    if (newLeave.type === 'Casual' || newLeave.type === 'Earned') {
        const existingLeavesThisYear = leaves.filter(l =>
            l.employeeId === selectedEmployee.id &&
            l.type === newLeave.type &&
            l.status === 'Approved' &&
            getYear(new Date(l.startDate.replace(/-/g, '/'))) === currentYear
        );
        
        const totalDaysTaken = existingLeavesThisYear.reduce((acc, l) => {
            const start = new Date(l.startDate.replace(/-/g, '/'));
            const end = new Date(l.endDate.replace(/-/g, '/'));
            if (start <= end) {
                return acc + (differenceInCalendarDays(end, start) + 1);
            }
            return acc;
        }, 0);
        
        const limit = 30;
        if (totalDaysTaken + newLeaveDuration > limit) {
            const remaining = limit - totalDaysTaken;
            toast({
                variant: 'destructive',
                title: t.leave.limitExceededTitle,
                description: t.leave.limitExceededDescription(t.leaveTypes[newLeave.type], limit, remaining > 0 ? remaining : 0),
            });
            return;
        }
    }

    const femaleOnlyLeaves: LeaveType[] = ['CCL'];
    const femaleRanks: EmployeeRank[] = ['Lady Inspector', 'Lady Sub Inspector', 'Lady Head Constable', 'Lady Constable'];
    
    if (femaleOnlyLeaves.includes(newLeave.type) && !femaleRanks.includes(selectedEmployee.rank)) {
        toast({
            variant: 'destructive',
            title: t.leave.genderRestrictedLeaveTitle,
            description: t.leave.genderRestrictedLeaveDescription(t.leaveTypes[newLeave.type]),
        });
        return;
    }

    const leaveToAdd: Leave = {
        id: Date.now().toString(),
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        type: newLeave.type,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
        status: newLeave.status,
    };
    updateLeaves(prevLeaves => [...prevLeaves, leaveToAdd]);
    toast({ title: t.leave.leaveAdded, description: t.leave.leaveAddedDescription(selectedEmployee.name) });
    setIsLeaveDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleMarkAbsent = (employee: Employee) => {
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

    const absentLeave: Leave = {
      id: Date.now().toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      type: "Absent",
      startDate: todayString,
      endDate: todayString,
      reason: "Marked absent from reserve.",
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

  const handleOpenSuspendDialog = (employee: Employee) => {
    setEmployeeToSuspend(employee);
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
    
    updateEmployees(prevEmployees =>
      prevEmployees.map(e =>
        e.id === employeeToSuspend.id
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
      description: t.leave.suspensionSuccessDescription(employeeToSuspend.name),
    });

    setIsSuspendDialogOpen(false);
    setEmployeeToSuspend(null);
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
        title={t.pageHeaders.todayReserve.title}
        description={t.pageHeaders.todayReserve.description(format(new Date(), 'dd-MM-yyyy'))}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={reserveEmployees.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.todayReserve.title}</CardTitle>
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
                          <TableHead>{t.status}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {reserveEmployees.length > 0 ? (
                      reserveEmployees.map((employee, index) => (
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
                              <TableCell>{t.statement.reserve}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenAssignDutyDialog(employee)}>
                                      {t.dashboard.assignDuty}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenLeaveDialog(employee)}>
                                      {t.leave.addLeaveEntry}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleMarkAbsent(employee)}>
                                      {t.duty.absentFromReserve}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleOpenSuspendDialog(employee)}>
                                      {t.duty.suspendFromReserve}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={8} className="text-center h-24">
                              {t.duty.noReserveEmployees}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>

      <Dialog open={isAssignDutyDialogOpen} onOpenChange={setIsAssignDutyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.duty.assignDutyTo(selectedEmployee?.name || '')}</DialogTitle>
            <DialogDescription>{t.duty.assignDutyDescriptionReserve}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shift" className="text-right">
                {t.duty.shift}
              </Label>
              <Select
                onValueChange={(value) => setNewDuty(prev => ({ ...prev, shift: value as any }))}
                value={newDuty.shift}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t.duty.selectShift} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">{t.duty.morning}</SelectItem>
                  <SelectItem value="Afternoon">{t.duty.afternoon}</SelectItem>
                  <SelectItem value="Night">{t.duty.night}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                {t.duty.location}
              </Label>
              <Input
                id="location"
                value={newDuty.location}
                onChange={(e) => setNewDuty(prev => ({ ...prev, location: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">
                {t.duty.details}
              </Label>
              <Textarea
                id="details"
                value={newDuty.details}
                onChange={(e) => setNewDuty(prev => ({ ...prev, details: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignDutyDialogOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleAssignDuty}>{t.duty.assignDuty}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.leave.addLeaveFor(selectedEmployee?.name || "")}</DialogTitle>
              <DialogDescription>{t.leave.requestLeaveDescription}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t.leave.employee}</Label>
                    <Input
                        value={selectedEmployee?.name || ""}
                        disabled
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">{t.leave.leaveType}</Label>
                    <Select
                        onValueChange={(value) => setNewLeave(prev => ({...prev, type: value as LeaveType}))}
                        value={newLeave.type}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder={t.leave.selectType} />
                        </SelectTrigger>
                        <SelectContent>
                            {leaveTypes.map((type) => (
                                <SelectItem key={type} value={type}>{t.leaveTypes[type]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">{t.leave.startDate}</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) => setNewLeave(prev => ({...prev, startDate: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">{t.leave.endDate}</Label>
                    <Input
                        id="endDate"
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) => setNewLeave(prev => ({...prev, endDate: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">{t.leave.reason}</Label>
                    <Textarea
                        id="reason"
                        value={newLeave.reason}
                        onChange={(e) => setNewLeave(prev => ({...prev, reason: e.target.value}))}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsLeaveDialogOpen(false)}>
                    {t.cancel}
                </Button>
                <Button onClick={handleSaveLeave}>{t.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.leave.suspendEmployeeTitle}</DialogTitle>
            <DialogDescription>
              {employeeToSuspend ? t.leave.suspendEmployeeDescription(employeeToSuspend.name) : ''}
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
