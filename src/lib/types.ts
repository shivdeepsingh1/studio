export interface User {
  id: string;
  pno: string;
  name: string;
  rank: string;
  avatarUrl: string;
  email: string;
}

export interface Employee {
  id: string;
  pno: string;
  name: string;
  rank: 'Constable' | 'Head Constable' | 'ASI' | 'SI' | 'Inspector';
  contact: string;
  joiningDate: string;
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
