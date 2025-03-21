import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { webSocketService } from '@/lib/websocket';
import { Vehicle, VehicleStatus, Geofence, Alert, Trip } from '@shared/schema';

interface VehicleContextType {
  vehicles: Vehicle[];
  vehicleStatuses: Record<number, VehicleStatus>;
  geofences: Geofence[];
  alerts: Alert[];
  trips: Trip[];
  isLoading: boolean;
  error: Error | null;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};

interface VehicleProviderProps {
  children: ReactNode;
}

export const VehicleProvider = ({ children }: VehicleProviderProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, VehicleStatus>>({});
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Fetch vehicles
  const { isLoading: isVehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['/api/vehicles'],
    onSuccess: (data) => setVehicles(data || [])
  });

  // Fetch vehicle statuses
  const { isLoading: isStatusesLoading, error: statusesError } = useQuery({
    queryKey: ['/api/vehicle-status'],
    onSuccess: (data) => {
      if (data) {
        const statusMap: Record<number, VehicleStatus> = {};
        data.forEach((status: VehicleStatus) => {
          statusMap[status.vehicleId] = status;
        });
        setVehicleStatuses(statusMap);
      }
    }
  });

  // Fetch geofences
  const { isLoading: isGeofencesLoading, error: geofencesError } = useQuery({
    queryKey: ['/api/geofences'],
    onSuccess: (data) => setGeofences(data || [])
  });

  // Fetch alerts
  const { isLoading: isAlertsLoading, error: alertsError } = useQuery({
    queryKey: ['/api/alerts'],
    onSuccess: (data) => setAlerts(data || [])
  });

  // Fetch trips
  const { isLoading: isTripsLoading, error: tripsError } = useQuery({
    queryKey: ['/api/trips'],
    onSuccess: (data) => setTrips(data || [])
  });

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
        case 'geofenceCreated':
          setGeofences(prev => [...prev, message.geofence]);
          break;
        case 'geofenceUpdated':
          setGeofences(prev => 
            prev.map(g => g.id === message.geofence.id ? message.geofence : g)
          );
          break;
        case 'geofenceDeleted':
          setGeofences(prev => prev.filter(g => g.id !== message.geofenceId));
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

  const isLoading = isVehiclesLoading || isStatusesLoading || isGeofencesLoading || isAlertsLoading || isTripsLoading;
  const error = vehiclesError || statusesError || geofencesError || alertsError || tripsError;

  const value = {
    vehicles,
    vehicleStatuses,
    geofences,
    alerts,
    trips,
    isLoading,
    error
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};
