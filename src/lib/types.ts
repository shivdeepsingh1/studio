
export interface User {
  id: string;
  pno: string;
  name: string;
  rank: string;
  avatarUrl: string;
  email: string;
  role: 'admin' | 'employee';
  status?: 'Active' | 'Suspended';
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
  status?: 'Active' | 'Suspended';
}

export interface Duty {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
  location: string;
  details: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Casual' | 'Sick' | 'Earned' | 'Maternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export const leaveTypes: Leave['type'][] = ["Casual", "Sick", "Earned", "Maternity"];
export const leaveStatuses: Leave['status'][] = ["Pending", "Approved", "Rejected"];
