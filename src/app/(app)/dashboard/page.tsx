
"use client";

import { Users, CalendarOff, Send, Plus, Anchor, Globe, Calendar, CalendarPlus, CalendarHeart } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';
import { employeeRanks, EmployeeRank, employeeRankTranslations } from '@/lib/types';
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
    label: 'ड्यूटियां',
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
      <PageHeader title={`नमस्ते, ${user?.name?.split(' ')[0]}!`} description={user?.role === 'admin' ? "यह आपका कमांड सेंटर ओवरव्यू है।" : "यह आपका दैनिक सारांश है।"} />

      {user?.role === 'admin' ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">कुल कर्मचारी</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">कुल संख्या</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">रिज़र्व</CardTitle>
                <Anchor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reserve}</div>
                <p className="text-xs text-muted-foreground">आज रिज़र्व ड्यूटी पर</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">जिले से बाहर ड्यूटी</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.outOfDistrict}</div>
                <p className="text-xs text-muted-foreground">जिले से बाहर तैनात</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">आकस्मिक अवकाश</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.casualLeave}</div>
                <p className="text-xs text-muted-foreground">आज आकस्मिक अवकाश पर</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">अर्जित अवकाश</CardTitle>
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.earnedLeave}</div>
                <p className="text-xs text-muted-foreground">आज अर्जित अवकाश पर</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">अन्य अवकाश</CardTitle>
                <CalendarHeart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.otherLeave}</div>
                <p className="text-xs text-muted-foreground">बीमारी, मातृत्व, आदि।</p>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">पद-अनुसार संख्या</h2>
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {employeeRanks
                .filter((rank) => rank !== 'Administrator')
                .map((rank) => (
                  <Card key={rank}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{employeeRankTranslations[rank]}</CardTitle>
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
                <CardTitle>ड्यूटी असाइनमेंट का अवलोकन</CardTitle>
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
                <CardTitle>त्वरित कार्रवाई</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Link href="/duty"><Button><Send className="mr-2"/>ड्यूटी सौंपें</Button></Link>
                <Link href="/employees"><Button variant="secondary"><Plus className="mr-2"/>नया कर्मचारी जोड़ें</Button></Link>
                <Link href="/leave"><Button variant="secondary"><CalendarOff className="mr-2"/>अवकाश विवरण अपडेट करें</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
           <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle>आज की ड्यूटी</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeDuty ? (
                    <div>
                        <p className="text-lg font-semibold">{employeeDuty.location}</p>
                        <p>शिफ्ट: {employeeDuty.shift}</p>
                        <p>विवरण: {employeeDuty.details}</p>
                    </div>
                ) : (
                    <p>आज के लिए कोई ड्यूटी नहीं सौंपी गई।</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>अवकाश शेष</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{employeeLeaveBalance} दिन</div>
                <p className="text-sm text-muted-foreground">आकस्मिक अवकाश उपलब्ध</p>
              </CardContent>
            </Card>
        </div>
      )}
    </>
  );
}
