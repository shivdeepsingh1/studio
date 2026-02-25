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
import { mockLeaves } from "@/lib/mock-data"
import { Leave } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// A mock function for PDF generation
const generatePdf = (data: any, title: string) => {
  console.log(`Generating PDF for ${title}:`, data)
  alert(`PDF for "${title}" would be generated. Check console for data.`)
}

export default function LeavePage() {
  const { role, user } = useAuth()
  const [leaves, setLeaves] = useState<Leave[]>(mockLeaves)

  const handleExport = () => {
    generatePdf(leaves, "Leave Records")
  }

  const employeeLeaves = leaves.filter((l) => l.employeeId === user?.id)

  const getStatusBadgeVariant = (status: Leave["status"]) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Pending":
        return "secondary"
      case "Rejected":
        return "destructive"
    }
  }

  return (
    <>
      <PageHeader
        title="Leave Management"
        description={
          role === "admin"
            ? "Update and manage employee leave details."
            : "View your leave status and history."
        }
      >
        {role === "admin" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Update Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Leave Details</DialogTitle>
                <DialogDescription>
                  Select an employee and update their leave status. This is a placeholder.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>Leave update form would be here.</p>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="mr-2" />
          Export PDF
        </Button>
      </PageHeader>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {role === "admin" && <TableHead>Employee Name</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(role === 'admin' ? leaves : employeeLeaves).map((leave) => (
              <TableRow key={leave.id}>
                {role === "admin" && <TableCell>{leave.employeeName}</TableCell>}
                <TableCell>{leave.type}</TableCell>
                <TableCell>{leave.startDate}</TableCell>
                <TableCell>{leave.endDate}</TableCell>
                <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(leave.status)}
                    className={cn(leave.status === 'Approved' && 'bg-green-500 hover:bg-green-600')}
                  >
                    {leave.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
             {(role === 'employee' && employeeLeaves.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No leave records found.</TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
