
"use client";

import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { EmployeeRank, employeeRanks, leaveTypes, employeeRankTranslations, leaveTypeTranslations } from '@/lib/types';
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
              <p>आपको यह पृष्ठ देखने की अनुमति नहीं है।</p>
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
                { content: 'पद', rowSpan: 2 },
                { content: 'तैनात संख्या', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'अवकाश पर', colSpan: leaveTypes.length + 1, styles: { halign: 'center' } },
                { content: 'निलंबित', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'अनुपस्थित', rowSpan: 2, styles: { halign: 'center' } },
                { content: 'ड्यूटी पर उपस्थित', rowSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
            ],
            [
                ...leaveTypes.map(type => ({ content: leaveTypeTranslations[type], styles: { halign: 'center' } })),
                { content: 'कुल', styles: { halign: 'center', fontStyle: 'bold' } },
            ]
        ];

        const body = statementData.map(data => [
            employeeRankTranslations[data.rank],
            { content: data.strength, styles: { halign: 'center' } },
            ...leaveTypes.map(type => ({ content: data.leaveCounts[type] || 0, styles: { halign: 'center' } })),
            { content: data.totalOnLeave, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: data.suspended, styles: { halign: 'center' } },
            { content: data.absent, styles: { halign: 'center' } },
            { content: data.present, styles: { halign: 'center', fontStyle: 'bold' } },
        ]);
        
        const foot = [
            [
                { content: 'कुल', styles: { fontStyle: 'bold' } },
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
            <PageHeader title="दैनिक विवरण" description={`${format(today, 'MMMM dd, yyyy')} के लिए स्थिति अवलोकन`} >
                <Button onClick={handleExportPdf}>
                    <FileDown className="mr-2" />
                    PDF निर्यात करें
                </Button>
            </PageHeader>
            <Card>
                <CardHeader><CardTitle>दैनिक बल विवरण</CardTitle></CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead rowSpan={2} className="sticky left-0 bg-background z-10 min-w-[150px]">पद</TableHead>
                                    <TableHead rowSpan={2} className="text-center">तैनात संख्या</TableHead>
                                    <TableHead colSpan={leaveTypes.length + 1} className="text-center border-x">अवकाश पर</TableHead>
                                    <TableHead rowSpan={2} className="text-center">निलंबित</TableHead>
                                    <TableHead rowSpan={2} className="text-center">अनुपस्थित</TableHead>
                                    <TableHead rowSpan={2} className="text-center">ड्यूटी पर उपस्थित</TableHead>
                                </TableRow>
                                <TableRow>
                                    {leaveTypes.map(type => <TableHead key={type} className="text-center border-x">{leaveTypeTranslations[type]}</TableHead>)}
                                    <TableHead className="text-center font-bold border-x">कुल</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statementData.map(data => (
                                    <TableRow key={data.rank}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{employeeRankTranslations[data.rank]}</TableCell>
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
                                    <TableHead className="sticky left-0 bg-muted/50 z-10">कुल</TableHead>
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

    
