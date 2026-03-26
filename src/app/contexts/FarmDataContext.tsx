import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  zones as initialZones, 
  devices as initialDevices, 
  schedules as initialSchedules, 
  thresholds as initialThresholds, 
  alerts as initialAlerts, 
  activityLogs as initialActivityLogs,
  type Zone,
  type Device,
  type Schedule,
  type Threshold,
  type Alert,
  type ActivityLog
} from '../data/farmData';

interface FarmDataContextType {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  thresholds: Threshold[];
  setThresholds: React.Dispatch<React.SetStateAction<Threshold[]>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  activityLogs: ActivityLog[];
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
}

const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

export function FarmDataProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [thresholds, setThresholds] = useState<Threshold[]>(initialThresholds);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);

  return (
    <FarmDataContext.Provider value={{
      zones, setZones,
      devices, setDevices,
      schedules, setSchedules,
      thresholds, setThresholds,
      alerts, setAlerts,
      activityLogs, setActivityLogs
    }}>
      {children}
    </FarmDataContext.Provider>
  );
}

export function useFarmData() {
  const context = useContext(FarmDataContext);
  if (context === undefined) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
}
