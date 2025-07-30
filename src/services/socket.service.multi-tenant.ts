import io, { Socket } from 'socket.io-client';
import { getCurrentTenant } from '../config/tenant.config';

class MultiTenantSocketService {
  private socket: Socket | null = null;
  private orderSocket: Socket | null = null;
  private kitchenSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  
  connect(authToken: string, tableNumber: string) {
    const tenant = getCurrentTenant();
    if (!tenant) {
      console.error('Cannot connect socket: No tenant identified');
      return;
    }

    const SOCKET_URL = process.env['REACT_APP_SOCKET_URL'] || 'http://localhost:5000';
    
    const socketOptions = {
      auth: { 
        token: authToken,
        tenantId: tenant.tenantId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      extraHeaders: {
        'X-Tenant-Id': tenant.tenantId
      }
    };

    // Main socket
    this.socket = io(SOCKET_URL, socketOptions);
    
    // Order namespace
    this.orderSocket = io(`${SOCKET_URL}/orders`, socketOptions);
    
    // Kitchen namespace
    this.kitchenSocket = io(`${SOCKET_URL}/kitchen`, socketOptions);

    // Setup event handlers
    this.socket.on('connect', () => {
      console.log('✅ Main socket connected for tenant:', tenant.name);
      this.socket?.emit('join-table', tableNumber);
    });

    this.orderSocket.on('connect', () => {
      console.log('✅ Order socket connected for tenant:', tenant.name);
      this.reconnectAttempts = 0;
      this.orderSocket?.emit('join-table', tableNumber);
    });

    this.orderSocket.on('connect_error', (error) => {
      console.error('❌ Order socket connection error:', error.message);
      this.reconnectAttempts++;
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.orderSocket?.disconnect();
    this.kitchenSocket?.disconnect();
    this.socket = null;
    this.orderSocket = null;
    this.kitchenSocket = null;
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  onOrderUpdate(callback: (data: any) => void) {
    this.orderSocket?.on('order-updated', callback);
  }

  offOrderUpdate(callback?: (data: any) => void) {
    this.orderSocket?.off('order-updated', callback);
  }

  onNewOrder(callback: (data: any) => void) {
    this.orderSocket?.on('new-order', callback);
  }

  offNewOrder(callback?: (data: any) => void) {
    this.orderSocket?.off('new-order', callback);
  }

  onOrderStatusChange(callback: (data: any) => void) {
    this.orderSocket?.on('order-status-changed', callback);
  }

  offOrderStatusChange(callback?: (data: any) => void) {
    this.orderSocket?.off('order-status-changed', callback);
  }

  emitTableOrder(data: any) {
    if (this.orderSocket?.connected) {
      this.orderSocket.emit('table-order', data);
    }
  }

  // Kitchen events
  onKitchenUpdate(callback: (data: any) => void) {
    this.kitchenSocket?.on('kitchen-update', callback);
  }

  offKitchenUpdate(callback?: (data: any) => void) {
    this.kitchenSocket?.off('kitchen-update', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Additional methods for compatibility
  onTableStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('table-status-update', callback);
  }

  onMenuChanged(callback: () => void) {
    this.socket?.on('menu-updated', callback);
  }

  emitCustomerRequest(data: any): boolean {
    if (this.socket?.connected) {
      this.socket.emit('customer-request', data);
      return true;
    }
    return false;
  }

  offTableStatusUpdate(callback?: (data: any) => void) {
    this.socket?.off('table-status-update', callback);
  }

  offMenuChanged(callback?: () => void) {
    this.socket?.off('menu-updated', callback);
  }

  onOrderReady(callback: (data: any) => void) {
    this.orderSocket?.on('order-ready', callback);
  }

  offOrderReady(callback?: (data: any) => void) {
    this.orderSocket?.off('order-ready', callback);
  }

  emitOrderCancelled(data: any) {
    if (this.orderSocket?.connected) {
      this.orderSocket.emit('order-cancelled', data);
    }
  }

  emitNewOrder(data: any) {
    if (this.orderSocket?.connected) {
      this.orderSocket.emit('new-order', data);
    }
  }
}

export const socketService = new MultiTenantSocketService();