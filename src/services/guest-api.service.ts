/**
 * Guest API Service
 * 
 * Handles all API calls for guest users without authentication
 * Uses table number and session ID for tracking
 */

import axios from 'axios';
import { getGuestSession } from '../config/guest-mode.config';

const API_URL = process.env['REACT_APP_API_URL'] || 'http://localhost:5000/api';

class GuestApiService {
  private axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include guest session info
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const guestSession = getGuestSession();
        if (guestSession) {
          config.headers['X-Guest-Session-Id'] = guestSession.sessionId;
          config.headers['X-Table-Number'] = guestSession.tableNumber;
          config.headers['X-Tenant-Id'] = guestSession.tenantId;
          config.headers['X-Device-Type'] = guestSession.deviceType;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Guest sessions don't need re-authentication
          console.log('Guest session expired, refreshing...');
        }
        return Promise.reject(error);
      }
    );
  }

  // Menu & Categories (Public endpoints)
  async getCategories() {
    const response = await this.axiosInstance.get('/categories');
    return response.data;
  }

  async getMenuItems() {
    const response = await this.axiosInstance.get('/menu', {
      params: { all: true }
    });
    return response.data;
  }

  // Customer Session
  async createCustomerSession(data: {
    tableNumber: string;
    customerName: string;
    customerPhone?: string;
  }) {
    const response = await this.axiosInstance.post('/guest/customer-session', data);
    return response.data;
  }

  async getActiveCustomerSession(tableNumber: string) {
    const response = await this.axiosInstance.get(`/guest/customer-session/table/${tableNumber}`);
    return response.data;
  }

  // Orders (Guest endpoints)
  async createOrder(orderData: {
    tableNumber: string;
    items: any[];
    customerName: string;
    customerPhone?: string;
    specialInstructions?: string;
  }) {
    const response = await this.axiosInstance.post('/guest/orders', orderData);
    return response.data;
  }

  async getTableOrders(tableNumber: string) {
    const response = await this.axiosInstance.get(`/guest/orders/table/${tableNumber}`);
    return response.data;
  }

  async trackOrder(orderId: string) {
    const response = await this.axiosInstance.get(`/guest/orders/${orderId}/track`);
    return response.data;
  }

  // Service Requests
  async callWaiter(data: {
    tableNumber: string;
    type: 'call-waiter' | 'water' | 'napkins' | 'bill' | 'other';
    message?: string;
    urgent?: boolean;
  }) {
    const response = await this.axiosInstance.post('/guest/service-request', data);
    return response.data;
  }

  // Feedback
  async submitFeedback(data: {
    tableNumber: string;
    sessionId: string;
    rating: number;
    foodQuality?: number;
    serviceQuality?: number;
    ambiance?: number;
    comments?: string;
  }) {
    const response = await this.axiosInstance.post('/guest/feedback', data);
    return response.data;
  }

  // Table Info
  async getTableInfo(tableNumber: string) {
    const response = await this.axiosInstance.get(`/guest/table/${tableNumber}/info`);
    return response.data;
  }

  // Wait Time Estimates
  async getWaitTimes() {
    const response = await this.axiosInstance.get('/guest/wait-times');
    return response.data;
  }
}

export const guestApiService = new GuestApiService();