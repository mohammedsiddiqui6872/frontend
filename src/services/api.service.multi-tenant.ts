import { securityService } from './security.service';
import { getCurrentTenant, getTenantHeaders, TenantConfig } from '../config/tenant.config';

// Proper type definitions
interface LoginRequest {
  email: string;
  password: string;
  tableNumber?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

interface OrderRequest {
  tableNumber: string;
  items: Array<{
    menuItem: string;
    quantity: number;
    customizations?: Record<string, string>;
    specialRequests?: string;
  }>;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'digital';
  tip?: number;
}

class MultiTenantApiService {
  private tenant: TenantConfig | null = null;
  private apiUrl: string = '';

  constructor() {
    console.log('[API-SERVICE] Initializing multi-tenant API service...');
    this.initializeTenant();
  }

  private initializeTenant() {
    console.log('[API-SERVICE] Initializing tenant...');
    this.tenant = getCurrentTenant();
    console.log('[API-SERVICE] Current tenant:', this.tenant);
    
    if (!this.tenant) {
      console.error('[API-SERVICE] ❌ No tenant found!');
      throw new Error('Unable to identify restaurant. Please check the URL.');
    }
    this.apiUrl = this.tenant.apiUrl;
    console.log(`[API-SERVICE] ✅ Initialized API for tenant: ${this.tenant.name} - API URL: ${this.apiUrl}`);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    console.log('[API-SERVICE] Making request:', {
      endpoint,
      method: options.method || 'GET',
      hasBody: !!options.body
    });
    
    if (!this.tenant) {
      console.error('[API-SERVICE] ❌ Tenant not initialized');
      throw new Error('Tenant not initialized');
    }

    const token = this.getToken();
    const csrfToken = this.getCSRFToken();
    console.log('[API-SERVICE] Auth state - Has token:', !!token, 'Has CSRF:', !!csrfToken);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...getTenantHeaders(this.tenant),
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...options.headers,
    };
    
    console.log('[API-SERVICE] Request headers:', headers);

    try {
      console.log(`[API-SERVICE] Calling: ${this.apiUrl}${endpoint}`);
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Handle CSRF token from response
      const newCsrfToken = response.headers.get('X-CSRF-Token');
      if (newCsrfToken) {
        this.setCSRFToken(newCsrfToken);
      }

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status
          };
        }
        throw errorData;
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getToken(): string | null {
    return localStorage.getItem(`auth_token_${this.tenant?.tenantId}`);
  }

  private setToken(token: string): void {
    if (this.tenant) {
      localStorage.setItem(`auth_token_${this.tenant.tenantId}`, token);
    }
  }

  private clearToken(): void {
    if (this.tenant) {
      localStorage.removeItem(`auth_token_${this.tenant.tenantId}`);
    }
  }

  private getCSRFToken(): string | null {
    return sessionStorage.getItem(`csrf_token_${this.tenant?.tenantId}`);
  }

  private setCSRFToken(token: string): void {
    if (this.tenant) {
      sessionStorage.setItem(`csrf_token_${this.tenant.tenantId}`, token);
    }
  }

  // Public API methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
      sessionStorage.removeItem(`csrf_token_${this.tenant?.tenantId}`);
      
      // Clear any encrypted data
      if (securityService && securityService.secureStorage) {
        securityService.secureStorage.clear();
      }
    }
  }

  async getMenu() {
    return this.makeRequest('/menu');
  }

  async getCategories() {
    return this.makeRequest('/categories');
  }

  async getOrders() {
    return this.makeRequest('/orders');
  }

  async fetchOrders(tableNumber: string, authToken?: string, customerSessionId?: string) {
    // For multi-tenant, we use the standard getOrders endpoint
    // The backend will filter by tenant and table automatically
    return this.makeRequest('/orders');
  }

  async getTables() {
    return this.makeRequest('/tables');
  }

  async getTableStatus(tableNumber: string) {
    return this.makeRequest(`/tables/${tableNumber}/status`);
  }

  async createOrder(orderData: OrderRequest) {
    return this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async placeOrder(orderData: any, authToken?: string) {
    // For multi-tenant, use the standard createOrder
    return this.createOrder(orderData);
  }

  async getOrderHistory(tableNumber?: string) {
    const query = tableNumber ? `?tableNumber=${tableNumber}` : '';
    return this.makeRequest(`/orders${query}`);
  }

  async getOrderStatus(orderId: string) {
    return this.makeRequest(`/orders/${orderId}/status`);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async processPayment(paymentData: PaymentRequest) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async submitFeedback(feedbackData: any) {
    return this.makeRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  async createCustomerSession(sessionData: any) {
    return this.makeRequest('/customer-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async sendServiceRequest(requestData: any, token?: string) {
    return this.makeRequest('/mobile/waiter/service-request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateCustomerSession(sessionId: string, updates: any) {
    return this.makeRequest(`/customer-sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getActiveCustomerSession(tableNumber: string) {
    return this.makeRequest(`/customer-sessions/active/${tableNumber}`);
  }

  async checkoutCustomerSession(sessionId: string) {
    return this.makeRequest(`/customer-sessions/${sessionId}/checkout`, {
      method: 'POST',
    });
  }

  async closeCustomerSession(sessionId: string) {
    return this.makeRequest(`/customer-sessions/${sessionId}/close`, {
      method: 'POST',
    });
  }

  async callWaiter(tableNumber: string, reason?: string) {
    return this.makeRequest('/notifications/call-waiter', {
      method: 'POST',
      body: JSON.stringify({ tableNumber, reason }),
    });
  }

  // Get current tenant info
  getTenant(): TenantConfig | null {
    return this.tenant;
  }

  // Refresh tenant (useful if domain changes)
  refreshTenant(): void {
    this.initializeTenant();
  }
}

// Export singleton instance
export const apiService = new MultiTenantApiService();

// Also export the class for testing
export { MultiTenantApiService };