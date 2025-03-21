import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { webSocketService } from '@/lib/websocket';
import { Vehicle, VehicleStatus, Geofence } from '@shared/schema';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { createVehicleIcon, createVehiclePopup, createGeofenceLayer } from '@/lib/mapUtils';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import GeofenceModal from '@/components/modals/GeofenceModal';
import { Plus, Search, Layers, ZoomIn, ZoomOut, Locate, Maximize } from 'lucide-react';

const LiveTracking = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, VehicleStatus>>({});
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [isVehicleDetailsModalOpen, setIsVehicleDetailsModalOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [vehicleMarkers, setVehicleMarkers] = useState<Record<number, L.Marker>>({});
  const [geofenceLayers, setGeofenceLayers] = useState<Record<number, L.Layer>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawingType, setDrawingType] = useState<string | null>(null);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState<any>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // We'll store the FeatureGroup in this ref
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

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
  }, [vehicleData, statusData, geofenceData]);
  
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
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map if it doesn't exist
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.7128, -74.0060], // New York City by default
        zoom: 13,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          })
        ],
        zoomControl: false
      });
      
      // Create a FeatureGroup to store drawn shapes
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;
      
      // Initialize the draw control
      const drawOptions = {
        edit: {
          featureGroup: drawnItems,
          remove: true
        },
        draw: {
          rectangle: true,
          polygon: true,
          circle: true,
          marker: false,
          polyline: false,
          circlemarker: false
        }
      };
      
      // Use L.Control.Draw (casting to any for TypeScript)
      const drawingTools = new (L as any).Control.Draw(drawOptions);
      map.addControl(drawingTools);
      
      // Listen for shape creation
      map.on('draw:created', (e: any) => {
        const { layer, layerType } = e;
        drawnItems.addLayer(layer);
        
        // Get coordinates based on shape type
        let coordinates;
        
        if (layerType === 'circle') {
          coordinates = {
            center: {
              lat: layer.getLatLng().lat,
              lng: layer.getLatLng().lng
            },
            radius: layer.getRadius()
          };
        } else if (layerType === 'polygon') {
          coordinates = layer.getLatLngs()[0].map((latLng: L.LatLng) => ({
            lat: latLng.lat,
            lng: latLng.lng
          }));
        } else if (layerType === 'rectangle') {
          const bounds = layer.getBounds();
          coordinates = {
            southWest: {
              lat: bounds.getSouthWest().lat,
              lng: bounds.getSouthWest().lng
            },
            northEast: {
              lat: bounds.getNorthEast().lat,
              lng: bounds.getNorthEast().lng
            }
          };
        }
        
        setGeofenceCoordinates(coordinates);
        setIsGeofenceModalOpen(true);
      });
      
      mapRef.current = map;
    }
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update markers when vehicles or statuses change
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const markers = { ...vehicleMarkers };
    
    // Remove old markers
    Object.values(markers).forEach(marker => {
      map.removeLayer(marker);
    });
    
    // Filter vehicles
    const filteredVehicles = vehicles.filter(vehicle => {
      // Filter by search term
      const matchesSearch = 
        searchTerm === '' ||
        vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by vehicle type
      const matchesType = filterType === 'all' || vehicle.type === filterType;
      
      // Filter by status
      const status = vehicleStatuses[vehicle.id]?.status || 'offline';
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    // Create new markers
    const newMarkers: Record<number, L.Marker> = {};
    
    filteredVehicles.forEach(vehicle => {
      const status = vehicleStatuses[vehicle.id];
      
      if (status && typeof status.latitude === 'number' && typeof status.longitude === 'number') {
        const position: L.LatLngExpression = [status.latitude, status.longitude];
        const icon = createVehicleIcon(vehicle.type, status.status);
        
        const marker = L.marker(position, { icon }).addTo(map);
        
        // Add popup
        const popup = createVehiclePopup(vehicle, status);
        marker.bindPopup(popup);
        
        // Add click event
        marker.on('click', () => {
          setSelectedVehicle(vehicle);
          setIsVehicleDetailsModalOpen(true);
        });
        
        newMarkers[vehicle.id] = marker;
      }
    });
    
    setVehicleMarkers(newMarkers);
    
    // Update geofence layers
    const layers = { ...geofenceLayers };
    
    // Remove old layers
    Object.values(layers).forEach(layer => {
      map.removeLayer(layer);
    });
    
    // Create new layers
    const newLayers: Record<number, L.Layer> = {};
    
    geofences.forEach(geofence => {
      try {
        const layer = createGeofenceLayer(geofence);
        layer.addTo(map);
        newLayers[geofence.id] = layer;
      } catch (error) {
        console.error('Error creating geofence layer:', error);
      }
    });
    
    setGeofenceLayers(newLayers);
    
  }, [vehicles, vehicleStatuses, geofences, searchTerm, filterType, filterStatus]);
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1);
    }
  };
  
  // Handle center map
  const handleCenterMap = () => {
    if (mapRef.current && selectedVehicle && vehicleStatuses[selectedVehicle.id]) {
      const status = vehicleStatuses[selectedVehicle.id];
      if (status && typeof status.latitude === 'number' && typeof status.longitude === 'number') {
        mapRef.current.setView([status.latitude, status.longitude], 15);
      }
    } else if (mapRef.current) {
      // Find first vehicle with coordinates and center on it
      for (const vehicle of vehicles) {
        const status = vehicleStatuses[vehicle.id];
        if (status && typeof status.latitude === 'number' && typeof status.longitude === 'number') {
          mapRef.current.setView([status.latitude, status.longitude], 13);
          break;
        }
      }
    }
  };
  
  // Handle fullscreen
  const handleFullscreen = () => {
    const mapElement = mapContainerRef.current;
    if (!mapElement) return;
    
    if (!document.fullscreenElement) {
      mapElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Handle drawing start (manual trigger if needed)
  const handleDrawStart = (type: string) => {
    setDrawingType(type);
    if (!mapRef.current || !drawnItemsRef.current) return;
    
    // Clear existing drawings
    drawnItemsRef.current.clearLayers();
    
    // Manually enable the chosen draw tool
    if (type === 'circle') {
      new (L as any).Draw.Circle(mapRef.current).enable();
    } else if (type === 'polygon') {
      new (L as any).Draw.Polygon(mapRef.current).enable();
    } else if (type === 'rectangle') {
      new (L as any).Draw.Rectangle(mapRef.current).enable();
    }
  };
  
  // Calculate vehicle status counts
  const getStatusCounts = () => {
    const counts = { active: 0, idle: 0, offline: 0 };
    
    Object.values(vehicleStatuses).forEach(status => {
      if (status.status === 'active') counts.active++;
      else if (status.status === 'idle') counts.idle++;
      else counts.offline++;
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  return (
    <AppLayout>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for filters, vehicles, geofences */}
        <div className="w-80 bg-white shadow-md flex flex-col h-full">
          {/* Filters */}
          <div className="p-4 border-b border-neutral-200">
            <div className="relative mb-4">
              <Input 
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg"
              />
              <Search className="absolute left-3 top-2 text-neutral-300 h-5 w-5" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Vehicle Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="car">Cars</SelectItem>
                    <SelectItem value="van">Vans</SelectItem>
                    <SelectItem value="truck">Trucks</SelectItem>
                    <SelectItem value="bus">Buses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="vehicles" className="flex-1 flex flex-col">
            <TabsList className="px-4 pt-2 justify-start border-b rounded-none">
              <TabsTrigger value="vehicles" className="rounded-t-lg rounded-b-none">Vehicles</TabsTrigger>
              <TabsTrigger value="geofences" className="rounded-t-lg rounded-b-none">Geofences</TabsTrigger>
            </TabsList>
            
            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">
              <div className="divide-y divide-neutral-200">
                {vehicles
                  .filter(vehicle => {
                    const matchesSearch = 
                      searchTerm === '' ||
                      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesType = filterType === 'all' || vehicle.type === filterType;
                    const status = vehicleStatuses[vehicle.id]?.status || 'offline';
                    const matchesStatus = filterStatus === 'all' || status === filterStatus;
                    return matchesSearch && matchesType && matchesStatus;
                  })
                  .map(vehicle => {
                    const status = vehicleStatuses[vehicle.id];
                    return (
                      <div 
                        key={vehicle.id} 
                        className="p-4 hover:bg-neutral-50 cursor-pointer"
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setIsVehicleDetailsModalOpen(true);
                          
                          // Center map on selected vehicle
                          if (mapRef.current && status && typeof status.latitude === 'number' && typeof status.longitude === 'number') {
                            mapRef.current.setView([status.latitude, status.longitude], 15);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`material-icons ${
                              status?.status === 'active' ? 'text-secondary' : 
                              status?.status === 'idle' ? 'text-warning' : 'text-error'
                            }`}>
                              {vehicle.type === 'truck' ? 'local_shipping' : 
                               vehicle.type === 'bus' ? 'airport_shuttle' : 'directions_car'}
                            </span>
                            <h3 className="font-medium">{vehicle.name}</h3>
                          </div>
                          <div className={`flex items-center gap-1 ${
                            status?.status === 'active' ? 'text-secondary' : 
                            status?.status === 'idle' ? 'text-warning' : 'text-error'
                          } text-sm`}>
                            <span className={`w-2 h-2 rounded-full ${
                              status?.status === 'active' ? 'bg-secondary' : 
                              status?.status === 'idle' ? 'bg-warning' : 'bg-error'
                            }`}></span>
                            <span>
                              {status?.status 
                                ? status.status.charAt(0).toUpperCase() + status.status.slice(1) 
                                : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-neutral-400 mb-2">
                          <span>ID: {vehicle.vehicleId}</span>
                          <span>
                            {status?.lastUpdateTime 
                              ? `${new Date(status.lastUpdateTime).toLocaleTimeString()}` 
                              : 'No data'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="material-icons text-neutral-300 text-sm">speed</span>
                            <span>{status?.speed ? `${status.speed} km/h` : '-- km/h'}</span>
                            <span className="material-icons text-neutral-300 text-sm ml-3">location_on</span>
                            <span>
                              {status?.latitude && status?.longitude 
                                ? `${status.latitude.toFixed(4)}, ${status.longitude.toFixed(4)}` 
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {vehicles.filter(vehicle => {
                  const matchesSearch = 
                    searchTerm === '' ||
                    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesType = filterType === 'all' || vehicle.type === filterType;
                  const status = vehicleStatuses[vehicle.id]?.status || 'offline';
                  const matchesStatus = filterStatus === 'all' || status === filterStatus;
                  return matchesSearch && matchesType && matchesStatus;
                }).length === 0 && (
                  <div className="p-4 text-center text-neutral-400">
                    No vehicles match the current filters
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Geofences Tab */}
            <TabsContent value="geofences" className="flex-1 overflow-y-auto custom-scrollbar p-0 m-0">
              <div className="divide-y divide-neutral-200">
                {geofences.map(geofence => (
                  <div 
                    key={geofence.id} 
                    className="p-4 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => {
                      // Center map on geofence
                      if (mapRef.current && geofenceLayers[geofence.id]) {
                        const layer = geofenceLayers[geofence.id];
                        if (layer instanceof L.Circle) {
                          mapRef.current.setView(layer.getLatLng(), 15);
                        } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                          mapRef.current.fitBounds(layer.getBounds());
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-primary">
                          {geofence.type === 'circle' ? 'radio_button_unchecked' : 
                           geofence.type === 'rectangle' ? 'crop_square' : 'change_history'}
                        </span>
                        <h3 className="font-medium">{geofence.name}</h3>
                      </div>
                      <div className="text-sm" style={{ color: geofence.color || '#1976D2' }}>
                        {geofence.type.charAt(0).toUpperCase() + geofence.type.slice(1)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {geofence.alertOnEnter && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                          Alert on Enter
                        </span>
                      )}
                      {geofence.alertOnExit && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                          Alert on Exit
                        </span>
                      )}
                      {geofence.alertOnSpeed && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                          Speed Limit: {geofence.speedLimit || 'N/A'} km/h
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {geofences.length === 0 && (
                  <div className="p-4 text-center text-neutral-400">
                    No geofences defined
                  </div>
                )}
                
                <div className="p-4">
                  <Button 
                    className="w-full"
                    onClick={() => setIsGeofenceModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Geofence
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Main Map Area */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0 bg-neutral-200"></div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 bg-white hover:bg-neutral-100 shadow-md"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 bg-white hover:bg-neutral-100 shadow-md"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 bg-white hover:bg-neutral-100 shadow-md"
              onClick={handleCenterMap}
            >
              <Locate className="h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 bg-white hover:bg-neutral-100 shadow-md"
              onClick={handleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
            <div className="border-t border-neutral-200 my-1"></div>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 bg-white hover:bg-neutral-100 shadow-md"
            >
              <Layers className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Map Info Box */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md text-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span>Active ({statusCounts.active})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span>Idle ({statusCounts.idle})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-error"></span>
                <span>Offline ({statusCounts.offline})</span>
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Details Modal */}
      <VehicleDetailsModal 
        open={isVehicleDetailsModalOpen} 
        onOpenChange={setIsVehicleDetailsModalOpen}
        vehicle={selectedVehicle}
        vehicleStatus={selectedVehicle ? vehicleStatuses[selectedVehicle.id] : undefined}
      />
      
      {/* Geofence Modal */}
      <GeofenceModal 
        open={isGeofenceModalOpen} 
        onOpenChange={setIsGeofenceModalOpen}
        vehicles={vehicles}
        onDrawStart={handleDrawStart}
        coordinates={geofenceCoordinates}
      />
    </AppLayout>
  );
};

export default LiveTracking;

