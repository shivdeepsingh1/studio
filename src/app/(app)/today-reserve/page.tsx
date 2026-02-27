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
import { Employee } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TodayReservePage() {
  const { user } = useAuth();
  const { employees, duties, leaves } = useData();
  const { t } = useLanguage();

  const today = useMemo(() => new Date(), []);
  const todayString = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  const reserveEmployees = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const onLeaveTodayIds = new Set(leaves.filter(l => {
        if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
        const startDate = new Date(l.startDate.replace(/-/g, '/'));
        const endDate = new Date(l.endDate.replace(/-/g, '/'));
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
    }).map(l => l.employeeId));

    const suspendedIds = new Set(employees.filter(e => e.status === 'Suspended').map(e => e.id));

    const onActiveDutyIds = new Set(duties.filter(d => d.date === todayString && d.location.toLowerCase() !== 'reserve').map(d => d.employeeId));

    const reserve = employees.filter(employee =>
        employee.rank !== 'Administrator' &&
        !suspendedIds.has(employee.id) &&
        !onLeaveTodayIds.has(employee.id) &&
        !onActiveDutyIds.has(employee.id)
    );
    
    return reserve;
  }, [duties, employees, leaves, todayString]);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.todayReserve.title} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.badgeNumber, t.pno, t.name, t.rank, t.absentEmployeesPage.contactNumber, t.location]],
      body: reserveEmployees.map((employee, index) => [
        index + 1,
        employee.badgeNumber,
        employee.pno,
        employee.name,
        t.ranks[employee.rank],
        employee.contact,
        t.statement.reserve,
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`reserve_employees_${todayString}.pdf`);
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
        title={t.pageHeaders.todayReserve.title}
        description={t.pageHeaders.todayReserve.description(format(new Date(), 'dd-MM-yyyy'))}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={reserveEmployees.length === 0}>
            <FileDown className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.todayReserve.title}</CardTitle>
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
                          <TableHead>{t.absentEmployeesPage.contactNumber}</TableHead>
                          <TableHead>{t.location}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {reserveEmployees.length > 0 ? (
                      reserveEmployees.map((employee, index) => (
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
                              <TableCell>{employee.contact}</TableCell>
                              <TableCell>{t.statement.reserve}</TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                              {t.duty.noReserveEmployees}
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
