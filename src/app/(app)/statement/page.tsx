
"use client";

import { format } from 'date-fns';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { EmployeeRank, employeeRanks, leaveTypes } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '@/lib/data-provider';

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
    const totalStrength = displayRanks.reduce((sum, rank) => sum + (rankStrength[rank] || 0), 0);

    // Leave Calculation
    const onLeaveToday = leaves.filter(l => {
         if (l.status !== 'Approved' || !l.startDate || !l.endDate) return false;
         const startDate = new Date(l.startDate);
         const endDate = new Date(l.endDate);
         startDate.setHours(0,0,0,0);
         endDate.setHours(23,59,59,999);
         return today >= startDate && today <= endDate;
    });
    
    const onLeaveTodayIds = new Set(onLeaveToday.map(l => l.employeeId));

    const leaveByRank = displayRanks.map(rank => {
        const rankData: Record<string, number | string> = { rank };
        let total = 0;
        leaveTypes.forEach(leaveType => {
            const count = onLeaveToday.filter(l => {
                const emp = employees.find(e => e.id === l.employeeId);
                return emp?.rank === rank && l.type === leaveType;
            }).length;
            rankData[leaveType] = count;
            total += count;
        });
        rankData['Total'] = total;
        return rankData;
    });
    
    const totalLeaveByType = leaveTypes.reduce((acc, type) => {
        acc[type] = onLeaveToday.filter(l => l.type === type).length;
        return acc;
    }, {} as Record<string, number>);
    totalLeaveByType['Total'] = onLeaveToday.length;

    // Suspended Calculation
    const suspendedByRank = displayRanks.reduce((acc, rank) => {
        acc[rank] = employees.filter(e => e.rank === rank && e.status === 'Suspended').length;
        return acc;
    }, {} as Record<EmployeeRank, number>);
    const totalSuspended = Object.values(suspendedByRank).reduce((a, b) => a + b, 0);

    // Absent Calculation
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
    const totalAbsent = absentEmployees.length;

    return (
        <>
            <PageHeader title="Daily Statement" description={`Status overview for ${format(today, 'MMMM dd, yyyy')}`} />
            <div className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Full Strength</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead className="text-right">Strength</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayRanks.map(rank => (
                                    <TableRow key={rank}>
                                        <TableCell className="font-medium">{rank}</TableCell>
                                        <TableCell className="text-right">{rankStrength[rank] || 0}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="text-right">{totalStrength}</TableHead>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Leave Details</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        {leaveTypes.map(type => <TableHead key={type} className="text-right">{type}</TableHead>)}
                                        <TableHead className="text-right font-bold">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveByRank.map(row => (
                                        <TableRow key={row.rank as string}>
                                            <TableCell className="font-medium">{row.rank}</TableCell>
                                            {leaveTypes.map(type => <TableCell key={type} className="text-right">{row[type]}</TableCell>)}
                                            <TableCell className="text-right font-bold">{row['Total']}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableHead>Total</TableHead>
                                        {leaveTypes.map(type => <TableHead key={type} className="text-right">{totalLeaveByType[type]}</TableHead>)}
                                        <TableHead className="text-right">{totalLeaveByType['Total']}</TableHead>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader><CardTitle>Absent Personnel</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayRanks.map(rank => (
                                        <TableRow key={rank}>
                                            <TableCell className="font-medium">{rank}</TableCell>
                                            <TableCell className="text-right">{absentByRank[rank] || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">{totalAbsent}</TableHead>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Suspended Personnel</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayRanks.map(rank => (
                                        <TableRow key={rank}>
                                            <TableCell className="font-medium">{rank}</TableCell>
                                            <TableCell className="text-right">{suspendedByRank[rank] || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">{totalSuspended}</TableHead>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
