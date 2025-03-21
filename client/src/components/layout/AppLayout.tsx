import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from './Header';
import Sidebar from './Sidebar';
import { useToast } from "@/hooks/use-toast";
import { webSocketService } from '@/lib/websocket';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [alertCount, setAlertCount] = useState<number>(0);
  
  // Get the page title based on the current location
  const getPageTitle = () => {
    const path = location.split('/')[1];
    switch (path) {
      case '':
        return 'Vehicle Monitoring Dashboard';
      case 'live-tracking':
        return 'Live Tracking';
      case 'vehicles':
        return 'Vehicle Management';
      case 'geofences':
        return 'Geofences';
      case 'reports':
        return 'Reports';
      case 'alerts':
        return 'Alerts';
      case 'settings':
        return 'System Settings';
      case 'help':
        return 'Help & Support';
      default:
        return 'VMAT System';
    }
  };
  
  // Handle websocket alerts
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'alertCreated') {
        setAlertCount(prevCount => prevCount + 1);
        
        // Show toast notification for new alert
        toast({
          title: message.alert.type.charAt(0).toUpperCase() + message.alert.type.slice(1) + ' Alert',
          description: message.alert.message,
          variant: message.alert.priority === 'high' ? 'destructive' : (
            message.alert.priority === 'medium' ? 'default' : 'secondary'
          ),
        });
      }
    };
    
    webSocketService.addListener(handleWebSocketMessage);
    
    return () => {
      webSocketService.removeListener(handleWebSocketMessage);
    };
  }, [toast]);
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header title="VMAT System" user={{ name: 'Admin User', role: 'admin' }} alertCount={alertCount} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={location.split('/')[1] || 'dashboard'} alertCount={alertCount} />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white shadow-sm p-4 flex items-center justify-between">
            <h2 className="text-xl font-medium text-neutral-500">{getPageTitle()}</h2>
            
            {/* Action buttons specific to each page can be included here */}
            {location === '/' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-2 text-sm">
                  <span className="material-icons text-neutral-400 text-sm">calendar_today</span>
                  <span className="text-neutral-500">Today</span>
                  <span className="material-icons text-neutral-400 text-sm">arrow_drop_down</span>
                </div>
              </div>
            )}
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
