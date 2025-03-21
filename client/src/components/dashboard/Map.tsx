import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, VehicleStatus, Geofence } from '@shared/schema';
import { 
  DEFAULT_MAP_OPTIONS, 
  createVehicleIcon, 
  createVehiclePopup, 
  createGeofenceLayer, 
  VehicleMarker, 
  GeofenceLayer 
} from '@/lib/mapUtils';

interface MapProps {
  vehicles: Vehicle[];
  vehicleStatuses: Record<number, VehicleStatus>;
  geofences: Geofence[];
  selectedVehicleId?: number;
  onVehicleSelect: (vehicle: Vehicle) => void;
}

const Map = ({ vehicles, vehicleStatuses, geofences, selectedVehicleId, onVehicleSelect }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [vehicleMarkers, setVehicleMarkers] = useState<Record<number, VehicleMarker>>({});
  const [geofenceLayers, setGeofenceLayers] = useState<Record<number, GeofenceLayer>>({});
  
  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map if it doesn't exist
    if (!mapRef.current) {
      // Ensure container has a defined height
      mapContainerRef.current.style.height = '100%';
      
      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_MAP_OPTIONS.center,
        zoom: DEFAULT_MAP_OPTIONS.zoom,
        layers: [
          // OpenStreetMap layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          })
        ],
        zoomControl: false // We'll add custom zoom controls
      });
      
      // Refresh map size after container is ready
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      
      mapRef.current = map;
    }
    
    // Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update vehicle markers when vehicles or statuses change
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const currentMarkers = { ...vehicleMarkers };
    
    // Update or create markers for each vehicle
    vehicles.forEach(vehicle => {
      const status = vehicleStatuses[vehicle.id];
      
      // Skip vehicles without valid location data
      if (!status || typeof status.latitude !== 'number' || typeof status.longitude !== 'number') {
        return;
      }
      
      const position: L.LatLngExpression = [status.latitude, status.longitude];
      const icon = createVehicleIcon(vehicle.type, status.status);
      const popup = createVehiclePopup(vehicle, status);
      
      if (currentMarkers[vehicle.id]) {
        // Update existing marker
        currentMarkers[vehicle.id].marker.setLatLng(position);
        currentMarkers[vehicle.id].marker.setIcon(icon);
        currentMarkers[vehicle.id].popup.setContent(popup.getContent() || '');
      } else {
        // Create new marker
        const marker = L.marker(position, { icon }).addTo(map);
        
        // Bind popup to marker
        marker.bindPopup(popup);
        
        // Add click handler
        marker.on('click', () => {
          onVehicleSelect(vehicle);
        });
        
        currentMarkers[vehicle.id] = { id: vehicle.id, marker, popup };
      }
      
      // If this vehicle is selected, center map on it and open its popup
      if (selectedVehicleId === vehicle.id) {
        map.setView(position, map.getZoom());
        currentMarkers[vehicle.id].marker.openPopup();
      }
    });
    
    // Remove markers for vehicles that no longer exist
    Object.keys(currentMarkers).forEach(idStr => {
      const id = parseInt(idStr);
      if (!vehicles.find(v => v.id === id)) {
        if (currentMarkers[id].marker) {
          map.removeLayer(currentMarkers[id].marker);
        }
        delete currentMarkers[id];
      }
    });
    
    setVehicleMarkers(currentMarkers);
  }, [vehicles, vehicleStatuses, selectedVehicleId, onVehicleSelect]);
  
  // Update geofence layers when geofences change
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const currentLayers = { ...geofenceLayers };
    
    // Remove all existing geofence layers
    Object.values(currentLayers).forEach(({ layer }) => {
      map.removeLayer(layer);
    });
    
    // Create new geofence layers
    const newLayers: Record<number, GeofenceLayer> = {};
    
    geofences.forEach(geofence => {
      try {
        const layer = createGeofenceLayer(geofence);
        layer.addTo(map);
        newLayers[geofence.id] = { id: geofence.id, layer };
      } catch (error) {
        console.error('Error creating geofence layer:', error);
      }
    });
    
    setGeofenceLayers(newLayers);
    
    // Cleanup on effect change
    return () => {
      Object.values(newLayers).forEach(({ layer }) => {
        map.removeLayer(layer);
      });
    };
  }, [geofences]);
  
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
    if (mapRef.current && selectedVehicleId && vehicleStatuses[selectedVehicleId]) {
      const status = vehicleStatuses[selectedVehicleId];
      if (status && typeof status.latitude === 'number' && typeof status.longitude === 'number') {
        mapRef.current.setView([status.latitude, status.longitude], DEFAULT_MAP_OPTIONS.zoom);
      }
    } else if (mapRef.current) {
      mapRef.current.setView(DEFAULT_MAP_OPTIONS.center, DEFAULT_MAP_OPTIONS.zoom);
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
    <div className="w-full h-full relative">
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full bg-gray-100 z-0"></div>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="bg-white rounded-lg shadow-md p-1">
          <button 
            className="p-2 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" 
            title="Zoom In"
            onClick={handleZoomIn}
          >
            <span className="material-icons text-gray-700">add</span>
          </button>
          <button 
            className="p-2 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" 
            title="Zoom Out"
            onClick={handleZoomOut}
          >
            <span className="material-icons text-gray-700">remove</span>
          </button>
          <button 
            className="p-2 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" 
            title="Center Map"
            onClick={handleCenterMap}
          >
            <span className="material-icons text-gray-700">my_location</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button 
            className="p-2 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" 
            title="Fullscreen"
            onClick={handleFullscreen}
          >
            <span className="material-icons text-gray-700">fullscreen</span>
          </button>
          <button 
            className="p-2 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors" 
            title="Map Layers"
          >
            <span className="material-icons text-gray-700">layers</span>
          </button>
        </div>
      </div>
      
      {/* Map Info Box */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md z-10 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-700 text-sm">Vehicle Status</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="flex flex-col items-center bg-green-50 rounded-md p-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">{statusCounts.active}</span>
            </div>
            <div className="flex flex-col items-center bg-amber-50 rounded-md p-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-medium text-amber-700">Idle</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">{statusCounts.idle}</span>
            </div>
            <div className="flex flex-col items-center bg-red-50 rounded-md p-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-medium text-red-700">Offline</span>
              </div>
              <span className="text-lg font-semibold text-gray-800">{statusCounts.offline}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;

