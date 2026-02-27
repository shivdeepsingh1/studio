
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
        title: "सिस्टम व्यस्त है",
        description: "डेटा अभी भी लोड हो रहा है। कृपया कुछ क्षण बाद पुनः प्रयास करें।",
      });
      return;
    }
    
    if (!pno || !password) {
      toast({
        variant: "destructive",
        title: "जानकारी अधूरी है",
        description: "PNO और पासवर्ड आवश्यक हैं।",
      });
      return;
    }

    // Find the employee from context
    const employee = employees.find(emp => emp.pno === pno);
    if (!employee) {
        toast({
          variant: "destructive",
          title: "लॉगिन विफल",
          description: "अमान्य PNO या पासवर्ड। कृपया पुनः प्रयास करें।",
        });
        return;
    }

    // Determine the correct password
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

    // Check if passwords match
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
        title: "लॉगिन विफल",
        description: "अमान्य PNO या पासवर्ड। कृपया पुनः प्रयास करें।",
      });
    }
  };
  
  if (authLoading || dataLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold">लोड हो रहा है...</div>
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
          <CardTitle className="text-3xl font-bold tracking-tight">लाइनकमांड में आपका स्वागत है</CardTitle>
          <CardDescription>अपने खाते तक पहुंचने के लिए अपनी क्रेडेंशियल दर्ज करें</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pno">PNO (पुलिस नंबर)</Label>
            <Input id="pno" type="text" placeholder="अपना PNO दर्ज करें" value={pno} onChange={(e) => setPno(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">पासवर्ड</Label>
            <Input id="password" type="password" placeholder="अपना पासवर्ड दर्ज करें" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleLogin}>
            <User className="mr-2 h-4 w-4" /> लॉग इन करें
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
