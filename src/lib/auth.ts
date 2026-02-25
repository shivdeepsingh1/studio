"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Employee } from './types';
import { mockEmployees } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (pno: string, password: string) => boolean;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('line-command-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem('line-command-user');
    } finally {
        setLoading(false);
    }
  }, []);

  const updateUser = (updatedUserData: User) => {
    setUser(updatedUserData);
    localStorage.setItem('line-command-user', JSON.stringify(updatedUserData));
  };

  const login = (pno: string, password: string): boolean => {
    // 1. Admin special case login
    if (pno === 'ADMIN' && password === 'admin') {
      const adminUser: User = {
        id: '0',
        pno: 'ADMIN',
        name: 'Chief Administrator',
        rank: 'Administrator',
        avatarUrl: 'https://picsum.photos/seed/admin/100/100',
        email: 'admin@police.gov',
        role: 'admin'
      };
      setUser(adminUser);
      localStorage.setItem('line-command-user', JSON.stringify(adminUser));
      return true;
    }

    // 2. Load employees from storage
    let employees: Employee[] = [];
    const storedEmployees = localStorage.getItem("line-command-employees");
    try {
        employees = storedEmployees ? JSON.parse(storedEmployees) : mockEmployees;
    } catch (e) {
        console.error("Failed to parse employees from localStorage", e);
        employees = mockEmployees;
    }
    
    // 3. Find the employee
    const employee = employees.find(emp => emp.pno === pno);
    if (!employee) {
        return false;
    }

    // 4. Determine the correct password
    // The employee record has an explicit password set (and it's not an empty string).
    const hasExplicitPassword = employee.password && employee.password.length > 0;
    
    let correctPassword;
    if (hasExplicitPassword) {
        correctPassword = employee.password;
    } else {
        // No explicit password, so use DOB as default.
        if (employee.dob && typeof employee.dob === 'string' && employee.dob.includes('-')) {
            const [year, month, day] = employee.dob.split('-');
            correctPassword = `${day}${month}${year}`;
        }
    }

    // 5. Check if passwords match
    if (correctPassword && password === correctPassword) {
      const employeeUser: User = {
          id: employee.id,
          pno: employee.pno,
          name: employee.name,
          rank: employee.rank,
          avatarUrl: employee.avatarUrl,
          email: `${employee.pno}@police.gov`,
          role: employee.role || 'employee'
      };
      setUser(employeeUser);
      localStorage.setItem('line-command-user', JSON.stringify(employeeUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('line-command-user');
  };

  const value = { user, login, logout, loading, updateUser };

  return React.createElement(AuthContext.Provider, { value: value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
