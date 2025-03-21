import { Vehicle, VehicleStatus, Geofence, Alert } from "@shared/schema";

type WebSocketMessage = 
  | { type: 'initialState', vehicles: Vehicle[], vehicleStatuses: VehicleStatus[], geofences: Geofence[], alerts: Alert[] }
  | { type: 'vehicleLocationUpdate', vehicleId: number, latitude: number, longitude: number, speed: number, heading: number, status: string, lastUpdateTime: Date }
  | { type: 'vehicleCreated', vehicle: Vehicle }
  | { type: 'vehicleUpdated', vehicle: Vehicle }
  | { type: 'vehicleDeleted', vehicleId: number }
  | { type: 'vehicleStatusUpdated', vehicleStatus: VehicleStatus }
  | { type: 'tripCreated', trip: any }
  | { type: 'tripUpdated', trip: any }
  | { type: 'geofenceCreated', geofence: Geofence }
  | { type: 'geofenceUpdated', geofence: Geofence }
  | { type: 'geofenceDeleted', geofenceId: number }
  | { type: 'alertCreated', alert: Alert }
  | { type: 'alertUpdated', alert: Alert }
  | { type: 'alertDeleted', alertId: number };

type MessageCallback = (message: WebSocketMessage) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: MessageCallback[] = [];
  private reconnectInterval: number = 3000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.connect();
  }
  
  private connect() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.scheduleReconnect();
    }
  }
  
  private handleOpen() {
    console.log("WebSocket connection established");
    this.reconnectAttempts = 0;
  }
  
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      this.notifyListeners(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }
  
  private handleClose() {
    console.log("WebSocket connection closed");
    this.scheduleReconnect();
  }
  
  private handleError(error: Event) {
    console.error("WebSocket error:", error);
    this.socket?.close();
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${++this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error("Max reconnect attempts reached");
    }
  }
  
  public addListener(callback: MessageCallback) {
    this.listeners.push(callback);
  }
  
  public removeListener(callback: MessageCallback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  private notifyListeners(message: WebSocketMessage) {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error("Error in WebSocket listener:", error);
      }
    });
  }
  
  public send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected, cannot send message");
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
