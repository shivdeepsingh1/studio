
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
import { Leave, leaveTypes, leaveStatuses, LeaveType, LeaveStatus, leaveTypeTranslations, leaveStatusTranslations, employeeRankTranslations } from "@/lib/types"
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

export default function LeavePage() {
  const { user } = useAuth()
  const { leaves, employees: allEmployees, updateLeaves } = useData();
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
      alert("कृपया सभी आवश्यक फ़ील्ड भरें।")
      return
    }
    const employee = allEmployees.find((e) => e.id === employeeId)
    if (!employee) {
      alert("कर्मचारी नहीं मिला।")
      return
    }

    if (employee.status === 'Suspended') {
        alert("निलंबित कर्मचारी के लिए अवकाश संसाधित नहीं किया जा सकता है।");
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
    doc.text("अवकाश रिकॉर्ड", 14, 16)
    
    const isEmployeeView = user?.role !== "admin"
    const data = isEmployeeView ? employeeLeaves : leaves
    
    const head = isEmployeeView 
      ? [['क्र.सं.', 'प्रकार', 'प्रारंभ तिथि', 'अंतिम तिथि', 'कारण', 'स्थिति']]
      : [['क्र.सं.', 'कर्मचारी का नाम', 'प्रकार', 'प्रारंभ तिथि', 'अंतिम तिथि', 'कारण', 'स्थिति']]

    const body = data.map((leave, index) => {
        const startDateValid = leave.startDate && !isNaN(new Date(leave.startDate.replace(/-/g, '/')).getTime());
        const endDateValid = leave.endDate && !isNaN(new Date(leave.endDate.replace(/-/g, '/')).getTime());
        
        const row: (string | number)[] = [
            index + 1,
            leaveTypeTranslations[leave.type],
            startDateValid ? format(new Date(leave.startDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            endDateValid ? format(new Date(leave.endDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            leave.reason,
            leaveStatusTranslations[leave.status]
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
        title="अवकाश प्रबंधन"
        description={
          user?.role === "admin"
            ? "कर्मचारी अवकाश विवरण अपडेट और प्रबंधित करें।"
            : "अपनी अवकाश स्थिति और इतिहास देखें।"
        }
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
              {user?.role === "admin" ? "अवकाश जोड़ें" : "अवकाश का अनुरोध करें"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {user?.role === "admin" ? "अवकाश रिकॉर्ड जोड़ें" : "नए अवकाश का अनुरोध करें"}
              </DialogTitle>
              <DialogDescription>
                अवकाश अनुरोध जमा करने के लिए विवरण भरें।
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {user?.role === "admin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employeeId" className="text-right">
                    कर्मचारी
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewLeaveSelectChange("employeeId", value)
                    }
                    value={newLeave.employeeId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="कर्मचारी चुनें" />
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
                  अवकाश का प्रकार
                </Label>
                <Select
                  onValueChange={(value) => handleNewLeaveSelectChange("type", value)}
                  value={newLeave.type}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="प्रकार चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {leaveTypeTranslations[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  प्रारंभ तिथि
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
                  अंतिम तिथि
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
                  कारण
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
                    स्थिति
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewLeaveSelectChange("status", value)}
                    value={newLeave.status}
                    disabled={user.rank !== 'Administrator'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="स्थिति चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {leaveStatusTranslations[status]}
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
                रद्द करें
              </Button>
              <Button onClick={handleSaveLeave}>सहेजें</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          PDF निर्यात करें
        </Button>
      </PageHeader>

      {user?.status === 'Suspended' && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            आपका खाता वर्तमान में निलंबित है। आप नए अवकाश के लिए आवेदन नहीं कर सकते। कृपया एक प्रशासक से संपर्क करें।
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>क्र.सं.</TableHead>
              {user?.role === "admin" && <TableHead>कर्मचारी का नाम</TableHead>}
              <TableHead>प्रकार</TableHead>
              <TableHead>प्रारंभ तिथि</TableHead>
              <TableHead>अंतिम तिथि</TableHead>
              <TableHead>कारण</TableHead>
              <TableHead>स्थिति</TableHead>
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
                  <TableCell>{leaveTypeTranslations[leave.type]}</TableCell>
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
                              {leaveStatusTranslations[leave.status]}
                            </Badge>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Approved')}>
                            स्वीकृत करें
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Rejected')}>
                            अस्वीकार करें
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Pending')}>
                            लंबित के रूप में सेट करें
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
                        {leaveStatusTranslations[leave.status]}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {user?.role === "employee" && employeeLeaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  कोई अवकाश रिकॉर्ड नहीं मिला।
                </TableCell>
              </TableRow>
            )}
             {user?.role === "admin" && leaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  कोई अवकाश रिकॉर्ड नहीं मिला।
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
