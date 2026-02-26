
"use client";

import { useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown, Search } from "lucide-react";
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

export default function DutyReportPage() {
  const { user } = useAuth();
  const { employees, duties } = useData();
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
      alert("No data to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text(`Duty Report for ${selectedEmployee.name}`, 14, 16);
    doc.text(`From: ${format(new Date(dateFrom.replace(/-/g, '/')), "dd-MM-yyyy")} To: ${format(new Date(dateTo.replace(/-/g, '/')), "dd-MM-yyyy")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Sr. No.', 'Badge No.', 'Name', 'Date', 'Shift', 'Location', 'Details']],
      body: filteredDuties.map((duty, index) => [
        index + 1,
        selectedEmployee.badgeNumber,
        selectedEmployee.name,
        format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy'),
        duty.shift,
        duty.location,
        duty.details,
      ]),
    });
    doc.save(`duty_report_${selectedEmployee.pno}.pdf`);
  };

  if (user?.role !== 'admin') {
      return (
          <div className="flex items-center justify-center h-full">
              <p>You do not have permission to view this page.</p>
          </div>
      )
  }

  return (
    <>
      <PageHeader
        title="Duty Report"
        description="Generate duty reports for a specific employee within a date range."
      >
        <Button
          variant="outline"
          onClick={handleExportPdf}
          disabled={!selectedEmployee || filteredDuties.length === 0 || !dateFrom || !dateTo}
        >
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="pno-search">Employee PNO</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="pno-search"
                                placeholder="Enter employee PNO"
                                value={pnoInput}
                                onChange={(e) => setPnoInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePnoSearch()}
                            />
                            <Button onClick={handlePnoSearch}>
                                <Search className="mr-2 h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-from">Date From</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-to">Date To</Label>
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
                        <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                        <div>
                            <p className="text-sm font-medium">Name</p>
                            <p className="text-muted-foreground">{selectedEmployee.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">PNO</p>
                            <p className="text-muted-foreground">{selectedEmployee.pno}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Rank</p>
                            <p className="text-muted-foreground">{selectedEmployee.rank}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium">Badge Number</p>
                            <p className="text-muted-foreground">{selectedEmployee.badgeNumber}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Report Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Sr. No.</TableHead>
                            <TableHead>Badge No.</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Details</TableHead>
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
                                <TableCell>{duty.shift}</TableCell>
                                <TableCell>{duty.location}</TableCell>
                                <TableCell>{duty.details}</TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                No duties found for the selected employee and date range.
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
                      <p>Please search for an employee by PNO to view their duty report.</p>
                  </CardContent>
                </Card>
            )}
        </div>
      </div>
    </>
  );
}
