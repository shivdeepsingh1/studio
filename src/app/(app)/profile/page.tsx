"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Pencil } from "lucide-react"
import { mockEmployees } from "@/lib/mock-data"
import { Employee } from "@/lib/types"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);

  useEffect(() => {
    if (user) {
      const storedEmployees = localStorage.getItem("line-command-employees");
      const employees: Employee[] = storedEmployees ? JSON.parse(storedEmployees) : mockEmployees;
      const details = employees.find((e: Employee) => e.id === user.id);
      if (details) {
        setEmployeeDetails(details);
      }
    }
  }, [user]);

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
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{employeeDetails?.dob ? format(new Date(employeeDetails.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{employeeDetails?.joiningDate ? format(new Date(employeeDetails.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Joining Branch/District</p>
                    <p className="font-medium">{employeeDetails?.joiningDistrict || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Mobile Number</p>
                    <p className="font-medium">{employeeDetails?.contact || 'N/A'}</p>
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
