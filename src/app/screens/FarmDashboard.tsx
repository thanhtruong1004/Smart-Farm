import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { generateHistoricalData } from '../data/farmData';
import { MapPin, Cpu, AlertTriangle, Thermometer, Droplets, Sprout, Sun } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFarmData } from '../contexts/FarmDataContext';

export default function FarmDashboard() {
  const { user, canAccessZone } = useAuth();
  const { zones, devices, alerts } = useFarmData();
  const [selectedZone, setSelectedZone] = useState('all');

  // Filter zones based on user permissions
  const visibleZones = user?.role === 'Admin' 
    ? zones 
    : zones.filter(zone => canAccessZone(zone.id));

  const filteredZones = selectedZone === 'all' 
    ? visibleZones 
    : visibleZones.filter(z => z.id === selectedZone);
  
  const activeZones = filteredZones.filter((z) => z.status === 'Active').length;
  const warningZones = filteredZones.filter((z) => z.status === 'Warning').length;
  
  const visibleDevices = user?.role === 'Admin'
    ? devices
    : devices.filter(device => canAccessZone(device.zoneId));
    
  const zoneDevices = selectedZone === 'all' 
    ? visibleDevices 
    : visibleDevices.filter(d => d.zoneId === selectedZone);
  const onlineDevices = zoneDevices.filter((d) => d.status === 'Online').length;
  
  const visibleAlerts = user?.role === 'Admin'
    ? alerts
    : alerts.filter(alert => canAccessZone(alert.zoneId));
    
  const zoneAlerts = selectedZone === 'all'
    ? visibleAlerts
    : visibleAlerts.filter(a => a.zoneId === selectedZone);
  const unacknowledgedAlerts = zoneAlerts.filter((a) => !a.acknowledged).length;

  const temperatureData = generateHistoricalData('temperature', 24);
  const humidityData = generateHistoricalData('humidity', 24);
  const soilMoistureData = generateHistoricalData('soilMoisture', 24);
  const lightData = generateHistoricalData('light', 24);

  const avgTemp = (filteredZones.reduce((sum, z) => sum + z.temperature, 0) / filteredZones.length).toFixed(1);
  const avgHumidity = (filteredZones.reduce((sum, z) => sum + z.humidity, 0) / filteredZones.length).toFixed(0);
  const avgSoil = (filteredZones.reduce((sum, z) => sum + z.soilMoisture, 0) / filteredZones.length).toFixed(0);
  const avgLight = (filteredZones.reduce((sum, z) => sum + z.light, 0) / filteredZones.length).toFixed(0);

  return (
    <div className="space-y-8">
      {/* Zone Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Xem thống kê cho:</label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-64 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khu vực</SelectItem>
                {visibleZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">Khu vực hoạt động</p>
                <p className="text-3xl font-bold">{activeZones}</p>
                {warningZones > 0 && (
                  <p className="text-xs text-orange-600 mt-2">{warningZones} cảnh báo</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">Thiết bị trực tuyến</p>
                <p className="text-3xl font-bold">{onlineDevices}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">của {zoneDevices.length} tổng cộng</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">Cảnh báo chưa xử lý</p>
                <p className="text-3xl font-bold">{unacknowledgedAlerts}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">Cần chú ý</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">Nhiệt độ trung bình</p>
                <p className="text-3xl font-bold">{avgTemp}°C</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 truncate">Phạm vi tối ưu</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Thermometer className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-medium truncate">Nhiệt độ</span>
            </div>
            <p className="text-2xl font-bold mb-2">{avgTemp}°C</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Trung bình trên tất cả các khu vực</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span className="font-medium truncate">Độ ẩm</span>
            </div>
            <p className="text-2xl font-bold mb-2">{avgHumidity}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Trung bình trên tất cả các khu vực</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Sprout className="w-5 h-5 text-lime-600 dark:text-lime-400 flex-shrink-0" />
              <span className="font-medium truncate">Độ ẩm đất</span>
            </div>
            <p className="text-2xl font-bold mb-2">{avgSoil}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Trung bình trên tất cả các khu vực</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
              <span className="font-medium truncate">Độ sáng</span>
            </div>
            <p className="text-2xl font-bold mb-2">{avgLight}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Lux - Trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-6">
            <CardTitle>Đồ thị Nhiệt độ (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temperatureData}>
                  <CartesianGrid key="temp-grid" strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis key="temp-xaxis" dataKey="displayTime" stroke="#6b7280" />
                  <YAxis key="temp-yaxis" stroke="#6b7280" />
                  <Tooltip key="temp-tooltip" />
                  <Area key="temp-area" type="monotone" dataKey="value" stroke="#10b981" fill="#d1fae5" name="Nhiệt độ (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>Đồ thị Độ ẩm (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={humidityData}>
                  <CartesianGrid key="humid-grid" strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis key="humid-xaxis" dataKey="displayTime" stroke="#6b7280" />
                  <YAxis key="humid-yaxis" stroke="#6b7280" />
                  <Tooltip key="humid-tooltip" />
                  <Line key="humid-line" type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} name="Độ ẩm (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>Đồ thị Độ ẩm đất (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={soilMoistureData}>
                  <CartesianGrid key="soil-grid" strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis key="soil-xaxis" dataKey="displayTime" stroke="#6b7280" />
                  <YAxis key="soil-yaxis" stroke="#6b7280" />
                  <Tooltip key="soil-tooltip" />
                  <Area key="soil-area" type="monotone" dataKey="value" stroke="#84cc16" fill="#d9f99d" name="Độ ẩm đất (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle>Đồ thị Độ sáng (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lightData}>
                  <CartesianGrid key="light-grid" strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis key="light-xaxis" dataKey="displayTime" stroke="#6b7280" />
                  <YAxis key="light-yaxis" stroke="#6b7280" />
                  <Tooltip key="light-tooltip" />
                  <Bar key="light-bar" dataKey="value" fill="#f59e0b" name="Độ sáng (Lux)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {zoneAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    alert.type === 'Critical'
                      ? 'text-red-600'
                      : alert.type === 'Warning'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        alert.type === 'Critical'
                          ? 'destructive'
                          : alert.type === 'Warning'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {alert.type}
                    </Badge>
                    <span className="text-sm text-gray-500">{alert.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.zoneName}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}