// NOTE: You need to install socket.io-client with: yarn add socket.io-client @types/socket.io-client
import { io, Socket } from 'socket.io-client';
import { RequestData } from '../models/RequestData';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected, no need to reconnect');
      return;
    }
    
    if (this.socket) {
      console.log('Cleaning up existing socket before creating a new one');
      this.socket.close();
      this.socket = null;
    }

    // Reset reconnect attempts
    this.reconnectAttempts = 0;
    
    // Connect to the local server explicitly on port 3000
    // Use secure connection (https/wss) since your server is using HTTPS
    console.log('Attempting to connect to socket.io server at https://localhost:3000');
    this.socket = io('https://localhost:3000', {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      secure: true,
      rejectUnauthorized: false, // Allow self-signed certificates in development
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000 // 10 seconds connection timeout
    });

    this.socket.on('connect', () => {
      console.log('Connected to server with ID:', this.socket?.id);
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      this.socket?.emit('client-ready', { clientId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server, reason:', reason);
    });

    this.socket.on('new-data', (data: RequestData) => {
      console.log('Received new data:', data);
      this.notifyListeners('new-data', data);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err.message);
      // Add more detailed logging for debugging
      console.error('Socket connection error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      
      // Manual reconnect logic
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.socket?.connect();
        }, this.reconnectDelay);
      } else {
        console.error('Maximum reconnect attempts reached. Please check if the server is running.');
      }
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from socket server...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  addListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeListener(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Method to check if the server is available
  async checkServerAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://localhost:3000/api/data', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Server availability check failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default socketService;
