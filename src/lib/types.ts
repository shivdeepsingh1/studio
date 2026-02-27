
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

export const employeeRankTranslations: Record<EmployeeRank, string> = {
    "Administrator": "प्रशासक",
    "Inspector": "इंस्पेक्टर",
    "Lady Inspector": "महिला इंस्पेक्टर",
    "Sub Inspector": "सब इंस्पेक्टर",
    "Lady Sub Inspector": "महिला सब इंस्पेक्टर",
    "Head Constable": "हेड कांस्टेबल",
    "Lady Head Constable": "महिला हेड कांस्टेबल",
    "Constable": "कांस्टेबल",
    "Lady Constable": "महिला कांस्टेबल",
    "Computer Operator": "कंप्यूटर ऑपरेटर",
    "Fourth Class": "चतुर्थ श्रेणी",
    "Other": "अन्य"
};


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

export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Absent';
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

export const leaveTypes: LeaveType[] = ["Casual", "Sick", "Earned", "Maternity", "Absent"];
export const leaveTypeTranslations: Record<LeaveType, string> = {
    "Casual": "आकस्मिक",
    "Sick": "बीमारी",
    "Earned": "अर्जित",
    "Maternity": "मातृत्व",
    "Absent": "अनुपस्थित"
};


export const leaveStatuses: LeaveStatus[] = ["Pending", "Approved", "Rejected"];
export const leaveStatusTranslations: Record<LeaveStatus, string> = {
    "Pending": "लंबित",
    "Approved": "स्वीकृत",
    "Rejected": "अस्वीकृत"
};
