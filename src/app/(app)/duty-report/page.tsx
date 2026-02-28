
"use client";

import { useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Printer, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Employee, Duty } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";

export default function DutyReportPage() {
  const { user } = useAuth();
  const { employees, duties } = useData();
  const { t } = useLanguage();
  const [pnoInput, setPnoInput] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);

  const handlePnoSearch = () => {
    const employee = employees.find(e => e.pno === pnoInput);
    setSelectedEmployee(employee || null);
  };
  
  const filteredDuties = duties.filter((duty) => {
    if (!selectedEmployee || !dateFrom || !dateTo) {
      return false;
    }
    if (!duty.date || isNaN(new Date(duty.date.replace(/-/g, '/')).getTime())) {
      return false;
    }
    const dutyDate = new Date(duty.date.replace(/-/g, '/'));
    const startOfDay = new Date(dateFrom.replace(/-/g, '/'));
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateTo.replace(/-/g, '/'));
    endOfDay.setHours(23, 59, 59, 999);

    return (
      duty.employeeId === selectedEmployee.id &&
      dutyDate >= startOfDay &&
      dutyDate <= endOfDay
    );
  });

  const handleExportPdf = () => {
    if (!selectedEmployee || filteredDuties.length === 0 || !dateFrom || !dateTo) {
      alert(t.dutyReport.noDataToExport);
      return;
    }
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.pageHeaders.dutyReport.title} for ${selectedEmployee.name}`, 14, 16);
    doc.text(`${t.dutyReport.dateFrom}: ${format(new Date(dateFrom.replace(/-/g, '/')), "dd-MM-yyyy")} ${t.dutyReport.dateTo}: ${format(new Date(dateTo.replace(/-/g, '/')), "dd-MM-yyyy")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [[t.serialNumber, t.badgeNumber, t.name, t.date, t.shift, t.location, t.details]],
      body: filteredDuties.map((duty, index) => [
        index + 1,
        selectedEmployee.badgeNumber,
        selectedEmployee.name,
        format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy'),
        t.shifts[duty.shift],
        duty.location,
        duty.details,
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`duty_report_${selectedEmployee.pno}.pdf`);
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
        title={t.pageHeaders.dutyReport.title}
        description={t.pageHeaders.dutyReport.description}
      >
        <Button
          variant="outline"
          onClick={handleExportPdf}
          disabled={!selectedEmployee || filteredDuties.length === 0 || !dateFrom || !dateTo}
        >
          <Printer className="mr-2" />
          {t.exportPdf}
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>{t.dutyReport.filter}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="pno-search">{t.dutyReport.employeePno}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="pno-search"
                                placeholder={t.dutyReport.enterEmployeePno}
                                value={pnoInput}
                                onChange={(e) => setPnoInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePnoSearch()}
                            />
                            <Button onClick={handlePnoSearch}>
                                <Search className="mr-2 h-4 w-4" /> {t.search}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-from">{t.dutyReport.dateFrom}</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-to">{t.dutyReport.dateTo}</Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="space-y-6">
            {selectedEmployee ? (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>{t.dutyReport.employeeDetails}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                        <div>
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-muted-foreground">{selectedEmployee.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">{t.pno}</p>
                            <p className="text-muted-foreground">{selectedEmployee.pno}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">{t.rank}</p>
                            <p className="text-muted-foreground">{t.ranks[selectedEmployee.rank]}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium">{t.badgeNumber}</p>
                            <p className="text-muted-foreground">{selectedEmployee.badgeNumber}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.dutyReport.reportResults}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>{t.serialNumber}</TableHead>
                            <TableHead>{t.badgeNumber}</TableHead>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.date}</TableHead>
                            <TableHead>{t.shift}</TableHead>
                            <TableHead>{t.location}</TableHead>
                            <TableHead>{t.details}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDuties.length > 0 ? (
                            filteredDuties.map((duty, index) => (
                                <TableRow key={duty.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{selectedEmployee.badgeNumber}</TableCell>
                                <TableCell>{selectedEmployee.name}</TableCell>
                                <TableCell>{duty.date && !isNaN(new Date(duty.date.replace(/-/g, '/')).getTime()) ? format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</TableCell>
                                <TableCell>{t.shifts[duty.shift]}</TableCell>
                                <TableCell>{duty.location}</TableCell>
                                <TableCell>{duty.details}</TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                {t.dutyReport.noDutiesFound}
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                </>
            ) : (
                <Card className="flex items-center justify-center min-h-48">
                  <CardContent className="text-center p-8 text-muted-foreground">
                      <p>{t.dutyReport.searchForReport}</p>
                  </CardContent>
                </Card>
            )}
        </div>
      </div>
    </>
  );
}
