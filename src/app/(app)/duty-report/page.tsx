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
import { DateRange } from "react-day-picker";

export default function DutyReportPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [pnoInput, setPnoInput] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

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
    if (!selectedEmployee || !dateRange?.from || !dateRange?.to) {
      return false;
    }
    const dutyDate = new Date(duty.date);
    return (
      duty.employeeId === selectedEmployee.id &&
      dutyDate >= dateRange.from &&
      dutyDate <= dateRange.to
    );
  });

  const handleExportPdf = () => {
    if (!selectedEmployee || filteredDuties.length === 0) {
      alert("No data to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text(`Duty Report for ${selectedEmployee.name}`, 14, 16);
    doc.text(`From: ${format(dateRange!.from!, "dd-MM-yyyy")} To: ${format(dateRange!.to!, "dd-MM-yyyy")}`, 14, 22);

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
          disabled={!selectedEmployee || filteredDuties.length === 0}
        >
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
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
              <Label htmlFor="date-range">Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
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
                            <TableCell>{format(new Date(duty.date.replace(/-/g, '\/')), 'dd-MM-yyyy')}</TableCell>
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
