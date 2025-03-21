import { 
  User, InsertUser, 
  Vehicle, InsertVehicle, 
  VehicleStatus, InsertVehicleStatus,
  Driver, InsertDriver,
  Trip, InsertTrip,
  Geofence, InsertGeofence,
  GeofenceVehicle, InsertGeofenceVehicle,
  Alert, InsertAlert
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Vehicle Status operations
  getVehicleStatuses(): Promise<VehicleStatus[]>;
  getVehicleStatus(vehicleId: number): Promise<VehicleStatus | undefined>;
  createVehicleStatus(status: InsertVehicleStatus): Promise<VehicleStatus>;
  updateVehicleStatus(vehicleId: number, status: Partial<InsertVehicleStatus>): Promise<VehicleStatus | undefined>;
  
  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  
  // Trip operations
  getTrips(): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  getVehicleTrips(vehicleId: number): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  
  // Geofence operations
  getGeofences(): Promise<Geofence[]>;
  getGeofence(id: number): Promise<Geofence | undefined>;
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  updateGeofence(id: number, geofence: Partial<InsertGeofence>): Promise<Geofence | undefined>;
  deleteGeofence(id: number): Promise<boolean>;
  
  // GeofenceVehicle operations
  getGeofenceVehicles(geofenceId: number): Promise<GeofenceVehicle[]>;
  createGeofenceVehicle(geofenceVehicle: InsertGeofenceVehicle): Promise<GeofenceVehicle>;
  deleteGeofenceVehicle(geofenceId: number, vehicleId: number): Promise<boolean>;
  
  // Alert operations
  getAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  getVehicleAlerts(vehicleId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private vehicleStatuses: Map<number, VehicleStatus>;
  private drivers: Map<number, Driver>;
  private trips: Map<number, Trip>;
  private geofences: Map<number, Geofence>;
  private geofenceVehicles: Map<number, GeofenceVehicle>;
  private alerts: Map<number, Alert>;
  
  private userCurrentId: number;
  private vehicleCurrentId: number;
  private vehicleStatusCurrentId: number;
  private driverCurrentId: number;
  private tripCurrentId: number;
  private geofenceCurrentId: number;
  private geofenceVehicleCurrentId: number;
  private alertCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.vehicleStatuses = new Map();
    this.drivers = new Map();
    this.trips = new Map();
    this.geofences = new Map();
    this.geofenceVehicles = new Map();
    this.alerts = new Map();
    
    this.userCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.vehicleStatusCurrentId = 1;
    this.driverCurrentId = 1;
    this.tripCurrentId = 1;
    this.geofenceCurrentId = 1;
    this.geofenceVehicleCurrentId = 1;
    this.alertCurrentId = 1;
    
    // Create admin user
    this.createUser({
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'Admin User',
      email: 'admin@example.com'
    });
    
    // Create sample drivers
    this.createDriver({
      name: 'John Doe',
      phone: '555-1234',
      license: 'DL12345'
    });
    
    this.createDriver({
      name: 'Mike Smith',
      phone: '555-5678',
      license: 'DL67890'
    });
    
    this.createDriver({
      name: 'Sarah Johnson',
      phone: '555-9101',
      license: 'DL24680'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      (vehicle) => vehicle.vehicleId === vehicleId,
    );
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const createdAt = new Date();
    const vehicle: Vehicle = { ...insertVehicle, id, createdAt };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  
  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle = { ...vehicle, ...updates };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }
  
  // Vehicle Status operations
  async getVehicleStatuses(): Promise<VehicleStatus[]> {
    return Array.from(this.vehicleStatuses.values());
  }
  
  async getVehicleStatus(vehicleId: number): Promise<VehicleStatus | undefined> {
    return Array.from(this.vehicleStatuses.values()).find(
      (status) => status.vehicleId === vehicleId,
    );
  }
  
  async createVehicleStatus(insertStatus: InsertVehicleStatus): Promise<VehicleStatus> {
    const id = this.vehicleStatusCurrentId++;
    const timestamp = new Date();
    const lastUpdateTime = new Date();
    const status: VehicleStatus = { ...insertStatus, id, timestamp, lastUpdateTime };
    this.vehicleStatuses.set(id, status);
    return status;
  }
  
  async updateVehicleStatus(vehicleId: number, updates: Partial<InsertVehicleStatus>): Promise<VehicleStatus | undefined> {
    const currentStatus = Array.from(this.vehicleStatuses.values()).find(
      (status) => status.vehicleId === vehicleId,
    );
    
    if (!currentStatus) return undefined;
    
    const updatedStatus = { 
      ...currentStatus, 
      ...updates, 
      lastUpdateTime: new Date() 
    };
    
    this.vehicleStatuses.set(currentStatus.id, updatedStatus);
    return updatedStatus;
  }
  
  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }
  
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }
  
  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverCurrentId++;
    const driver: Driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    return driver;
  }
  
  // Trip operations
  async getTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values());
  }
  
  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }
  
  async getVehicleTrips(vehicleId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.vehicleId === vehicleId,
    );
  }
  
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.tripCurrentId++;
    const trip: Trip = { ...insertTrip, id };
    this.trips.set(id, trip);
    return trip;
  }
  
  async updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { ...trip, ...updates };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }
  
  // Geofence operations
  async getGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values());
  }
  
  async getGeofence(id: number): Promise<Geofence | undefined> {
    return this.geofences.get(id);
  }
  
  async createGeofence(insertGeofence: InsertGeofence): Promise<Geofence> {
    const id = this.geofenceCurrentId++;
    const createdAt = new Date();
    const geofence: Geofence = { ...insertGeofence, id, createdAt };
    this.geofences.set(id, geofence);
    return geofence;
  }
  
  async updateGeofence(id: number, updates: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;
    
    const updatedGeofence = { ...geofence, ...updates };
    this.geofences.set(id, updatedGeofence);
    return updatedGeofence;
  }
  
  async deleteGeofence(id: number): Promise<boolean> {
    return this.geofences.delete(id);
  }
  
  // GeofenceVehicle operations
  async getGeofenceVehicles(geofenceId: number): Promise<GeofenceVehicle[]> {
    return Array.from(this.geofenceVehicles.values()).filter(
      (gv) => gv.geofenceId === geofenceId,
    );
  }
  
  async createGeofenceVehicle(insertGeofenceVehicle: InsertGeofenceVehicle): Promise<GeofenceVehicle> {
    const id = this.geofenceVehicleCurrentId++;
    const geofenceVehicle: GeofenceVehicle = { ...insertGeofenceVehicle, id };
    this.geofenceVehicles.set(id, geofenceVehicle);
    return geofenceVehicle;
  }
  
  async deleteGeofenceVehicle(geofenceId: number, vehicleId: number): Promise<boolean> {
    const geofenceVehicle = Array.from(this.geofenceVehicles.values()).find(
      (gv) => gv.geofenceId === geofenceId && gv.vehicleId === vehicleId,
    );
    
    if (!geofenceVehicle) return false;
    
    return this.geofenceVehicles.delete(geofenceVehicle.id);
  }
  
  // Alert operations
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }
  
  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }
  
  async getVehicleAlerts(vehicleId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.vehicleId === vehicleId,
    );
  }
  
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.alertCurrentId++;
    const timestamp = new Date();
    const isRead = false;
    const alert: Alert = { ...insertAlert, id, timestamp, isRead };
    this.alerts.set(id, alert);
    return alert;
  }
  
  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, isRead: true };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }
  
  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }
}

export const storage = new MemStorage();
