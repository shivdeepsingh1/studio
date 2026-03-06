
export interface User {
  id: string;
  pno: string;
  name: string;
  rank: EmployeeRank;
  avatarUrl: string;
  email: string;
  role: 'admin' | 'employee';
  status?: 'Active' | 'Suspended' | 'Transferred';
}

export type EmployeeRank =
  | "Administrator"
  | "Inspector"
  | "Lady Inspector"
  | "Sub Inspector"
  | "Lady Sub Inspector"
  | "Head Constable"
  | "Lady Head Constable"
  | "Constable"
  | "Lady Constable"
  | "Computer Operator"
  | "Fourth Class"
  | "Other";

export const employeeRanks: EmployeeRank[] = [
  "Administrator",
  "Inspector",
  "Lady Inspector",
  "Sub Inspector",
  "Lady Sub Inspector",
  "Head Constable",
  "Lady Head Constable",
  "Constable",
  "Lady Constable",
  "Computer Operator",
  "Fourth Class",
  "Other",
];

export interface Employee {
  id: string;
  badgeNumber: string;
  pno: string;
  name: string;
  rank: EmployeeRank;
  dob: string;
  contact: string;
  joiningDate: string;
  joiningDistrict: string;
  avatarUrl: string;
  password?: string;
  role: 'admin' | 'employee';
  status: 'Active' | 'Suspended' | 'Transferred';
  suspensionDate?: string;
  suspensionLetterNumber?: string;
  transferDate?: string;
  transferLocation?: string;
  restorationLetterNumber?: string;
  restorationDate?: string;
}

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Absent' | 'Medical' | 'CCL' | 'Other';
export type LeaveStatus = 'Approved' | 'Pending' | 'Rejected';

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

export const leaveTypes: LeaveType[] = ["Casual", "Earned", "CCL", "Medical", "Sick", "Other"];

export const leaveStatuses: LeaveStatus[] = ["Pending", "Approved", "Rejected"];

export interface Duty {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  location: string;
  details: string;
  status?: 'Active' | 'Completed';
}
