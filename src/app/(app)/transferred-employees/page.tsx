
"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";

export default function TransferredEmployeesPage() {
  const { user } = useAuth();
  const { employees, updateEmployees } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isRejoinDialogOpen, setIsRejoinDialogOpen] = useState(false);
  const [employeeToRejoin, setEmployeeToRejoin] = useState<Employee | null>(null);
  const [rejoinDate, setRejoinDate] = useState('');

  const transferredEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Transferred');
  }, [employees]);

  const handleOpenRejoinDialog = (employee: Employee) => {
    setEmployeeToRejoin(employee);
    setRejoinDate(format(new Date(), 'yyyy-MM-dd'));
    setIsRejoinDialogOpen(true);
  };

  const handleRejoin = () => {
    if (!employeeToRejoin || !rejoinDate) return;

    updateEmployees(prev =>
        prev.map(e =>
            e.id === employeeToRejoin.id
                ? {
                    ...e,
                    status: 'Active',
                    transferDate: undefined,
                    transferLocation: undefined,
                    joiningDate: rejoinDate,
                  }
                : e
        )
    );

    toast({
        title: t.transferredEmployeesPage.rejoinedTitle,
        description: t.transferredEmployeesPage.rejoinedDescription(employeeToRejoin.name),
    });

    setIsRejoinDialogOpen(false);
    setEmployeeToRejoin(null);
  };


  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.transferredEmployees.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.employees.contactNumber, t.transferredEmployeesPage.transferDate, t.transferredEmployeesPage.transferLocation]],
      body: transferredEmployees.map((employee, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.contact,
        employee.transferDate ? format(new Date(employee.transferDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A',
        employee.transferLocation,
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`transferred_employees.pdf`);
  };
  
  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full">
              <p>{t.pageHeaders.permissionDenied}</p>
          </div>
      )
  }

  return (
    <>
      <PageHeader
        title={t.pageHeaders.transferredEmployees.title}
        description={t.pageHeaders.transferredEmployees.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={transferredEmployees.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.transferredEmployees.title}</CardTitle>
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
                          <TableHead>{t.transferredEmployeesPage.transferDate}</TableHead>
                          <TableHead>{t.transferredEmployeesPage.transferLocation}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transferredEmployees.length > 0 ? (
                      transferredEmployees.map((employee, index) => (
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
                              <TableCell>{employee.transferDate ? format(new Date(employee.transferDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                              <TableCell>{employee.transferLocation}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenRejoinDialog(employee)}>
                                      {t.transferredEmployeesPage.rejoin}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={9} className="text-center h-24">
                              {t.transferredEmployeesPage.noTransferred}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>

      <Dialog open={isRejoinDialogOpen} onOpenChange={setIsRejoinDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t.transferredEmployeesPage.rejoinTitle}</DialogTitle>
                <DialogDescription>
                    {t.transferredEmployeesPage.rejoinDescription}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">{t.name}</Label>
                    <Input
                        value={employeeToRejoin?.name || ''}
                        disabled
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rejoin-date" className="text-right">
                        {t.employees.joiningDate}
                    </Label>
                    <Input
                        id="rejoin-date"
                        type="date"
                        value={rejoinDate}
                        onChange={(e) => setRejoinDate(e.target.value)}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setIsRejoinDialogOpen(false)}>
                    {t.cancel}
                </Button>
                <Button onClick={handleRejoin}>{t.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
