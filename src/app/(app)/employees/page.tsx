
"use client"

import { useState } from "react"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle, Search, Eye, EyeOff, RotateCcw, FileUp, FileDown } from "lucide-react"
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
import { Employee, EmployeeRank, employeeRanks, employeeRankTranslations } from "@/lib/types"
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

export default function EmployeesPage() {
  const { user } = useAuth();
  const { employees, updateEmployees } = useData();
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

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
    status: "Active" as "Active" | "Suspended",
  }

  const [newEmployee, setNewEmployee] = useState(initialNewEmployeeState)

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.pno.includes(searchQuery) ||
      employee.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const deleteEmployee = (id: string) => {
    if (user?.rank !== 'Administrator') return;
    updateEmployees(employees.filter((e) => e.id !== id))
  }

  const handleUpdateEmployee = () => {
    if (!editingEmployee || !editingEmployee.id) return;
    if (user?.role !== 'admin') return;
  
    const updatedEmployeesList = employees.map((emp) =>
      emp.id === editingEmployee.id ? { ...emp, ...editingEmployee } as Employee : emp
    )
    
    updateEmployees(updatedEmployeesList);
  
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
                // Adjust for timezone offset
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
            status: row.status === 'Suspended' ? 'Suspended' : 'Active',
          };
        });

        const existingPnos = new Set(employees.map(e => e.pno));
        const newUniqueEmployees = importedEmployees.filter(e => !existingPnos.has(e.pno));
        
        const importedPnos = new Set();
        const trulyUniqueNewEmployees = newUniqueEmployees.filter(e => {
            if (importedPnos.has(e.pno)) return false;
            importedPnos.add(e.pno);
            return true;
        });

        if (trulyUniqueNewEmployees.length > 0) {
            updateEmployees([...employees, ...trulyUniqueNewEmployees]);
            alert(`${trulyUniqueNewEmployees.length} new employees imported successfully!`);
        } else {
            alert('No new unique employees to import.');
        }
        setIsImportDialogOpen(false);
        // Reset file input
        e.target.value = '';

      } catch (error: any) {
        alert(`Error importing file: ${error.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleExportPdf = () => {
    const doc = new jsPDF()
    doc.text("कर्मचारी सूची", 14, 16)
    autoTable(doc, {
      startY: 20,
      head: [['क्र.सं.', 'पद', 'बैज नं.', 'PNO', 'नाम', 'जन्म तिथि', 'ज्वाइनिंग तिथि', 'ज्वाइनिंग जिला', 'मोबाइल नं.', 'स्थिति']],
      body: filteredEmployees.map((employee, index) => {
        const dobValid = employee.dob && !isNaN(new Date(employee.dob.replace(/-/g, '/')).getTime());
        const joiningDateValid = employee.joiningDate && !isNaN(new Date(employee.joiningDate.replace(/-/g, '/')).getTime());
        return [
            index + 1,
            employeeRankTranslations[employee.rank],
            employee.badgeNumber,
            employee.pno,
            employee.name,
            dobValid ? format(new Date(employee.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            joiningDateValid ? format(new Date(employee.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A',
            employee.joiningDistrict,
            employee.contact,
            employee.status === 'Suspended' ? 'निलंबित' : 'सक्रिय'
        ]
      }),
    })
    doc.save("employees.pdf")
  }


  return (
    <>
      <PageHeader
        title="कर्मचारी प्रबंधन"
        description="कर्मचारी रिकॉर्ड जोड़ें, संपादित करें या हटाएं।"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="PNO, बैज नंबर या नाम से खोजें..."
            className="pl-8 sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={!canEdit}>
              <FileUp className="mr-2 h-4 w-4" />
              एक्सेल आयात करें
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>एक्सेल से कर्मचारी आयात करें</DialogTitle>
              <DialogDescription>
                एक .xlsx या .csv फ़ाइल अपलोड करें। फ़ाइल में हेडर के साथ कॉलम होने चाहिए: `badgeNumber`, `pno`, `name`, `rank`, `dob`, `contact`, `joiningDate`, `joiningDistrict`, `password`, `role`, `status`.
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
               <Button variant="secondary" onClick={() => setIsImportDialogOpen(false)}>रद्द करें</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={handleExportPdf}>
          <FileDown className="mr-2 h-4 w-4" />
          PDF निर्यात करें
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <PlusCircle className="mr-2" />
              कर्मचारी जोड़ें
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>नया कर्मचारी जोड़ें</DialogTitle>
              <DialogDescription>
                सिस्टम में एक नया कर्मचारी जोड़ने के लिए फॉर्म भरें।
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    नाम
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
                    पासवर्ड
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newEmployee.password}
                      onChange={handleNewInputChange}
                      className="pr-10"
                      placeholder="डिफ़ॉल्ट के लिए खाली छोड़ दें"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">पासवर्ड दृश्यता टॉगल करें</span>
                    </Button>
                  </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <p className="text-xs text-muted-foreground -mt-2">
                      डिफ़ॉल्ट पासवर्ड <strong>ddmmyyyy</strong> प्रारूप में जन्म तिथि है।
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rank" className="text-right">
                    पद
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('rank', value)}
                    value={newEmployee.rank}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="पद चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRanks.map((rank) => (
                        <SelectItem key={rank} value={rank} disabled={rank === 'Administrator'}>
                          {employeeRankTranslations[rank]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    भूमिका
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('role', value)}
                    value={newEmployee.role}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="भूमिका चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">कर्मचारी</SelectItem>
                      <SelectItem value="admin">एडमिन</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    स्थिति
                  </Label>
                  <Select
                    onValueChange={(value) => handleNewSelectChange('status', value)}
                    value={newEmployee.status}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="स्थिति चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">सक्रिय</SelectItem>
                      <SelectItem value="Suspended">निलंबित</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    बैज नंबर
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
                    जन्म तिथि
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
                    मोबाइल नंबर
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
                    ज्वाइनिंग तिथि
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
                    ज्वाइनिंग जिला
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
                रद्द करें
              </Button>
              <Button onClick={handleAddEmployee}>सहेजें</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>क्र.सं.</TableHead>
              <TableHead>पद</TableHead>
              <TableHead>भूमिका</TableHead>
              <TableHead>स्थिति</TableHead>
              <TableHead>बैज नंबर</TableHead>
              <TableHead>PNO</TableHead>
              <TableHead>कर्मचारी का नाम</TableHead>
              <TableHead>जन्म तिथि</TableHead>
              <TableHead>ज्वाइनिंग तिथि</TableHead>
              <TableHead>ज्वाइनिंग शाखा/जिला</TableHead>
              <TableHead>मोबाइल नंबर</TableHead>
              <TableHead className="text-right">कार्रवाई</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee, index) => {
              const dobValid = employee.dob && !isNaN(new Date(employee.dob.replace(/-/g, '/')).getTime());
              const joiningDateValid = employee.joiningDate && !isNaN(new Date(employee.joiningDate.replace(/-/g, '/')).getTime());
              
              const canEditThisRow = canEdit;

              return (
                <TableRow key={employee.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employeeRankTranslations[employee.rank]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>{employee.role === 'admin' ? 'एडमिन' : 'कर्मचारी'}</Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={employee.status === 'Suspended' ? 'destructive' : 'default'}>{employee.status === 'Suspended' ? 'निलंबित' : 'सक्रिय'}</Badge>
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
                          <span className="sr-only">मेनू खोलें</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(employee)} disabled={!canEditThisRow}>
                          संपादित करें
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => deleteEmployee(employee.id)}
                          disabled={!isCurrentUserAdministrator || employee.rank === 'Administrator'}
                        >
                          हटाएं
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
          कोई कर्मचारी नहीं मिला।
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>कर्मचारी विवरण संपादित करें</DialogTitle>
            <DialogDescription>
              कर्मचारी की जानकारी अपडेट करें और सहेजें पर क्लिक करें।
            </DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <ScrollArea className="max-h-[70vh] pr-6">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    नाम
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
                    पासवर्ड
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={editingEmployee.password ?? ""}
                      onChange={handleEditInputChange}
                      className="pr-10"
                      placeholder="डिफ़ॉल्ट के लिए खाली छोड़ दें"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                      onClick={() => setShowPassword(p => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       <span className="sr-only">पासवर्ड दृश्यता टॉगल करें</span>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3 flex flex-col items-start gap-2">
                    <p className="text-xs text-muted-foreground -mt-2">
                      डिफ़ॉल्ट पासवर्ड <strong>ddmmyyyy</strong> प्रारूप में जन्म तिथि है।
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
                      डिफ़ॉल्ट पर रीसेट करें
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rank" className="text-right">
                    पद
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('rank', value)}
                    value={editingEmployee.rank ?? ""}
                     disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="पद चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                       {employeeRanks.map((rank) => (
                        <SelectItem key={rank} value={rank} disabled={!isCurrentUserAdministrator && rank === 'Administrator'}>
                          {employeeRankTranslations[rank]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    भूमिका
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('role', value)}
                    value={editingEmployee.role ?? "employee"}
                    disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="भूमिका चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">कर्मचारी</SelectItem>
                      <SelectItem value="admin">एडमिन</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    स्थिति
                  </Label>
                  <Select
                    onValueChange={(value) => handleEditSelectChange('status', value)}
                    value={editingEmployee.status ?? "Active"}
                    disabled={!canEdit || (!isCurrentUserAdministrator && editingEmployee.rank === 'Administrator')}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="स्थिति चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">सक्रिय</SelectItem>
                      <SelectItem value="Suspended">निलंबित</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="badgeNumber" className="text-right">
                    बैज नंबर
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
                    जन्म तिथि
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
                    मोबाइल नंबर
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
                    ज्वाइनिंग तिथि
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
                    ज्वाइनिंग जिला
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
              रद्द करें
            </Button>
            <Button onClick={handleUpdateEmployee}>बदलाव सहेजें</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
