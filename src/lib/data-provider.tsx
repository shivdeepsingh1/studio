"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Employee, Duty, Leave } from './types';
import { mockEmployees, mockDuties, mockLeaves } from './mock-data';

interface DataContextType {
  employees: Employee[];
  duties: Duty[];
  leaves: Leave[];
  updateEmployees: (updater: Employee[] | ((prev: Employee[]) => Employee[])) => void;
  updateDuties: (updater: Duty[] | ((prev: Duty[]) => Duty[])) => void;
  updateLeaves: (updater: Leave[] | ((prev: Leave[]) => Leave[])) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getFromStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return fallback;
    }
};

const setInStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to set ${key} in localStorage`, e);
    }
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEmployees(getFromStorage("line-command-employees", mockEmployees));
    setDuties(getFromStorage("line-command-duties", mockDuties));
    setLeaves(getFromStorage("line-command-leaves", mockLeaves));
    setLoading(false);
  }, []);

  const updateEmployees = useCallback((updater: Employee[] | ((prev: Employee[]) => Employee[])) => {
    setEmployees(prev => {
        const newData = typeof updater === 'function' ? updater(prev) : updater;
        setInStorage("line-command-employees", newData);
        return newData;
    });
  }, []);

  const updateDuties = useCallback((updater: Duty[] | ((prev: Duty[]) => Duty[])) => {
    setDuties(prev => {
        const newData = typeof updater === 'function' ? updater(prev) : updater;
        setInStorage("line-command-duties", newData);
        return newData;
    });
  }, []);

  const updateLeaves = useCallback((updater: Leave[] | ((prev: Leave[]) => Leave[])) => {
    setLeaves(prev => {
        const newData = typeof updater === 'function' ? updater(prev) : updater;
        setInStorage("line-command-leaves", newData);
        return newData;
    });
  }, []);


  const value = useMemo(() => ({
      employees,
      duties,
      leaves,
      updateEmployees,
      updateDuties,
      updateLeaves,
      loading
  }), [employees, duties, leaves, loading, updateEmployees, updateDuties, updateLeaves]);

  return (
    <DataContext.Provider value={value}>
        {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
