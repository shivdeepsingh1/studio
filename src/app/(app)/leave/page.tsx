
"use client"

import { useState } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FileDown, PlusCircle } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Leave, leaveTypes, leaveStatuses, LeaveType, LeaveStatus } from "@/lib/types"
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

export default function LeavePage() {
  const { user } = useAuth()
  const { leaves, employees: allEmployees, updateLeaves } = useData();
  const { t } = useLanguage();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const initialNewLeaveState = {
    employeeId: "",
    type: "Casual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending" as LeaveStatus,
  }

  const [newLeave, setNewLeave] = useState(initialNewLeaveState)

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
      alert(t.leave.fillAllFields)
      return
    }
    const employee = allEmployees.find((e) => e.id === employeeId)
    if (!employee) {
      alert(t.leave.employeeNotFound)
      return
    }

    if (employee.status === 'Suspended') {
        alert(t.leave.suspendedLeaveError);
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
    updateLeaves([...leaves, leaveToAdd])
    setIsLeaveDialogOpen(false)
  }

  const handleStatusUpdate = (leaveId: string, status: LeaveStatus) => {
    if (user?.rank !== 'Administrator') return;
    updateLeaves(
      leaves.map((l) => (l.id === leaveId ? { ...l, status } : l))
    );
  };

  const handleExport = () => {
    const doc = new jsPDF()
    doc.text(t.pageHeaders.leaveAdmin.title, 14, 16)
    
    const isEmployeeView = user?.role !== "admin"
    const data = isEmployeeView ? employeeLeaves : leaves
    
    const head = isEmployeeView 
      ? [[t.serialNumber, t.leave.leaveType, t.leave.startDate, t.leave.endDate, t.leave.reason, t.status]]
      : [[t.serialNumber, t.name, t.leave.leaveType, t.leave.startDate, t.leave.endDate, t.leave.reason, t.status]]

    const body = data.map((leave, index) => {
        const startDateValid = leave.startDate && !isNaN(new Date(leave.startDate.replace(/-/g, '/')).getTime());
        const endDateValid = leave.endDate && !isNaN(new Date(leave.endDate.replace(/-/g, '/')).getTime());
        
        const row: (string | number)[] = [
            index + 1,
            t.leaveTypes[leave.type],
            startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            leave.reason,
            t.leaveStatuses[leave.status]
        ];

        if (!isEmployeeView) {
            row.splice(1, 0, leave.employeeName)
        }

        return row
    });

    autoTable(doc, {
      startY: 20,
      head: head,
      body: body as any,
    })

    doc.save("leave_records.pdf")
  }

  const employeeLeaves = leaves.filter((l) => l.employeeId === user?.id)

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

  return (
    <>
      <PageHeader
        title={user?.role === "admin" ? t.pageHeaders.leaveAdmin.title : t.pageHeaders.leaveEmployee.title}
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
                      {allEmployees.filter(emp => emp.status !== 'Suspended').map((employee) => (
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
          <FileDown className="mr-2" />
          {t.exportPdf}
        </Button>
      </PageHeader>

      {user?.status === 'Suspended' && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            {t.leave.suspendedMessage}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.serialNumber}</TableHead>
              {user?.role === "admin" && <TableHead>{t.name}</TableHead>}
              <TableHead>{t.leave.leaveType}</TableHead>
              <TableHead>{t.leave.startDate}</TableHead>
              <TableHead>{t.leave.endDate}</TableHead>
              <TableHead>{t.leave.reason}</TableHead>
              <TableHead>{t.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(user?.role === "admin" ? leaves : employeeLeaves).map((leave, index) => {
              const startDateValid = leave.startDate && !isNaN(new Date(leave.startDate.replace(/-/g, '/')).getTime());
              const endDateValid = leave.endDate && !isNaN(new Date(leave.endDate.replace(/-/g, '/')).getTime());
              return (
                <TableRow key={leave.id}>
                  <TableCell>{index + 1}</TableCell>
                  {user?.role === "admin" && (
                    <TableCell>{leave.employeeName}</TableCell>
                  )}
                  <TableCell>{t.leaveTypes[leave.type]}</TableCell>
                  <TableCell>{startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                  <TableCell>{endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {leave.reason}
                  </TableCell>
                  <TableCell>
                    {user?.rank === 'Administrator' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0 h-auto" disabled={user?.rank !== 'Administrator'}>
                            <Badge
                              variant={getStatusBadgeVariant(leave.status)}
                              className={cn("cursor-pointer",
                                leave.status === "Approved" && "bg-green-500 hover:bg-green-600"
                              )}
                            >
                              {t.leaveStatuses[leave.status]}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Approved')}>
                            {t.leaveStatuses['Approved']}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Rejected')}>
                            {t.leaveStatuses['Rejected']}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Pending')}>
                            {t.leaveStatuses['Pending']}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge
                        variant={getStatusBadgeVariant(leave.status)}
                        className={cn(
                          leave.status === "Approved" && "bg-green-500"
                        )}
                      >
                        {t.leaveStatuses[leave.status]}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {user?.role === "employee" && employeeLeaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {t.leave.noLeaveRecords}
                </TableCell>
              </TableRow>
            )}
             {user?.role === "admin" && leaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {t.leave.noLeaveRecords}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

    