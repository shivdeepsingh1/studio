"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Search, Eye, EyeOff, RotateCcw } from "lucide-react"
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
import { useAuth } from "@/lib/auth"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const initialNewEmployeeState = {
    badgeNumber: "",
    pno: "",
    name: "",
    rank: "Constable" as EmployeeRank,
    dob: "",
    contact: "",
    joiningDate: "",
    joiningDistrict: "",
    password: "",
    role: "employee" as "admin" | "employee",
  }

  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState)

  useEffect(() => {
    const storedEmployees = localStorage.getItem("line-command-employees");
    if (storedEmployees) {
      try {
        setEmployees(JSON.parse(storedEmployees));
      } catch (e) {
        setEmployees(mockEmployees);
      }
    } else {
      setEmployees(mockEmployees);
    }
  }, []);

  const updateEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    localStorage.setItem("line-command-employees", JSON.stringify(updatedEmployees));
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.pno.includes(searchQuery) ||
      employee.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const deleteEmployee = (id: string) => {
    updateEmployees(employees.filter((e) => e.id !== id))
  }

  const handleUpdateEmployee = () => {
    if (!editingEmployee || !editingEmployee.id) return;

    updateEmployees(
      employees.map((emp) =>
        emp.id === editingEmployee.id ? { ...emp, ...editingEmployee } : emp
      )
    );

    setIsEditDialogOpen(false);
    setEditingEmployee(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEmployee) return
    const { id, value } = e.target
    setEditingEmployee({ ...editingEmployee, [id]: value })
  }

  const handleRankChange = (value: string) => {
    if (!editingEmployee) return
    setEditingEmployee({ ...editingEmployee, rank: value as EmployeeRank })
  }

  const handleRoleChange = (value: "admin" | "employee") => {
    if (!editingEmployee) return
    setEditingEmployee({ ...editingEmployee, role: value })
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee({ ...employee, password: employee.password ?? "" })
    setIsEditDialogOpen(true)
  }

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewEmployee({ ...newEmployee, [id]: value })
  }

  const handleNewRankChange = (value: string) => {
    setNewEmployee({ ...newEmployee, rank: value as EmployeeRank })
  }

  const handleNewRoleChange = (value: "admin" | "employee") => {
    setNewEmployee({ ...newEmployee, role: value })
  }

  const handleAddEmployee = () => {
    const newId = Date.now().toString()
    const avatarUrl = `https://picsum.photos/seed/${newId}/100/100`

    let employeeToAdd = { ...newEmployee };
    if (!employeeToAdd.password && employeeToAdd.dob && employeeToAdd.dob.includes('-')) {
        const parts = employeeToAdd.dob.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            employeeToAdd.password = `${day}${month}${year}`;
        }
    }

    updateEmployees([...employees, { ...employeeToAdd, id: newId, avatarUrl } as Employee])
    setIsAddDialogOpen(false)
    setNewEmployee(initialNewEmployeeState)
  }
  
  const handleAddDialogChange = (isOpen: boolean) => {
    setIsAddDialogOpen(isOpen);
    if (!isOpen) {
      setShowPassword(false);
    }
  }

  const handleEditDialogChange = (isOpen: boolean) => {
    setIsEditDialogOpen(isOpen);
     if (!isOpen) {
      setShowPassword(false);
    }
  }
  
  const canEdit = user?.rank === 'Administrator';

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
            placeholder="Search by PNO, Badge No. or name..."
            className="pl-8 sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
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
            <ScrollArea className="max-h-[70vh] pr-6">
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
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newEmployee.password}
                      onChange={handleNewInputChange}
                      className="pr-10"
                      placeholder="Leave blank for default"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <p className="text-xs text-muted-foreground -mt-2">
                      Default password is the date of birth in <strong>ddmmyyyy</strong> format.
                    </p>
                  </div>
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
                        <SelectItem key={rank} value={rank} disabled={rank === 'Administrator'}>
                          {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    onValueChange={handleNewRoleChange}
                    value={newEmployee.role}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    Badge Number
                  </Label>
                  <Input
                    id="badgeNumber"
                    value={newEmployee.badgeNumber}
                    onChange={handleNewInputChange}
                    className="col-span-3"
                  />
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
                  <Label htmlFor="dob" className="text-right">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={newEmployee.dob}
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
            </ScrollArea>
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
              <TableHead>Sr. No.</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Badge Number</TableHead>
              <TableHead>PNO</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Joining Branch/District</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee, index) => {
              const dobValid = employee.dob && !isNaN(new Date(employee.dob.replace(/-/g, '/')).getTime());
              const joiningDateValid = employee.joiningDate && !isNaN(new Date(employee.joiningDate.replace(/-/g, '/')).getTime());
              return (
                <TableRow key={employee.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.rank}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>{employee.role}</Badge>
                  </TableCell>
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
                  <TableCell>{dobValid ? format(new Date(employee.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                  <TableCell>{joiningDateValid ? format(new Date(employee.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                  <TableCell>{employee.joiningDistrict}</TableCell>
                  <TableCell>{employee.contact}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canEdit}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(employee)} disabled={!canEdit}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => deleteEmployee(employee.id)}
                          disabled={!canEdit}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {filteredEmployees.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          No employees found.
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>
              Update the employee's information and click save.
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editingEmployee.name ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={editingEmployee.password ?? ""}
                      onChange={handleEditInputChange}
                      className="pr-10"
                      placeholder="Leave blank for default"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3 flex flex-col items-start gap-2">
                    <p className="text-xs text-muted-foreground -mt-2">
                      Default password is the date of birth in <strong>ddmmyyyy</strong> format.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                          if (editingEmployee) {
                              setEditingEmployee({ ...editingEmployee, password: "" });
                          }
                      }}
                      disabled={!canEdit}
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Reset to Default
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rank" className="text-right">
                    Rank
                  </Label>
                  <Select
                    onValueChange={handleRankChange}
                    value={editingEmployee.rank ?? ""}
                     disabled={!canEdit}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                       {employeeRanks.map((rank) => (
                        <SelectItem key={rank} value={rank} disabled={rank === 'Administrator'}>
                          {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    onValueChange={handleRoleChange}
                    value={editingEmployee.role ?? "employee"}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    Badge Number
                  </Label>
                  <Input
                    id="badgeNumber"
                    value={editingEmployee.badgeNumber ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pno" className="text-right">
                    PNO
                  </Label>
                  <Input
                    id="pno"
                    value={editingEmployee.pno ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dob" className="text-right">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editingEmployee.dob ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact" className="text-right">
                    Mobile No.
                  </Label>
                  <Input
                    id="contact"
                    value={editingEmployee.contact ?? ""}
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
                    value={editingEmployee.joiningDate ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="joiningDistrict" className="text-right">
                    Joining District
                  </Label>
                  <Input
                    id="joiningDistrict"
                    value={editingEmployee.joiningDistrict ?? ""}
                    onChange={handleEditInputChange}
                    className="col-span-3"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </ScrollArea>
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
