import { securityService } from './security.service';
import { getCurrentTenant, getTenantHeaders } from '../config/tenant.config';

const API_URL = process.env['REACT_APP_API_URL'] || 'https://api.gritservices.ae/api';

// Proper type definitions
interface LoginRequest {
  email: string;
  password: string;
  tableNumber?: string; // Optional for backward compatibility
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

class EnhancedApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    category: string = 'default'
  ): Promise<T> {
    // Add CSRF token to headers
    const headers = new Headers(options.headers);
    headers.set('X-CSRF-Token', securityService.getCSRFToken());
    
    // Add tenant headers
    const tenant = getCurrentTenant();
    if (tenant) {
      const tenantHeaders = getTenantHeaders(tenant);
      Object.entries(tenantHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CSRF
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Network error',
        message: `Request failed with status ${response.status}`,
        statusCode: response.status,
      }));
      
      throw new ApiServiceError(
        error.message || error.error || 'Request failed',
        response.status,
        error
      );
    }

    return response.json();
  }

  private getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add tenant headers
    const tenant = getCurrentTenant();
    if (tenant) {
      const tenantHeaders = getTenantHeaders(tenant);
      Object.assign(headers, tenantHeaders);
    }
    
    return headers;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    }, 'auth');
  }

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
      headers: this.getHeaders(token),
    }, 'auth');
  }

  async fetchMenu(token: string) {
    return this.makeRequest('/menu', {
      headers: this.getHeaders(token),
    });
  }

  async fetchOrders(tableNumber: string, token: string, customerSessionId?: string) {
    let url = `/orders?tableNumber=${encodeURIComponent(tableNumber)}`;
    if (customerSessionId) {
      url += `&customerSession=${encodeURIComponent(customerSessionId)}`;
    }
    return this.makeRequest(url, {
      headers: this.getHeaders(token),
    });
  }

  async placeOrder(orderData: OrderRequest, token: string) {
    return this.makeRequest('/orders', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(orderData),
    }, 'order');
  }

  async updateOrderStatus(orderId: string, status: string, token: string) {
    return this.makeRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });
  }

  async processPayment(paymentData: PaymentRequest, token: string) {
    return this.makeRequest('/payments/process', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(paymentData),
    }, 'payment');
  }

  async submitFeedback(feedbackData: any, token: string) {
    return this.makeRequest('/feedback', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(feedbackData),
    }, 'feedback');
  }

  async sendServiceRequest(requestData: any, token: string) {
    return this.makeRequest('/mobile/waiter/service-request', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(requestData),
    });
  }
  
  async createCustomerSession(sessionData: any, token: string) {
    return this.makeRequest('/customer-sessions/create', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(sessionData),
    });
  }

  // Generic method for authenticated requests
  async fetchWithAuth(endpoint: string, options: RequestInit = {}, token?: string) {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${API_URL}${url}`;
    
    // Get auth token from storage if not provided
    if (!token) {
      // Try to get from localStorage first (for admin panel)
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        token = adminToken;
      } else {
        // Get from auth store (using secure storage)
        try {
          const authData = securityService.secureStorage.getItem('auth-storage');
          if (authData && authData.state && authData.state.authToken) {
            token = authData.state.authToken;
          }
        } catch (error) {
          console.warn('Failed to get auth token from secure storage:', error);
        }
      }
    }
    
    const headers = new Headers(options.headers);
    
    // Add auth token if available
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Add CSRF token
    headers.set('X-CSRF-Token', securityService.getCSRFToken());
    
    // Add Content-Type if not set
    if (!headers.has('Content-Type') && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
    
    return fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
  }
}

// Custom Error class for better error handling
class ApiServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

export const apiService = new EnhancedApiService();
export { ApiServiceError };