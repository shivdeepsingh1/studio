
"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "@/lib/fonts/Hind-Regular";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Printer, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-provider";
import { useLanguage } from "@/lib/i18n/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leave } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AbsentEmployeesPage() {
  const { user } = useAuth();
  const { employees, leaves, updateLeaves } = useData();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [editingAbsence, setEditingAbsence] = useState<Leave | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<string | null>(null);

  const absenceRecords = useMemo(() => {
    return leaves.filter(l => l.type === 'Absent');
  }, [leaves]);

  const openEditDialog = (absence: Leave) => {
    if (user?.rank !== 'Administrator') return;
    setEditingAbsence({ ...absence });
    setIsEditDialogOpen(true);
  };

  const handleDeleteAbsence = (id: string) => {
    if (user?.rank !== 'Administrator') return;
    setAbsenceToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAbsence = () => {
    if (!absenceToDelete) return;
    updateLeaves(prevLeaves => prevLeaves.filter(l => l.id !== absenceToDelete));
    setIsDeleteDialogOpen(false);
    setAbsenceToDelete(null);
  };

  const handleUpdateAbsence = () => {
    if (!editingAbsence || user?.rank !== 'Administrator') return;

    const absenceStartDate = new Date(editingAbsence.startDate.replace(/-/g, '/'));
    const absenceEndDate = new Date(editingAbsence.endDate.replace(/-/g, '/'));

    if (absenceEndDate < absenceStartDate) {
        toast({ variant: 'destructive', title: t.leave.invalidDateRange, description: t.leave.invalidDateRangeDescription });
        return;
    }
    
    updateLeaves(prevLeaves => prevLeaves.map(l => (l.id === editingAbsence!.id ? editingAbsence! : l)));
    setIsEditDialogOpen(false);
    setEditingAbsence(null);
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingAbsence) return;
    const { id, value } = e.target;
    setEditingAbsence({ ...editingAbsence, [id]: value });
  };


  const handleExportPdf = () => {
    const doc = new jsPDF();
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }
    
    doc.text(`${t.pageHeaders.absentManagement.title}`, 14, 16);

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
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
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
        title={t.pageHeaders.absentManagement.title}
        description={t.pageHeaders.absentManagement.description}
      >
        <Button variant="outline" onClick={handleExportPdf} disabled={absenceRecords.length === 0}>
            <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>{t.pageHeaders.absentManagement.title}</CardTitle>
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
                          {user?.rank === 'Administrator' && <TableHead className="text-right">{t.actions}</TableHead>}
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
                              {user?.rank === 'Administrator' && (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">{t.employees.openMenu}</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditDialog(absence)}>
                                        {t.edit}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={() => handleDeleteAbsence(absence.id)}
                                      >
                                        {t.delete}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                          </TableRow>
                        )
                      })
                      ) : (
                      <TableRow>
                          <TableCell colSpan={user?.rank === 'Administrator' ? 8 : 7} className="text-center h-24">
                              {t.absentManagement.noAbsences}
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
          </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.leave.editLeave}</DialogTitle>
              <DialogDescription>{t.leave.editLeaveDescription}</DialogDescription>
            </DialogHeader>
            {editingAbsence && (
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t.leave.employee}</Label>
                        <Input
                            value={editingAbsence.employeeName}
                            disabled
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate-edit" className="text-right">{t.leave.startDate}</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={editingAbsence.startDate}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate-edit" className="text-right">{t.leave.endDate}</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={editingAbsence.endDate}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason-edit" className="text-right">{t.leave.reason}</Label>
                        <Textarea
                            id="reason"
                            value={editingAbsence.reason}
                            onChange={handleEditInputChange}
                            className="col-span-3"
                        />
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditDialogOpen(false)}
                >
                    {t.cancel}
                </Button>
                <Button onClick={handleUpdateAbsence}>{t.save}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
                <AlertDialogDescription>{t.confirmDeleteDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAbsenceToDelete(null)}>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteAbsence} className={buttonVariants({ variant: "destructive" })}>{t.deleteConfirm}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
