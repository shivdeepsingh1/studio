export interface User {
  id: string;
  pno: string;
  name: string;
  rank: string;
  avatarUrl: string;
  email: string;
}

export type EmployeeRank =
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
  pno: string;
  name: string;
  rank: EmployeeRank;
  contact: string;
  joiningDate: string;
  joiningDistrict: string;
  avatarUrl: string;
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
