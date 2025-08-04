import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set) => ({
      guestSession: null,
      isGuestMode: false,
      
      setGuestSession: (session) => set({ 
        guestSession: session,
        isGuestMode: true 
      }),
      
      clearGuestSession: () => set({ 
        guestSession: null,
        isGuestMode: false 
      }),
      
      setGuestMode: (isGuest) => set({ isGuestMode: isGuest }),
    }),
    {
      name: 'guest-session-storage',
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistent guest sessions
      partialize: (state) => ({
        guestSession: state.guestSession,
        isGuestMode: state.isGuestMode,
      }),
    }
  )
);