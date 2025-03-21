import { useState, useEffect } from 'react';
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
import { Vehicle, VehicleStatus } from '@shared/schema';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import AddVehicleModal from '@/components/modals/AddVehicleModal';
import VehicleDetailsModal from '@/components/modals/VehicleDetailsModal';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStatuses, setVehicleStatuses] = useState<Record<number, VehicleStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>(undefined);
  const [isVehicleDetailsModalOpen, setIsVehicleDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch vehicles
  const { data: vehicleData } = useQuery({ 
    queryKey: ['/api/vehicles']
  });
  
  // Fetch vehicle statuses
  const { data: statusData } = useQuery({ 
    queryKey: ['/api/vehicle-status'] 
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
  }, [vehicleData, statusData]);
  
  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
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
        default:
          break;
      }
    };
    
    webSocketService.addListener(handleWebSocketMessage);
    
    return () => {
      webSocketService.removeListener(handleWebSocketMessage);
    };
  }, []);
  
  // Handle vehicle deletion
  const handleDeleteVehicle = async (id: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/vehicles/${id}`, undefined);
      
      if (response.ok) {
        toast({
          title: 'Vehicle deleted',
          description: 'Vehicle has been deleted successfully',
        });
        
        // Invalidate vehicles query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the vehicle',
        variant: 'destructive',
      });
    }
  };
  
  // Format last update time
  const formatLastUpdate = (time?: Date | string) => {
    if (!time) return 'N/A';
    
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };
  
  // Filter vehicles by search term
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.registrationNumber && vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Input 
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          </div>
          
          <Button onClick={() => setIsAddVehicleModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vehicle ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map(vehicle => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.name}</TableCell>
                    <TableCell>{vehicle.vehicleId}</TableCell>
                    <TableCell className="capitalize">{vehicle.type}</TableCell>
                    <TableCell>{vehicle.registrationNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          vehicleStatuses[vehicle.id]?.status === 'active' ? 'bg-secondary' :
                          vehicleStatuses[vehicle.id]?.status === 'idle' ? 'bg-warning' :
                          'bg-error'
                        }`}></span>
                        <span className="capitalize">
                          {vehicleStatuses[vehicle.id]?.status || 'Offline'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatLastUpdate(vehicleStatuses[vehicle.id]?.lastUpdateTime)}
                    </TableCell>
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setIsVehicleDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
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
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                    {searchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

export default VehiclesPage;
