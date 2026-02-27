"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown, Search, UserX } from "lucide-react";
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
import { Employee, Leave } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AbsentEmployeesPage() {
  const { user } = useAuth();
  const { employees, leaves, updateLeaves } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [pnoInput, setPnoInput] = useState<string>("");
  const [searchedEmployee, setSearchedEmployee] = useState<Employee | null>(null);
  const [absentEmployees, setAbsentEmployees] = useState<Employee[]>([]);

  const todayString = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const today = new Date();
    const onLeaveToday = leaves.filter(l => {
      if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
      const startDate = new Date(l.startDate.replace(/-/g, '/'));
      const endDate = new Date(l.endDate.replace(/-/g, '/'));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return today >= startDate && today <= endDate;
    });

    const absentLeaveEmployeeIds = new Set(
      onLeaveToday.filter(l => l.type === 'Absent').map(l => l.employeeId)
    );

    setAbsentEmployees(employees.filter(e => absentLeaveEmployeeIds.has(e.id)));
  }, [leaves, employees]);


  const handlePnoSearch = () => {
    if (!pnoInput) {
      setSearchedEmployee(null);
      return;
    }
    const employee = employees.find(e => e.pno === pnoInput);
    setSearchedEmployee(employee || null);
    if (!employee) {
        toast({
            variant: 'destructive',
            title: t.duty.employeeNotFound,
        })
    }
  };

  const handleMarkAbsent = () => {
    if (!searchedEmployee) {
      toast({ variant: 'destructive', title: t.duty.noEmployeeSelected, description: t.duty.noEmployeeSelectedDescription });
      return;
    }

    const isAlreadyAbsent = absentEmployees.some(e => e.id === searchedEmployee.id);
    if (isAlreadyAbsent) {
      toast({ variant: 'destructive', title: t.absentEmployeesPage.alreadyAbsentTitle, description: t.absentEmployeesPage.alreadyAbsentDescription(searchedEmployee.name) });
      return;
    }

    const absentLeave: Leave = {
      id: Date.now().toString(),
      employeeId: searchedEmployee.id,
      employeeName: searchedEmployee.name,
      type: 'Absent',
      startDate: todayString,
      endDate: todayString,
      reason: 'Marked absent from Absent Employees page.',
      status: 'Approved'
    };
    updateLeaves([...leaves, absentLeave]);
    toast({ title: t.duty.employeeMarkedAbsent, description: t.duty.employeeMarkedAbsentDescription(searchedEmployee.name, format(new Date(), 'dd-MM-yyyy')) });
    setSearchedEmployee(null);
    setPnoInput("");
  }
  
  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('Hind-Regular.ttf', font);
    doc.addFont('Hind-Regular.ttf', 'Hind', 'normal');
    doc.setFont('Hind');
    
    doc.text(`${t.absentEmployeesPage.absentList} - ${format(new Date(), 'dd-MM-yyyy')}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[t.serialNumber, t.badgeNumber, t.pno, t.rank, t.name]],
      body: absentEmployees.map((employee, index) => [
        index + 1,
        employee.badgeNumber,
        employee.pno,
        t.ranks[employee.rank],
        employee.name,
      ]),
      styles: { font: 'Hind' },
      headStyles: { font: 'Hind' },
    });
    doc.save(`absent_employees_${todayString}.pdf`);
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
        title={t.absentEmployeesPage.title}
        description={t.absentEmployeesPage.description}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t.absentEmployeesPage.markAbsent}</CardTitle>
                    <CardContent className="pt-4 px-0 pb-0">{t.absentEmployeesPage.markAbsentDescription}</CardContent>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
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
                        {searchedEmployee && (
                             <Card className="bg-muted">
                                <CardContent className="pt-6">
                                     <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={searchedEmployee.avatarUrl} alt={searchedEmployee.name} />
                                            <AvatarFallback>{searchedEmployee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{searchedEmployee.name}</p>
                                            <p className="text-sm text-muted-foreground">{t.ranks[searchedEmployee.rank]}</p>
                                        </div>
                                    </div>
                                    <Button className="w-full mt-4" onClick={handleMarkAbsent}>
                                        <UserX className="mr-2" /> {t.absentEmployeesPage.markAsAbsentButton}
                                    </Button>
                                </CardContent>
                             </Card>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.absentEmployeesPage.absentList}</CardTitle>
                <Button variant="outline" onClick={handleExportPdf} disabled={absentEmployees.length === 0}>
                    <FileDown className="mr-2" /> {t.exportPdf}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t.serialNumber}</TableHead>
                            <TableHead>{t.name}</TableHead>
                            <TableHead>{t.badgeNumber}</TableHead>
                            <TableHead>{t.pno}</TableHead>
                            <TableHead>{t.rank}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {absentEmployees.length > 0 ? (
                        absentEmployees.map((employee, index) => (
                            <TableRow key={employee.id}>
                                <TableCell>{index + 1}</TableCell>
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
                                <TableCell>{employee.badgeNumber}</TableCell>
                                <TableCell>{employee.pno}</TableCell>
                                <TableCell>{t.ranks[employee.rank]}</TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                                {t.absentEmployeesPage.noAbsentees}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
