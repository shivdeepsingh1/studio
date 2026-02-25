"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { Shield, User } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [pno, setPno] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (role: 'admin' | 'employee') => {
    // In a real app, you'd validate credentials against a backend.
    // Here, we'll just log in a mock user.
    if (pno && password) {
      const success = login(pno, password, role);
      if (success) {
        router.push('/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid PNO or password. Please try again.",
        });
      }
    } else {
      // Handle empty fields error
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "PNO and password are required.",
      });
    }
  };

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
          <Button className="w-full bg-accent hover:bg-accent/90" onClick={() => handleLogin('admin')}>
            <Shield className="mr-2 h-4 w-4" /> Login as Admin
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleLogin('employee')}>
            <User className="mr-2 h-4 w-4" /> Login as Employee
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
