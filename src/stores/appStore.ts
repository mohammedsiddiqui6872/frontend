import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { secureSessionStorage } from '../utils/security/secureStorage';

// Types
interface AppState {
  // UI State
  ui: {
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    showCart: boolean;
    showCheckout: boolean;
    showCustomization: boolean;
    showOrderHistory: boolean;
    showFeedback: boolean;
    showFlavorJourney: boolean;
    showAIAssistant: boolean;
    showTableService: boolean;
    showWelcome: boolean;
    showThankYou: boolean;
    selectedCategory: string | null;
    searchQuery: string;
    viewMode: 'grid' | 'universe';
    activeFilters: string[];
  };

  // Customer State
  customer: {
    details: {
      name: string;
      phone: string;
      email?: string;
    } | null;
    preferences: {
      dietary: string[];
      allergies: string[];
      spiceLevel: number;
    };
    sessionToken: string | null;
  };

  // Order State
  orders: {
    active: any[];
    history: any[];
    tracking: Map<string, any>;
  };

  // Table State
  table: {
    number: string | null;
    sessionActive: boolean;
    waiterAssigned: string | null;
  };

  // Notification State
  notifications: {
    list: any[];
    unreadCount: number;
  };

  // Actions
  actions: {
    // UI Actions
    setLoading: (loading: boolean, message?: string) => void;
    setError: (error: string | null) => void;
    toggleModal: (modal: keyof AppState['ui'], show?: boolean) => void;
    setSelectedCategory: (category: string | null) => void;
    setSearchQuery: (query: string) => void;
    setViewMode: (mode: 'grid' | 'universe') => void;
    addFilter: (filter: string) => void;
    removeFilter: (filter: string) => void;
    clearFilters: () => void;

    // Customer Actions
    setCustomerDetails: (details: AppState['customer']['details']) => void;
    updatePreferences: (preferences: Partial<AppState['customer']['preferences']>) => void;
    setSessionToken: (token: string | null) => void;

    // Order Actions
    addActiveOrder: (order: any) => void;
    updateOrderStatus: (orderId: string, status: string) => void;
    moveOrderToHistory: (orderId: string) => void;
    clearActiveOrders: () => void;

    // Table Actions
    setTableNumber: (number: string | null) => void;
    setTableSession: (active: boolean) => void;
    setWaiterAssigned: (waiter: string | null) => void;

    // Notification Actions
    addNotification: (notification: any) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;

    // Global Actions
    resetState: () => void;
  };
}

const initialState = {
  ui: {
    isLoading: false,
    loadingMessage: '',
    error: null,
    showCart: false,
    showCheckout: false,
    showCustomization: false,
    showOrderHistory: false,
    showFeedback: false,
    showFlavorJourney: false,
    showAIAssistant: false,
    showTableService: false,
    showWelcome: true,
    showThankYou: false,
    selectedCategory: null,
    searchQuery: '',
    viewMode: 'grid' as const,
    activeFilters: []
  },
  customer: {
    details: null,
    preferences: {
      dietary: [],
      allergies: [],
      spiceLevel: 3
    },
    sessionToken: null
  },
  orders: {
    active: [],
    history: [],
    tracking: new Map()
  },
  table: {
    number: null,
    sessionActive: false,
    waiterAssigned: null
  },
  notifications: {
    list: [],
    unreadCount: 0
  }
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        actions: {
          // UI Actions
          setLoading: (loading, message = '') => set((state) => {
            state.ui.isLoading = loading;
            state.ui.loadingMessage = message;
          }),

          setError: (error) => set((state) => {
            state.ui.error = error;
          }),

          toggleModal: (modal, show) => set((state) => {
            const modalKey = `show${modal.charAt(0).toUpperCase() + modal.slice(1)}` as keyof AppState['ui'];
            if (modalKey in state.ui) {
              (state.ui as any)[modalKey] = show ?? !state.ui[modalKey];
            }
          }),

          setSelectedCategory: (category) => set((state) => {
            state.ui.selectedCategory = category;
          }),

          setSearchQuery: (query) => set((state) => {
            state.ui.searchQuery = query;
          }),

          setViewMode: (mode) => set((state) => {
            state.ui.viewMode = mode;
          }),

          addFilter: (filter) => set((state) => {
            if (!state.ui.activeFilters.includes(filter)) {
              state.ui.activeFilters.push(filter);
            }
          }),

          removeFilter: (filter) => set((state) => {
            state.ui.activeFilters = state.ui.activeFilters.filter(f => f !== filter);
          }),

          clearFilters: () => set((state) => {
            state.ui.activeFilters = [];
          }),

          // Customer Actions
          setCustomerDetails: (details) => set((state) => {
            state.customer.details = details;
          }),

          updatePreferences: (preferences) => set((state) => {
            state.customer.preferences = {
              ...state.customer.preferences,
              ...preferences
            };
          }),

          setSessionToken: (token) => set((state) => {
            state.customer.sessionToken = token;
          }),

          // Order Actions
          addActiveOrder: (order) => set((state) => {
            state.orders.active.push(order);
            state.orders.tracking.set(order.id, order);
          }),

          updateOrderStatus: (orderId, status) => set((state) => {
            const orderIndex = state.orders.active.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
              state.orders.active[orderIndex].status = status;
              state.orders.tracking.set(orderId, {
                ...state.orders.tracking.get(orderId),
                status
              });
            }
          }),

          moveOrderToHistory: (orderId) => set((state) => {
            const orderIndex = state.orders.active.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
              const [order] = state.orders.active.splice(orderIndex, 1);
              state.orders.history.push(order);
            }
          }),

          clearActiveOrders: () => set((state) => {
            state.orders.active = [];
            state.orders.tracking.clear();
          }),

          // Table Actions
          setTableNumber: (number) => set((state) => {
            state.table.number = number;
          }),

          setTableSession: (active) => set((state) => {
            state.table.sessionActive = active;
          }),

          setWaiterAssigned: (waiter) => set((state) => {
            state.table.waiterAssigned = waiter;
          }),

          // Notification Actions
          addNotification: (notification) => set((state) => {
            state.notifications.list.push({
              ...notification,
              id: notification.id || Date.now().toString(),
              timestamp: new Date().toISOString(),
              read: false
            });
            state.notifications.unreadCount++;
          }),

          markNotificationRead: (id) => set((state) => {
            const notification = state.notifications.list.find(n => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              state.notifications.unreadCount--;
            }
          }),

          clearNotifications: () => set((state) => {
            state.notifications.list = [];
            state.notifications.unreadCount = 0;
          }),

          // Global Actions
          resetState: () => set(() => initialState)
        }
      })),
      {
        name: 'app-store',
        storage: {
          getItem: async (name: string) => {
            const data = secureSessionStorage.getItem(name);
            return data;
          },
          setItem: async (name: string, value: any) => {
            secureSessionStorage.setItem(name, value);
          },
          removeItem: async (name: string) => {
            secureSessionStorage.removeItem(name);
          }
        } as any,
        partialize: (state) => ({
          customer: state.customer,
          table: state.table,
          ui: {
            viewMode: state.ui.viewMode,
            selectedCategory: state.ui.selectedCategory
          }
        })
      }
    ),
    { name: 'AppStore' }
  )
);

// Selectors
export const useUIState = () => useAppStore((state) => state.ui);
export const useCustomerState = () => useAppStore((state) => state.customer);
export const useOrdersState = () => useAppStore((state) => state.orders);
export const useTableState = () => useAppStore((state) => state.table);
export const useNotificationsState = () => useAppStore((state) => state.notifications);
export const useAppActions = () => useAppStore((state) => state.actions);