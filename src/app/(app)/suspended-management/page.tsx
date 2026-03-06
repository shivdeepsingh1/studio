
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "@/lib/fonts/Hind-Regular";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee } from "@/lib/types";

export default function SuspendedManagementPage() {
  const { user } = useAuth();
  const { employees } = useData();
  const { t } = useLanguage();

  const suspensionRecords = useMemo(() => {
    return employees.filter(e => e.suspensionDate);
  }, [employees]);

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.pageHeaders.suspendedManagement.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[
        t.serialNumber, 
        t.rank, 
        t.badgeNumber, 
        t.pno, 
        t.name, 
        t.suspendedManagementPage.suspensionOrderNumber, 
        t.todaySuspendedEmployeesPage.suspensionDate,
        t.suspendedManagementPage.restorationOrderNumber,
        t.suspendedManagementPage.restorationDate,
        t.status,
      ]],
      body: suspensionRecords.map((employee, index) => [
        index + 1,
        t.ranks[employee.rank],
        employee.badgeNumber,
        employee.pno,
        employee.name,
        employee.suspensionLetterNumber || 'N/A',
        employee.suspensionDate ? format(new Date(employee.suspensionDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A',
        employee.restorationLetterNumber || 'N/A',
        employee.restorationDate ? format(new Date(employee.restorationDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A',
        t.statusTypes[employee.status],
      ]),
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    });
    doc.save(`suspension_log.pdf`);
  };
  
  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full">
              <p>{t.pageHeaders.permissionDenied}</p>
          </div>
      )
  }
  
  const getStatusBadgeVariant = (status: Employee['status']) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Suspended': return 'destructive';
        case 'Transferred': return 'secondary';
        default: return 'outline';
    }
  };


  return (
    <>
      <PageHeader
        title={t.pageHeaders.suspendedManagement.title}
        description={t.pageHeaders.suspendedManagement.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={suspensionRecords.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.suspendedManagement.title}</CardTitle>
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
                          <TableHead>{t.suspendedManagementPage.suspensionOrderNumber}</TableHead>
                          <TableHead>{t.todaySuspendedEmployeesPage.suspensionDate}</TableHead>
                          <TableHead>{t.suspendedManagementPage.restorationOrderNumber}</TableHead>
                          <TableHead>{t.suspendedManagementPage.restorationDate}</TableHead>
                          <TableHead>{t.status}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {suspensionRecords.length > 0 ? (
                      suspensionRecords.map((employee, index) => (
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
                              <TableCell>{employee.suspensionLetterNumber || 'N/A'}</TableCell>
                              <TableCell>{employee.suspensionDate ? format(new Date(employee.suspensionDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                              <TableCell>{employee.restorationLetterNumber || 'N/A'}</TableCell>
                              <TableCell>{employee.restorationDate ? format(new Date(employee.restorationDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(employee.status)}>{t.statusTypes[employee.status]}</Badge>
                              </TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={10} className="text-center h-24">
                              {t.suspendedManagementPage.noSuspensionRecords}
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
