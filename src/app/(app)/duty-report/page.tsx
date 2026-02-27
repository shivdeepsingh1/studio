
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
import { Employee, Duty, employeeRankTranslations } from "@/lib/types";
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
      head: [['क्र.सं.', 'बैज नं.', 'नाम', 'दिनांक', 'शिफ्ट', 'स्थान', 'विवरण']],
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
              <p>आपको यह पृष्ठ देखने की अनुमति नहीं है।</p>
          </div>
      )
  }

  return (
    <>
      <PageHeader
        title="ड्यूटी रिपोर्ट"
        description="एक विशिष्ट तिथि सीमा के भीतर एक विशिष्ट कर्मचारी के लिए ड्यूटी रिपोर्ट तैयार करें।"
      >
        <Button
          variant="outline"
          onClick={handleExportPdf}
          disabled={!selectedEmployee || filteredDuties.length === 0 || !dateFrom || !dateTo}
        >
          <FileDown className="mr-2" />
          PDF निर्यात करें
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>फ़िल्टर</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="pno-search">कर्मचारी PNO</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="pno-search"
                                placeholder="कर्मचारी PNO दर्ज करें"
                                value={pnoInput}
                                onChange={(e) => setPnoInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePnoSearch()}
                            />
                            <Button onClick={handlePnoSearch}>
                                <Search className="mr-2 h-4 w-4" /> खोजें
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-from">दिनांक से</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date-to">दिनांक तक</Label>
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
                        <CardTitle>कर्मचारी विवरण</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                        <div>
                            <p className="text-sm font-medium">नाम</p>
                            <p className="text-muted-foreground">{selectedEmployee.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">PNO</p>
                            <p className="text-muted-foreground">{selectedEmployee.pno}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">पद</p>
                            <p className="text-muted-foreground">{employeeRankTranslations[selectedEmployee.rank]}</p>
                        </div>
                         <div>
                            <p className="text-sm font-medium">बैज नंबर</p>
                            <p className="text-muted-foreground">{selectedEmployee.badgeNumber}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>रिपोर्ट परिणाम</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>क्र.सं.</TableHead>
                            <TableHead>बैज नं.</TableHead>
                            <TableHead>नाम</TableHead>
                            <TableHead>दिनांक</TableHead>
                            <TableHead>शिफ्ट</TableHead>
                            <TableHead>स्थान</TableHead>
                            <TableHead>विवरण</TableHead>
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
                                चयनित कर्मचारी और दिनांक सीमा के लिए कोई ड्यूटी नहीं मिली।
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
                      <p>कृपया उनकी ड्यूटी रिपोर्ट देखने के लिए PNO द्वारा कर्मचारी खोजें।</p>
                  </CardContent>
                </Card>
            )}
        </div>
      </div>
    </>
  );
}
