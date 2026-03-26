import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Admin' | 'Operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  assignedZones?: string[]; // Zone IDs that this operator can manage
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  canAccessZone: (zoneId: string) => boolean; // Check if user can access a zone
  canEditZone: (zoneId: string) => boolean; // Check if user can edit in a zone
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@smartfarm.com': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'John Admin',
      email: 'admin@smartfarm.com',
      role: 'Admin',
    },
  },
  'operator@smartfarm.com': {
    password: 'operator123',
    user: {
      id: '2',
      name: 'Jane Operator',
      email: 'operator@smartfarm.com',
      role: 'Operator',
      assignedZones: ['z1', 'z3'],
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userRecord = mockUsers[email];
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const canAccessZone = (zoneId: string): boolean => {
    if (user?.role === 'Admin') return true;
    return user?.assignedZones?.includes(zoneId) || false;
  };

  const canEditZone = (zoneId: string): boolean => {
    if (user?.role === 'Admin') return true;
    return user?.assignedZones?.includes(zoneId) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        canAccessZone,
        canEditZone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}