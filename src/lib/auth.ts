"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Employee } from './types';
import { mockEmployees } from './mock-data';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'employee' | null;
  login: (pno: string, password: string, role: 'admin' | 'employee') => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('line-command-user');
      const storedRole = localStorage.getItem('line-command-role') as 'admin' | 'employee' | null;
      if (storedUser && storedRole) {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      // Clear corrupted data
      localStorage.removeItem('line-command-user');
      localStorage.removeItem('line-command-role');
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback((pno: string, password: string, role: 'admin' | 'employee'): boolean => {
    if (role === 'admin') {
      if (pno === 'ADMIN' && password === 'admin') {
        const adminUser = {
          id: 'admin01', pno: 'ADMIN', name: 'Admin User', rank: 'Administrator',
          avatarUrl: 'https://picsum.photos/seed/admin/100/100', email: 'admin@police.gov'
        };
        setUser(adminUser);
        setRole('admin');
        localStorage.setItem('line-command-user', JSON.stringify(adminUser));
        localStorage.setItem('line-command-role', 'admin');
        return true;
      }
      return false;
    }

    // Employee Login
    let employees: Employee[] = [];
    const storedEmployees = localStorage.getItem("line-command-employees");
    try {
        employees = storedEmployees ? JSON.parse(storedEmployees) : mockEmployees;
    } catch (e) {
        employees = mockEmployees;
    }

    const employee = employees.find(emp => emp.pno === pno);
    if (!employee) {
        return false;
    }
    
    // Determine the correct password.
    // The password can be explicitly set on the employee record.
    let hasExplicitPassword = employee.password && employee.password.length > 0;
    let correctPassword = employee.password;

    // If there's no explicit password, fall back to the DOB-based default.
    if (!hasExplicitPassword) {
        if (employee.dob && typeof employee.dob === 'string' && employee.dob.includes('-')) {
            const parts = employee.dob.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                correctPassword = `${day}${month}${year}`;
            }
        }
    }
    
    // Now, compare the provided password with the determined correct password.
    if (correctPassword && password === correctPassword) {
      const employeeUser = {
          id: employee.id,
          pno: employee.pno,
          name: employee.name,
          rank: employee.rank,
          avatarUrl: employee.avatarUrl,
          email: `${employee.pno}@police.gov`
      };
      setUser(employeeUser);
      setRole('employee');
      localStorage.setItem('line-command-user', JSON.stringify(employeeUser));
      localStorage.setItem('line-command-role', 'employee');
      return true;
    }

    // If we've reached here, the login has failed.
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('line-command-user');
    localStorage.removeItem('line-command-role');
  }, []);

  const value = { user, role, login, logout, loading };

  return React.createElement(AuthContext.Provider, { value: value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
