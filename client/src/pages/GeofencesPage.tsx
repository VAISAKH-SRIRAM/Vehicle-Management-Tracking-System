import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { webSocketService } from '@/lib/websocket';
import { Geofence, Vehicle } from '@shared/schema';
import { Plus, Search, MoreVertical, Edit, Trash2, Map as MapIcon } from 'lucide-react';
import GeofenceModal from '@/components/modals/GeofenceModal';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { createGeofenceLayer } from '@/lib/mapUtils';

const GeofencesPage = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geofenceCoordinates, setGeofenceCoordinates] = useState<any>(null);
  const { toast } = useToast();

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  // Fetch geofences
  const { data: geofenceData } = useQuery({ 
    queryKey: ['/api/geofences']
  });
  
  // Fetch vehicles for association
  const { data: vehicleData } = useQuery({ 
    queryKey: ['/api/vehicles']
  });
  
  // Update local state when data is fetched
  useEffect(() => {
    if (geofenceData) setGeofences(geofenceData);
    if (vehicleData) setVehicles(vehicleData);
  }, [geofenceData, vehicleData]);
  
  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
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
  
  // Initialize map when showing
  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapRef.current) {
      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [40.7128, -74.0060], // New York City by default
        zoom: 13,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          })
        ]
      });
      
      // Add drawn items layer to map
      drawnItemsRef.current.addTo(map);
      
      // Initialize draw control (using a cast for TypeScript)
      const drawControl = new (L as any).Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true
        },
        draw: {
          polygon: true,
          rectangle: true,
          circle: true,
          marker: false,
          polyline: false,
          circlemarker: false
        }
      });
      map.addControl(drawControl);
      
      // Handle draw created event
      map.on('draw:created', (e: any) => {
        const { layer, layerType } = e;
        drawnItemsRef.current.addLayer(layer);
        
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
      
      // Add existing geofences to map
      geofences.forEach(geofence => {
        try {
          const layer = createGeofenceLayer(geofence);
          layer.addTo(map);
          layer.bindPopup(`
            <div class="p-2">
              <div class="font-medium text-base mb-1">${geofence.name}</div>
              <div class="text-sm">Type: ${geofence.type}</div>
            </div>
          `);
        } catch (error) {
          console.error('Error creating geofence layer:', error);
        }
      });
      
      mapRef.current = map;
    }
    
    // Cleanup on hide
    return () => {
      if (!showMap && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, geofences]);
  
  // Handle geofence deletion
  const handleDeleteGeofence = async (id: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/geofences/${id}`, undefined);
      
      if (response.ok) {
        toast({
          title: 'Geofence deleted',
          description: 'Geofence has been deleted successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
      }
    } catch (error) {
      console.error('Error deleting geofence:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the geofence',
        variant: 'destructive',
      });
    }
  };
  
  // Format created date
  const formatCreatedDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  // Filter geofences by search term
  const filteredGeofences = geofences.filter(geofence => 
    geofence.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle drawing start for new geofence (for additional manual control)
  const handleDrawStart = (type: string) => {
    if (!mapRef.current) return;
    // Clear existing drawings
    drawnItemsRef.current.clearLayers();
    
    if (type === 'circle') {
      new (L as any).Draw.Circle(mapRef.current).enable();
    } else if (type === 'polygon') {
      new (L as any).Draw.Polygon(mapRef.current).enable();
    } else if (type === 'rectangle') {
      new (L as any).Draw.Rectangle(mapRef.current).enable();
    }
  };
  
  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Input 
              type="text"
              placeholder="Search geofences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowMap(!showMap)}>
              <MapIcon className="h-4 w-4 mr-2" />
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
            <Button onClick={() => {
              setShowMap(true);
              setIsGeofenceModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Geofence
            </Button>
          </div>
        </div>
        
        {showMap && (
  	<div
    	className={`
      	mb-6 h-96 relative w-full max-w-full overflow-hidden rounded-lg shadow-md border
      	${isGeofenceModalOpen ? 'hidden' : ''}
    	`}
  	>
    <div ref={mapContainerRef} className="w-full h-full"></div>
  </div>
)}
        
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGeofences.length > 0 ? (
                filteredGeofences.map(geofence => (
                  <TableRow key={geofence.id}>
                    <TableCell className="font-medium">{geofence.name}</TableCell>
                    <TableCell className="capitalize">{geofence.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: geofence.color || '#1976D2' }}
                        ></div>
                        {geofence.color || '#1976D2'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {geofence.alertOnEnter && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                            Enter
                          </span>
                        )}
                        {geofence.alertOnExit && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                            Exit
                          </span>
                        )}
                        {geofence.alertOnSpeed && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-xs rounded-full">
                            Speed
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCreatedDate(geofence.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setShowMap(true);
                            if (mapRef.current) {
                              setTimeout(() => {
                                try {
                                  const layer = createGeofenceLayer(geofence);
                                  if (layer instanceof L.Circle) {
                                    mapRef.current?.setView(layer.getLatLng(), 15);
                                  } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                                    layer.addTo(mapRef.current);
                                    mapRef.current.fitBounds(layer.getBounds());
                                    mapRef.current.removeLayer(layer);
                                  }
                                } catch (error) {
                                  console.error('Error creating temp geofence layer:', error);
                                }
                              }, 100);
                            }
                          }}>
                            <MapIcon className="h-4 w-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteGeofence(geofence.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-400">
                    {searchTerm ? 'No geofences found matching your search' : 'No geofences available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Geofence Modal */}
      <GeofenceModal 
        open={isGeofenceModalOpen} 
        onOpenChange={(open) => {
          setIsGeofenceModalOpen(open);
          if (!open) {
            setGeofenceCoordinates(null);
            drawnItemsRef.current.clearLayers();
          }
        }}
        vehicles={vehicles}
        onDrawStart={handleDrawStart}
        coordinates={geofenceCoordinates}
      />
    </AppLayout>
  );
};

export default GeofencesPage;

