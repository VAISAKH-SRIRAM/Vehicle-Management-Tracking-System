import L from 'leaflet';
import { VehicleStatus } from '@shared/schema';

export interface MapOptions {
  center: [number, number];
  zoom: number;
}

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  center: [40.7128, -74.0060], // New York City by default
  zoom: 13
};

export interface VehicleMarker {
  id: number;
  marker: L.Marker;
  popup: L.Popup;
}

export interface GeofenceLayer {
  id: number;
  layer: L.Layer;
}

// Custom vehicle icon for the map
export const createVehicleIcon = (type: string, status: string) => {
  // Pick icon and color based on vehicle type and status
  let iconName = 'directions_car';
  let color = '#1976D2'; // Blue (default)
  
  if (type === 'truck') {
    iconName = 'local_shipping';
  } else if (type === 'bus') {
    iconName = 'airport_shuttle';
  } else if (type === 'motorcycle') {
    iconName = 'two_wheeler';
  }
  
  if (status === 'active') {
    color = '#388E3C'; // Green
  } else if (status === 'idle') {
    color = '#F57C00'; // Orange
  } else if (status === 'offline') {
    color = '#D32F2F'; // Red
  }
  
  // Create an HTML element for the icon
  const iconHtml = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border-2 transform rotate-0" 
         style="border-color: ${color};">
      <span class="material-icons text-xl" style="color: ${color};">${iconName}</span>
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'vehicle-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Function to create a popup for a vehicle
export const createVehiclePopup = (
  vehicle: { id: number; name: string; vehicleId: string; type: string },
  status: VehicleStatus | undefined
) => {
  const speed = status?.speed ? `${status.speed} km/h` : '--';
  const lastUpdate = status?.lastUpdateTime ? new Date(status.lastUpdateTime).toLocaleTimeString() : '--';
  
  const popupContent = `
    <div class="p-2">
      <div class="font-medium text-base mb-1">${vehicle.name}</div>
      <div class="text-sm text-gray-600 mb-1">ID: ${vehicle.vehicleId}</div>
      <div class="flex items-center text-sm">
        <span class="material-icons text-sm mr-1">speed</span>
        ${speed}
        <span class="ml-2 material-icons text-sm mr-1">access_time</span>
        ${lastUpdate}
      </div>
    </div>
  `;
  
  return L.popup({
    offset: [0, -20],
    closeButton: false,
    className: 'vehicle-popup'
  }).setContent(popupContent);
};

// Function to create geofence layers
export const createGeofenceLayer = (geofence: any): L.Layer => {
  const { type, coordinates, color } = geofence;
  let layer: L.Layer;
  
  const geofenceStyle = {
    color: color || '#1976D2',
    fillColor: color || '#1976D2',
    fillOpacity: 0.2,
    weight: 2
  };
  
  if (type === 'circle') {
    layer = L.circle(
      [coordinates.center.lat, coordinates.center.lng],
      {
        radius: coordinates.radius,
        ...geofenceStyle
      }
    );
  } else if (type === 'polygon') {
    layer = L.polygon(coordinates.map((coord: any) => [coord.lat, coord.lng]), geofenceStyle);
  } else if (type === 'rectangle') {
    layer = L.rectangle([
      [coordinates.southWest.lat, coordinates.southWest.lng],
      [coordinates.northEast.lat, coordinates.northEast.lng]
    ], geofenceStyle);
  } else {
    // Default to a marker if unknown type
    layer = L.marker([coordinates[0].lat, coordinates[0].lng]);
  }
  
  // Add popup with geofence info
  layer.bindPopup(`
    <div class="p-2">
      <div class="font-medium text-base mb-1">${geofence.name}</div>
      <div class="text-sm">Type: ${geofence.type}</div>
    </div>
  `);
  
  return layer;
};

// Function to check if a point is inside a geofence
export const isPointInGeofence = (geofence: any, point: [number, number]): boolean => {
  const [lat, lng] = point;
  
  if (geofence.type === 'circle') {
    const center = L.latLng(geofence.coordinates.center.lat, geofence.coordinates.center.lng);
    const distance = center.distanceTo(L.latLng(lat, lng));
    return distance <= geofence.coordinates.radius;
  } else if (geofence.type === 'polygon') {
    const polygon = L.polygon(geofence.coordinates.map((coord: any) => [coord.lat, coord.lng]));
    return polygon.contains(L.latLng(lat, lng));
  } else if (geofence.type === 'rectangle') {
    const bounds = L.latLngBounds(
      L.latLng(geofence.coordinates.southWest.lat, geofence.coordinates.southWest.lng),
      L.latLng(geofence.coordinates.northEast.lat, geofence.coordinates.northEast.lng)
    );
    return bounds.contains(L.latLng(lat, lng));
  }
  
  return false;
};
