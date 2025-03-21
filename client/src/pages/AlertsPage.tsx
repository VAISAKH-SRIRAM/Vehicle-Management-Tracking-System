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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, Vehicle } from '@shared/schema';
import { 
  Search, 
  Bell, 
  Clock, 
  MapPin, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  Clock3 
} from 'lucide-react';
import { webSocketService } from '@/lib/websocket';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const { toast } = useToast();

  // Fetch alerts
  const { data: alertData, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    onSuccess: (data) => setAlerts(data || [])
  });

  // Fetch vehicles for reference
  const { data: vehicleData } = useQuery({
    queryKey: ['/api/vehicles'],
    onSuccess: (data) => setVehicles(data || [])
  });

  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
        case 'alertCreated':
          setAlerts(prev => [message.alert, ...prev]);
          break;
        case 'alertUpdated':
          setAlerts(prev => 
            prev.map(a => a.id === message.alert.id ? message.alert : a)
          );
          break;
        case 'alertDeleted':
          setAlerts(prev => prev.filter(a => a.id !== message.alertId));
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

  // Mark alert as read
  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await apiRequest('PUT', `/api/alerts/${id}/read`, {});
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        toast({
          title: 'Alert marked as read',
          description: 'The alert has been marked as read'
        });
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark alert as read',
        variant: 'destructive'
      });
    }
  };

  // Mark all alerts as read
  const handleMarkAllAsRead = async () => {
    try {
      // Filter unread alerts
      const unreadAlerts = alerts.filter(alert => !alert.isRead);
      
      if (unreadAlerts.length === 0) {
        toast({
          title: 'No unread alerts',
          description: 'There are no unread alerts to mark'
        });
        return;
      }
      
      // Mark each unread alert as read
      await Promise.all(
        unreadAlerts.map(alert => 
          apiRequest('PUT', `/api/alerts/${alert.id}/read`, {})
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: 'All alerts marked as read',
        description: `${unreadAlerts.length} alerts have been marked as read`
      });
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark alerts as read',
        variant: 'destructive'
      });
    }
  };

  // Get vehicle name by ID
  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : `Vehicle ${vehicleId}`;
  };

  // Format time
  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1m ago';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1h ago';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  // Filter alerts based on criteria
  const filteredAlerts = alerts.filter(alert => {
    // Filter by search term
    const matchesSearch = 
      searchTerm === '' || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleName(alert.vehicleId).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by priority
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    
    // Filter by type
    const matchesType = filterType === 'all' || alert.type === filterType;
    
    // Filter by read status
    const matchesRead = 
      filterRead === 'all' || 
      (filterRead === 'read' && alert.isRead) || 
      (filterRead === 'unread' && !alert.isRead);
    
    return matchesSearch && matchesPriority && matchesType && matchesRead;
  });

  // Get alert type icon
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'speed':
        return <span className="material-icons">speed</span>;
      case 'geofence':
        return <span className="material-icons">fence</span>;
      case 'ignition':
        return <span className="material-icons">power_settings_new</span>;
      case 'battery':
        return <span className="material-icons">battery_alert</span>;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  // Get alert priority color
  const getAlertPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'low':
        return 'bg-neutral-200 text-neutral-700';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  // Get alert count summary
  const getAlertSummary = () => {
    const unreadCount = alerts.filter(a => !a.isRead).length;
    const highPriorityCount = alerts.filter(a => a.priority === 'high').length;
    const mediumPriorityCount = alerts.filter(a => a.priority === 'medium').length;
    const lowPriorityCount = alerts.filter(a => a.priority === 'low').length;
    
    return { unreadCount, highPriorityCount, mediumPriorityCount, lowPriorityCount };
  };

  const alertSummary = getAlertSummary();

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
          
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={alertSummary.unreadCount === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Unread Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alertSummary.unreadCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-error">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alertSummary.highPriorityCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-warning">Medium Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alertSummary.mediumPriorityCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-neutral-500">Low Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alertSummary.lowPriorityCount}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            </div>
            
            <div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="speed">Speed</SelectItem>
                  <SelectItem value="geofence">Geofence</SelectItem>
                  <SelectItem value="ignition">Ignition</SelectItem>
                  <SelectItem value="battery">Battery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <Clock3 className="h-8 w-8 text-neutral-300 animate-spin mb-2" />
                      <span className="text-neutral-500">Loading alerts...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={!alert.isRead ? 'bg-neutral-50' : ''}>
                    <TableCell>
                      {!alert.isRead ? (
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 text-primary mr-2" />
                          <span>New</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-neutral-400 mr-2" />
                          <span className="text-neutral-500">Read</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${
                          alert.priority === 'high' ? 'bg-error bg-opacity-20' : 
                          alert.priority === 'medium' ? 'bg-warning bg-opacity-20' :
                          'bg-neutral-200'
                        } flex items-center justify-center ${
                          alert.priority === 'high' ? 'text-error' : 
                          alert.priority === 'medium' ? 'text-warning' :
                          'text-neutral-500'
                        } mr-2`}>
                          {getAlertTypeIcon(alert.type)}
                        </div>
                        <span className="capitalize">{alert.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getVehicleName(alert.vehicleId)}</TableCell>
                    <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getAlertPriorityColor(alert.priority)}`}>
                        {alert.priority.charAt(0).toUpperCase() + alert.priority.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-neutral-400 mr-2" />
                        {formatTime(alert.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {alert.latitude && alert.longitude && (
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <MapPin className="h-4 w-4" />
                          </Button>
                        )}
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleMarkAsRead(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                    {searchTerm || filterPriority !== 'all' || filterType !== 'all' || filterRead !== 'all' ? 
                      'No alerts match your search criteria' : 
                      'No alerts available'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AlertsPage;
