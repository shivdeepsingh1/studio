"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Search } from "lucide-react"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { mockEmployees } from "@/lib/mock-data"
import { Employee, EmployeeRank, employeeRanks } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const initialNewEmployeeState = {
    pno: "",
    name: "",
    rank: "Constable" as EmployeeRank,
    contact: "",
    joiningDate: "",
    joiningDistrict: "",
  }

  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState)

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.pno.includes(searchQuery)
  )

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id))
  }

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return
    setEmployees(
      employees.map((emp) =>
        emp.id === editingEmployee.id ? editingEmployee : emp
      )
    )
    setIsEditDialogOpen(false)
    setEditingEmployee(null)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEmployee) return
    const { id, value } = e.target
    setEditingEmployee({ ...editingEmployee, [id]: value })
  }

  const handleRankChange = (value: string) => {
    if (!editingEmployee) return
    setEditingEmployee({ ...editingEmployee, rank: value as EmployeeRank })
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee({ ...employee })
    setIsEditDialogOpen(true)
  }

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewEmployee({ ...newEmployee, [id]: value })
  }

  const handleNewRankChange = (value: string) => {
    setNewEmployee({ ...newEmployee, rank: value as EmployeeRank })
  }

  const handleAddEmployee = () => {
    const newId = Date.now().toString()
    const avatarUrl = `https://picsum.photos/seed/${newId}/100/100`
    setEmployees([...employees, { ...newEmployee, id: newId, avatarUrl }])
    setIsAddDialogOpen(false)
    setNewEmployee(initialNewEmployeeState)
  }

  return (
    <>
      <PageHeader
        title="Employee Management"
        description="Add, edit, or delete employee records."
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by PNO or name..."
            className="pl-8 sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Fill in the form to add a new employee to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={handleNewInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rank" className="text-right">
                  Rank
                </Label>
                <Select
                  onValueChange={handleNewRankChange}
                  value={newEmployee.rank}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeRanks.map((rank) => (
                      <SelectItem key={rank} value={rank}>
                        {rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pno" className="text-right">
                  PNO
                </Label>
                <Input
                  id="pno"
                  value={newEmployee.pno}
                  onChange={handleNewInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">
                  Mobile No.
                </Label>
                <Input
                  id="contact"
                  value={newEmployee.contact}
                  onChange={handleNewInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joiningDate" className="text-right">
                  Joining Date
                </Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={newEmployee.joiningDate}
                  onChange={handleNewInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joiningDistrict" className="text-right">
                  Joining District
                </Label>
                <Input
                  id="joiningDistrict"
                  value={newEmployee.joiningDistrict}
                  onChange={handleNewInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEmployee}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Badge Number</TableHead>
              <TableHead>PNO</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Joining Branch/District</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Badge variant="outline">{employee.rank}</Badge>
                </TableCell>
                <TableCell>{employee.pno}</TableCell>
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
                <TableCell>{employee.joiningDate}</TableCell>
                <TableCell>{employee.joiningDistrict}</TableCell>
                <TableCell>{employee.contact}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => deleteEmployee(employee.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredEmployees.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No employees found.
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>
              Update the employee's information and click save.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingEmployee.name}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rank" className="text-right">
                  Rank
                </Label>
                <Select
                  onValueChange={handleRankChange}
                  value={editingEmployee.rank}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                     {employeeRanks.map((rank) => (
                      <SelectItem key={rank} value={rank}>
                        {rank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pno" className="text-right">
                  PNO
                </Label>
                <Input
                  id="pno"
                  value={editingEmployee.pno}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">
                  Mobile No.
                </Label>
                <Input
                  id="contact"
                  value={editingEmployee.contact}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joiningDate" className="text-right">
                  Joining Date
                </Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={editingEmployee.joiningDate}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joiningDistrict" className="text-right">
                  Joining District
                </Label>
                <Input
                  id="joiningDistrict"
                  value={editingEmployee.joiningDistrict}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
