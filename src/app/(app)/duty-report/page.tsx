
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar as CalendarIcon, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { mockEmployees, mockDuties } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function DutyReportPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [pnoInput, setPnoInput] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const storedEmployees = localStorage.getItem("line-command-employees");
    setEmployees(storedEmployees ? JSON.parse(storedEmployees) : mockEmployees);

    const storedDuties = localStorage.getItem("line-command-duties");
    setDuties(storedDuties ? JSON.parse(storedDuties) : mockDuties);
  }, []);

  const handlePnoSearch = () => {
    const employee = employees.find(e => e.pno === pnoInput);
    setSelectedEmployee(employee || null);
  };
  
  const filteredDuties = duties.filter((duty) => {
    if (!selectedEmployee || !fromDate || !toDate) {
      return false;
    }
    if (!duty.date || isNaN(new Date(duty.date.replace(/-/g, '/')).getTime())) {
      return false;
    }
    const dutyDate = new Date(duty.date.replace(/-/g, '/'));
    const startOfDay = new Date(fromDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);

    return (
      duty.employeeId === selectedEmployee.id &&
      dutyDate >= startOfDay &&
      dutyDate <= endOfDay
    );
  });

  const handleExportPdf = () => {
    if (!selectedEmployee || filteredDuties.length === 0 || !fromDate || !toDate) {
      alert("No data to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text(`Duty Report for ${selectedEmployee.name}`, 14, 16);
    doc.text(`From: ${format(fromDate, "dd-MM-yyyy")} To: ${format(toDate, "dd-MM-yyyy")}`, 14, 22);

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
          disabled={!selectedEmployee || filteredDuties.length === 0 || !fromDate || !toDate}
        >
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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
              <Label htmlFor="from-date">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="from-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? (
                      format(fromDate, "dd-MM-yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    disabled={(date) => toDate ? date > toDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="to-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? (
                      format(toDate, "dd-MM-yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    disabled={(date) => fromDate ? date < fromDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {selectedEmployee ? (
                <>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Employee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 pt-6">
                        <p><strong>Name:</strong> {selectedEmployee.name}</p>
                        <p><strong>PNO:</strong> {selectedEmployee.pno}</p>
                        <p><strong>Rank:</strong> {selectedEmployee.rank}</p>
                        <p><strong>Badge Number:</strong> {selectedEmployee.badgeNumber}</p>
                    </CardContent>
                </Card>
                <div className="border rounded-lg mt-4">
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
                </>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    <p>Please search for an employee by PNO to view their duty report.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
