import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  isConsultant: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  user: User | null;
  children: ReactNode;
}

export function UserProvider({ user, children }: UserProviderProps) {
  const isAdmin = user?.role === 'admin';
  const isConsultant = user?.role === 'consultant';

  // console.log('UserContext - user:', user);
  // console.log('UserContext - user role:', user?.role);
  // console.log('UserContext - isAdmin:', isAdmin);
  // console.log('UserContext - isConsultant:', isConsultant);
  // console.log('UserContext - role comparison:', user?.role === 'admin');

  const value = {
    user,
    isAdmin,
    isConsultant,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
