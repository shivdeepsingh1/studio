"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Employee, Duty, Leave } from './types';
import { mockEmployees, mockDuties, mockLeaves } from './mock-data';

interface DataContextType {
  employees: Employee[];
  duties: Duty[];
  leaves: Leave[];
  updateEmployees: (updater: (prev: Employee[]) => Employee[]) => void;
  updateDuties: (updater: (prev: Duty[]) => Duty[]) => void;
  updateLeaves: (updater: (prev: Leave[]) => Leave[]) => void;
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
    const initialEmployees = getFromStorage("line-command-employees", mockEmployees);
    setEmployees(initialEmployees);
    if (localStorage.getItem("line-command-employees") === null) {
      setInStorage("line-command-employees", mockEmployees);
    }

    const initialDuties = getFromStorage("line-command-duties", mockDuties);
    setDuties(initialDuties);
    if (localStorage.getItem("line-command-duties") === null) {
      setInStorage("line-command-duties", mockDuties);
    }
    
    const initialLeaves = getFromStorage("line-command-leaves", mockLeaves);
    setLeaves(initialLeaves);
    if (localStorage.getItem("line-command-leaves") === null) {
      setInStorage("line-command-leaves", mockLeaves);
    }

    setLoading(false);
  }, []);

  const updateEmployees = useCallback((updater: (prev: Employee[]) => Employee[]) => {
    setEmployees(prev => {
        const newState = updater(prev);
        setInStorage("line-command-employees", newState);
        return newState;
    });
  }, []);

  const updateDuties = useCallback((updater: (prev: Duty[]) => Duty[]) => {
    setDuties(prev => {
        const newState = updater(prev);
        setInStorage("line-command-duties", newState);
        return newState;
    });
  }, []);

  const updateLeaves = useCallback((updater: (prev: Leave[]) => Leave[]) => {
    setLeaves(prev => {
        const newState = updater(prev);
        setInStorage("line-command-leaves", newState);
        return newState;
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
