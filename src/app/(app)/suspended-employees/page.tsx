
"use client";

import { useMemo, useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "@/lib/fonts/Hind-Regular";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Printer, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";

export default function SuspendedEmployeesPage() {
  const { user } = useAuth();
  const { employees, updateEmployees } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [employeeToRestore, setEmployeeToRestore] = useState<Employee | null>(null);
  const [restorationDetails, setRestorationDetails] = useState({ letterNumber: '', date: '' });

  const suspendedEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Suspended');
  }, [employees]);

  const handleOpenRestoreDialog = (employee: Employee) => {
    setEmployeeToRestore(employee);
    setRestorationDetails({ letterNumber: '', date: format(new Date(), 'yyyy-MM-dd') });
    setIsRestoreDialogOpen(true);
  };
  
  const handleConfirmRestoration = () => {
    if (!employeeToRestore || !restorationDetails.letterNumber || !restorationDetails.date) {
      toast({ variant: 'destructive', title: t.leave.fillAllFields });
      return;
    }
    updateEmployees(prev => prev.map(e => e.id === employeeToRestore.id ? { 
        ...e, 
        status: 'Active',
        restorationLetterNumber: restorationDetails.letterNumber,
        restorationDate: restorationDetails.date,
    } : e));
    toast({
        title: t.todaySuspendedEmployeesPage.reinstatedTitle,
        description: t.todaySuspendedEmployeesPage.reinstatedDescription(employeeToRestore.name),
    });
    setIsRestoreDialogOpen(false);
    setEmployeeToRestore(null);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.pageHeaders.todaySuspendedEmployees.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.employees.contactNumber, t.todaySuspendedEmployeesPage.suspensionDate]],
      body: suspendedEmployees.map((employee, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.contact,
        employee.suspensionDate ? format(new Date(employee.suspensionDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A',
      ]),
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    });
    doc.save(`suspended_employees.pdf`);
  };
  
  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full">
              <p>{t.pageHeaders.permissionDenied}</p>
          </div>
      )
  }
  
  const today = new Date();

  return (
    <>
      <PageHeader
        title={t.pageHeaders.todaySuspendedEmployees.title}
        description={t.pageHeaders.todaySuspendedEmployees.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={suspendedEmployees.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.todaySuspendedEmployees.title}</CardTitle>
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
                          <TableHead>{t.employees.contactNumber}</TableHead>
                          <TableHead>{t.todaySuspendedEmployeesPage.suspensionDate}</TableHead>
                          <TableHead>{t.todaySuspendedEmployeesPage.suspensionTillDate}</TableHead>
                          <TableHead className="text-center">{t.todaySuspendedEmployeesPage.totalDays}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {suspendedEmployees.length > 0 ? (
                      suspendedEmployees.map((employee, index) => {
                        const suspensionDate = employee.suspensionDate ? new Date(employee.suspensionDate.replace(/-/g, '/')) : null;
                        const totalDays = suspensionDate ? differenceInCalendarDays(today, suspensionDate) + 1 : 'N/A';
                        return (
                          <TableRow key={employee.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{t.ranks[employee.rank]}</TableCell>
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
                              <TableCell>{employee.contact}</TableCell>
                              <TableCell>{employee.suspensionDate ? format(new Date(employee.suspensionDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                              <TableCell>{format(today, 'dd-MM-yyyy')}</TableCell>
                              <TableCell className="text-center">{totalDays}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenRestoreDialog(employee)}>
                                      {t.todaySuspendedEmployeesPage.reserveFromSuspend}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                        )
                      })
                      ) : (
                      <TableRow>
                          <TableCell colSpan={10} className="text-center h-24">
                              {t.todaySuspendedEmployeesPage.noSuspended}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>
      
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.todaySuspendedEmployeesPage.restoreEmployeeTitle}</DialogTitle>
            <DialogDescription>
              {employeeToRestore ? t.todaySuspendedEmployeesPage.restoreEmployeeDescription : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restoration-letter-number" className="text-right">
                {t.todaySuspendedEmployeesPage.restorationLetterNumber}
              </Label>
              <Input
                id="restoration-letter-number"
                value={restorationDetails.letterNumber}
                onChange={(e) => setRestorationDetails(prev => ({...prev, letterNumber: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restoration-date" className="text-right">
                {t.todaySuspendedEmployeesPage.restorationDate}
              </Label>
              <Input
                id="restoration-date"
                type="date"
                value={restorationDetails.date}
                onChange={(e) => setRestorationDetails(prev => ({...prev, date: e.target.value}))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRestoreDialogOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleConfirmRestoration}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
