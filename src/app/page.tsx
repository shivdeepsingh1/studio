"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { Shield, User } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/data-provider';
import { User as UserType } from '@/lib/types';

export default function LoginPage() {
  const [pno, setPno] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { user, _setUser, loading: authLoading } = useAuth();
  const { employees, loading: dataLoading } = useData();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = () => {
    if (dataLoading) {
      toast({
        variant: "destructive",
        title: "System Busy",
        description: "Data is still loading. Please try again in a moment.",
      });
      return;
    }
    
    if (!pno || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "PNO and password are required.",
      });
      return;
    }

    // 1. Admin special case login
    if (pno === 'ADMIN' && password === 'admin') {
      const adminUser: UserType = {
        id: '0',
        pno: 'ADMIN',
        name: 'Chief Administrator',
        rank: 'Administrator',
        avatarUrl: 'https://picsum.photos/seed/admin/100/100',
        email: 'admin@police.gov',
        role: 'admin',
        status: 'Active',
      };
      _setUser(adminUser);
      return;
    }

    // 2. Find the employee from context
    const employee = employees.find(emp => emp.pno === pno);
    if (!employee) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid PNO or password. Please try again.",
        });
        return;
    }

    // 3. Determine the correct password
    const hasExplicitPassword = employee.password && employee.password.length > 0;
    
    let correctPassword;
    if (hasExplicitPassword) {
        correctPassword = employee.password;
    } else {
        if (employee.dob && typeof employee.dob === 'string' && employee.dob.includes('-')) {
            const [year, month, day] = employee.dob.split('-');
            correctPassword = `${day}${month}${year}`;
        }
    }

    // 4. Check if passwords match
    if (correctPassword && password === correctPassword) {
      const employeeUser: UserType = {
          id: employee.id,
          pno: employee.pno,
          name: employee.name,
          rank: employee.rank,
          avatarUrl: employee.avatarUrl,
          email: `${employee.pno}@police.gov`,
          role: employee.role || 'employee',
          status: employee.status || 'Active',
      };
      _setUser(employeeUser);
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid PNO or password. Please try again.",
      });
    }
  };
  
  if (authLoading || dataLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome to LineCommand</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pno">PNO (Police Number)</Label>
            <Input id="pno" type="text" placeholder="Enter your PNO" value={pno} onChange={(e) => setPno(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleLogin}>
            <User className="mr-2 h-4 w-4" /> Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
