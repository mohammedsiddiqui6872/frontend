// API Response Type Definitions

// Base response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User and Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier' | 'customer';
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

// Menu types
export interface MenuItem {
  id: number;
  _id: string;
  name: string;
  nameAr?: string;
  category: string;
  price: number;
  cost?: number;
  description: string;
  descriptionAr?: string;
  image: string;
  images?: string[];
  available: boolean;
  inStock: boolean;
  stockQuantity: number;
  allergens: string[];
  dietary: string[];
  prepTime: number;
  rating: number;
  reviews: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isSpecial: boolean;
  discount: number;
  recommended: boolean;
  featured: boolean;
  customizations: Record<string, string[]>;
  tags: string[];
  soldCount: number;
  viewCount: number;
}

export interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  image?: string;
  itemCount?: number;
}

// Order types
export interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  specialRequests?: string;
  customizations?: Record<string, string>;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  station?: 'grill' | 'salad' | 'dessert' | 'beverage' | 'main';
  preparedBy?: string;
  preparedAt?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  waiter?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'digital' | 'split';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedTime?: number;
  actualTime?: number;
}

// Payment types
export interface Payment {
  _id: string;
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'digital';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  tip?: number;
  createdAt: string;
  processedAt?: string;
}

// Feedback types
export interface Feedback {
  _id: string;
  orderId?: string;
  tableNumber: string;
  customerName?: string;
  overallRating: number;
  foodQuality: number;
  serviceQuality: number;
  ambience: number;
  cleanliness: number;
  comments?: string;
  createdAt: string;
}

// Table and Session types
export interface Table {
  _id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: string;
  waiter?: string;
}

export interface CustomerSession {
  _id: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  occupancy: number;
  startTime: string;
  endTime?: string;
  totalSpent?: number;
  isActive: boolean;
}

// Service Request types
export interface ServiceRequest {
  type: 'waiter' | 'water' | 'napkins' | 'utensils' | 'condiments' | 'other';
  tableNumber: string;
  message?: string;
  priority: 'low' | 'medium' | 'high';
  status?: 'pending' | 'acknowledged' | 'completed';
}

// Analytics types
export interface DailyStats {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
  }>;
}

// Socket event types
export interface SocketEvents {
  'order:new': Order;
  'order:updated': Order;
  'order:cancelled': { orderId: string };
  'menu:updated': { categoryId?: string };
  'table:status': { tableNumber: string; status: string };
  'service:request': ServiceRequest;
  'notification': {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  };
}