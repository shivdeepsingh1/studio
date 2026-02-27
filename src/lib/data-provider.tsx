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
    const newEmployees = typeof updater === 'function' ? updater(employees) : updater;
    setInStorage('line-command-employees', newEmployees);
    setEmployees(newEmployees);
  }, [employees]);

  const updateDuties = useCallback((updater: Duty[] | ((prev: Duty[]) => Duty[])) => {
    const newDuties = typeof updater === 'function' ? updater(duties) : updater;
    setInStorage('line-command-duties', newDuties);
    setDuties(newDuties);
  }, [duties]);

  const updateLeaves = useCallback((updater: Leave[] | ((prev: Leave[]) => Leave[])) => {
    const newLeaves = typeof updater === 'function' ? updater(leaves) : updater;
    setInStorage('line-command-leaves', newLeaves);
    setLeaves(newLeaves);
  }, [leaves]);


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
