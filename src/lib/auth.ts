"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from './types';
import { mockEmployees } from './mock-data';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'employee' | null;
  login: (pno: string, role: 'admin' | 'employee') => void;
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

  const login = useCallback((pno: string, role: 'admin' | 'employee') => {
    // This is a mock login. In a real app, you'd fetch user data.
    // For admin, we create a generic admin user.
    // For employee, we find them in the mock data.
    let foundUser: User | null = null;
    
    if (role === 'admin') {
      foundUser = {
        id: 'admin01',
        pno: 'ADMIN',
        name: 'Admin User',
        rank: 'Administrator',
        avatarUrl: 'https://picsum.photos/seed/admin/100/100',
        email: 'admin@police.gov'
      };
    } else {
        const employee = mockEmployees.find(emp => emp.pno === pno);
        if(employee) {
            foundUser = {
                id: employee.id,
                pno: employee.pno,
                name: employee.name,
                rank: employee.rank,
                avatarUrl: employee.avatarUrl,
                email: `${employee.pno}@police.gov`
            }
        }
    }
    
    if (foundUser) {
        setUser(foundUser);
        setRole(role);
        localStorage.setItem('line-command-user', JSON.stringify(foundUser));
        localStorage.setItem('line-command-role', role);
    } else {
        // Handle failed login
        console.error("Login failed: User not found");
    }
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
