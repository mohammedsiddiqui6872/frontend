import io, { Socket } from 'socket.io-client';
import { getCurrentTenant } from '../config/tenant.config';
import { getGuestSession } from '../config/guest-mode.config';

class GuestSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  
  connect(guestSessionId: string, tableNumber: string) {
    const tenant = getCurrentTenant();
    const guestSession = getGuestSession();
    
    if (!tenant || !guestSession) {
      
      return;
    }

    const SOCKET_URL = process.env['REACT_APP_SOCKET_URL'] || 'http://localhost:5000';
    
    const socketOptions = {
      auth: { 
        guestSessionId,
        tableNumber,
        tenantId: tenant.tenantId,
        deviceType: guestSession.deviceType
      },
      query: {
        table: tableNumber,
        guest: true
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      extraHeaders: {
        'X-Tenant-Id': tenant.tenantId,
        'X-Table-Number': tableNumber,
        'X-Guest-Session': guestSessionId
      }
    };

    // Main socket for guest
    this.socket = io(`${SOCKET_URL}/guest`, socketOptions);

    // Setup event handlers
    this.socket.on('connect', () => {
      
      this.socket?.emit('guest-join-table', { 
        tableNumber, 
        sessionId: guestSessionId,
        deviceType: guestSession.deviceType 
      });
    });

    this.socket.on('disconnect', (reason) => {
      
    });

    this.socket.on('reconnect', (attemptNumber) => {
      
    });

    this.socket.on('error', (error) => {
      
    });

    // Guest-specific events
    this.socket.on('waiter-assigned', (data) => {
      
    });

    this.socket.on('waiter-on-way', (data) => {
      
    });

    this.socket.on('order-update', (data) => {
      
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emit events
  emitCustomerRequest(data: {
    tableNumber: string;
    type: string;
    message: string;
    urgent?: boolean;
  }) {
    if (!this.socket || !this.socket.connected) {
      
      return false;
    }

    this.socket.emit('guest-service-request', {
      ...data,
      timestamp: new Date().toISOString(),
      sessionId: getGuestSession()?.sessionId
    });
    
    return true;
  }

  callWaiter(tableNumber: string, urgent: boolean = false) {
    return this.emitCustomerRequest({
      tableNumber,
      type: 'call-waiter',
      message: urgent ? 'Urgent: Guest needs immediate assistance' : 'Guest is calling for service',
      urgent
    });
  }

  requestBill(tableNumber: string) {
    return this.emitCustomerRequest({
      tableNumber,
      type: 'bill',
      message: 'Guest requested the bill',
      urgent: false
    });
  }

  emitNewOrder(orderData: any) {
    if (!this.socket || !this.socket.connected) {
      
      return false;
    }

    this.socket.emit('new-order', {
      ...orderData,
      timestamp: new Date().toISOString(),
      sessionId: getGuestSession()?.sessionId
    });
    
    return true;
  }

  // Event listeners
  onOrderStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('order-status-update', callback);
  }

  onWaiterResponse(callback: (data: any) => void) {
    this.socket?.on('waiter-response', callback);
  }

  onTableStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('table-status-update', callback);
  }

  onMenuChanged(callback: () => void) {
    this.socket?.on('menu-updated', callback);
  }

  onSpecialOffer(callback: (data: any) => void) {
    this.socket?.on('special-offer', callback);
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const guestSocketService = new GuestSocketService();