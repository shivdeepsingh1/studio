
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
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

export default function TransferredEmployeesPage() {
  const { user } = useAuth();
  const { employees } = useData();
  const { t } = useLanguage();

  const transferredEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Transferred');
  }, [employees]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.transferredEmployees.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.badgeNumber, t.pno, t.name, t.rank, t.transferredEmployeesPage.transferDate, t.transferredEmployeesPage.transferLocation]],
      body: transferredEmployees.map((employee, index) => [
        index + 1,
        employee.badgeNumber,
        employee.pno,
        employee.name,
        t.ranks[employee.rank],
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
            <FileDown className="mr-2" /> {t.exportPdf}
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
                          <TableHead>{t.badgeNumber}</TableHead>
                          <TableHead>{t.pno}</TableHead>
                          <TableHead>{t.name}</TableHead>
                          <TableHead>{t.rank}</TableHead>
                          <TableHead>{t.transferredEmployeesPage.transferDate}</TableHead>
                          <TableHead>{t.transferredEmployeesPage.transferLocation}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {transferredEmployees.length > 0 ? (
                      transferredEmployees.map((employee, index) => (
                          <TableRow key={employee.id}>
                              <TableCell>{index + 1}</TableCell>
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
                              <TableCell>{t.ranks[employee.rank]}</TableCell>
                              <TableCell>{employee.transferDate ? format(new Date(employee.transferDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                              <TableCell>{employee.transferLocation}</TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                              {t.transferredEmployeesPage.noTransferred}
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
