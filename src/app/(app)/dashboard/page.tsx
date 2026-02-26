
"use client";

import { Users, CalendarOff, Send, Plus, Anchor, Globe, Calendar, CalendarPlus, CalendarHeart } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';
import { employeeRanks, EmployeeRank } from '@/lib/types';
import { useData } from '@/lib/data-provider';

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: 'Duties',
    color: 'hsl(var(--primary))',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { employees, duties, leaves } = useData();
  
  const today = new Date();
  const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const dutiesToday = duties.filter(d => d.date === todayString);
  const leavesToday = leaves.filter(l => l.status === 'Approved' && l.startDate <= todayString && l.endDate >= todayString);

  const stats = {
    totalEmployees: employees.length,
    reserve: dutiesToday.filter(d => d.location.toLowerCase() === 'reserve').length,
    outOfDistrict: dutiesToday.filter(d => d.location.toLowerCase() !== 'reserve').length,
    casualLeave: leavesToday.filter(l => l.type === 'Casual').length,
    earnedLeave: leavesToday.filter(l => l.type === 'Earned').length,
    otherLeave: leavesToday.filter(l => l.type !== 'Casual' && l.type !== 'Earned').length,
  };
  
  const rankCounts = employeeRanks.reduce((acc, rank) => {
    acc[rank] = employees.filter(e => e.rank === rank).length;
    return acc;
  }, {} as Record<EmployeeRank, number>);

  const employeeDuty = duties.find(d => d.employeeId === user?.id && d.date === todayString)
  const employeeLeaveBalance = 12; // Mock data

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}!`} description={user?.role === 'admin' ? "Here's your command center overview." : "Here's your daily summary."} />

      {user?.role === 'admin' ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">Total strength</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reserve</CardTitle>
                <Anchor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reserve}</div>
                <p className="text-xs text-muted-foreground">On reserve duty today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of District Duty</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.outOfDistrict}</div>
                <p className="text-xs text-muted-foreground">Deployed outside district</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Casual Leave</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.casualLeave}</div>
                <p className="text-xs text-muted-foreground">On casual leave today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned Leave</CardTitle>
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.earnedLeave}</div>
                <p className="text-xs text-muted-foreground">On earned leave today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Other Leave</CardTitle>
                <CalendarHeart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.otherLeave}</div>
                <p className="text-xs text-muted-foreground">Sick, Maternity, etc.</p>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Rank-wise Strength</h2>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {employeeRanks
                .filter((rank) => rank !== 'Administrator')
                .map((rank) => (
                  <Card key={rank}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{rank}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{rankCounts[rank] || 0}</div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Duty Assignments Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <RechartsBarChart accessibilityLayer data={chartData}>
                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                  </RechartsBarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/duty"><Button><Send className="mr-2"/>Assign Duty</Button></Link>
                <Link href="/employees"><Button variant="secondary"><Plus className="mr-2"/>Add New Employee</Button></Link>
                <Link href="/leave"><Button variant="secondary"><CalendarOff className="mr-2"/>Update Leave Details</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>Today's Duty</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeDuty ? (
                    <div>
                        <p className="text-lg font-semibold">{employeeDuty.location}</p>
                        <p>Shift: {employeeDuty.shift}</p>
                        <p>Details: {employeeDuty.details}</p>
                    </div>
                ) : (
                    <p>No duty assigned for today.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{employeeLeaveBalance} Days</div>
                <p className="text-sm text-muted-foreground">Casual Leave available</p>
              </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}
