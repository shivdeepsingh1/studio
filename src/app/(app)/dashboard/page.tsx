"use client";

import { BarChart, FileDown, Plus, Send } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { mockEmployees, mockDuties, mockLeaves } from '@/lib/mock-data';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';

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
  const { user, role } = useAuth();
  
  const stats = {
    totalEmployees: mockEmployees.length,
    onDuty: mockDuties.filter(d => d.date === new Date().toISOString().split('T')[0]).length,
    onLeave: mockLeaves.filter(l => l.status === 'Approved' && new Date() >= new Date(l.startDate) && new Date() <= new Date(l.endDate)).length,
  };

  const employeeDuty = mockDuties.find(d => d.employeeId === user?.id && d.date === new Date().toISOString().split('T')[0])
  const employeeLeaveBalance = 12; // Mock data

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}!`} description={role === 'admin' ? "Here's your command center overview." : "Here's your daily summary."} />

      {role === 'admin' ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">+2 since last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently On Duty</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onDuty}</div>
                 <p className="text-xs text-muted-foreground">As of today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently On Leave</CardTitle>
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.onLeave}</div>
                <p className="text-xs text-muted-foreground">As of today</p>
              </CardContent>
            </Card>
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
                <Link href="/duty" passHref legacyBehavior><Button><Send className="mr-2"/>Assign Duty</Button></Link>
                <Link href="/employees" passHref legacyBehavior><Button variant="secondary"><Plus className="mr-2"/>Add New Employee</Button></Link>
                <Link href="/leave" passHref legacyBehavior><Button variant="secondary"><CalendarOff className="mr-2"/>Update Leave Details</Button></Link>
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
