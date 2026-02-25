"use client"

import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Pencil } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader title="My Profile" description="View and manage your personal information." />

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
             <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <p className="text-muted-foreground">{user.rank}</p>
                </div>
                <Button variant="outline" size="icon" className="ml-auto">
                    <Pencil className="w-4 h-4"/>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">PNO</p>
                    <p className="font-medium">{user.pno}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{mockEmployees.find(e => e.id === user.id)?.contact || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{mockEmployees.find(e => e.id === user.id)?.joiningDate || 'N/A'}</p>
                </div>
            </div>
             <div className="mt-8 flex justify-end">
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2"/>
                    Logout
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Simple mock find since we don't have a real DB
const mockEmployees = [
  { id: '1', pno: '12345', name: 'Ravi Kumar', rank: 'Constable', contact: '9876543210', joiningDate: '2020-01-15', avatarUrl: '...' },
  { id: '2', pno: '12346', name: 'Sita Sharma', rank: 'Head Constable', contact: '9876543211', joiningDate: '2018-05-20', avatarUrl: '...' },
  { id: '3', pno: '12347', name: 'Amit Singh', rank: 'ASI', contact: '9876543212', joiningDate: '2015-11-30', avatarUrl: '...' },
  { id: '4', pno: '12348', name: 'Priya Patel', rank: 'SI', contact: '9876543213', joiningDate: '2012-02-10', avatarUrl: '...' },
  { id: '5', pno: '12349', name: 'Vikram Rathore', rank: 'Inspector', contact: '9876543214', joiningDate: '2008-07-22', avatarUrl: '...' },
  { id: '6', pno: '12350', name: 'Anjali Gupta', rank: 'Constable', contact: '9876543215', joiningDate: '2021-08-01', avatarUrl: '...' },
];
