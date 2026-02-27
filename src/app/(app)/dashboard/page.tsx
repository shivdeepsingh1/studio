
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
import { useLanguage } from '@/lib/i18n/language-provider';

const chartData = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
  { month: 'March', desktop: 237 },
  { month: 'April', desktop: 73 },
  { month: 'May', desktop: 209 },
  { month: 'June', desktop: 214 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  const chartConfig = {
    desktop: {
      label: t.dashboard.assignDuty,
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <>
      <PageHeader 
        title={user?.role === 'admin' ? t.pageHeaders.dashboardAdmin.title(user?.name?.split(' ')[0] ?? '') : t.pageHeaders.dashboardEmployee.title(user?.name?.split(' ')[0] ?? '')} 
        description={user?.role === 'admin' ? t.pageHeaders.dashboardAdmin.description : t.pageHeaders.dashboardEmployee.description} 
      />

      {user?.role === 'admin' ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.totalEmployees}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.totalStrength}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.reserve}</CardTitle>
                <Anchor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reserve}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.onReserveDuty}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.outOfDistrict}</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.outOfDistrict}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.postedOutOfDistrict}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.casualLeave}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.casualLeave}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.onCasualLeave}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.earnedLeave}</CardTitle>
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.earnedLeave}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.onEarnedLeave}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.dashboard.otherLeave}</CardTitle>
                <CalendarHeart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.otherLeave}</div>
                <p className="text-xs text-muted-foreground">{t.dashboard.sicknessMaternityEtc}</p>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">{t.dashboard.rankWiseStrength}</h2>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {employeeRanks
                .filter((rank) => rank !== 'Administrator')
                .map((rank) => (
                  <Card key={rank}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{t.ranks[rank]}</CardTitle>
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
                <CardTitle>{t.dashboard.dutyAssignmentOverview}</CardTitle>
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
                <CardTitle>{t.dashboard.quickActions}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/duty"><Button><Send className="mr-2"/>{t.dashboard.assignDuty}</Button></Link>
                <Link href="/employees"><Button variant="secondary"><Plus className="mr-2"/>{t.dashboard.addEmployee}</Button></Link>
                <Link href="/leave"><Button variant="secondary"><CalendarOff className="mr-2"/>{t.dashboard.updateLeaveDetails}</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>{t.dashboard.todaysDuty}</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeDuty ? (
                    <div>
                        <p className="text-lg font-semibold">{employeeDuty.location}</p>
                        <p>{t.dashboard.shift}: {t.shifts[employeeDuty.shift]}</p>
                        <p>{t.dashboard.details}: {employeeDuty.details}</p>
                    </div>
                ) : (
                    <p>{t.dashboard.noDutyAssigned}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.dashboard.leaveBalance}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{employeeLeaveBalance} {t.dashboard.days}</div>
                <p className="text-sm text-muted-foreground">{t.dashboard.casualLeaveAvailable}</p>
              </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}

    