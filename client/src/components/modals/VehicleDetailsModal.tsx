import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Vehicle, VehicleStatus, Trip } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VehicleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
  vehicleStatus?: VehicleStatus;
}

const VehicleDetailsModal = ({ open, onOpenChange, vehicle, vehicleStatus }: VehicleDetailsModalProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Fetch vehicle trips if vehicle is selected
  const { data: tripData } = useQuery({
    queryKey: vehicle ? ['/api/vehicles', vehicle.id, 'trips'] : null,
    enabled: !!vehicle
  });
  
  useEffect(() => {
    if (tripData) {
      setTrips(tripData);
    }
  }, [tripData]);
  
  if (!vehicle) return null;
  
  // Format time
  const formatTime = (timestamp?: Date | string) => {
    if (!timestamp) return '--';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Status icon mapping
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return 'directions_car';
      case 'idle': return 'local_shipping';
      case 'offline': return 'airport_shuttle';
      default: return 'help_outline';
    }
  };
  
  // Status color mapping
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-secondary';
      case 'idle': return 'text-warning';
      case 'offline': return 'text-error';
      default: return 'text-neutral-400';
    }
  };
  
  // Format activity timestamp
  const formatActivityTime = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Sort trips by start time (most recent first)
  const sortedTrips = [...(trips || [])].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  ).slice(0, 10); // Only show 10 most recent activities
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vehicle Details - {vehicle.name}</DialogTitle>
          <DialogClose />
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vehicle Info Section */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-medium text-neutral-400 mb-3">VEHICLE INFORMATION</h4>
            
            <div className="bg-neutral-100 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`material-icons text-primary text-2xl`}>
                    {vehicle.type === 'truck' ? 'local_shipping' : 
                     vehicle.type === 'bus' ? 'airport_shuttle' : 'directions_car'}
                  </span>
                  <div>
                    <h3 className="font-medium">{vehicle.name}</h3>
                    <div className="text-xs text-neutral-400">ID: {vehicle.vehicleId}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${getStatusColor(vehicleStatus?.status)} text-sm`}>
                  <span className={`w-2 h-2 rounded-full ${
                    vehicleStatus?.status === 'active' ? 'bg-secondary' : 
                    vehicleStatus?.status === 'idle' ? 'bg-warning' : 'bg-error'
                  }`}></span>
                  <span>{vehicleStatus?.status ? vehicleStatus.status.charAt(0).toUpperCase() + vehicleStatus.status.slice(1) : 'Unknown'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <div className="text-neutral-400">Registration</div>
                  <div>{vehicle.registrationNumber || '--'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Type</div>
                  <div>{vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Driver ID</div>
                  <div>{vehicle.driverId || '--'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">GPS Device</div>
                  <div>{vehicle.gpsDeviceId || '--'}</div>
                </div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-neutral-400 mb-3">CURRENT STATUS</h4>
            
            <div className="bg-neutral-100 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <div className="text-neutral-400">Speed</div>
                  <div>{vehicleStatus?.speed ? `${vehicleStatus.speed} km/h` : '--'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Heading</div>
                  <div>{vehicleStatus?.heading ? `${vehicleStatus.heading}°` : '--'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Location</div>
                  <div>
                    {vehicleStatus?.latitude && vehicleStatus?.longitude 
                      ? `${vehicleStatus.latitude.toFixed(4)}, ${vehicleStatus.longitude.toFixed(4)}` 
                      : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Fuel Level</div>
                  <div>{vehicleStatus?.fuelLevel ? `${vehicleStatus.fuelLevel}%` : '--'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Engine Status</div>
                  <div>{vehicleStatus?.ignition ? 'Running' : 'Off'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Last Update</div>
                  <div>{vehicleStatus?.lastUpdateTime ? formatTime(vehicleStatus.lastUpdateTime) : '--'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 flex items-center justify-center gap-1 p-2">
                <span className="material-icons text-sm">edit</span>
                <span>Edit</span>
              </Button>
              <Button variant="outline" className="flex-1 flex items-center justify-center gap-1 p-2">
                <span className="material-icons text-sm">history</span>
                <span>History</span>
              </Button>
            </div>
          </div>
          
          {/* Map & Timeline Section */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-neutral-400 mb-3">CURRENT LOCATION</h4>
            
            {/* Mini Map */}
            {vehicleStatus?.latitude && vehicleStatus?.longitude ? (
              <div className="rounded-lg overflow-hidden h-48 mb-4 bg-neutral-200">
                <iframe 
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    vehicleStatus.longitude - 0.01},${
                    vehicleStatus.latitude - 0.01},${
                    vehicleStatus.longitude + 0.01},${
                    vehicleStatus.latitude + 0.01}&layer=mapnik&marker=${
                    vehicleStatus.latitude},${vehicleStatus.longitude}`}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden h-48 mb-4 bg-neutral-100 flex items-center justify-center text-neutral-400">
                No location data available
              </div>
            )}
            
            <h4 className="text-sm font-medium text-neutral-400 mb-3">TODAY'S ACTIVITY</h4>
            
            {/* Timeline */}
            <div className="bg-neutral-100 rounded-lg p-4 h-64">
              <ScrollArea className="h-full pr-4">
                {sortedTrips.length > 0 ? (
                  <ol className="relative border-l border-neutral-300">
                    {sortedTrips.map((trip, index) => (
                      <li key={trip.id} className="ml-6 mb-6">
                        <span className={`absolute flex items-center justify-center w-6 h-6 ${
                          index === 0 ? 'bg-primary' : 'bg-secondary'
                        } rounded-full -left-3 ring-8 ring-neutral-100`}>
                          <span className="material-icons text-white text-sm">
                            {index === 0 ? 'location_on' : 'departure_board'}
                          </span>
                        </span>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium">
                            {trip.status === 'ongoing' ? 'Trip in progress' : 'Trip completed'}
                          </h4>
                          <time className="text-xs text-neutral-400">{formatActivityTime(trip.startTime)}</time>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {trip.status === 'ongoing' 
                            ? `Current trip started at ${formatActivityTime(trip.startTime)}`
                            : `Trip from ${trip.startLatitude.toFixed(4)}, ${trip.startLongitude.toFixed(4)} to ${
                                trip.endLatitude?.toFixed(4) || '--'
                              }, ${trip.endLongitude?.toFixed(4) || '--'}`
                          }
                          {trip.distance ? ` (${trip.distance.toFixed(2)} km)` : ''}
                        </p>
                      </li>
                    ))}
                    {/* Current status if vehicle is active */}
                    {vehicleStatus?.status === 'active' && (
                      <li className="ml-6 mb-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-primary rounded-full -left-3 ring-8 ring-neutral-100">
                          <span className="material-icons text-white text-sm">location_on</span>
                        </span>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium">Current Location</h4>
                          <time className="text-xs text-neutral-400">{formatTime(vehicleStatus.lastUpdateTime)}</time>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Vehicle is moving at {vehicleStatus.speed || 0} km/h
                          {vehicleStatus.latitude && vehicleStatus.longitude 
                            ? ` at ${vehicleStatus.latitude.toFixed(4)}, ${vehicleStatus.longitude.toFixed(4)}` 
                            : ''}
                        </p>
                      </li>
                    )}
                  </ol>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400">
                    No activity data available
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleDetailsModal;
