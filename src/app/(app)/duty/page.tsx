
"use client"

import { useState } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FileDown, PlusCircle, MoreHorizontal } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Duty, Employee, Leave } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useData } from "@/lib/data-provider"
import { useToast } from "@/hooks/use-toast"

export default function DutyPage() {
  const { user } = useAuth()
  const { duties, employees: allEmployees, updateDuties, leaves, updateLeaves } = useData()
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState<"Present" | "Absent">("Present");
  
  const [editingDuty, setEditingDuty] = useState<Duty | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);


  const initialNewDutyState = {
    employeeId: "",
    date: "",
    shift: "Morning" as "Morning" | "Afternoon" | "Night",
    location: "Reserve",
    details: "",
  }
  const [newDuty, setNewDuty] = useState(initialNewDutyState)
  const [pnoInput, setPnoInput] = useState("")
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null)

  const handlePnoSearch = (pno: string) => {
    setPnoInput(pno)
    if (pno) {
      const employee = allEmployees.find((e) => e.pno === pno)
      if (employee) {
        setFoundEmployee(employee)
        setNewDuty((prev) => ({ ...prev, employeeId: employee.id }))
      } else {
        setFoundEmployee(null)
        setNewDuty((prev) => ({ ...prev, employeeId: "" }))
      }
    } else {
      setFoundEmployee(null)
      setNewDuty((prev) => ({ ...prev, employeeId: "" }))
    }
  }

  const handleNewDutyInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setNewDuty({ ...newDuty, [id]: value })
  }

  const handleNewDutySelectChange = (id: string, value: string) => {
    setNewDuty({ ...newDuty, [id]: value as any })
  }

  const handleAssignDuty = () => {
    if (!foundEmployee) {
      toast({ variant: 'destructive', title: 'No Employee Selected', description: "Please search for an employee first." });
      return;
    }

    if (foundEmployee.status === 'Suspended') {
        toast({ variant: 'destructive', title: 'Action Prohibited', description: "Cannot assign duty or mark attendance for a suspended employee." });
        return;
    }

    if (attendanceStatus === 'Absent') {
      const absentLeave: Leave = {
        id: Date.now().toString(),
        employeeId: foundEmployee.id,
        employeeName: foundEmployee.name,
        type: 'Absent',
        startDate: newDuty.date,
        endDate: newDuty.date,
        reason: 'Marked absent from duty roster.',
        status: 'Approved'
      };
      updateLeaves([...leaves, absentLeave]);
      toast({ title: "Employee Marked Absent", description: `${foundEmployee.name} has been marked as absent for ${format(new Date(newDuty.date.replace(/-/g, '\/')), 'dd-MM-yyyy')}.` });
      setIsAssignDialogOpen(false);
      return;
    }
    
    // This is for 'Present'
    if (!newDuty.employeeId || !newDuty.date || !newDuty.location) {
      toast({ variant: 'destructive', title: 'Missing Information', description: "Please fill all required fields for duty assignment." });
      return
    }

    const dutyToAdd: Duty = {
      id: Date.now().toString(),
      employeeName: foundEmployee.name,
      employeeId: newDuty.employeeId,
      date: newDuty.date,
      shift: newDuty.shift,
      location: newDuty.location,
      details: newDuty.details,
    }
    updateDuties([...duties, dutyToAdd])
    toast({ title: "Duty Assigned", description: `Duty assigned to ${foundEmployee.name} for ${format(new Date(newDuty.date.replace(/-/g, '\/')), 'dd-MM-yyyy')}.` });
    setIsAssignDialogOpen(false)
  }

  const openEditDialog = (duty: Duty) => {
    if (user?.rank !== 'Administrator') return;
    setEditingDuty(duty);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDuty = () => {
    if (!editingDuty || user?.rank !== 'Administrator') return;
    updateDuties(duties.map(d => d.id === editingDuty.id ? editingDuty : d));
    setIsEditDialogOpen(false);
    setEditingDuty(null);
  };

  const handleDeleteDuty = (id: string) => {
    if (user?.rank !== 'Administrator') return;
    if(window.confirm("Are you sure you want to delete this duty record?")){
      updateDuties(duties.filter(d => d.id !== id));
    }
  };


  const handleExport = () => {
    const doc = new jsPDF();
    doc.text("Duty Roster", 14, 16);

    const isEmployee = user?.role !== 'admin';
    
    let head;
    let body;

    if (isEmployee) {
      head = [['Sr. No.', 'Date', 'Shift', 'Location', 'Details']];
      body = employeeDuties.map((duty, index) => {
        const dutyDateValid = duty.date && !isNaN(new Date(duty.date.replace(/-/g, '/')).getTime());
        return [
            index + 1,
            dutyDateValid ? format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            duty.shift,
            duty.location,
            duty.details
        ]
      });
    } else {
      head = [['Sr. No.', 'Badge Number', 'PNO', 'Rank', 'Name', 'Date', 'Shift', 'Location']];
      body = duties.map((duty, index) => {
        const employee = allEmployees.find(e => e.id === duty.employeeId);
        const dutyDateValid = duty.date && !isNaN(new Date(duty.date.replace(/-/g, '/')).getTime());
        return [
          index + 1,
          employee?.badgeNumber || 'N/A',
          employee?.pno || 'N/A',
          employee?.rank || 'N/A',
          duty.employeeName,
          dutyDateValid ? format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
          duty.shift,
          duty.location
        ];
      });
    }

    autoTable(doc, {
      startY: 20,
      head: head,
      body: body as any,
    });
    doc.save("duty_roster.pdf");
  }

  const employeeDuties = duties.filter((d) => d.employeeId === user?.id)

  const dutiesForSelectedDate = date
    ? duties.filter((duty) => duty.date === format(date, "yyyy-MM-dd"))
    : []

  const dutyDates = [...new Set(duties.map((d) => d.date))].map((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day)
  })

  return (
    <>
      <PageHeader
        title="Duty Roster"
        description={
          user?.role === "admin"
            ? "Assign and manage daily duties for all employees."
            : "View your upcoming and past duty assignments."
        }
      >
        {user?.role === "admin" && (
          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setNewDuty({
                  ...initialNewDutyState,
                  date: new Date().toISOString().split("T")[0],
                })
                setPnoInput("")
                setFoundEmployee(null)
                setAttendanceStatus("Present")
              } else {
                setNewDuty(initialNewDutyState)
                setPnoInput("")
                setFoundEmployee(null)
                setAttendanceStatus("Present")
              }
              setIsAssignDialogOpen(isOpen)
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Assign Duty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Duty</DialogTitle>
                <DialogDescription>
                  Enter an employee's PNO to find them and assign a duty.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pno" className="text-right">
                    PNO
                  </Label>
                  <Input
                    id="pno"
                    value={pnoInput}
                    onChange={(e) => handlePnoSearch(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter employee PNO"
                  />
                </div>

                {foundEmployee ? (
                  <div className="col-span-4 rounded-md border bg-muted p-3 grid grid-cols-4 items-center gap-4 -mt-2">
                    <div className="col-span-4">
                        <p className="font-semibold">{foundEmployee.name}</p>
                        <p className="text-sm text-muted-foreground">{foundEmployee.rank}</p>
                        {foundEmployee.status === 'Suspended' && (
                           <p className="text-sm text-white bg-destructive/80 p-2 rounded-md mt-2">
                               This employee is suspended and cannot be assigned a duty.
                           </p>
                        )}
                    </div>
                  </div>
                ) : pnoInput && (
                    <div className="col-span-4 text-center text-sm text-white bg-destructive/80 p-2 rounded-md -mt-2">
                        <p>Employee not found.</p>
                    </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attendance" className="text-right">Attendance</Label>
                    <Select
                        onValueChange={(value) => setAttendanceStatus(value as 'Present' | 'Absent')}
                        value={attendanceStatus}
                        disabled={!foundEmployee || foundEmployee.status === 'Suspended'}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select attendance" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDuty.date}
                    onChange={handleNewDutyInputChange}
                    className="col-span-3"
                    disabled={!foundEmployee || foundEmployee.status === 'Suspended'}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shift" className="text-right">
                    Shift
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewDutySelectChange("shift", value)
                    }
                    value={newDuty.shift}
                    disabled={!foundEmployee || foundEmployee.status === 'Suspended' || attendanceStatus === 'Absent'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={newDuty.location}
                    onChange={handleNewDutyInputChange}
                    className="col-span-3"
                    disabled={!foundEmployee || foundEmployee.status === 'Suspended' || attendanceStatus === 'Absent'}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="details" className="text-right">
                    Details
                  </Label>
                  <Textarea
                    id="details"
                    value={newDuty.details}
                    onChange={handleNewDutyInputChange}
                    className="col-span-3"
                    disabled={!foundEmployee || foundEmployee.status === 'Suspended' || attendanceStatus === 'Absent'}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignDuty} disabled={!foundEmployee || foundEmployee.status === 'Suspended'}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      {user?.role === "admin" ? (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Duty List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Badge Number</TableHead>
                    <TableHead>PNO</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Location</TableHead>
                    {user?.rank === 'Administrator' && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duties.map((duty, index) => {
                    const employee = allEmployees.find(
                      (e) => e.id === duty.employeeId
                    )
                    const dutyDateValid = duty.date && !isNaN(new Date(duty.date.replace(/-/g, '/')).getTime());
                    return (
                      <TableRow key={duty.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{employee?.badgeNumber}</TableCell>
                        <TableCell>{employee?.pno}</TableCell>
                        <TableCell>{employee?.rank}</TableCell>
                        <TableCell>{duty.employeeName}</TableCell>
                        <TableCell>{dutyDateValid ? format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              duty.shift === "Night"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {duty.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>{duty.location}</TableCell>
                        {user?.rank === 'Administrator' && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={user?.rank !== 'Administrator'}>
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(duty)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => handleDeleteDuty(duty.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="calendar" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-0 flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="p-4"
                  modifiers={{ hasDuty: dutyDates }}
                  modifiersClassNames={{
                    hasDuty: "bg-primary/20",
                  }}
                  numberOfMonths={2}
                  captionLayout="dropdown-buttons"
                  fromYear={new Date().getFullYear() - 100}
                  toYear={new Date().getFullYear() + 10}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Duties for {date ? format(date, "dd-MM-yyyy") : "selected date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dutiesForSelectedDate.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sr. No.</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dutiesForSelectedDate.map((duty, index) => (
                        <TableRow key={duty.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{duty.employeeName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                duty.shift === "Night"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {duty.shift}
                            </Badge>
                          </TableCell>
                          <TableCell>{duty.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">
                    No duties assigned for this date.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr. No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeDuties.map((duty, index) => {
                const dutyDateValid = duty.date && !isNaN(new Date(duty.date.replace(/-/g, '/')).getTime());
                return (
                  <TableRow key={duty.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{dutyDateValid ? format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          duty.shift === "Night" ? "destructive" : "secondary"
                        }
                      >
                        {duty.shift}
                      </Badge>
                    </TableCell>
                    <TableCell>{duty.location}</TableCell>
                    <TableCell>{duty.details}</TableCell>
                  </TableRow>
                )
              })}
              {employeeDuties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No duties assigned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Duty</DialogTitle>
            <DialogDescription>
              Update the details for this duty assignment.
            </DialogDescription>
          </DialogHeader>
          {editingDuty && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Employee</Label>
                  <Input
                    value={editingDuty.employeeName}
                    disabled
                    className="col-span-3"
                  />
                </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date-edit" className="text-right">
                  Date
                </Label>
                <Input
                  id="date-edit"
                  type="date"
                  value={editingDuty.date}
                  onChange={(e) => setEditingDuty({ ...editingDuty, date: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift-edit" className="text-right">
                  Shift
                </Label>
                <Select
                  onValueChange={(value) =>
                    setEditingDuty({ ...editingDuty, shift: value as Duty['shift'] })
                  }
                  value={editingDuty.shift}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Afternoon">Afternoon</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location-edit" className="text-right">
                  Location
                </Label>
                <Input
                  id="location-edit"
                  value={editingDuty.location}
                  onChange={(e) => setEditingDuty({ ...editingDuty, location: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="details-edit" className="text-right">
                  Details
                </Label>
                <Textarea
                  id="details-edit"
                  value={editingDuty.details}
                  onChange={(e) => setEditingDuty({ ...editingDuty, details: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDuty}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

    

    
