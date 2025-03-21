import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Vehicle, VehicleStatus } from '@shared/schema';

interface VehicleListProps {
  vehicles: Vehicle[];
  vehicleStatuses: Record<number, VehicleStatus>;
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicleId?: number;
}

const VehicleList = ({ vehicles, vehicleStatuses, onVehicleSelect, selectedVehicleId }: VehicleListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(vehicles);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredVehicles(vehicles);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    setFilteredVehicles(vehicles.filter(vehicle => 
      vehicle.name.toLowerCase().includes(lowercasedSearch) || 
      vehicle.vehicleId.toLowerCase().includes(lowercasedSearch)
    ));
  }, [searchTerm, vehicles]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white shadow-md rounded-lg">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <Search className="text-gray-400 w-5 h-5" />
        <Input 
          type="text" 
          placeholder="Find a vehicle..." 
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {filteredVehicles.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No vehicles found</div>
        ) : (
          filteredVehicles.map(vehicle => (
            <div 
              key={vehicle.id} 
              className={`p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${selectedVehicleId === vehicle.id ? 'bg-gray-100' : ''}`}
              onClick={() => onVehicleSelect(vehicle)}
            >
              <h3 className="font-medium">{vehicle.name}</h3>
              <span className="text-sm text-gray-500">{vehicle.vehicleId}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VehicleList;

