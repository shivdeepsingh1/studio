
"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee, Duty } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { font } from "@/lib/fonts/Hind-Regular";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function TodayReservePage() {
  const { user } = useAuth();
  const { employees, duties, leaves, updateDuties } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newDuty, setNewDuty] = useState<{
    shift: 'Morning' | 'Afternoon' | 'Night';
    location: string;
    details: string;
  }>({
    shift: 'Morning',
    location: '',
    details: '',
  });

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

    const onActiveDutyIds = new Set(duties.filter(d => d.date === todayString && d.status !== 'Completed').map(d => d.employeeId));

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

  const handleOpenAssignDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewDuty({ shift: 'Morning', location: '', details: '' });
    setIsAssignDialogOpen(true);
  };
  
  const handleAssignDuty = () => {
    if (!selectedEmployee || !newDuty.location) {
        toast({ variant: 'destructive', title: t.duty.incompleteInformation, description: t.duty.incompleteInformationDescription });
        return;
    }
    
    const alreadyOnDuty = duties.find(d => 
        d.employeeId === selectedEmployee.id &&
        d.date === todayString &&
        d.status !== 'Completed'
    );

    if (alreadyOnDuty) {
        toast({
            variant: 'destructive',
            title: t.duty.employeeAlreadyOnDutyTitle,
            description: t.duty.employeeAlreadyOnDutyDescription(selectedEmployee.name, format(new Date(todayString.replace(/-/g, '\/')), 'dd-MM-yyyy')),
        });
        setIsAssignDialogOpen(false);
        return;
    }


    const dutyToAdd: Duty = {
        id: Date.now().toString(),
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        date: todayString,
        shift: newDuty.shift,
        location: newDuty.location,
        details: newDuty.details,
        status: 'Active',
    };

    updateDuties(prevDuties => [...prevDuties, dutyToAdd]);
    toast({ title: t.duty.dutyAssigned, description: t.duty.dutyAssignedDescription(selectedEmployee.name, format(new Date(), 'dd-MM-yyyy')) });
    setIsAssignDialogOpen(false);
    setSelectedEmployee(null);
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
                              <TableCell>
                                <Button variant="link" onClick={() => handleOpenAssignDialog(employee)}>
                                  {t.statement.reserve}
                                </Button>
                              </TableCell>
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

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.duty.assignDutyTo(selectedEmployee?.name || '')}</DialogTitle>
            <DialogDescription>{t.duty.assignDutyDescriptionReserve}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shift" className="text-right">
                {t.duty.shift}
              </Label>
              <Select
                onValueChange={(value) => setNewDuty(prev => ({ ...prev, shift: value as any }))}
                value={newDuty.shift}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t.duty.selectShift} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">{t.duty.morning}</SelectItem>
                  <SelectItem value="Afternoon">{t.duty.afternoon}</SelectItem>
                  <SelectItem value="Night">{t.duty.night}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                {t.duty.location}
              </Label>
              <Input
                id="location"
                value={newDuty.location}
                onChange={(e) => setNewDuty(prev => ({ ...prev, location: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">
                {t.duty.details}
              </Label>
              <Textarea
                id="details"
                value={newDuty.details}
                onChange={(e) => setNewDuty(prev => ({ ...prev, details: e.target.value }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleAssignDuty}>{t.duty.assignDuty}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
