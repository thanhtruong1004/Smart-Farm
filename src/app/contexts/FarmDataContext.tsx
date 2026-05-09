// ============================================================
//  FarmDataContext.tsx
//  Gộp chung: Adafruit IO service + React Context + Polling
//
//  ⚠️ QUAN TRỌNG: Điền 2 thông tin bên dưới trước khi chạy
// ============================================================

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react';
import {
  zones as initialZones,
  devices as initialDevices,
  schedules as initialSchedules,
  thresholds as initialThresholds,
  alerts as initialAlerts,
  activityLogs as initialActivityLogs,
  type Zone, type Device, type Schedule,
  type Threshold, type Alert, type ActivityLog,
} from '../data/farmData';
import { toast } from 'sonner';

// ============================================================
//  ✏️  ĐIỀN THÔNG TIN CỦA BẠN VÀO ĐÂY
// ============================================================
const AIO_USERNAME = "xamnhach";               // username Adafruit
const AIO_KEY      = "aio_ybHl30sJ7mXIJIva1XZ0abwSelJ4";   // lấy tại io.adafruit.com → nút vàng "My Key"

// Feed keys — phải khớp với tên feed trên Adafruit IO
const FEEDS = {
  temperature:  "sensor1",    // Nhiệt độ
  humidity:     "sensor2",    // Độ ẩm không khí
  soilMoisture: "sensor3",    // Độ ẩm đất
  light:        "sensor4",    // Ánh sáng
  pumpControl:  "button1",    // Máy bơm  (ghi "1"=BẬT / "0"=TẮT)
  relay:        "button2",    // Relay     (ghi "1"=BẬT / "0"=TẮT)
  colorRgb:     "color-rgb",  // Đèn RGB   (ghi "#RRGGBB")
} as const;

// ============================================================
//  Adafruit IO API (gọi qua proxy /api/adafruit → vite.config)
// ============================================================
const BASE = `https://io.adafruit.com/api/v2/xamnhach`;

async function aioFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "X-AIO-Key": AIO_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Adafruit lỗi [${res.status}]: ${txt}`);
  }
  return res.json();
}

/** Lấy giá trị mới nhất của một feed */
async function getFeedValue(feedKey: string): Promise<string> {
  const d = await aioFetch(`/feeds/${feedKey}/data/last`);
  return d.value ?? "0";
}

/** Lấy lịch sử feed để vẽ biểu đồ */
async function getFeedHistory(feedKey: string, limit = 48) {
  const data: { value: string; created_at: string }[] =
    await aioFetch(`/feeds/${feedKey}/data?limit=${limit}&order=asc`);
  return data.map(d => ({
    time: new Date(d.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: parseFloat(d.value) || 0,
  }));
}

/** Đọc tất cả sensor cùng lúc */
async function getAllSensorData(): Promise<SensorData> {
  const [temp, hum, soil, light, pump, relay, rgb] = await Promise.all([
    getFeedValue(FEEDS.temperature),
    getFeedValue(FEEDS.humidity),
    getFeedValue(FEEDS.soilMoisture),
    getFeedValue(FEEDS.light),
    getFeedValue(FEEDS.pumpControl),
    getFeedValue(FEEDS.relay),
    getFeedValue(FEEDS.colorRgb),
  ]);
  return {
    temperature:  parseFloat(temp)  || 0,
    humidity:     parseFloat(hum)   || 0,
    soilMoisture: parseFloat(soil)  || 0,
    light:        parseFloat(light) || 0,
    pumpOn:  pump  === "1",
    relayOn: relay === "1",
    colorRgb: rgb || "#000000",
  };
}

/** Ghi giá trị vào feed (điều khiển thiết bị) */
async function setFeedValue(feedKey: string, value: string) {
  return aioFetch(`/feeds/${feedKey}/data`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

// ============================================================
//  Types
// ============================================================
export interface SensorData {
  temperature:  number;
  humidity:     number;
  soilMoisture: number;
  light:        number;
  pumpOn:       boolean;
  relayOn:      boolean;
  colorRgb:     string;
}

interface ChartPoint { time: string; value: number }

interface FarmDataContextType {
  // mock data (cho các màn hình CRUD khác)
  zones: Zone[];           setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  devices: Device[];       setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  schedules: Schedule[];   setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  thresholds: Threshold[]; setThresholds: React.Dispatch<React.SetStateAction<Threshold[]>>;
  alerts: Alert[];         setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  activityLogs: ActivityLog[]; setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;

  // dữ liệu thật từ Adafruit
  sensorData: SensorData;
  chartData: { temperature: ChartPoint[]; humidity: ChartPoint[]; soilMoisture: ChartPoint[]; light: ChartPoint[] };
  isLoadingAdafruit: boolean;
  adafruitError: string | null;
  lastUpdated: Date | null;

  // điều khiển thiết bị
  handleTogglePump:  (on: boolean) => Promise<void>;
  handleToggleRelay: (on: boolean) => Promise<void>;
  handleSetRgb:      (hex: string) => Promise<void>;
  refreshNow: () => void;
}

const DEFAULT_SENSOR: SensorData = {
  temperature: 0, humidity: 0, soilMoisture: 0, light: 0,
  pumpOn: false, relayOn: false, colorRgb: '#000000',
};

// ============================================================
//  Context
// ============================================================
const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

export function FarmDataProvider({ children }: { children: ReactNode }) {
  // mock data
  const [zones,        setZones]        = useState<Zone[]>(initialZones);
  const [devices,      setDevices]      = useState<Device[]>(initialDevices);
  const [schedules,    setSchedules]    = useState<Schedule[]>(initialSchedules);
  const [thresholds,   setThresholds]   = useState<Threshold[]>(initialThresholds);
  const [alerts,       setAlerts]       = useState<Alert[]>(initialAlerts);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);

  // adafruit state
  const [sensorData,        setSensorData]        = useState<SensorData>(DEFAULT_SENSOR);
  const [chartData,         setChartData]         = useState({ temperature: [] as ChartPoint[], humidity: [] as ChartPoint[], soilMoisture: [] as ChartPoint[], light: [] as ChartPoint[] });
  const [isLoadingAdafruit, setIsLoadingAdafruit] = useState(true);
  const [adafruitError,     setAdafruitError]     = useState<string | null>(null);
  const [lastUpdated,       setLastUpdated]       = useState<Date | null>(null);
  const [chartLoaded,       setChartLoaded]       = useState(false);

  // Fetch sensor mỗi 5 giây
  const fetchSensors = useCallback(async () => {
    try {
      const data = await getAllSensorData();
      setSensorData(data);
      setAdafruitError(null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setAdafruitError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsLoadingAdafruit(false);
    }
  }, []);

  // Fetch lịch sử biểu đồ 1 lần khi load
  const fetchCharts = useCallback(async () => {
    if (chartLoaded) return;
    try {
      const [t, h, s, l] = await Promise.all([
        getFeedHistory(FEEDS.temperature),
        getFeedHistory(FEEDS.humidity),
        getFeedHistory(FEEDS.soilMoisture),
        getFeedHistory(FEEDS.light),
      ]);
      setChartData({ temperature: t, humidity: h, soilMoisture: s, light: l });
      setChartLoaded(true);
    } catch (err) {
      console.error('[Chart]', err);
    }
  }, [chartLoaded]);

  useEffect(() => {
    fetchSensors();
    fetchCharts();
    const interval = setInterval(fetchSensors, 5000);
    return () => clearInterval(interval);
  }, [fetchSensors, fetchCharts]);

  // Handlers điều khiển
  const handleTogglePump = async (on: boolean) => {
    try {
      await setFeedValue(FEEDS.pumpControl, on ? "1" : "0");
      setSensorData(p => ({ ...p, pumpOn: on }));
      toast.success(`Máy bơm đã ${on ? 'BẬT ✅' : 'TẮT 🔴'}`);
    } catch { toast.error('Không thể điều khiển máy bơm'); }
  };

  const handleToggleRelay = async (on: boolean) => {
    try {
      await setFeedValue(FEEDS.relay, on ? "1" : "0");
      setSensorData(p => ({ ...p, relayOn: on }));
      toast.success(`Relay đã ${on ? 'BẬT ✅' : 'TẮT 🔴'}`);
    } catch { toast.error('Không thể điều khiển relay'); }
  };

  const handleSetRgb = async (hex: string) => {
    try {
      await setFeedValue(FEEDS.colorRgb, hex);
      setSensorData(p => ({ ...p, colorRgb: hex }));
      toast.success('Đèn RGB đã đổi màu 🎨');
    } catch { toast.error('Không thể đổi màu đèn'); }
  };

  return (
    <FarmDataContext.Provider value={{
      zones, setZones, devices, setDevices,
      schedules, setSchedules, thresholds, setThresholds,
      alerts, setAlerts, activityLogs, setActivityLogs,
      sensorData, chartData,
      isLoadingAdafruit, adafruitError, lastUpdated,
      handleTogglePump, handleToggleRelay, handleSetRgb,
      refreshNow: fetchSensors,
    }}>
      {children}
    </FarmDataContext.Provider>
  );
}

export function useFarmData() {
  const ctx = useContext(FarmDataContext);
  if (!ctx) throw new Error('useFarmData must be used within FarmDataProvider');
  return ctx;
}
