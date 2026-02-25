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
  }

  const login = useCallback((pno: string, password: string): boolean => {
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
    
    let hasExplicitPassword = employee.password && employee.password.length > 0;
    let correctPassword = employee.password;

    if (!hasExplicitPassword) {
        if (employee.dob && typeof employee.dob === 'string' && employee.dob.includes('-')) {
            const parts = employee.dob.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                correctPassword = `${day}${month}${year}`;
            }
        }
    }
    
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
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('line-command-user');
  }, []);

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
