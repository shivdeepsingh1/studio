
"use client"

import { useState, useEffect } from "react"
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
import { mockEmployees, mockLeaves } from "@/lib/mock-data"
import { Employee, Leave } from "@/lib/types"
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

// A mock function for PDF generation
const generatePdf = (data: any, title: string) => {
  console.log(`Generating PDF for ${title}:`, data)
  alert(`PDF for "${title}" would be generated. Check console for data.`)
}

const leaveTypes: Leave["type"][] = ["Casual", "Sick", "Earned", "Maternity"]
const leaveStatuses: Leave["status"][] = ["Pending", "Approved", "Rejected"]

export default function LeavePage() {
  const { role, user } = useAuth()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const initialNewLeaveState = {
    employeeId: "",
    type: "Casual" as Leave["type"],
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending" as Leave["status"],
  }

  const [newLeave, setNewLeave] = useState(initialNewLeaveState)

  useEffect(() => {
    const storedLeaves = localStorage.getItem("line-command-leaves");
    if (storedLeaves) {
        try {
            setLeaves(JSON.parse(storedLeaves));
        } catch(e) {
            setLeaves(mockLeaves);
        }
    } else {
        setLeaves(mockLeaves);
    }
    

    const storedEmployees = localStorage.getItem("line-command-employees");
     if (storedEmployees) {
        try {
            setAllEmployees(JSON.parse(storedEmployees));
        } catch(e) {
            setAllEmployees(mockEmployees);
        }
    } else {
        setAllEmployees(mockEmployees);
    }
  }, []);

  const updateLeaves = (updatedLeaves: Leave[]) => {
    setLeaves(updatedLeaves);
    localStorage.setItem("line-command-leaves", JSON.stringify(updatedLeaves));
  }

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
    const isEmployeeRequest = role === "employee"
    const employeeId = isEmployeeRequest ? user?.id : newLeave.employeeId

    if (
      !employeeId ||
      !newLeave.startDate ||
      !newLeave.endDate ||
      !newLeave.reason
    ) {
      alert("Please fill all required fields.")
      return
    }
    const employee = allEmployees.find((e) => e.id === employeeId)
    if (!employee) {
      alert("Employee not found.")
      return
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

  const handleStatusUpdate = (leaveId: string, status: Leave["status"]) => {
    updateLeaves(
      leaves.map((l) => (l.id === leaveId ? { ...l, status } : l))
    );
  };

  const handleExport = () => {
    generatePdf(leaves, "Leave Records")
  }

  const employeeLeaves = leaves.filter((l) => l.employeeId === user?.id)

  const getStatusBadgeVariant = (status: Leave["status"]) => {
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
        title="Leave Management"
        description={
          role === "admin"
            ? "Update and manage employee leave details."
            : "View your leave status and history."
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
            <Button>
              <PlusCircle className="mr-2" />
              {role === "admin" ? "Add Leave" : "Request Leave"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {role === "admin" ? "Add Leave Record" : "Request New Leave"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to submit a leave request.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {role === "admin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employeeId" className="text-right">
                    Employee
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewLeaveSelectChange("employeeId", value)
                    }
                    value={newLeave.employeeId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.map((employee) => (
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
                  Leave Type
                </Label>
                <Select
                  onValueChange={(value) => handleNewLeaveSelectChange("type", value)}
                  value={newLeave.type}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date
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
                  End Date
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
                  Reason
                </Label>
                <Textarea
                  id="reason"
                  value={newLeave.reason}
                  onChange={handleNewLeaveInputChange}
                  className="col-span-3"
                />
              </div>
              {role === "admin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewLeaveSelectChange("status", value)}
                    value={newLeave.status}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
                Cancel
              </Button>
              <Button onClick={handleSaveLeave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr. No.</TableHead>
              {role === "admin" && <TableHead>Employee Name</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(role === "admin" ? leaves : employeeLeaves).map((leave, index) => (
              <TableRow key={leave.id}>
                <TableCell>{index + 1}</TableCell>
                {role === "admin" && (
                  <TableCell>{leave.employeeName}</TableCell>
                )}
                <TableCell>{leave.type}</TableCell>
                <TableCell>{leave.startDate}</TableCell>
                <TableCell>{leave.endDate}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {leave.reason}
                </TableCell>
                <TableCell>
                  {role === 'admin' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="p-0 h-auto">
                           <Badge
                            variant={getStatusBadgeVariant(leave.status)}
                            className={cn("cursor-pointer",
                              leave.status === "Approved" && "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {leave.status}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Approved')}>
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Rejected')}>
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(leave.id, 'Pending')}>
                          Set as Pending
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
                      {leave.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {role === "employee" && employeeLeaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No leave records found.
                </TableCell>
              </TableRow>
            )}
             {role === "admin" && leaves.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No leave records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

    