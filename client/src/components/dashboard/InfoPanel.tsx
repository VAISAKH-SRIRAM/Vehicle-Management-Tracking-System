import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleList from './VehicleList';
import Alerts from './Alerts';
import TripHistory from './TripHistory';

const InfoPanel = ({ vehicles, vehicleStatuses, alerts, trips, onVehicleSelect, selectedVehicleId, onViewTripDetails, onViewAlertDetails }) => {
  const [activeTab, setActiveTab] = useState('vehicles');

  return (
    <div className="w-96 bg-white shadow-lg rounded-lg flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex border-b border-gray-200 p-0">
          {['Vehicles', 'Trips', 'Alerts'].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase()} className="flex-1 py-3 text-center font-medium">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="vehicles" className="flex-1 overflow-hidden">
          <VehicleList vehicles={vehicles} vehicleStatuses={vehicleStatuses} onVehicleSelect={onVehicleSelect} selectedVehicleId={selectedVehicleId} />
        </TabsContent>

        <TabsContent value="trips" className="flex-1 overflow-hidden">
          <TripHistory trips={trips} vehicles={vehicles} onViewTripDetails={onViewTripDetails} />
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 overflow-hidden">
          <Alerts alerts={alerts} vehicles={vehicles} onViewAlertDetails={onViewAlertDetails} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InfoPanel;

