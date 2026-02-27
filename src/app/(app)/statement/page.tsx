
"use client";

import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { EmployeeRank, employeeRanks, leaveTypes } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '@/lib/data-provider';
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StatementPage() {
    const { user } = useAuth();
    const { employees, duties, leaves } = useData();

    if (user?.role !== 'admin') {
        return (
             <div className="flex items-center justify-center h-full">
              <p>You do not have permission to view this page.</p>
          </div>
        );
    }
    
    const today = new Date();
    const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const displayRanks = employeeRanks.filter(rank => rank !== 'Administrator');

    // Strength Calculation
    const rankStrength = displayRanks.reduce((acc, rank) => {
        acc[rank] = employees.filter(e => e.rank === rank).length;
        return acc;
    }, {} as Record<EmployeeRank, number>);

    // Leave Calculation
    const onLeaveToday = leaves.filter(l => {
         if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
         const startDate = new Date(l.startDate.replace(/-/g, '/'));
         const endDate = new Date(l.endDate.replace(/-/g, '/'));
         startDate.setHours(0,0,0,0);
         endDate.setHours(23,59,59,999);
         return today >= startDate && today <= endDate;
    });
    const onLeaveTodayIds = new Set(onLeaveToday.map(l => l.employeeId));
    
    // Suspended Calculation
    const suspendedByRank = displayRanks.reduce((acc, rank) => {
        acc[rank] = employees.filter(e => e.rank === rank && e.status === 'Suspended').length;
        return acc;
    }, {} as Record<EmployeeRank, number>);

    // Absent Calculation (Unaccounted for)
    const onDutyTodayIds = new Set(duties.filter(d => d.date === todayString).map(d => d.employeeId));
    const absentEmployees = employees.filter(e => 
        e.rank !== 'Administrator' &&
        (e.status === 'Active' || !e.status) &&
        !onLeaveTodayIds.has(e.id) &&
        !onDutyTodayIds.has(e.id)
    );
    const absentByRank = displayRanks.reduce((acc, rank) => {
        acc[rank] = absentEmployees.filter(e => e.rank === rank).length;
        return acc;
    }, {} as Record<EmployeeRank, number>);


    // Combine data for the table
    const statementData = displayRanks.map(rank => {
        const strength = rankStrength[rank] || 0;

        const onLeaveRank = onLeaveToday.filter(l => {
            const emp = employees.find(e => e.id === l.employeeId);
            return emp?.rank === rank;
        });
        
        const leaveCounts: Record<string, number> = {};
        leaveTypes.forEach(type => {
            leaveCounts[type] = onLeaveRank.filter(l => l.type === type).length;
        });
        const totalOnLeave = onLeaveRank.length;

        const suspended = suspendedByRank[rank] || 0;
        const absent = absentByRank[rank] || 0;
        const present = strength - totalOnLeave - suspended - absent;

        return {
            rank,
            strength,
            leaveCounts,
            totalOnLeave,
            suspended,
            absent,
            present,
        };
    });

    // Calculate totals for the footer
    const totalStrength = displayRanks.reduce((sum, rank) => sum + (rankStrength[rank] || 0), 0);
    const totalLeaveByType = leaveTypes.reduce((acc, type) => {
        acc[type] = onLeaveToday.filter(l => l.type === type).length;
        return acc;
    }, {} as Record<string, number>);
    const totalOnLeave = onLeaveToday.length;
    const totalSuspended = Object.values(suspendedByRank).reduce((a, b) => a + b, 0);
    const totalAbsent = absentEmployees.length;
    const totalPresent = totalStrength - totalOnLeave - totalSuspended - totalAbsent;

    const handleExportPdf = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.text(`Daily Force Statement for ${format(today, 'MMMM dd, yyyy')}`, 14, 16);

        const head = [
            [
                { content: 'Rank', rowSpan: 2 },
                { content: 'Posted Strength', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'On Leave', colSpan: leaveTypes.length + 1, styles: { halign: 'center' } },
                { content: 'Suspended', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'Absent', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'Present for Duty', rowSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
            ],
            [
                ...leaveTypes.map(type => ({ content: type, styles: { halign: 'center' } })),
                { content: 'Total', styles: { halign: 'center', fontStyle: 'bold' } },
            ]
        ];

        const body = statementData.map(data => [
            data.rank,
            { content: data.strength, styles: { halign: 'center' } },
            ...leaveTypes.map(type => ({ content: data.leaveCounts[type] || 0, styles: { halign: 'center' } })),
            { content: data.totalOnLeave, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: data.suspended, styles: { halign: 'center' } },
            { content: data.absent, styles: { halign: 'center' } },
            { content: data.present, styles: { halign: 'center', fontStyle: 'bold' } },
        ]);
        
        const foot = [
            [
                { content: 'Total', styles: { fontStyle: 'bold' } },
                { content: totalStrength, styles: { halign: 'center', fontStyle: 'bold' } },
                ...leaveTypes.map(type => ({ content: totalLeaveByType[type] || 0, styles: { halign: 'center', fontStyle: 'bold' } })),
                { content: totalOnLeave, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalSuspended, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalAbsent, styles: { halign: 'center', fontStyle: 'bold' } },
                { content: totalPresent, styles: { halign: 'center', fontStyle: 'bold' } },
            ]
        ];

        autoTable(doc, {
            startY: 22,
            head: head,
            body: body as any,
            foot: foot as any,
            theme: 'grid',
            headStyles: { fontStyle: 'bold', halign: 'center' },
            footStyles: { fontStyle: 'bold' },
        });

        doc.save(`daily_force_statement_${todayString}.pdf`);
    };


    return (
        <>
            <PageHeader title="Daily Statement" description={`Status overview for ${format(today, 'MMMM dd, yyyy')}`} >
                <Button onClick={handleExportPdf}>
                    <FileDown className="mr-2" />
                    Export PDF
                </Button>
            </PageHeader>
            <Card>
                <CardHeader><CardTitle>Daily Force Statement</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={2} className="sticky left-0 bg-background z-10 min-w-[150px]">Rank</TableHead>
                                    <TableHead rowSpan={2} className="text-center">Posted Strength</TableHead>
                                    <TableHead colSpan={leaveTypes.length + 1} className="text-center border-x">On Leave</TableHead>
                                    <TableHead rowSpan={2} className="text-center">Suspended</TableHead>
                                    <TableHead rowSpan={2} className="text-center">Absent</TableHead>
                                    <TableHead rowSpan={2} className="text-center">Present for Duty</TableHead>
                                </TableRow>
                                <TableRow>
                                    {leaveTypes.map(type => <TableHead key={type} className="text-center border-x">{type}</TableHead>)}
                                    <TableHead className="text-center font-bold border-x">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.map(data => (
                                    <TableRow key={data.rank}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{data.rank}</TableCell>
                                        <TableCell className="text-center">{data.strength}</TableCell>
                                        {leaveTypes.map(type => <TableCell key={type} className="text-center border-x">{data.leaveCounts[type]}</TableCell>)}
                                        <TableCell className="text-center font-bold border-x">{data.totalOnLeave}</TableCell>
                                        <TableCell className="text-center">{data.suspended}</TableCell>
                                        <TableCell className="text-center">{data.absent}</TableCell>
                                        <TableCell className="text-center font-bold">{data.present}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-muted/50 z-10">Total</TableHead>
                                    <TableHead className="text-center">{totalStrength}</TableHead>
                                    {leaveTypes.map(type => <TableHead key={type} className="text-center border-x">{totalLeaveByType[type]}</TableHead>)}
                                    <TableHead className="text-center font-bold border-x">{totalOnLeave}</TableHead>
                                    <TableHead className="text-center">{totalSuspended}</TableHead>
                                    <TableHead className="text-center">{totalAbsent}</TableHead>
                                    <TableHead className="text-center font-bold">{totalPresent}</TableHead>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </>
    );
}

    