import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type UserRole = 'admin'| 'operator'| 'viewer';

export interface User {
  user_id: string;
  user_name: string;
  email: string;
  user_type: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, user_name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loadUserZones: () => Promise<number[]>;
  canAccessZone: (zoneId: number | string) => Promise<boolean>;
  canEditZone: (zoneId: number | string) => Promise<boolean>;
  userAccessibleZones: number[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = 'http://localhost:5001/api';

// Mock users
// const mockUsers: Record<string, { password: string; user: User }> = {
//   'admin@smartfarm.com': {
//     password: 'admin123',
//     user: {
//       id: '1',
//       name: 'John Admin',
//       email: 'admin@smartfarm.com',
//       role: 'Admin',
//     },
//   },
//   'operator@smartfarm.com': {
//     password: 'operator123',
//     user: {
//       id: '2',
//       name: 'Jane Operator',
//       email: 'operator@smartfarm.com',
//       role: 'Operator',
//       assignedZones: ['z1', 'z3'],
//     },
//   },
// };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userAccessibleZones, setUserAccessibleZones] = useState<number[]>([]);

  // Load token từ localStorage khi component mount
  useEffect (() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Load zones for operator
      if (parsedUser.user_type === 'operator') {
        loadOperatorZones(savedToken, parsedUser.user_id);
      }
    }
  }, [] );

  const loadOperatorZones = async (token: string, userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/permissions/operators/${userId}/zones`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (response.ok) {
        const zones = await response.json();
        const zoneIds = zones.map((z: any) => z.zone_id);
        setUserAccessibleZones(zoneIds);
      }
    } catch (error) {
      console.error('Failed to load operator zones:', error);
    }
  };

  const loadUserZones = async (): Promise<number[]> => {
    if (!token || !user) return [];
    
    if (user.user_type === 'admin') {
      // Admin can access all zones
      try {
        const response = await fetch(`${API_BASE_URL}/zones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const zones = await response.json();
          const zoneIds = zones.map((z: any) => z.zone_id);
          setUserAccessibleZones(zoneIds);
          return zoneIds;
        }
      } catch (error) {
        console.error('Failed to load zones:', error);
      }
    } else if (user.user_type === 'operator') {
      // Load operator's assigned zones
      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/operators/${user.user_id}/zones`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        if (response.ok) {
          const zones = await response.json();
          const zoneIds = zones.map((z: any) => z.zone_id);
          setUserAccessibleZones(zoneIds);
          return zoneIds;
        }
      } catch (error) {
        console.error('Failed to load operator zones:', error);
      }
    }
    
    return [];
  };

  const canAccessZone = async (zoneId: number | string): Promise<boolean> => {
    if (!user || !token) return false;
    
    // Admin can access all zones
    if (user.user_type === 'admin') return true;
    
    // Viewer can access all zones (read-only)
    if (user.user_type === 'viewer') return true;
    
    // Operator can only access assigned zones
    if (user.user_type === 'operator') {
      const numZoneId = typeof zoneId === 'string' ? parseInt(zoneId) : zoneId;
      if (userAccessibleZones.includes(numZoneId)) return true;
      
      // If not cached, check with API
      try {
        const response = await fetch(
          `${API_BASE_URL}/zones/${zoneId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        return response.ok;
      } catch (error) {
        console.error('Failed to check zone access:', error);
        return false;
      }
    }
    
    return false;
  };

  const canEditZone = async (zoneId: number | string): Promise<boolean> => {
    if (!user || !token) return false;
    
    // Only admin and assigned operators can edit zones
    if (user.user_type === 'admin') return true;
    
    if (user.user_type === 'operator') {
      const numZoneId = typeof zoneId === 'string' ? parseInt(zoneId) : zoneId;
      return userAccessibleZones.includes(numZoneId);
    }
    
    return false;
  };

  
  const login = async (email: string, password: string): Promise<boolean> => {
    try{
      const response = await fetch(
        `${API_BASE_URL}/auth/login` , {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'}, 
          body: JSON.stringify({email,password}),
        }
      );

      const data = await response.json(); 
      if (!response.ok){return false;}

      // 1. Save in state of React
      setToken(data.token); 
      setUser(data.user);
      // 2. Save in Browser 
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Load zones for operator
      if (data.user.user_type === 'operator') {
        await loadOperatorZones(data.token, data.user.user_id);
      }

      return true;
    }
    catch (error){
      console.error('ERROR LOGIN'); 
      return false; 
    }
    
  };

  const register = async (email: string, user_name:string, password:string): Promise<boolean> => {
    try {
      const response = await fetch (`${API_BASE_URL}/auth/register`, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({email, user_name, password, user_type: 'operator'}),

      });

      const data = await response.json(); 
      if (!response.ok){
        console.error('Register failed:', data.error);
        return false; 
      }

      return await login (email, password); 

    }
    catch (error){
      console.error('Register error', error);
      return false;
    }
  }

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserAccessibleZones([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };


  return (
    <AuthContext.Provider
      value = {{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        loadUserZones,
        canAccessZone,
        canEditZone,
        userAccessibleZones,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}