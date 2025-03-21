import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  name: text("name"),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  email: true,
});

// Vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vehicleId: text("vehicleId").notNull().unique(),
  type: text("type").notNull(),
  registrationNumber: text("registrationNumber"),
  driverId: integer("driverId").references(() => drivers.id),
  gpsDeviceId: text("gpsDeviceId"),
  createdAt: timestamp("createdAt").defaultNow(),
  notes: text("notes"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  name: true,
  vehicleId: true,
  type: true,
  registrationNumber: true,
  driverId: true,
  gpsDeviceId: true,
  notes: true,
});

// Vehicle Status schema
export const vehicleStatus = pgTable("vehicleStatus", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id),
  timestamp: timestamp("timestamp").defaultNow(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  speed: real("speed"),
  heading: real("heading"),
  altitude: real("altitude"),
  ignition: boolean("ignition"),
  fuelLevel: real("fuelLevel"),
  batteryLevel: real("batteryLevel"),
  status: text("status").notNull(), // active, idle, offline
  lastUpdateTime: timestamp("lastUpdateTime").defaultNow(),
});

export const insertVehicleStatusSchema = createInsertSchema(vehicleStatus).pick({
  vehicleId: true,
  latitude: true,
  longitude: true,
  speed: true,
  heading: true,
  altitude: true,
  ignition: true,
  fuelLevel: true,
  batteryLevel: true,
  status: true,
});

// Driver schema
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  license: text("license"),
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  phone: true,
  license: true,
});

// Trip schema
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  startLatitude: real("startLatitude").notNull(),
  startLongitude: real("startLongitude").notNull(),
  endLatitude: real("endLatitude"),
  endLongitude: real("endLongitude"),
  distance: real("distance"),
  routeData: jsonb("routeData"),
  status: text("status").notNull(), // ongoing, completed
});

export const insertTripSchema = createInsertSchema(trips).pick({
  vehicleId: true,
  startTime: true,
  endTime: true,
  startLatitude: true,
  startLongitude: true,
  endLatitude: true,
  endLongitude: true,
  distance: true,
  routeData: true,
  status: true,
});

// Geofence schema
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // circle, polygon, rectangle
  coordinates: jsonb("coordinates").notNull(),
  color: text("color"),
  alertOnEnter: boolean("alertOnEnter").default(true),
  alertOnExit: boolean("alertOnExit").default(true),
  alertOnSpeed: boolean("alertOnSpeed").default(false),
  speedLimit: real("speedLimit"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertGeofenceSchema = createInsertSchema(geofences).pick({
  name: true,
  type: true,
  coordinates: true,
  color: true,
  alertOnEnter: true,
  alertOnExit: true,
  alertOnSpeed: true,
  speedLimit: true,
});

// GeofenceVehicle relation schema
export const geofenceVehicles = pgTable("geofenceVehicles", {
  id: serial("id").primaryKey(),
  geofenceId: integer("geofenceId").notNull().references(() => geofences.id),
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id),
});

export const insertGeofenceVehicleSchema = createInsertSchema(geofenceVehicles).pick({
  geofenceId: true,
  vehicleId: true,
});

// Alert schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // speed, geofence, ignition, battery
  vehicleId: integer("vehicleId").notNull().references(() => vehicles.id),
  geofenceId: integer("geofenceId").references(() => geofences.id),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  priority: text("priority").notNull(), // high, medium, low
  isRead: boolean("isRead").default(false),
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  type: true,
  vehicleId: true,
  geofenceId: true,
  message: true,
  latitude: true,
  longitude: true,
  priority: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertVehicleStatus = z.infer<typeof insertVehicleStatusSchema>;
export type VehicleStatus = typeof vehicleStatus.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type Geofence = typeof geofences.$inferSelect;

export type InsertGeofenceVehicle = z.infer<typeof insertGeofenceVehicleSchema>;
export type GeofenceVehicle = typeof geofenceVehicles.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
