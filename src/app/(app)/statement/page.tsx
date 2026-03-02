
"use client";

import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { EmployeeRank, employeeRanks, leaveTypes, LeaveType, Leave } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '@/lib/data-provider';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { font } from "@/lib/fonts/Hind-Regular";
import { useLanguage } from '@/lib/i18n/language-provider';

export default function StatementPage() {
    const { user } = useAuth();
    const { employees, duties, leaves } = useData();
    const { t } = useLanguage();

    if (user?.role !== 'admin') {
        return (
             <div className="flex items-center justify-center h-full">
              <p>{t.pageHeaders.permissionDenied}</p>
          </div>
        );
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = format(today, "yyyy-MM-dd");
    
    const displayRanks = employeeRanks.filter(rank => rank !== 'Administrator');
    const statementLeaveTypes: (keyof typeof t.leaveTypes)[] = ['Casual', 'Earned', 'CCL', 'Medical'];

    const allLeavesToday = leaves.filter(l => {
         if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
         const startDate = new Date(l.startDate.replace(/-/g, '/'));
         const endDate = new Date(l.endDate.replace(/-/g, '/'));
         startDate.setHours(0,0,0,0);
         endDate.setHours(23,59,59,999);
         return today >= startDate && today <= endDate;
    });

    const dutiesToday = duties.filter(d => d.date === todayString && d.status !== 'Completed');

    // Combine data for the table
    const statementData = displayRanks.map(rank => {
        const employeesInRank = employees.filter(e => e.rank === rank && e.status !== 'Transferred');
        const strength = employeesInRank.length;
        const suspended = employeesInRank.filter(e => e.status === 'Suspended').length;
        
        const leavesForRank = allLeavesToday.filter(l => employeesInRank.some(e => e.id === l.employeeId));
        
        const leavesByEmployee = leavesForRank.reduce((acc, leave) => {
            if (!acc[leave.employeeId]) acc[leave.employeeId] = [];
            acc[leave.employeeId].push(leave.type);
            return acc;
        }, {} as Record<string, LeaveType[]>);

        let absentCount = 0;
        const onLeaveEmployeeIds = new Set<string>();
        const leaveCounts: Record<string, number> = {};
        statementLeaveTypes.forEach(type => { leaveCounts[type] = 0; });

        Object.entries(leavesByEmployee).forEach(([employeeId, types]) => {
            if (types.includes('Absent')) {
                absentCount++;
            } else {
                onLeaveEmployeeIds.add(employeeId);
                let counted = false;
                for (const type of statementLeaveTypes) {
                    if (types.includes(type)) {
                        leaveCounts[type]++;
                        counted = true;
                        break; 
                    }
                }
            }
        });
        
        const totalOnLeave = onLeaveEmployeeIds.size;
        
        const presentCount = strength - totalOnLeave - absentCount - suspended;

        const presentEmployeeIdsInRank = new Set(employeesInRank.filter(e => 
            e.status !== 'Suspended' && 
            !onLeaveEmployeeIds.has(e.id) &&
            !Object.keys(leavesByEmployee).some(id => leavesByEmployee[id].includes('Absent') && id === e.id)
        ).map(e => e.id));
        
        const onDutyCount = dutiesToday.filter(d => presentEmployeeIdsInRank.has(d.employeeId)).length;
        
        const reserve = presentCount - onDutyCount;

        return {
            rank,
            strength,
            leaveCounts,
            totalOnLeave,
            absent: absentCount,
            suspended,
            present: presentCount,
            onDuty: onDutyCount,
            reserve: reserve,
        };
    });

    // Calculate totals for the footer
    const totalStrength = statementData.reduce((sum, data) => sum + data.strength, 0);
    const totalLeaveByType = statementLeaveTypes.reduce((acc, type) => {
        acc[type] = statementData.reduce((sum, data) => sum + (data.leaveCounts[type] || 0), 0);
        return acc;
    }, {} as Record<string, number>);
    const totalOnLeave = statementData.reduce((sum, data) => sum + data.totalOnLeave, 0);
    const totalAbsent = statementData.reduce((sum, data) => sum + data.absent, 0);
    const totalSuspended = statementData.reduce((sum, data) => sum + data.suspended, 0);
    const totalPresent = statementData.reduce((sum, data) => sum + data.present, 0);
    const totalOnDuty = statementData.reduce((sum, data) => sum + data.onDuty, 0);
    const totalReserve = statementData.reduce((sum, data) => sum + data.reserve, 0);

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        if (font) {
          doc.addFileToVFS("Hind-Regular.ttf", font);
          doc.addFont("Hind-Regular.ttf", "Hind", "normal");
          doc.setFont("Hind");
        }

        doc.text(t.pageHeaders.statement.description(format(today, 'MMMM dd, yyyy')), 14, 16);

        const head = [
            [
                { content: t.rank, rowSpan: 2 },
                { content: t.statement.postedStrength, rowSpan: 2, styles: { halign: 'center' } },
                { content: t.statement.onLeave, colSpan: statementLeaveTypes.length + 1, styles: { halign: 'center' } },
                { content: t.statement.absent, rowSpan: 2, styles: { halign: 'center' } },
                { content: t.statement.suspended, rowSpan: 2, styles: { halign: 'center' } },
                { content: t.statement.presentForDuty, rowSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: t.statement.onDuty, rowSpan: 2, styles: { halign: 'center' } },
                { content: t.statement.reserve, rowSpan: 2, styles: { halign: 'center' } },
            ],
            [
                ...statementLeaveTypes.map(type => ({ content: t.leaveTypes[type], styles: { halign: 'center' } })),
                { content: t.statement.total, styles: { halign: 'center', fontStyle: 'bold' } },
            ]
        ];

        const body = statementData.map(data => [
            t.ranks[data.rank],
            { content: data.strength, styles: { halign: 'center' } },
            ...statementLeaveTypes.map(type => ({ content: data.leaveCounts[type] || 0, styles: { halign: 'center' } })),
            { content: data.totalOnLeave, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: data.absent, styles: { halign: 'center' } },
            { content: data.suspended, styles: { halign: 'center' } },
            { content: data.present, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: data.onDuty, styles: { halign: 'center' } },
            { content: data.reserve, styles: { halign: 'center' } },
        ]);
        
        const foot = [
            [
                { content: t.statement.total, styles: { fontStyle: 'bold' } },
                { content: totalStrength, styles: { halign: 'center', fontStyle: 'bold' } },
                ...statementLeaveTypes.map(type => ({ content: totalLeaveByType[type] || 0, styles: { halign: 'center', fontStyle: 'bold' } })),
                { content: totalOnLeave, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalAbsent, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalSuspended, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalPresent, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalOnDuty, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalReserve, styles: { halign: 'center', fontStyle: 'bold' } },
            ]
        ];

        autoTable(doc, {
            startY: 22,
            head: head,
            body: body as any,
            foot: foot as any,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', halign: 'center', ...(font && {font: 'Hind'}) },
            footStyles: { fontStyle: 'bold', ...(font && {font: 'Hind'}) },
            ...(font && { styles: { font: "Hind" }, bodyStyles: {font: "Hind"} })
        });

        doc.save(`daily_force_statement_${todayString}.pdf`);
    };


    return (
        <>
            <PageHeader title={t.pageHeaders.statement.title} description={t.pageHeaders.statement.description(format(today, 'MMMM dd, yyyy'))} >
                <Button onClick={handleExportPdf}>
                    <Printer className="mr-2" />
                    {t.exportPdf}
                </Button>
            </PageHeader>
            <Card>
                <CardHeader><CardTitle>{t.statement.dailyForceStatement}</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={2} className="sticky left-0 bg-background z-10 min-w-[150px]">{t.rank}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.postedStrength}</TableHead>
                                    <TableHead colSpan={statementLeaveTypes.length + 1} className="text-center border-x">{t.statement.onLeave}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.absent}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.suspended}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.presentForDuty}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.onDuty}</TableHead>
                                    <TableHead rowSpan={2} className="text-center">{t.statement.reserve}</TableHead>
                                </TableRow>
                                <TableRow>
                                    {statementLeaveTypes.map(type => <TableHead key={type} className="text-center border-x">{t.leaveTypes[type]}</TableHead>)}
                                    <TableHead className="text-center font-bold border-x">{t.statement.total}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.map(data => (
                                    <TableRow key={data.rank}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{t.ranks[data.rank]}</TableCell>
                                        <TableCell className="text-center">{data.strength}</TableCell>
                                        {statementLeaveTypes.map(type => <TableCell key={type} className="text-center border-x">{data.leaveCounts[type]}</TableCell>)}
                                        <TableCell className="text-center font-bold border-x">{data.totalOnLeave}</TableCell>
                                        <TableCell className="text-center">{data.absent}</TableCell>
                                        <TableCell className="text-center">{data.suspended}</TableCell>
                                        <TableCell className="text-center font-bold">{data.present}</TableCell>
                                        <TableCell className="text-center">{data.onDuty}</TableCell>
                                        <TableCell className="text-center">{data.reserve}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-muted/50 z-10">{t.statement.total}</TableHead>
                                    <TableHead className="text-center">{totalStrength}</TableHead>
                                    {statementLeaveTypes.map(type => <TableHead key={type} className="text-center border-x">{totalLeaveByType[type]}</TableHead>)}
                                    <TableHead className="text-center font-bold border-x">{totalOnLeave}</TableHead>
                                    <TableHead className="text-center">{totalAbsent}</TableHead>
                                    <TableHead className="text-center">{totalSuspended}</TableHead>
                                    <TableHead className="text-center font-bold">{totalPresent}</TableHead>
                                    <TableHead className="text-center font-bold">{totalOnDuty}</TableHead>
                                    <TableHead className="text-center font-bold">{totalReserve}</TableHead>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </>
    );
}
