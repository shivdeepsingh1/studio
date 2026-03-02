
"use client"

import { useState } from "react"
import { format, differenceInCalendarDays, getYear } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { font } from "@/lib/fonts/Hind-Regular";
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { Printer, PlusCircle, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Leave, leaveTypes, leaveStatuses, LeaveType, LeaveStatus, EmployeeRank } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useData } from "@/lib/data-provider"
import { useLanguage } from "@/lib/i18n/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LeavePage() {
  const { user } = useAuth()
  const { leaves, employees: allEmployees, updateLeaves } = useData()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('');

  const initialNewLeaveState = {
    employeeId: "",
    type: "Casual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending" as LeaveStatus,
  }

  const [newLeave, setNewLeave] = useState(initialNewLeaveState)
  
  const currentUserEmployee = allEmployees.find(e => e.id === user?.id);

  const handleNewLeaveInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setNewLeave({ ...newLeave, [id]: value })
  }

  const handleNewLeaveSelectChange = (id: string, value: string) => {
    setNewLeave({ ...newLeave, [id]: value as any })
  }

  const handleSaveLeave = () => {
    const isEmployeeRequest = user?.role === "employee"
    const employeeId = isEmployeeRequest ? user?.id : newLeave.employeeId

    if (
      !employeeId ||
      !newLeave.startDate ||
      !newLeave.endDate ||
      !newLeave.reason
    ) {
      toast({ variant: 'destructive', title: t.leave.fillAllFields });
      return
    }
    const employee = allEmployees.find((e) => e.id === employeeId)
    if (!employee) {
      toast({ variant: 'destructive', title: t.leave.employeeNotFound });
      return
    }

    if (employee.status === 'Suspended') {
        toast({ variant: 'destructive', title: t.leave.actionProhibited, description: t.leave.suspendedLeaveError });
        setIsLeaveDialogOpen(false);
        return;
    }
    
    if (employee.status === 'Transferred') {
        toast({ variant: 'destructive', title: t.leave.actionProhibited, description: t.leave.transferredLeaveError });
        setIsLeaveDialogOpen(false);
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
            l.employeeId === employeeId &&
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
    
    if (femaleOnlyLeaves.includes(newLeave.type) && !femaleRanks.includes(employee.rank)) {
        toast({
            variant: 'destructive',
            title: t.leave.genderRestrictedLeaveTitle,
            description: t.leave.genderRestrictedLeaveDescription(t.leaveTypes[newLeave.type]),
        });
        return;
    }

    const isAlreadyAbsent = leaves.some(l => 
        l.employeeId === employeeId && 
        l.type === 'Absent' &&
        l.status === 'Approved' &&
        new Date(l.startDate.replace(/-/g, '/')) <= leaveEndDate &&
        new Date(l.endDate.replace(/-/g, '/')) >= leaveStartDate
    );
    
    if (isAlreadyAbsent) {
        toast({
            variant: "destructive",
            title: t.leave.actionProhibited,
            description: t.leave.absentLeaveError,
        });
        setIsLeaveDialogOpen(false);
        return;
    }

    const leaveToAdd: Leave = {
      id: Date.now().toString(),
      employeeId: employeeId,
      employeeName: employee.name,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason,
      status: isEmployeeRequest ? "Pending" : newLeave.status,
    }
    updateLeaves(prevLeaves => [...prevLeaves, leaveToAdd]);
    setIsLeaveDialogOpen(false)
  }

  const openEditDialog = (leave: Leave) => {
    if (user?.rank !== 'Administrator') return;
    setEditingLeave({ ...leave });
    setIsEditDialogOpen(true);
  };

  const handleDeleteLeave = (id: string) => {
    if (user?.pno !== 'ADMIN') return;
    setLeaveToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLeave = () => {
    if (!leaveToDelete) return;
    updateLeaves(prevLeaves => prevLeaves.filter(l => l.id !== leaveToDelete));
    setIsDeleteDialogOpen(false);
    setLeaveToDelete(null);
  };

  const handleUpdateLeave = () => {
    if (!editingLeave || user?.rank !== 'Administrator') return;

    const employee = allEmployees.find(e => e.id === editingLeave.employeeId);
    if (!employee) {
        toast({ variant: 'destructive', title: t.leave.employeeNotFound });
        return;
    }

    const leaveStartDate = new Date(editingLeave.startDate.replace(/-/g, '/'));
    const leaveEndDate = new Date(editingLeave.endDate.replace(/-/g, '/'));

    if (leaveEndDate < leaveStartDate) {
        toast({ variant: 'destructive', title: t.leave.invalidDateRange, description: t.leave.invalidDateRangeDescription });
        return;
    }

    const currentYear = getYear(leaveStartDate);
    const updatedLeaveDuration = differenceInCalendarDays(leaveEndDate, leaveStartDate) + 1;

    if (editingLeave.type === 'Casual' || editingLeave.type === 'Earned') {
        const existingLeavesThisYear = leaves.filter(l =>
            l.id !== editingLeave.id &&
            l.employeeId === editingLeave.employeeId &&
            l.type === editingLeave.type &&
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
        if (totalDaysTaken + updatedLeaveDuration > limit) {
            const remaining = limit - totalDaysTaken;
            toast({
                variant: 'destructive',
                title: t.leave.limitExceededTitle,
                description: t.leave.limitExceededDescription(t.leaveTypes[editingLeave.type], limit, remaining > 0 ? remaining : 0),
            });
            return;
        }
    }
    
    const femaleOnlyLeaves: LeaveType[] = ['CCL'];
    const femaleRanks: EmployeeRank[] = ['Lady Inspector', 'Lady Sub Inspector', 'Lady Head Constable', 'Lady Constable'];
    
    if (femaleOnlyLeaves.includes(editingLeave.type) && !femaleRanks.includes(employee.rank)) {
        toast({
            variant: 'destructive',
            title: t.leave.genderRestrictedLeaveTitle,
            description: t.leave.genderRestrictedLeaveDescription(t.leaveTypes[editingLeave.type]),
        });
        return;
    }

    updateLeaves(prevLeaves => prevLeaves.map(l => (l.id === editingLeave!.id ? editingLeave! : l)));
    setIsEditDialogOpen(false);
    setEditingLeave(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingLeave) return;
    const { id, value } = e.target;
    setEditingLeave({ ...editingLeave, [id]: value });
  };

  const handleEditSelectChange = (field: keyof Leave, value: string) => {
    if (!editingLeave) return;
    setEditingLeave({ ...editingLeave, [field]: value as any });
  };

  const handleExport = () => {
    const doc = new jsPDF()
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }

    doc.text(t.sidebar.leave, 14, 16)
    
    const isEmployeeView = user?.role !== "admin"
    const data = isEmployeeView ? employeeLeaves : filteredLeaves
    const currentUserEmployee = allEmployees.find(e => e.id === user?.id);
    
    const head = isEmployeeView 
      ? [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.leave.leaveType, t.leave.startDate, t.leave.endDate, t.leave.totalDays, t.leave.reason, t.status]]
      : [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.leave.leaveType, t.leave.startDate, t.leave.endDate, t.leave.totalDays, t.leave.reason, t.status]]

    const body = data.map((leave, index) => {
        const startDateValid = leave.startDate && !isNaN(new Date(leave.startDate.replace(/-/g, '/')).getTime());
        const endDateValid = leave.endDate && !isNaN(new Date(leave.endDate.replace(/-/g, '/')).getTime());
        const totalDays = startDateValid && endDateValid
            ? differenceInCalendarDays(new Date(leave.endDate.replace(/-/g, '/')), new Date(leave.startDate.replace(/-/g, '/'))) + 1
            : 0;
        
        if (isEmployeeView) {
            return [
                index + 1,
                currentUserEmployee ? t.ranks[currentUserEmployee.rank] : 'N/A',
                currentUserEmployee?.badgeNumber || 'N/A',
                currentUserEmployee?.pno || 'N/A',
                currentUserEmployee?.name || 'N/A',
                t.leaveTypes[leave.type],
                startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
                endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
                totalDays > 0 ? totalDays : 'N/A',
                leave.reason,
                t.leaveStatuses[leave.status]
            ];
        }

        const employee = allEmployees.find(e => e.id === leave.employeeId);
        return [
            index + 1,
            employee ? t.ranks[employee.rank] : 'N/A',
            employee?.badgeNumber || 'N/A',
            employee?.pno || 'N/A',
            leave.employeeName,
            t.leaveTypes[leave.type],
            startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            totalDays > 0 ? totalDays : 'N/A',
            leave.reason,
            t.leaveStatuses[leave.status]
        ];
    });

    autoTable(doc, {
      startY: 20,
      head: head,
      body: body as any,
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    })

    doc.save("leave_records.pdf")
  }

  const employeeLeaves = leaves.filter((l) => l.employeeId === user?.id)

  const leavesToDisplay = user?.role === 'admin' ? leaves : employeeLeaves;

  const filteredLeaves = leavesToDisplay.filter(leave => {
    if (user?.role !== 'admin' || !searchQuery) return true;
    const employee = allEmployees.find(e => e.id === leave.employeeId);
    if (!employee) {
        return leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
        employee.name.toLowerCase().includes(lowerCaseQuery) ||
        employee.pno.toLowerCase().includes(lowerCaseQuery) ||
        employee.badgeNumber.toLowerCase().includes(lowerCaseQuery)
    );
  });

  const getStatusBadgeVariant = (status: LeaveStatus) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Pending":
        return "secondary"
      case "Rejected":
        return "destructive"
    }
  }

  const isChiefAdmin = user?.pno === 'ADMIN';

  return (
    <>
      <PageHeader
        title={t.sidebar.leave}
        description={user?.role === "admin" ? t.pageHeaders.leaveAdmin.description : t.pageHeaders.leaveEmployee.description}
      >
        <Dialog
          open={isLeaveDialogOpen}
          onOpenChange={(isOpen) => {
            setIsLeaveDialogOpen(isOpen)
            if (isOpen) {
              const today = new Date().toISOString().split("T")[0]
              setNewLeave({
                ...initialNewLeaveState,
                startDate: today,
                endDate: today,
              })
            } else {
              setNewLeave(initialNewLeaveState)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={user?.status === 'Suspended'}>
              <PlusCircle className="mr-2" />
              {user?.role === "admin" ? t.leave.addLeave : t.leave.requestLeave}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {user?.role === "admin" ? t.leave.addLeaveRecord : t.leave.requestNewLeave}
              </DialogTitle>
              <DialogDescription>
                {t.leave.requestLeaveDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {user?.role === "admin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employeeId" className="text-right">
                    {t.leave.employee}
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewLeaveSelectChange("employeeId", value)
                    }
                    value={newLeave.employeeId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.leave.selectEmployee} />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.filter(emp => emp.status !== 'Suspended' && emp.status !== 'Transferred').map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.pno})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  {t.leave.leaveType}
                </Label>
                <Select
                  onValueChange={(value) => handleNewLeaveSelectChange("type", value)}
                  value={newLeave.type}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t.leave.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t.leaveTypes[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  {t.leave.startDate}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newLeave.startDate}
                  onChange={handleNewLeaveInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  {t.leave.endDate}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newLeave.endDate}
                  onChange={handleNewLeaveInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  {t.leave.reason}
                </Label>
                <Textarea
                  id="reason"
                  value={newLeave.reason}
                  onChange={handleNewLeaveInputChange}
                  className="col-span-3"
                />
              </div>
              {user?.role === "admin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    {t.status}
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewLeaveSelectChange("status", value)}
                    value={newLeave.status}
                    disabled={user.rank !== 'Administrator'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.leave.selectStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t.leaveStatuses[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLeaveDialogOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button onClick={handleSaveLeave}>{t.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleExport}>
          <Printer className="mr-2" />
          {t.exportPdf}
        </Button>
      </PageHeader>

      {user?.status === 'Suspended' && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {t.leave.suspendedMessage}
        </div>
      )}

      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>{t.sidebar.leave}</CardTitle>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Input
                            placeholder={t.employees.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64"
                        />
                    </div>
                )}
            </div>
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
                  <TableHead>{t.leave.leaveType}</TableHead>
                  <TableHead>{t.leave.startDate}</TableHead>
                  <TableHead>{t.leave.endDate}</TableHead>
                  <TableHead>{t.leave.totalDays}</TableHead>
                  <TableHead>{t.leave.reason}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  {user?.rank === 'Administrator' && <TableHead className="text-right">{t.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave, index) => {
                  const startDateValid = leave.startDate && !isNaN(new Date(leave.startDate.replace(/-/g, '/')).getTime());
                  const endDateValid = leave.endDate && !isNaN(new Date(leave.endDate.replace(/-/g, '/')).getTime());
                  const employee = allEmployees.find(e => e.id === leave.employeeId);
                  const totalDays = startDateValid && endDateValid
                    ? differenceInCalendarDays(new Date(leave.endDate.replace(/-/g, '/')), new Date(leave.startDate.replace(/-/g, '/'))) + 1
                    : 0;

                  return (
                    <TableRow key={leave.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{employee ? t.ranks[employee.rank] : 'N/A'}</TableCell>
                      <TableCell>{employee?.badgeNumber || 'N/A'}</TableCell>
                      <TableCell>{employee?.pno || 'N/A'}</TableCell>
                      <TableCell>{leave.employeeName}</TableCell>
                      <TableCell>{t.leaveTypes[leave.type]}</TableCell>
                      <TableCell>{startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                      <TableCell>{endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                      <TableCell>{totalDays > 0 ? totalDays : 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(leave.status)}
                          className={cn(leave.status === "Approved" && "bg-green-500")}
                        >
                          {t.leaveStatuses[leave.status]}
                        </Badge>
                      </TableCell>
                      {user?.rank === 'Administrator' && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t.employees.openMenu}</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(leave)}>
                                {t.edit}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleDeleteLeave(leave.id)}
                                disabled={!isChiefAdmin}
                              >
                                {t.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
                {filteredLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={user?.rank === 'Administrator' ? 12 : 11} className="text-center h-24">
                      {t.leave.noLeaveRecords}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.leave.editLeave}</DialogTitle>
              <DialogDescription>{t.leave.editLeaveDescription}</DialogDescription>
            </DialogHeader>
            {editingLeave && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t.leave.employee}</Label>
                        <Input
                            value={editingLeave.employeeName}
                            disabled
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type-edit" className="text-right">{t.leave.leaveType}</Label>
                        <Select
                            onValueChange={(value) => handleEditSelectChange("type", value)}
                            value={editingLeave.type}
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
                        <Label htmlFor="startDate-edit" className="text-right">{t.leave.startDate}</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={editingLeave.startDate}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate-edit" className="text-right">{t.leave.endDate}</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={editingLeave.endDate}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason-edit" className="text-right">{t.leave.reason}</Label>
                        <Textarea
                            id="reason"
                            value={editingLeave.reason}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status-edit" className="text-right">{t.status}</Label>
                      <Select
                        onValueChange={(value) => handleEditSelectChange("status", value)}
                        value={editingLeave.status}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t.leave.selectStatus} />
                        </SelectTrigger>
                        <SelectContent>
                          {leaveStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t.leaveStatuses[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditDialogOpen(false)}
                >
                    {t.cancel}
                </Button>
                <Button onClick={handleUpdateLeave}>{t.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
                <AlertDialogDescription>{t.confirmDeleteDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setLeaveToDelete(null)}>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteLeave} className={buttonVariants({ variant: "destructive" })}>{t.deleteConfirm}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

    