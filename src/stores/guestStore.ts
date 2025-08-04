import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentTenant } from '../config/tenant.config';

interface GuestSession {
  sessionId: string;
  customerName: string;
  customerPhone?: string;
  tableNumber: string;
  tenantId: string;
  isActive: boolean;
  startTime: Date;
}

interface GuestStore {
  guestSession: GuestSession | null;
  isGuestMode: boolean;
  
  setGuestSession: (session: GuestSession) => void;
  clearGuestSession: () => void;
  setGuestMode: (isGuest: boolean) => void;
  validateTenant: () => boolean;
}

// Get tenant-specific storage key
const getStorageKey = () => {
  const tenant = getCurrentTenant();
  return tenant ? `guest-session-${tenant.tenantId}` : 'guest-session-default';
};

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      guestSession: null,
      isGuestMode: false,
      
      setGuestSession: (session) => {
        // Validate tenant matches
        const currentTenant = getCurrentTenant();
        if (currentTenant && session.tenantId !== currentTenant.tenantId) {
          console.error('[GUEST-STORE] Tenant mismatch! Session tenant:', session.tenantId, 'Current tenant:', currentTenant.tenantId);
          return;
        }
        
        set({ 
          guestSession: session,
          isGuestMode: true 
        });
      },
      
      clearGuestSession: () => set({ 
        guestSession: null,
        isGuestMode: false 
      }),
      
      setGuestMode: (isGuest) => set({ isGuestMode: isGuest }),
      
      validateTenant: () => {
        const state = get();
        const currentTenant = getCurrentTenant();
        
        // If no session or no tenant, invalid
        if (!state.guestSession || !currentTenant) {
          return false;
        }
        
        // Check if session tenant matches current tenant
        if (state.guestSession.tenantId !== currentTenant.tenantId) {
          console.warn('[GUEST-STORE] Session tenant mismatch, clearing session');
          state.clearGuestSession();
          return false;
        }
        
        return true;
      }
    }),
    {
      name: getStorageKey(), // Use tenant-specific storage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        guestSession: state.guestSession,
        isGuestMode: state.isGuestMode,
      }),
    }
  )
);