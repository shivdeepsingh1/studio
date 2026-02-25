"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { FileDown, PlusCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { mockDuties } from "@/lib/mock-data"
import { Duty } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"

// A mock function for PDF generation
const generatePdf = (data: any, title: string) => {
  console.log(`Generating PDF for ${title}:`, data)
  alert(`PDF for "${title}" would be generated. Check console for data.`)
}

export default function DutyPage() {
  const { role, user } = useAuth()
  const [duties, setDuties] = useState<Duty[]>(mockDuties)
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleExport = () => {
    generatePdf(duties, "Duty Roster")
  }
  
  const employeeDuties = duties.filter(d => d.employeeId === user?.id);

  return (
    <>
      <PageHeader
        title="Duty Roster"
        description={
          role === "admin"
            ? "Assign and manage daily duties for all employees."
            : "View your upcoming and past duty assignments."
        }
      >
        {role === "admin" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Assign Duty
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Duty</DialogTitle>
                <DialogDescription>
                  Fill in the details to assign a new duty. This is a placeholder form.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>Duty assignment form would be here.</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>
      
      {role === "admin" ? (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Duty List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PNO</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell>{mockDuties.find(e => e.id === duty.employeeId)?.employeeId}</TableCell>
                      <TableCell>{duty.employeeName}</TableCell>
                      <TableCell>{duty.date}</TableCell>
                      <TableCell><Badge variant={duty.shift === 'Night' ? 'destructive' : 'secondary'}>{duty.shift}</Badge></TableCell>
                      <TableCell>{duty.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
           <TabsContent value="calendar">
            <div className="flex justify-center p-4 border rounded-lg bg-card">
               <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeDuties.map((duty) => (
                <TableRow key={duty.id}>
                  <TableCell>{duty.date}</TableCell>
                  <TableCell><Badge variant={duty.shift === 'Night' ? 'destructive' : 'secondary'}>{duty.shift}</Badge></TableCell>
                  <TableCell>{duty.location}</TableCell>
                  <TableCell>{duty.details}</TableCell>
                </TableRow>
              ))}
              {employeeDuties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No duties assigned.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
