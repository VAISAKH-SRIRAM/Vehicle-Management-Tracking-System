import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vehicle, VehicleStatus, Trip } from '@shared/schema';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';

const ReportsPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, VehicleStatus>>({});
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  // Fetch vehicles
  const { data: vehicleData } = useQuery({ 
    queryKey: ['/api/vehicles']
  });
  
  // Fetch vehicle statuses
  const { data: statusData } = useQuery({ 
    queryKey: ['/api/vehicle-status'] 
  });
  
  // Fetch trips
  const { data: tripData } = useQuery({ 
    queryKey: ['/api/trips'] 
  });
  
  // Update local state when data is fetched
  useEffect(() => {
    if (vehicleData) setVehicles(vehicleData);
    if (statusData) {
      const statusMap: Record<number, VehicleStatus> = {};
      statusData.forEach((status: VehicleStatus) => {
        statusMap[status.vehicleId] = status;
      });
      setVehicleStatuses(statusMap);
    }
    if (tripData) setTrips(tripData);
  }, [vehicleData, statusData, tripData]);
  
  // Filter trips by vehicle and date range
  const filteredTrips = trips.filter(trip => {
    const matchesVehicle = selectedVehicleId === 'all' || trip.vehicleId === parseInt(selectedVehicleId);
    
    const tripDate = new Date(trip.startTime);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // Set to end of day
    
    const matchesDateRange = tripDate >= startDate && tripDate <= endDate;
    
    return matchesVehicle && matchesDateRange;
  });
  
  // Process data for distance chart
  const getDistanceChartData = () => {
    const data: { date: string; distance: number }[] = [];
    const dateMap = new Map<string, number>();
    
    filteredTrips.forEach(trip => {
      if (trip.distance) {
        const date = new Date(trip.startTime).toLocaleDateString();
        const currentDistance = dateMap.get(date) || 0;
        dateMap.set(date, currentDistance + trip.distance);
      }
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    sortedDates.forEach(date => {
      data.push({
        date,
        distance: Math.round(dateMap.get(date)! * 10) / 10 // Round to 1 decimal place
      });
    });
    
    return data;
  };
  
  // Process data for trip duration chart
  const getTripDurationChartData = () => {
    const data: { date: string; duration: number }[] = [];
    const dateMap = new Map<string, number>();
    
    filteredTrips.forEach(trip => {
      if (trip.startTime && trip.endTime) {
        const date = new Date(trip.startTime).toLocaleDateString();
        const startTime = new Date(trip.startTime).getTime();
        const endTime = new Date(trip.endTime).getTime();
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        
        const currentDuration = dateMap.get(date) || 0;
        dateMap.set(date, currentDuration + durationHours);
      }
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    sortedDates.forEach(date => {
      data.push({
        date,
        duration: Math.round(dateMap.get(date)! * 10) / 10 // Round to 1 decimal place
      });
    });
    
    return data;
  };
  
  // Process data for status chart
  const getStatusChartData = () => {
    const statusCounts = { active: 0, idle: 0, offline: 0 };
    
    Object.values(vehicleStatuses).forEach(status => {
      if (selectedVehicleId !== 'all' && status.vehicleId !== parseInt(selectedVehicleId)) {
        return;
      }
      
      if (status.status === 'active') statusCounts.active++;
      else if (status.status === 'idle') statusCounts.idle++;
      else statusCounts.offline++;
    });
    
    return [
      { name: 'Active', value: statusCounts.active },
      { name: 'Idle', value: statusCounts.idle },
      { name: 'Offline', value: statusCounts.offline }
    ];
  };
  
  // Calculate summary data
  const getSummaryData = () => {
    let totalDistance = 0;
    let totalDuration = 0;
    let avgSpeed = 0;
    
    filteredTrips.forEach(trip => {
      if (trip.distance) {
        totalDistance += trip.distance;
      }
      
      if (trip.startTime && trip.endTime) {
        const startTime = new Date(trip.startTime).getTime();
        const endTime = new Date(trip.endTime).getTime();
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        totalDuration += durationHours;
      }
    });
    
    if (totalDuration > 0) {
      avgSpeed = totalDistance / totalDuration;
    }
    
    const tripCount = filteredTrips.length;
    
    return {
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(totalDuration * 10) / 10,
      tripCount,
      avgSpeed: Math.round(avgSpeed * 10) / 10
    };
  };
  
  const distanceChartData = getDistanceChartData();
  const durationChartData = getTripDurationChartData();
  const statusChartData = getStatusChartData();
  const summaryData = getSummaryData();
  
  const COLORS = ['#388E3C', '#F57C00', '#D32F2F'];
  
  // Handle export data
  const handleExportData = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Trip ID,Vehicle,Start Time,End Time,Distance (km),Duration (hours)\n";
    
    filteredTrips.forEach(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const vehicleName = vehicle ? vehicle.name : `Vehicle ${trip.vehicleId}`;
      const startTime = new Date(trip.startTime).toLocaleString();
      const endTime = trip.endTime ? new Date(trip.endTime).toLocaleString() : 'In Progress';
      const distance = trip.distance ? `${trip.distance.toFixed(1)}` : 'N/A';
      
      let duration = 'N/A';
      if (trip.startTime && trip.endTime) {
        const durationHours = (new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / (1000 * 60 * 60);
        duration = durationHours.toFixed(1);
      }
      
      csvContent += `${trip.id},${vehicleName},${startTime},${endTime},${distance},${duration}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trip_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Distance</CardTitle>
              <CardDescription>Total kilometers traveled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryData.totalDistance} km</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Duration</CardTitle>
              <CardDescription>Hours on the road</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryData.totalDuration} hrs</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trip Count</CardTitle>
              <CardDescription>Number of trips made</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryData.tripCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Speed</CardTitle>
              <CardDescription>Average speed during trips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summaryData.avgSpeed} km/h</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-500">Date Range:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-40"
              />
              <span>to</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-40"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-500">Vehicle:</span>
            </div>
            
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="distance" className="mb-6">
          <TabsList>
            <TabsTrigger value="distance">Distance</TabsTrigger>
            <TabsTrigger value="duration">Duration</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distance" className="bg-white rounded-lg shadow p-4 mt-2">
            <h3 className="text-lg font-semibold mb-4">Distance Traveled</h3>
            
            <div className="h-80">
              {distanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distanceChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="distance" name="Distance (km)" fill="#1976D2" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400">
                  No data available for selected filters
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="duration" className="bg-white rounded-lg shadow p-4 mt-2">
            <h3 className="text-lg font-semibold mb-4">Trip Duration</h3>
            
            <div className="h-80">
              {durationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={durationChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="duration" name="Duration (hours)" stroke="#388E3C" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400">
                  No data available for selected filters
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="bg-white rounded-lg shadow p-4 mt-2">
            <h3 className="text-lg font-semibold mb-4">Vehicle Status Distribution</h3>
            
            <div className="h-80">
              {statusChartData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-400">
                  No status data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
