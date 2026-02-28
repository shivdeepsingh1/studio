
"use client";

import { useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";

export default function SuspendedEmployeesPage() {
  const { user } = useAuth();
  const { employees, updateEmployees } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const suspendedEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Suspended');
  }, [employees]);

  const handleReserveFromSuspend = (employee: Employee) => {
    updateEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, status: 'Active', suspensionDate: undefined } : e));
    toast({
        title: t.suspendedEmployeesPage.unsuspendedTitle,
        description: t.suspendedEmployeesPage.unsuspendedDescription(employee.name),
    });
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.suspendedEmployees.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.employees.contactNumber, t.suspendedEmployeesPage.suspensionDate]],
      body: suspendedEmployees.map((employee, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.contact,
        employee.suspensionDate ? format(new Date(employee.suspensionDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A',
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
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

  return (
    <>
      <PageHeader
        title={t.pageHeaders.suspendedEmployees.title}
        description={t.pageHeaders.suspendedEmployees.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={suspendedEmployees.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.suspendedEmployees.title}</CardTitle>
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
                          <TableHead>{t.suspendedEmployeesPage.suspensionDate}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {suspendedEmployees.length > 0 ? (
                      suspendedEmployees.map((employee, index) => (
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
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t.employees.openMenu}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleReserveFromSuspend(employee)}>
                                      {t.suspendedEmployeesPage.reserveFromSuspend}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={8} className="text-center h-24">
                              {t.suspendedEmployeesPage.noSuspended}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>
    </>
  );
}
