import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private orderSocket: Socket | null = null;
  private kitchenSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  
  connect(authToken: string, tableNumber: string) {
    const SOCKET_URL = process.env['REACT_APP_SOCKET_URL'] || 'https://api.gritservices.ae';
    
    const socketOptions = {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    };

    // Main socket
    this.socket = io(SOCKET_URL, socketOptions);
    
    // Order namespace
    this.orderSocket = io(`${SOCKET_URL}/orders`, socketOptions);
    
    // Kitchen namespace
    this.kitchenSocket = io(`${SOCKET_URL}/kitchen`, socketOptions);

    // Setup event handlers
    this.socket.on('connect', () => {
      console.log('✅ Main socket connected');
      this.socket?.emit('join-table', tableNumber);
    });

    this.orderSocket.on('connect', () => {
      console.log('✅ Order socket connected');
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

  onOrderStatusChange(callback: (data: any) => void) {
    this.orderSocket?.on('order-status-changed', callback);
  }

  onKitchenUpdate(callback: (data: any) => void) {
    this.orderSocket?.on('kitchen-update', callback);
  }

  onOrderReady(callback: (data: any) => void) {
    this.orderSocket?.on('order-ready', callback);
  }

  onTableStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('table-status-update', callback);
  }

  onMenuChanged(callback: () => void) {
    this.socket?.on('menu-changed', callback);
  }

  emitCustomerRequest(data: any) {
    if (this.socket?.connected) {
      this.socket.emit('customer-request', data);
      return true;
    } else if (this.orderSocket?.connected) {
      this.orderSocket.emit('customer-request', data);
      return true;
    }
    return false;
  }

  emitNewOrder(order: any) {
    if (this.orderSocket?.connected) {
      this.orderSocket.emit('new-order', order);
    }
  }

  emitOrderCancelled(data: { orderId: string; tableNumber: string }) {
    if (this.orderSocket?.connected) {
      this.orderSocket.emit('order-cancelled', data);
    }
  }

  isConnected() {
    return this.socket?.connected || this.orderSocket?.connected;
  }
}

export const socketService = new SocketService();