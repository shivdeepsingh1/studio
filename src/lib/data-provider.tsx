"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee, Duty, Leave } from './types';
import { mockEmployees, mockDuties, mockLeaves } from './mock-data';

interface DataContextType {
  employees: Employee[];
  duties: Duty[];
  leaves: Leave[];
  updateEmployees: (employees: Employee[]) => void;
  updateDuties: (duties: Duty[]) => void;
  updateLeaves: (leaves: Leave[]) => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to get data from localStorage
const getFromStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const item = localStorage.getItem(key);
    if (item) {
        try {
            return JSON.parse(item);
        } catch (e) {
            console.error(`Failed to parse ${key} from localStorage`, e);
            return fallback;
        }
    }
    return fallback;
};

// Helper function to set data to localStorage
const setInStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(key, JSON.stringify(value));
};


export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialEmployees = getFromStorage("line-command-employees", mockEmployees);
    if (initialEmployees.length === 0) {
      setInStorage("line-command-employees", mockEmployees);
      setEmployees(mockEmployees);
    } else {
      setEmployees(initialEmployees);
    }

    const initialDuties = getFromStorage("line-command-duties", mockDuties);
     if (initialDuties.length === 0) {
      setInStorage("line-command-duties", mockDuties);
      setDuties(mockDuties);
    } else {
      setDuties(initialDuties);
    }
    
    const initialLeaves = getFromStorage("line-command-leaves", mockLeaves);
    if (initialLeaves.length === 0) {
      setInStorage("line-command-leaves", mockLeaves);
      setLeaves(mockLeaves);
    } else {
      setLeaves(initialLeaves);
    }

    setLoading(false);
  }, []);

  const updateEmployees = (updatedEmployees: Employee[]) => {
    setEmployees(updatedEmployees);
    setInStorage("line-command-employees", updatedEmployees);
  };

  const updateDuties = (updatedDuties: Duty[]) => {
    setDuties(updatedDuties);
    setInStorage("line-command-duties", updatedDuties);
  };

  const updateLeaves = (updatedLeaves: Leave[]) => {
    setLeaves(updatedLeaves);
    setInStorage("line-command-leaves", updatedLeaves);
  };

  const value = { employees, duties, leaves, updateEmployees, updateDuties, updateLeaves, loading };

  return React.createElement(DataContext.Provider, { value: value }, children);
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
