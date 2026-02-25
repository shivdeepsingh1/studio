import { Employee, Duty, Leave } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getRandomAvatar = () => {
    const avatars = PlaceHolderImages.filter(img => img.id.startsWith('avatar'));
    return avatars[Math.floor(Math.random() * avatars.length)].imageUrl;
}


export const mockEmployees: Employee[] = [
  { id: '1', badgeNumber: 'B12345', pno: '12345', name: 'Ravi Kumar', rank: 'Constable', contact: '9876543210', joiningDate: '2020-01-15', joiningDistrict: 'North District', avatarUrl: getRandomAvatar(), password: 'password' },
  { id: '2', badgeNumber: 'B12346', pno: '12346', name: 'Sita Sharma', rank: 'Lady Head Constable', contact: '9876543211', joiningDate: '2018-05-20', joiningDistrict: 'South District', avatarUrl: getRandomAvatar(), password: 'password' },
  { id: '3', badgeNumber: 'B12347', pno: '12347', name: 'Amit Singh', rank: 'Sub Inspector', contact: '9876543212', joiningDate: '2015-11-30', joiningDistrict: 'West District', avatarUrl: getRandomAvatar(), password: 'password' },
  { id: '4', badgeNumber: 'B12348', pno: '12348', name: 'Priya Patel', rank: 'Lady Sub Inspector', contact: '9876543213', joiningDate: '2012-02-10', joiningDistrict: 'East District', avatarUrl: getRandomAvatar(), password: 'password' },
  { id: '5', badgeNumber: 'B12349', pno: '12349', name: 'Vikram Rathore', rank: 'Inspector', contact: '9876543214', joiningDate: '2008-07-22', joiningDistrict: 'Central District', avatarUrl: getRandomAvatar(), password: 'password' },
  { id: '6', badgeNumber: 'B12350', pno: '12350', name: 'Anjali Gupta', rank: 'Lady Constable', contact: '9876543215', joiningDate: '2021-08-01', joiningDistrict: 'North District', avatarUrl: getRandomAvatar(), password: 'password' },
];

export const mockDuties: Duty[] = [
  { id: '1', employeeId: '1', employeeName: 'Ravi Kumar', date: '2024-07-28', shift: 'Morning', location: 'City Center', details: 'Patrol duty' },
  { id: '2', employeeId: '2', employeeName: 'Sita Sharma', date: '2024-07-28', shift: 'Night', location: 'Control Room', details: 'Monitoring CCTV' },
  { id: '3', employeeId: '3', employeeName: 'Amit Singh', date: '2024-07-29', shift: 'Afternoon', location: 'South Gate', details: 'Security check' },
  { id: '4', employeeId: '1', employeeName: 'Ravi Kumar', date: '2024-07-29', shift: 'Morning', location: 'Main Market', details: 'Traffic control' },
];

export const mockLeaves: Leave[] = [
    { id: '1', employeeId: '4', employeeName: 'Priya Patel', type: 'Casual', startDate: '2024-08-05', endDate: '2024-08-07', reason: 'Family function', status: 'Approved' },
    { id: '2', employeeId: '5', employeeName: 'Vikram Rathore', type: 'Sick', startDate: '2024-07-20', endDate: '2024-07-21', reason: 'Fever', status: 'Approved' },
    { id: '3', employeeId: '1', employeeName: 'Ravi Kumar', type: 'Earned', startDate: '2024-09-01', endDate: '2024-09-10', reason: 'Vacation', status: 'Pending' },
];
