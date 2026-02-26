"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
  _setUser: (user: User | null) => void; // internal setter for login page
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const _setUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
        localStorage.setItem('line-command-user', JSON.stringify(newUser));
    } else {
        localStorage.removeItem('line-command-user');
    }
  }, []);


  const updateUser = useCallback((updatedUserData: User) => {
    setUser(updatedUserData);
    localStorage.setItem('line-command-user', JSON.stringify(updatedUserData));
  }, []);


  const logout = useCallback(() => {
    _setUser(null);
  }, [_setUser]);

  const value = useMemo(() => ({ user, logout, loading, updateUser, _setUser }), [user, loading, logout, updateUser, _setUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
