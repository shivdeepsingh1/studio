
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AbsentEmployeesPage() {
  const { user } = useAuth();
  const { employees, leaves } = useData();
  const { t } = useLanguage();

  const absenceRecords = useMemo(() => {
    return leaves.filter(l => l.type === 'Absent');
  }, [leaves]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.absentEmployees.title}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.rank, t.badgeNumber, t.pno, t.name, t.date, t.leave.reason]],
      body: absenceRecords.map((absence, index) => {
        const employee = employees.find(e => e.id === absence.employeeId);
        return [
          index + 1,
          employee ? t.ranks[employee.rank] : 'N/A',
          employee?.badgeNumber || 'N/A',
          employee?.pno || 'N/A',
          absence.employeeName,
          format(new Date(absence.startDate.replace(/-/g, '/')), 'dd-MM-yyyy'),
          absence.reason,
        ];
      }),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`absence_records.pdf`);
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
        title={t.pageHeaders.absentEmployees.title}
        description={t.pageHeaders.absentEmployees.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={absenceRecords.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.absentEmployees.title}</CardTitle>
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
                          <TableHead>{t.date}</TableHead>
                          <TableHead>{t.leave.reason}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {absenceRecords.length > 0 ? (
                      absenceRecords.map((absence, index) => {
                        const employee = employees.find(e => e.id === absence.employeeId);
                        return (
                          <TableRow key={absence.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{employee ? t.ranks[employee.rank] : 'N/A'}</TableCell>
                              <TableCell>{employee?.badgeNumber || 'N/A'}</TableCell>
                              <TableCell>{employee?.pno || 'N/A'}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage
                                      src={employee?.avatarUrl}
                                      alt={absence.employeeName}
                                      data-ai-hint="person portrait"
                                    />
                                    <AvatarFallback>{absence.employeeName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium">{absence.employeeName}</div>
                                </div>
                              </TableCell>
                              <TableCell>{format(new Date(absence.startDate.replace(/-/g, '/')), 'dd-MM-yyyy')}</TableCell>
                              <TableCell>{absence.reason}</TableCell>
                          </TableRow>
                        )
                      })
                      ) : (
                      <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                              {t.absentManagement.noAbsences}
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
