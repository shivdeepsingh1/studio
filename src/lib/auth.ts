
"use client";

import { useContext } from 'react';
import { AuthContext } from './auth-provider';

// The AuthProvider component contains JSX and has been moved to auth-provider.tsx.
// We re-export it here to avoid breaking imports throughout the application.
export { AuthProvider } from './auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
