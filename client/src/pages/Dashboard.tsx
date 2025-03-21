import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import Map from '@/components/dashboard/Map';
import InfoPanel from '@/components/dashboard/InfoPanel';
import { Button } from '@/components/ui/button';
import AddVehicleModal from '@/components/modals/AddVehicleModal';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import { webSocketService } from '@/lib/websocket';
import { Vehicle, VehicleStatus, Geofence, Alert, Trip } from '@shared/schema';
import { Calendar } from 'lucide-react';

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, VehicleStatus>>({});
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isVehicleDetailsModalOpen, setIsVehicleDetailsModalOpen] = useState(false);
  
  // Fetch vehicles
  const { data: vehicleData } = useQuery({ 
    queryKey: ['/api/vehicles']
  });
  
  // Fetch vehicle statuses
  const { data: statusData } = useQuery({ 
    queryKey: ['/api/vehicle-status'] 
  });
  
  // Fetch geofences
  const { data: geofenceData } = useQuery({ 
    queryKey: ['/api/geofences'] 
  });
  
  // Fetch alerts
  const { data: alertData } = useQuery({ 
    queryKey: ['/api/alerts'] 
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
    if (geofenceData) setGeofences(geofenceData);
    if (alertData) setAlerts(alertData);
    if (tripData) setTrips(tripData);
  }, [vehicleData, statusData, geofenceData, alertData, tripData]);
  
  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
        case 'initialState':
          if (message.vehicles) setVehicles(message.vehicles);
          if (message.vehicleStatuses) {
            const statusMap: Record<number, VehicleStatus> = {};
            message.vehicleStatuses.forEach((status: VehicleStatus) => {
              statusMap[status.vehicleId] = status;
            });
            setVehicleStatuses(statusMap);
          }
          if (message.geofences) setGeofences(message.geofences);
          if (message.alerts) setAlerts(message.alerts);
          break;
        case 'vehicleLocationUpdate':
          setVehicleStatuses(prev => ({
            ...prev,
            [message.vehicleId]: {
              ...prev[message.vehicleId],
              latitude: message.latitude,
              longitude: message.longitude,
              speed: message.speed,
              heading: message.heading,
              status: message.status,
              lastUpdateTime: message.lastUpdateTime
            }
          }));
          break;
        case 'vehicleCreated':
          setVehicles(prev => [...prev, message.vehicle]);
          break;
        case 'vehicleUpdated':
          setVehicles(prev => 
            prev.map(v => v.id === message.vehicle.id ? message.vehicle : v)
          );
          break;
        case 'vehicleDeleted':
          setVehicles(prev => prev.filter(v => v.id !== message.vehicleId));
          break;
        case 'vehicleStatusUpdated':
          setVehicleStatuses(prev => ({
            ...prev,
            [message.vehicleStatus.vehicleId]: message.vehicleStatus
          }));
          break;
        case 'alertCreated':
          setAlerts(prev => [message.alert, ...prev]);
          break;
        case 'alertUpdated':
          setAlerts(prev => 
            prev.map(a => a.id === message.alert.id ? message.alert : a)
          );
          break;
        case 'alertDeleted':
          setAlerts(prev => prev.filter(a => a.id !== message.alertId));
          break;
        case 'tripCreated':
          setTrips(prev => [message.trip, ...prev]);
          break;
        case 'tripUpdated':
          setTrips(prev => 
            prev.map(t => t.id === message.trip.id ? message.trip : t)
          );
          break;
        default:
          break;
      }
    };
    
    webSocketService.addListener(handleWebSocketMessage);
    
    return () => {
      webSocketService.removeListener(handleWebSocketMessage);
    };
  }, []);
  
  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleDetailsModalOpen(true);
  };
  
  return (
    <AppLayout>
      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <Map 
            vehicles={vehicles}
            vehicleStatuses={vehicleStatuses}
            geofences={geofences}
            selectedVehicleId={selectedVehicle?.id}
            onVehicleSelect={handleVehicleSelect}
          />
        </div>
        
        <InfoPanel 
          vehicles={vehicles}
          vehicleStatuses={vehicleStatuses}
          alerts={alerts}
          trips={trips}
          onVehicleSelect={handleVehicleSelect}
          selectedVehicleId={selectedVehicle?.id}
          onViewTripDetails={() => {}} // Placeholder - will implement trip details view
          onViewAlertDetails={() => {}} // Placeholder - will implement alert details view
        />
      </div>
      
      {/* Floating action button to add vehicle */}
      <div className="absolute bottom-6 left-6">
        <Button 
          className="rounded-full w-12 h-12 shadow-lg"
          onClick={() => setIsAddVehicleModalOpen(true)}
        >
          <span className="material-icons">add</span>
        </Button>
      </div>
      
      {/* Add Vehicle Modal */}
      <AddVehicleModal 
        open={isAddVehicleModalOpen} 
        onOpenChange={setIsAddVehicleModalOpen}
      />
      
      {/* Vehicle Details Modal */}
      <VehicleDetailsModal 
        open={isVehicleDetailsModalOpen} 
        onOpenChange={setIsVehicleDetailsModalOpen}
        vehicle={selectedVehicle}
        vehicleStatus={selectedVehicle ? vehicleStatuses[selectedVehicle.id] : undefined}
      />
    </AppLayout>
  );
};

export default Dashboard;
