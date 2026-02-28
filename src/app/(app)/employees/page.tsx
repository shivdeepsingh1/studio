"use client"

import { useState } from "react"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { font } from "@/lib/fonts/Hind-Regular";
import { PageHeader } from "@/components/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Search, Eye, EyeOff, RotateCcw, FileUp, Printer, Pencil } from "lucide-react"
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
import { Input } from "@/components/ui/input"
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
import { useData } from "@/lib/data-provider"
import { useLanguage } from "@/lib/i18n/language-provider"

export default function EmployeesPage() {
  const { user } = useAuth();
  const { employees, updateEmployees } = useData();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

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
    status: "Active" as "Active" | "Suspended" | "Transferred",
    suspensionDate: "",
    transferDate: "",
    transferLocation: "",
  }

  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState)

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.status === 'Active' &&
      (employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.pno.includes(searchQuery) ||
      employee.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDeleteClick = (id: string) => {
    if (user?.rank !== 'Administrator') return;
    setEmployeeToDelete(id);
    setIsDeleteDialogOpen(true);
  }

  const confirmDelete = () => {
    if (!employeeToDelete) return;
    updateEmployees(prevEmployees => prevEmployees.filter((e) => e.id !== employeeToDelete));
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  }

  const handleUpdateEmployee = () => {
    if (!editingEmployee || !editingEmployee.id) return;
    if (user?.role !== 'admin') return;
  
    updateEmployees(prevEmployees => 
      prevEmployees.map((emp) =>
        emp.id === editingEmployee.id ? { ...emp, ...editingEmployee } as Employee : emp
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

  const handleEditSelectChange = (field: keyof Employee, value: string) => {
    if (!editingEmployee) return;
    setEditingEmployee({ ...editingEmployee, [field]: value });
  };


  const openEditDialog = (employee: Employee) => {
    setEditingEmployee({ ...employee, password: employee.password ?? "" })
    setIsEditDialogOpen(true)
  }

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewEmployee({ ...newEmployee, [id]: value })
  }
  
  const handleNewSelectChange = (field: keyof typeof initialNewEmployeeState, value: string) => {
    setNewEmployee({ ...newEmployee, [field]: value });
  };

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

    updateEmployees(prevEmployees => [...prevEmployees, { ...employeeToAdd, id: newId, avatarUrl } as Employee]);
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
  
  const canEdit = user?.role === 'admin';
  const isCurrentUserAdministrator = user?.rank === 'Administrator';

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        const importedEmployees: Employee[] = json.map((row: any, index) => {
          if (!row.pno || !row.name || !row.rank) {
            throw new Error(`Row ${index + 2}: Missing required fields (pno, name, rank).`);
          }
          
          const formatDate = (date: any): string => {
             if (date instanceof Date && !isNaN(date.getTime())) {
                const tempDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
                return tempDate.toISOString().split('T')[0];
             }
             return "";
          }

          const newId = Date.now().toString() + index;
          const avatarUrl = `https://picsum.photos/seed/${newId}/100/100`;
          
          return {
            id: newId,
            badgeNumber: row.badgeNumber?.toString() || '',
            pno: row.pno.toString(),
            name: row.name,
            rank: row.rank as EmployeeRank,
            dob: formatDate(row.dob),
            contact: row.contact?.toString() || '',
            joiningDate: formatDate(row.joiningDate),
            joiningDistrict: row.joiningDistrict || '',
            avatarUrl,
            password: row.password?.toString() || '',
            role: row.role === 'admin' ? 'admin' : 'employee',
            status: row.status as Employee['status'] || 'Active',
            suspensionDate: row.status === 'Suspended' ? formatDate(row.suspensionDate) : undefined,
            transferDate: row.status === 'Transferred' ? formatDate(row.transferDate) : undefined,
            transferLocation: row.status === 'Transferred' ? row.transferLocation : undefined,
          };
        });

        updateEmployees(prevEmployees => {
          const existingPnos = new Set(prevEmployees.map(e => e.pno));
          const newUniqueEmployees = importedEmployees.filter(e => !existingPnos.has(e.pno));
          
          const importedPnos = new Set();
          const trulyUniqueNewEmployees = newUniqueEmployees.filter(e => {
              if (importedPnos.has(e.pno)) return false;
              importedPnos.add(e.pno);
              return true;
          });

          if (trulyUniqueNewEmployees.length > 0) {
              alert(t.employees.importSuccess(trulyUniqueNewEmployees.length));
              return [...prevEmployees, ...trulyUniqueNewEmployees];
          } else {
              alert(t.employees.noNewEmployees);
              return prevEmployees;
          }
        });

        setIsImportDialogOpen(false);
        e.target.value = '';

      } catch (error: any) {
        alert(t.employees.importError(error.message));
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleExportPdf = () => {
    const doc = new jsPDF()
    if (font) {
      doc.addFileToVFS("Mangal.ttf", font);
      doc.addFont("Mangal.ttf", "Mangal", "normal");
      doc.setFont("Mangal");
    }

    doc.text(t.pageHeaders.employees.title, 14, 16)
    autoTable(doc, {
      startY: 20,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.employees.dob, t.employees.joiningDate, t.employees.joiningDistrict, t.employees.contactNumber, t.status]],
      body: filteredEmployees.map((employee, index) => {
        const dobValid = employee.dob && !isNaN(new Date(employee.dob.replace(/-/g, '/')).getTime());
        const joiningDateValid = employee.joiningDate && !isNaN(new Date(employee.joiningDate.replace(/-/g, '/')).getTime());
        return [
            index + 1,
            t.ranks[employee.rank],
            employee.badgeNumber,
            employee.pno,
            employee.name,
            dobValid ? format(new Date(employee.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            joiningDateValid ? format(new Date(employee.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            employee.joiningDistrict,
            employee.contact,
            t.statusTypes[employee.status]
        ]
      }),
      ...(font && { styles: { font: "Mangal" }, headStyles: {font: "Mangal"}, bodyStyles: {font: "Mangal"} })
    })
    doc.save("employees.pdf")
  }

  const handleEmployeeAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && editingEmployee) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatarUrl = event.target?.result as string;
        if (newAvatarUrl) {
          setEditingEmployee({ ...editingEmployee, avatarUrl: newAvatarUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <>
      <PageHeader
        title={t.pageHeaders.employees.title}
        description={t.pageHeaders.employees.description}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t.employees.searchPlaceholder}
            className="pl-8 sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!canEdit}>
              <FileUp className="mr-2 h-4 w-4" />
              {t.employees.importExcel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.employees.importFromExcel}</DialogTitle>
              <DialogDescription>
                {t.employees.importDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx, .csv"
                onChange={handleFileImport}
              />
            </div>
            <DialogFooter>
               <Button variant="secondary" onClick={() => setIsImportDialogOpen(false)}>{t.cancel}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleExportPdf}>
          <Printer className="mr-2 h-4 w-4" />
          {t.exportPdf}
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <PlusCircle className="mr-2" />
              {t.employees.addEmployee}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.employees.addNewEmployee}</DialogTitle>
              <DialogDescription>
                {t.employees.addNewEmployeeDescription}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t.name}
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
                    {t.employees.password}
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newEmployee.password}
                      onChange={handleNewInputChange}
                      className="pr-10"
                      placeholder={t.employees.passwordPlaceholder}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">{t.employees.togglePasswordVisibility}</span>
                    </Button>
                  </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <p className="text-xs text-muted-foreground -mt-2">
                      {t.employees.passwordHint}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rank" className="text-right">
                    {t.rank}
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('rank', value)}
                    value={newEmployee.rank}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectRank} />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRanks.map((rank) => (
                        <SelectItem key={rank} value={rank} disabled={rank === 'Administrator'}>
                          {t.ranks[rank]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    {t.role}
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('role', value)}
                    value={newEmployee.role}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectRole} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{t.employees.employee}</SelectItem>
                      <SelectItem value="admin">{t.employees.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    {t.status}
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('status', value)}
                    value={newEmployee.status}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">{t.employees.active}</SelectItem>
                      <SelectItem value="Suspended">{t.employees.suspended}</SelectItem>
                      <SelectItem value="Transferred">{t.employees.transferred}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEmployee.status === 'Suspended' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="suspensionDate" className="text-right">{t.employees.suspensionDate}</Label>
                    <Input id="suspensionDate" type="date" value={newEmployee.suspensionDate} onChange={handleNewInputChange} className="col-span-3" />
                  </div>
                )}
                {newEmployee.status === 'Transferred' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="transferDate" className="text-right">{t.employees.transferDate}</Label>
                      <Input id="transferDate" type="date" value={newEmployee.transferDate} onChange={handleNewInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="transferLocation" className="text-right">{t.employees.transferLocation}</Label>
                      <Input id="transferLocation" value={newEmployee.transferLocation} onChange={handleNewInputChange} className="col-span-3" />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    {t.badgeNumber}
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
                    {t.pno}
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
                    {t.employees.dob}
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
                    {t.employees.contactNumber}
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
                    {t.employees.joiningDate}
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
                    {t.employees.joiningDistrict}
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
                {t.cancel}
              </Button>
              <Button onClick={handleAddEmployee}>{t.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.serialNumber}</TableHead>
              <TableHead>{t.rank}</TableHead>
              <TableHead>{t.role}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.badgeNumber}</TableHead>
              <TableHead>{t.pno}</TableHead>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.employees.dob}</TableHead>
              <TableHead>{t.employees.joiningDate}</TableHead>
              <TableHead>{t.employees.joiningBranchDistrict}</TableHead>
              <TableHead>{t.employees.contactNumber}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee, index) => {
              const dobValid = employee.dob && !isNaN(new Date(employee.dob.replace(/-/g, '/')).getTime());
              const joiningDateValid = employee.joiningDate && !isNaN(new Date(employee.joiningDate.replace(/-/g, '/')).getTime());
              
              const canEditThisRow = canEdit;

              const getStatusBadgeVariant = (status: Employee['status']) => {
                switch (status) {
                    case 'Active': return 'default';
                    case 'Suspended': return 'destructive';
                    case 'Transferred': return 'secondary';
                    default: return 'outline';
                }
              };

              return (
                <TableRow key={employee.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.ranks[employee.rank]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>{employee.role === 'admin' ? t.employees.admin : t.employees.employee}</Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={getStatusBadgeVariant(employee.status)}>{t.statusTypes[employee.status]}</Badge>
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
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canEditThisRow}>
                          <span className="sr-only">{t.employees.openMenu}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(employee)} disabled={!canEditThisRow}>
                          {t.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleDeleteClick(employee.id)}
                          disabled={!isCurrentUserAdministrator || employee.rank === 'Administrator'}
                        >
                          {t.delete}
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
          {t.employees.noEmployeesFound}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.employees.editEmployee}</DialogTitle>
            <DialogDescription>
              {t.employees.editEmployeeDescription}
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="flex justify-center mb-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editingEmployee.avatarUrl ?? ''} alt={editingEmployee.name ?? ''} />
                    <AvatarFallback className="text-4xl">{editingEmployee.name?.charAt(0) ?? ''}</AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="employee-avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  >
                    <Pencil className="w-6 h-6" />
                    <span className="sr-only">Change Picture</span>
                  </label>
                  <input
                    type="file"
                    id="employee-avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleEmployeeAvatarChange}
                  />
                </div>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t.name}
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
                    {t.employees.password}
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={editingEmployee.password ?? ""}
                      onChange={handleEditInputChange}
                      className="pr-10"
                      placeholder={t.employees.passwordPlaceholder}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">{t.employees.togglePasswordVisibility}</span>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3 flex flex-col items-start gap-2">
                    <p className="text-xs text-muted-foreground -mt-2">
                      {t.employees.passwordHint}
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
                      {t.employees.resetToDefault}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rank" className="text-right">
                    {t.rank}
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('rank', value)}
                    value={editingEmployee.rank ?? ""}
                     disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectRank} />
                    </SelectTrigger>
                    <SelectContent>
                       {employeeRanks.map((rank) => (
                        <SelectItem key={rank} value={rank} disabled={!isCurrentUserAdministrator && rank === 'Administrator'}>
                          {t.ranks[rank]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    {t.role}
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('role', value)}
                    value={editingEmployee.role ?? "employee"}
                    disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectRole} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{t.employees.employee}</SelectItem>
                      <SelectItem value="admin">{t.employees.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    {t.status}
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('status', value)}
                    value={editingEmployee.status ?? "Active"}
                    disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.employees.selectStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">{t.employees.active}</SelectItem>
                      <SelectItem value="Suspended">{t.employees.suspended}</SelectItem>
                      <SelectItem value="Transferred">{t.employees.transferred}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingEmployee.status === 'Suspended' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="suspensionDate" className="text-right">{t.employees.suspensionDate}</Label>
                    <Input id="suspensionDate" type="date" value={editingEmployee.suspensionDate ?? ''} onChange={handleEditInputChange} className="col-span-3" />
                  </div>
                )}
                {editingEmployee.status === 'Transferred' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="transferDate" className="text-right">{t.employees.transferDate}</Label>
                      <Input id="transferDate" type="date" value={editingEmployee.transferDate ?? ''} onChange={handleEditInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="transferLocation" className="text-right">{t.employees.transferLocation}</Label>
                      <Input id="transferLocation" value={editingEmployee.transferLocation ?? ''} onChange={handleEditInputChange} className="col-span-3" />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    {t.badgeNumber}
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
                    {t.pno}
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
                    {t.employees.dob}
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
                    {t.employees.contactNumber}
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
                    {t.employees.joiningDate}
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
                    {t.employees.joiningDistrict}
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
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateEmployee}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>{t.deleteConfirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
