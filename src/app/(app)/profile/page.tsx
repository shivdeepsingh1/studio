
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { font } from "@/lib/fonts/Hind-Regular";
import { useAuth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, Pencil, Eye, EyeOff, Printer } from "lucide-react"
import { Employee, User, EmployeeRank } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useData } from "@/lib/data-provider"
import { useLanguage } from "@/lib/i18n/language-provider"
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()
  const { t } = useLanguage();
  const { employees, updateEmployees } = useData();
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<User & Employee> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [adminList, setAdminList] = useState<Employee[]>([]);
  const { toast } = useToast();

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

    updateUser(editingProfile);

    const updatedEmployees = employees.map(emp => {
      if (emp.id === editingProfile.id) {
        return { ...emp, ...editingProfile } as Employee;
      }
      return emp;
    });

    updateEmployees(updatedEmployees);
    
    setIsEditDialogOpen(false);
  };
  
  const handleExportPdf = () => {
    if (!user || !employeeDetails) return;

    const doc = new jsPDF();
    if (font) {
      doc.addFileToVFS("Hind-Regular.ttf", font);
      doc.addFont("Hind-Regular.ttf", "Hind", "normal");
      doc.setFont("Hind");
    }

    doc.text(`${t.pageHeaders.profile.title} - ${user.name}`, 14, 16);

    const profileData = [
      [t.pno, user.pno],
      [t.name, user.name],
      [t.rank, t.ranks[user.rank]],
      [t.profile.emailAddress, user.email || 'N/A'],
      [t.profile.dob, employeeDetails.dob ? format(new Date(employeeDetails.dob.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'],
      [t.profile.joiningDate, employeeDetails.joiningDate ? format(new Date(employeeDetails.joiningDate.replace(/-/g, '/')), 'dd-MM-yyyy') : 'N/A'],
      [t.profile.joiningBranchDistrict, employeeDetails.joiningDistrict || 'N/A'],
      [t.profile.contactNumber, employeeDetails.contact || 'N/A'],
      [t.status, t.statusTypes[user.status || 'Active']],
    ];

    autoTable(doc, {
      startY: 22,
      head: [[t.details, '']],
      body: profileData,
      ...(font && { styles: { font: "Hind" }, headStyles: {font: "Hind"}, bodyStyles: {font: "Hind"} })
    });

    doc.save(`profile_${user.pno}.pdf`);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAvatarUrl = event.target?.result as string;
        if (newAvatarUrl && user) {
          updateUser({ avatarUrl: newAvatarUrl });
          updateEmployees(prevEmployees =>
            prevEmployees.map(emp =>
              emp.id === user.id ? { ...emp, avatarUrl: newAvatarUrl } : emp
            )
          );
          toast({
            title: t.profile.pictureUpdated,
            description: t.profile.pictureUpdatedDescription,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };


  if (!user) {
    return null
  }

  return (
    <>
      <PageHeader title={t.pageHeaders.profile.title} description={t.pageHeaders.profile.description}>
        <Button variant="outline" onClick={handleExportPdf}>
          <Printer className="mr-2" /> {t.exportPdf}
        </Button>
      </PageHeader>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
             <div className="flex items-center space-x-4">
                <div className="relative group">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                      <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                    >
                        <Pencil className="w-6 h-6" />
                        <span className="sr-only">{t.profile.changePicture}</span>
                    </label>
                    <input
                        type="file"
                        id="avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
                </div>
                <div>
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <p className="text-muted-foreground">{t.ranks[user.rank]}</p>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-auto">
                        <Pencil className="w-4 h-4"/>
                    </Button>
                  </DialogTrigger>
                   <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.profile.editProfile}</DialogTitle>
                      <DialogDescription>
                        {t.profile.editProfileDescription}
                      </DialogDescription>
                    </DialogHeader>
                    {editingProfile && (
                       <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              {t.name}
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
                              {t.profile.pnoUsername}
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
                              {t.profile.email}
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
                              {t.profile.contactNumber}
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
                              {t.profile.password}
                            </Label>
                            <div className="col-span-3 relative">
                              <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={editingProfile.password ?? ""}
                                onChange={handleEditInputChange}
                                className="pr-10"
                                placeholder={t.profile.passwordPlaceholder}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute inset-y-0 right-0 h-full w-10 flex items-center justify-center text-muted-foreground"
                                onClick={() => setShowPassword(p => !p)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                 <span className="sr-only">{t.employees.togglePasswordVisibility}</span>
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
                          {t.cancel}
                        </Button>
                        <Button onClick={handleUpdateProfile}>{t.profile.saveChanges}</Button>
                      </DialogFooter>
                   </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">{t.pno}</p>
                    <p className="font-medium">{user.pno}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">{t.profile.emailAddress}</p>
                    <p className="font-medium">{user.email}</p>
                </div>
                {employeeDetails && (
                  <>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">{t.profile.dob}</p>
                        <p className="font-medium">{employeeDetails?.dob && !isNaN(new Date(employeeDetails.dob.replace(/-/g, '/')).getTime()) ? format(new Date(employeeDetails.dob.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-muted-foreground">{t.profile.joiningDate}</p>
                        <p className="font-medium">{employeeDetails?.joiningDate && !isNaN(new Date(employeeDetails.joiningDate.replace(/-/g, '/')).getTime()) ? format(new Date(employeeDetails.joiningDate.replace(/-/g, '\/')), 'dd-MM-yyyy') : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">{t.profile.joiningBranchDistrict}</p>
                        <p className="font-medium">{employeeDetails?.joiningDistrict || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">{t.profile.contactNumber}</p>
                        <p className="font-medium">{employeeDetails?.contact || 'N/A'}</p>
                    </div>
                  </>
                )}
            </div>
             <div className="mt-8 flex justify-end">
                <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2"/>
                    {t.profile.logout}
                </Button>
            </div>
          </CardContent>
        </Card>
        
        {user.rank === 'Administrator' && adminList.length > 0 && (
          <Card className="mt-8">
              <CardHeader>
                  <CardTitle>{t.profile.otherAdmins}</CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>{t.name}</TableHead>
                              <TableHead>{t.pno}</TableHead>
                              <TableHead>{t.rank}</TableHead>
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
                                  <TableCell>{t.ranks[admin.rank]}</TableCell>
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
