import { useState, useEffect } from 'react';
import { Trip, Vehicle } from '@shared/schema';
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TripHistoryProps {
  trips: Trip[];
  vehicles: Vehicle[];
  onViewTripDetails?: (trip: Trip) => void;
}

const TripHistory = ({ trips, vehicles, onViewTripDetails }: TripHistoryProps) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>(trips);

  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredTrips(trips);
      return;
    }

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    setFilteredTrips(trips.filter(trip => {
      const tripStart = new Date(trip.startTime);
      return tripStart >= start && tripStart <= end;
    }));
  }, [startDate, endDate, trips]);

  return (
    <div className="flex flex-col h-full bg-white shadow-md rounded-lg">
      {/* Filter Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Recent Trips</h3>
        <div className="flex gap-2">
          <Input 
            type="date" 
            className="w-full border p-2 rounded-lg text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input 
            type="date" 
            className="w-full border p-2 rounded-lg text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button className="bg-primary text-white p-2 rounded-lg">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trip List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {filteredTrips.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No trips found</div>
        ) : (
          filteredTrips.map(trip => (
            <div 
              key={trip.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
              onClick={() => onViewTripDetails && onViewTripDetails(trip)}
            >
              <h3 className="font-medium">{trip.distance} km</h3>
              <span className="text-sm text-gray-500">{trip.startTime}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TripHistory;

