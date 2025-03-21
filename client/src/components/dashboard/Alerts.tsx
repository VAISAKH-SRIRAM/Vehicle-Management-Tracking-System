import { useState } from 'react';
import { Alert, Vehicle } from '@shared/schema';
import { AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const Alerts = ({ alerts, vehicles, onViewAlertDetails }) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-white shadow-md rounded-lg">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Recent Alerts</h3>
        <Button variant="ghost" size="sm" className="text-primary">
          Mark All as Read
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No alerts</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="p-4 hover:bg-gray-50 flex justify-between">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <div className="flex-1 ml-3">
                <h4 className="font-medium">{alert.type} Alert</h4>
                <p className="text-sm text-gray-500">{alert.message}</p>
              </div>
              <span className="text-sm text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;

