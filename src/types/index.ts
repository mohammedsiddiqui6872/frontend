// Frontend specific types
export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  modifiers?: Array<{
    modifierId: string;
    name: string;
    price: number;
    quantity?: number;
  }>;
  specialInstructions?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  tableNumber?: string;
  sessionToken?: string;
}

export interface UIState {
  isLoading: boolean;
  isMenuOpen: boolean;
  isCartOpen: boolean;
  activeCategory: string | null;
  searchQuery: string;
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: Date;
  }>;
}

export interface MenuState {
  categories: any[];
  items: any[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

export interface OrderState {
  activeOrders: any[];
  orderHistory: any[];
  isPlacingOrder: boolean;
  lastOrderId: string | null;
}