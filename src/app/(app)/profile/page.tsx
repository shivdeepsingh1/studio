
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Pencil, Eye, EyeOff } from "lucide-react"
import { Employee, User, employeeRankTranslations } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useData } from "@/lib/data-provider"

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()
  const { employees, updateEmployees } = useData();
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<User & Employee> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminList, setAdminList] = useState<Employee[]>([]);

  useEffect(() => {
    if (user) {
      const details = employees.find((e: Employee) => e.id === user.id);
      setEmployeeDetails(details || null);
      setEditingProfile({ ...user, ...details });
      
      if (user.rank === 'Administrator') {
        const otherAdmins = employees.filter(e => e.role === 'admin' && e.id !== user.id);
        setAdminList(otherAdmins);
      }
    }
  }, [user, employees]);

  const handleLogout = () => {
    logout()
    router.push("/")
  }
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProfile) return;
    const { id, value } = e.target;
    setEditingProfile({ ...editingProfile, [id]: value });
  };
  
  const handleUpdateProfile = () => {
    if (!editingProfile || !editingProfile.id) return;

    // Update user context
    updateUser(editingProfile);

    // Update employee list
    const updatedEmployees = employees.map(emp => {
      if (emp.id === editingProfile.id) {
        return { ...emp, ...editingProfile } as Employee;
      }
      return emp;
    });

    updateEmployees(updatedEmployees);
    
    setIsEditDialogOpen(false);
  };


  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader title="मेरी प्रोफ़ाइल" description="अपनी व्यक्तिगत जानकारी देखें और प्रबंधित करें।" />

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
                    <p className="text-muted-foreground">{user.rank in employeeRankTranslations ? employeeRankTranslations[user.rank as keyof typeof employeeRankTranslations] : user.rank}</p>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-auto">
                        <Pencil className="w-4 h-4"/>
                    </Button>
                  </DialogTrigger>
                   <DialogContent>
                    <DialogHeader>
                      <DialogTitle>प्रोफ़ाइल संपादित करें</DialogTitle>
                      <DialogDescription>
                        अपनी व्यक्तिगत जानकारी अपडेट करें।
                      </DialogDescription>
                    </DialogHeader>
                    {editingProfile && (
                       <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              नाम
                            </Label>
                            <Input
                              id="name"
                              value={editingProfile.name ?? ""}
                              onChange={handleEditInputChange}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pno" className="text-right">
                              PNO / उपयोगकर्ता नाम
                            </Label>
                            <Input
                              id="pno"
                              value={editingProfile.pno ?? ""}
                              onChange={handleEditInputChange}
                              className="col-span-3"
                            />
                          </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              ईमेल
                            </Label>
                            <Input
                              id="email"
                              value={editingProfile.email ?? ""}
                              onChange={handleEditInputChange}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contact" className="text-right">
                              मोबाइल नंबर
                            </Label>
                            <Input
                              id="contact"
                              value={editingProfile.contact ?? ""}
                              onChange={handleEditInputChange}
                              className="col-span-3"
                            />
                          </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                              पासवर्ड
                            </Label>
                            <div className="col-span-3 relative">
                              <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={editingProfile.password ?? ""}
                                onChange={handleEditInputChange}
                                className="pr-10"
                                placeholder="डिफ़ॉल्ट के लिए खाली छोड़ दें"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                                onClick={() => setShowPassword(p => !p)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                 <span className="sr-only">पासवर्ड दृश्यता टॉगल करें</span>
                              </Button>
                            </div>
                          </div>
                       </div>
                    )}
                     <DialogFooter>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          रद्द करें
                        </Button>
                        <Button onClick={handleUpdateProfile}>बदलाव सहेजें</Button>
                      </DialogFooter>
                   </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">PNO</p>
                    <p className="font-medium">{user.pno}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">ईमेल पता</p>
                    <p className="font-medium">{user.email}</p>
                </div>
                {employeeDetails && (
                  <>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">जन्म तिथि</p>
                        <p className="font-medium">{employeeDetails?.dob && !isNaN(new Date(employeeDetails.dob.replace(/-/g, '/')).getTime()) ? format(new Date(employeeDetails.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-muted-foreground">ज्वाइनिंग तिथि</p>
                        <p className="font-medium">{employeeDetails?.joiningDate && !isNaN(new Date(employeeDetails.joiningDate.replace(/-/g, '/')).getTime()) ? format(new Date(employeeDetails.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">ज्वाइनिंग शाखा/जिला</p>
                        <p className="font-medium">{employeeDetails?.joiningDistrict || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">मोबाइल नंबर</p>
                        <p className="font-medium">{employeeDetails?.contact || 'N/A'}</p>
                    </div>
                  </>
                )}
            </div>
             <div className="mt-8 flex justify-end">
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2"/>
                    लॉग आउट
                </Button>
            </div>
          </CardContent>
        </Card>
        
        {user.rank === 'Administrator' && adminList.length > 0 && (
          <Card className="mt-8">
              <CardHeader>
                  <CardTitle>अन्य प्रशासक</CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>नाम</TableHead>
                              <TableHead>PNO</TableHead>
                              <TableHead>पद</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {adminList.map(admin => (
                              <TableRow key={admin.id}>
                                  <TableCell>
                                      <div className="flex items-center gap-3">
                                          <Avatar>
                                              <AvatarImage src={admin.avatarUrl} alt={admin.name} />
                                              <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">{admin.name}</div>
                                      </div>
                                  </TableCell>
                                  <TableCell>{admin.pno}</TableCell>
                                  <TableCell>{employeeRankTranslations[admin.rank]}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
