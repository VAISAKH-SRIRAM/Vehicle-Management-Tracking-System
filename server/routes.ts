import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertVehicleSchema, 
  insertVehicleStatusSchema,
  insertDriverSchema,
  insertTripSchema,
  insertGeofenceSchema,
  insertGeofenceVehicleSchema,
  insertAlertSchema 
} from "@shared/schema";
import { randomUUID } from "crypto";

interface Client {
  id: string;
  socket: WebSocket;
}

let clients: Client[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (socket) => {
    const clientId = randomUUID();
    clients.push({ id: clientId, socket });
    
    console.log(`Client connected: ${clientId}`);
    
    // Send initial state
    const initialState = async () => {
      try {
        const vehicles = await storage.getVehicles();
        const vehicleStatuses = await storage.getVehicleStatuses();
        const geofences = await storage.getGeofences();
        const alerts = await storage.getAlerts();
        
        const message = JSON.stringify({
          type: 'initialState',
          vehicles,
          vehicleStatuses,
          geofences,
          alerts
        });
        
        socket.send(message);
      } catch (error) {
        console.error('Error sending initial state:', error);
      }
    };
    
    initialState();
    
    socket.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'updateVehicleLocation') {
          const { vehicleId, latitude, longitude, speed, heading } = message;
          
          const status = await storage.getVehicleStatus(vehicleId);
          
          // Update or create vehicle status
          if (status) {
            await storage.updateVehicleStatus(vehicleId, {
              latitude,
              longitude,
              speed,
              heading,
              status: 'active'
            });
          } else {
            await storage.createVehicleStatus({
              vehicleId,
              latitude,
              longitude,
              speed,
              heading,
              status: 'active'
            });
          }
          
          // Broadcast update to all connected clients
          broadcastToClients({
            type: 'vehicleLocationUpdate',
            vehicleId,
            latitude,
            longitude,
            speed,
            heading,
            status: 'active',
            lastUpdateTime: new Date()
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    socket.on('close', () => {
      clients = clients.filter(client => client.id !== clientId);
      console.log(`Client disconnected: ${clientId}`);
    });
  });
  
  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(messageStr);
      }
    });
  }
  
  // Authentication routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // In a real app, use JWT or sessions for auth
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'An error occurred during login' });
    }
  });
  
  // Vehicle routes
  app.get('/api/vehicles', async (_req: Request, res: Response) => {
    try {
      const vehicles = await storage.getVehicles();
      return res.json(vehicles);
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return res.status(500).json({ message: 'Failed to get vehicles' });
    }
  });
  
  app.get('/api/vehicles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      return res.json(vehicle);
    } catch (error) {
      console.error('Error getting vehicle:', error);
      return res.status(500).json({ message: 'Failed to get vehicle' });
    }
  });
  
  app.post('/api/vehicles', async (req: Request, res: Response) => {
    try {
      const validationResult = insertVehicleSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid vehicle data', errors: validationResult.error.errors });
      }
      
      const newVehicle = await storage.createVehicle(validationResult.data);
      
      // Create initial vehicle status if lat/long provided
      if (req.body.latitude && req.body.longitude) {
        await storage.createVehicleStatus({
          vehicleId: newVehicle.id,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          status: 'idle'
        });
      }
      
      // Broadcast new vehicle to all clients
      broadcastToClients({
        type: 'vehicleCreated',
        vehicle: newVehicle
      });
      
      return res.status(201).json(newVehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return res.status(500).json({ message: 'Failed to create vehicle' });
    }
  });
  
  app.put('/api/vehicles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      const validationResult = insertVehicleSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid vehicle data', errors: validationResult.error.errors });
      }
      
      const updatedVehicle = await storage.updateVehicle(id, validationResult.data);
      
      // Broadcast updated vehicle to all clients
      broadcastToClients({
        type: 'vehicleUpdated',
        vehicle: updatedVehicle
      });
      
      return res.json(updatedVehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return res.status(500).json({ message: 'Failed to update vehicle' });
    }
  });
  
  app.delete('/api/vehicles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      await storage.deleteVehicle(id);
      
      // Broadcast vehicle deleted to all clients
      broadcastToClients({
        type: 'vehicleDeleted',
        vehicleId: id
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return res.status(500).json({ message: 'Failed to delete vehicle' });
    }
  });
  
  // Vehicle Status routes
  app.get('/api/vehicle-status', async (_req: Request, res: Response) => {
    try {
      const vehicleStatuses = await storage.getVehicleStatuses();
      return res.json(vehicleStatuses);
    } catch (error) {
      console.error('Error getting vehicle statuses:', error);
      return res.status(500).json({ message: 'Failed to get vehicle statuses' });
    }
  });
  
  app.get('/api/vehicle-status/:vehicleId', async (req: Request, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const status = await storage.getVehicleStatus(vehicleId);
      
      if (!status) {
        return res.status(404).json({ message: 'Vehicle status not found' });
      }
      
      return res.json(status);
    } catch (error) {
      console.error('Error getting vehicle status:', error);
      return res.status(500).json({ message: 'Failed to get vehicle status' });
    }
  });
  
  app.post('/api/vehicle-status', async (req: Request, res: Response) => {
    try {
      const validationResult = insertVehicleStatusSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid vehicle status data', errors: validationResult.error.errors });
      }
      
      const vehicleId = validationResult.data.vehicleId;
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      const existingStatus = await storage.getVehicleStatus(vehicleId);
      let newStatus;
      
      if (existingStatus) {
        newStatus = await storage.updateVehicleStatus(vehicleId, validationResult.data);
      } else {
        newStatus = await storage.createVehicleStatus(validationResult.data);
      }
      
      // Broadcast status update to all clients
      broadcastToClients({
        type: 'vehicleStatusUpdated',
        vehicleStatus: newStatus
      });
      
      return res.status(201).json(newStatus);
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      return res.status(500).json({ message: 'Failed to update vehicle status' });
    }
  });
  
  // Driver routes
  app.get('/api/drivers', async (_req: Request, res: Response) => {
    try {
      const drivers = await storage.getDrivers();
      return res.json(drivers);
    } catch (error) {
      console.error('Error getting drivers:', error);
      return res.status(500).json({ message: 'Failed to get drivers' });
    }
  });
  
  app.post('/api/drivers', async (req: Request, res: Response) => {
    try {
      const validationResult = insertDriverSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid driver data', errors: validationResult.error.errors });
      }
      
      const newDriver = await storage.createDriver(validationResult.data);
      return res.status(201).json(newDriver);
    } catch (error) {
      console.error('Error creating driver:', error);
      return res.status(500).json({ message: 'Failed to create driver' });
    }
  });
  
  // Trip routes
  app.get('/api/trips', async (_req: Request, res: Response) => {
    try {
      const trips = await storage.getTrips();
      return res.json(trips);
    } catch (error) {
      console.error('Error getting trips:', error);
      return res.status(500).json({ message: 'Failed to get trips' });
    }
  });
  
  app.get('/api/trips/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      return res.json(trip);
    } catch (error) {
      console.error('Error getting trip:', error);
      return res.status(500).json({ message: 'Failed to get trip' });
    }
  });
  
  app.get('/api/vehicles/:vehicleId/trips', async (req: Request, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const trips = await storage.getVehicleTrips(vehicleId);
      return res.json(trips);
    } catch (error) {
      console.error('Error getting vehicle trips:', error);
      return res.status(500).json({ message: 'Failed to get vehicle trips' });
    }
  });
  
  app.post('/api/trips', async (req: Request, res: Response) => {
    try {
      const validationResult = insertTripSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid trip data', errors: validationResult.error.errors });
      }
      
      const newTrip = await storage.createTrip(validationResult.data);
      
      // Broadcast new trip to all clients
      broadcastToClients({
        type: 'tripCreated',
        trip: newTrip
      });
      
      return res.status(201).json(newTrip);
    } catch (error) {
      console.error('Error creating trip:', error);
      return res.status(500).json({ message: 'Failed to create trip' });
    }
  });
  
  app.put('/api/trips/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      const validationResult = insertTripSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid trip data', errors: validationResult.error.errors });
      }
      
      const updatedTrip = await storage.updateTrip(id, validationResult.data);
      
      // Broadcast updated trip to all clients
      broadcastToClients({
        type: 'tripUpdated',
        trip: updatedTrip
      });
      
      return res.json(updatedTrip);
    } catch (error) {
      console.error('Error updating trip:', error);
      return res.status(500).json({ message: 'Failed to update trip' });
    }
  });
  
  // Geofence routes
  app.get('/api/geofences', async (_req: Request, res: Response) => {
    try {
      const geofences = await storage.getGeofences();
      return res.json(geofences);
    } catch (error) {
      console.error('Error getting geofences:', error);
      return res.status(500).json({ message: 'Failed to get geofences' });
    }
  });
  
  app.get('/api/geofences/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const geofence = await storage.getGeofence(id);
      
      if (!geofence) {
        return res.status(404).json({ message: 'Geofence not found' });
      }
      
      return res.json(geofence);
    } catch (error) {
      console.error('Error getting geofence:', error);
      return res.status(500).json({ message: 'Failed to get geofence' });
    }
  });
  
  app.post('/api/geofences', async (req: Request, res: Response) => {
    try {
      const validationResult = insertGeofenceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid geofence data', errors: validationResult.error.errors });
      }
      
      const newGeofence = await storage.createGeofence(validationResult.data);
      
      // Assign vehicles to geofence if provided
      if (req.body.vehicleIds && Array.isArray(req.body.vehicleIds)) {
        for (const vehicleId of req.body.vehicleIds) {
          await storage.createGeofenceVehicle({
            geofenceId: newGeofence.id,
            vehicleId
          });
        }
      }
      
      // Broadcast new geofence to all clients
      broadcastToClients({
        type: 'geofenceCreated',
        geofence: newGeofence
      });
      
      return res.status(201).json(newGeofence);
    } catch (error) {
      console.error('Error creating geofence:', error);
      return res.status(500).json({ message: 'Failed to create geofence' });
    }
  });
  
  app.put('/api/geofences/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const geofence = await storage.getGeofence(id);
      
      if (!geofence) {
        return res.status(404).json({ message: 'Geofence not found' });
      }
      
      const validationResult = insertGeofenceSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid geofence data', errors: validationResult.error.errors });
      }
      
      const updatedGeofence = await storage.updateGeofence(id, validationResult.data);
      
      // Broadcast updated geofence to all clients
      broadcastToClients({
        type: 'geofenceUpdated',
        geofence: updatedGeofence
      });
      
      return res.json(updatedGeofence);
    } catch (error) {
      console.error('Error updating geofence:', error);
      return res.status(500).json({ message: 'Failed to update geofence' });
    }
  });
  
  app.delete('/api/geofences/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const geofence = await storage.getGeofence(id);
      
      if (!geofence) {
        return res.status(404).json({ message: 'Geofence not found' });
      }
      
      await storage.deleteGeofence(id);
      
      // Broadcast geofence deleted to all clients
      broadcastToClients({
        type: 'geofenceDeleted',
        geofenceId: id
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting geofence:', error);
      return res.status(500).json({ message: 'Failed to delete geofence' });
    }
  });
  
  // Alert routes
  app.get('/api/alerts', async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getAlerts();
      return res.json(alerts);
    } catch (error) {
      console.error('Error getting alerts:', error);
      return res.status(500).json({ message: 'Failed to get alerts' });
    }
  });
  
  app.get('/api/alerts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      return res.json(alert);
    } catch (error) {
      console.error('Error getting alert:', error);
      return res.status(500).json({ message: 'Failed to get alert' });
    }
  });
  
  app.get('/api/vehicles/:vehicleId/alerts', async (req: Request, res: Response) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const alerts = await storage.getVehicleAlerts(vehicleId);
      return res.json(alerts);
    } catch (error) {
      console.error('Error getting vehicle alerts:', error);
      return res.status(500).json({ message: 'Failed to get vehicle alerts' });
    }
  });
  
  app.post('/api/alerts', async (req: Request, res: Response) => {
    try {
      const validationResult = insertAlertSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ message: 'Invalid alert data', errors: validationResult.error.errors });
      }
      
      const newAlert = await storage.createAlert(validationResult.data);
      
      // Broadcast new alert to all clients
      broadcastToClients({
        type: 'alertCreated',
        alert: newAlert
      });
      
      return res.status(201).json(newAlert);
    } catch (error) {
      console.error('Error creating alert:', error);
      return res.status(500).json({ message: 'Failed to create alert' });
    }
  });
  
  app.put('/api/alerts/:id/read', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      const updatedAlert = await storage.markAlertAsRead(id);
      
      // Broadcast alert update to all clients
      broadcastToClients({
        type: 'alertUpdated',
        alert: updatedAlert
      });
      
      return res.json(updatedAlert);
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return res.status(500).json({ message: 'Failed to mark alert as read' });
    }
  });
  
  app.delete('/api/alerts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.getAlert(id);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      await storage.deleteAlert(id);
      
      // Broadcast alert deleted to all clients
      broadcastToClients({
        type: 'alertDeleted',
        alertId: id
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting alert:', error);
      return res.status(500).json({ message: 'Failed to delete alert' });
    }
  });
  
  return httpServer;
}
