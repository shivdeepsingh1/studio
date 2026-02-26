
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { useData } from '@/lib/data-provider';

export interface AuthContextType {
  user: User | null;
  login: (pno: string, password: string) => boolean;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { employees, loading: dataLoading } = useData();

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

  const updateUser = useCallback((updatedUserData: User) => {
    setUser(updatedUserData);
    localStorage.setItem('line-command-user', JSON.stringify(updatedUserData));
  }, []);

  const login = useCallback((pno: string, password: string): boolean => {
    if (dataLoading) return false;

    // 1. Admin special case login
    if (pno === 'ADMIN' && password === 'admin') {
      const adminUser: User = {
        id: '0',
        pno: 'ADMIN',
        name: 'Chief Administrator',
        rank: 'Administrator',
        avatarUrl: 'https://picsum.photos/seed/admin/100/100',
        email: 'admin@police.gov',
        role: 'admin',
        status: 'Active',
      };
      setUser(adminUser);
      localStorage.setItem('line-command-user', JSON.stringify(adminUser));
      return true;
    }

    // 2. Find the employee from context
    const employee = employees.find(emp => emp.pno === pno);
    if (!employee) {
        return false;
    }

    // 3. Determine the correct password
    const hasExplicitPassword = employee.password && employee.password.length > 0;
    
    let correctPassword;
    if (hasExplicitPassword) {
        correctPassword = employee.password;
    } else {
        if (employee.dob && typeof employee.dob === 'string' && employee.dob.includes('-')) {
            const [year, month, day] = employee.dob.split('-');
            correctPassword = `${day}${month}${year}`;
        }
    }

    // 4. Check if passwords match
    if (correctPassword && password === correctPassword) {
      const employeeUser: User = {
          id: employee.id,
          pno: employee.pno,
          name: employee.name,
          rank: employee.rank,
          avatarUrl: employee.avatarUrl,
          email: `${employee.pno}@police.gov`,
          role: employee.role || 'employee',
          status: employee.status || 'Active',
      };
      setUser(employeeUser);
      localStorage.setItem('line-command-user', JSON.stringify(employeeUser));
      return true;
    }

    return false;
  }, [employees, dataLoading]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('line-command-user');
  }, []);

  const value = useMemo(() => ({ user, login, logout, loading, updateUser }), [user, loading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
