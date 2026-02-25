"use client"

import { useState } from "react"
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
import { mockDuties, mockEmployees } from "@/lib/mock-data"
import { Duty } from "@/lib/types"
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

// A mock function for PDF generation
const generatePdf = (data: any, title: string) => {
  console.log(`Generating PDF for ${title}:`, data)
  alert(`PDF for "${title}" would be generated. Check console for data.`)
}

export default function DutyPage() {
  const { role, user } = useAuth()
  const [duties, setDuties] = useState<Duty[]>(mockDuties)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  const initialNewDutyState = {
    employeeId: "",
    date: "",
    shift: "Morning" as "Morning" | "Afternoon" | "Night",
    location: "",
    details: "",
  }
  const [newDuty, setNewDuty] = useState(initialNewDutyState)

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
    if (!newDuty.employeeId || !newDuty.date || !newDuty.location) {
      alert("Please fill all required fields.")
      return
    }
    const employee = mockEmployees.find((e) => e.id === newDuty.employeeId)
    if (!employee) {
      alert("Selected employee not found.")
      return
    }

    const dutyToAdd: Duty = {
      id: Date.now().toString(),
      employeeName: employee.name,
      ...newDuty,
    }
    setDuties([...duties, dutyToAdd])
    setIsAssignDialogOpen(false)
    setNewDuty(initialNewDutyState)
  }

  const handleExport = () => {
    generatePdf(duties, "Duty Roster")
  }

  const employeeDuties = duties.filter((d) => d.employeeId === user?.id)

  return (
    <>
      <PageHeader
        title="Duty Roster"
        description={
          role === "admin"
            ? "Assign and manage daily duties for all employees."
            : "View your upcoming and past duty assignments."
        }
      >
        {role === "admin" && (
          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
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
                  Fill in the details to assign a new duty.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employeeId" className="text-right">
                    Employee
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewDutySelectChange("employeeId", value)
                    }
                    value={newDuty.employeeId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.pno})
                        </SelectItem>
                      ))}
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
                <Button onClick={handleAssignDuty}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      {role === "admin" ? (
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
                    <TableHead>Badge Number</TableHead>
                    <TableHead>PNO</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duties.map((duty) => {
                    const employee = mockEmployees.find(
                      (e) => e.id === duty.employeeId
                    )
                    return (
                      <TableRow key={duty.id}>
                        <TableCell>{employee?.pno}</TableCell>
                        <TableCell>{employee?.pno}</TableCell>
                        <TableCell>{employee?.rank}</TableCell>
                        <TableCell>{duty.employeeName}</TableCell>
                        <TableCell>{duty.date}</TableCell>
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="calendar">
            <div className="flex justify-center p-4 border rounded-lg bg-card">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeDuties.map((duty) => (
                <TableRow key={duty.id}>
                  <TableCell>{duty.date}</TableCell>
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
              ))}
              {employeeDuties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No duties assigned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
