import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { securityService } from '../services/security.service';

interface LoginData {
  employeeId: string;
  password: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  employeeId: string;
  employeeName: string;
  authToken: string | null;
  rememberMe: boolean;
  customerName: string | null;
  customerSessionId: string | null;
  assignedTables: string[];
  
  setAuth: (data: {
    isAuthenticated: boolean;
    employeeId: string;
    employeeName: string;
    authToken: string;
  }) => void;
  
  setRememberMe: (remember: boolean) => void;
  setCustomerName: (name: string) => void;
  setCustomerSession: (sessionId: string | null) => void;
  clearCustomerSession: () => void;
  setAssignedTables: (tables: string[]) => void;
  logout: () => void;
  getLoginData: () => LoginData | null;
}

// Custom secure storage adapter
const secureStorage = {
  getItem: (name: string): string | null => {
    try {
      const data = securityService.secureStorage.getItem(name);
      return data ? JSON.stringify(data) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const data = JSON.parse(value);
      securityService.secureStorage.setItem(name, data);
    } catch {
      // Handle error silently
    }
  },
  removeItem: (name: string): void => {
    securityService.secureStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      employeeId: '',
      employeeName: '',
      authToken: null,
      rememberMe: false,
      customerName: null,
      customerSessionId: null,
      assignedTables: [],
      
      setAuth: (data) => set(data),
      
      setRememberMe: (remember) => set({ rememberMe: remember }),
      
      setCustomerName: (name) => set({ customerName: name }),
      
      setCustomerSession: (sessionId) => set({ customerSessionId: sessionId }),
      
      clearCustomerSession: () => set({ 
        customerSessionId: null, 
        customerName: null 
      }),
      
      setAssignedTables: (tables) => set({ assignedTables: tables }),
      
      logout: async () => {
        const state = get();
        if (state.authToken) {
          try {
            // Call logout API - imported later to avoid circular dependency
            const { apiService } = await import('../services/api.service');
            await apiService.logout(state.authToken);
          } catch (error) {
            
            // Continue with local logout even if API fails
          }
        }
        
        set({
          isAuthenticated: false,
          employeeId: '',
          employeeName: '',
          authToken: null,
          customerName: null,
          customerSessionId: null,
          assignedTables: [],
        });
      },
      
      getLoginData: () => {
        const state = get();
        if (state.rememberMe && state.employeeId) {
          return {
            employeeId: state.employeeId,
            password: '',
          };
        }
        return null;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
        employeeName: state.employeeName,
        rememberMe: state.rememberMe,
        employeeId: state.employeeId,
        // Note: We don't persist customerName, customerSessionId, or assignedTables as they're session-specific
      }),
    }
  )
);