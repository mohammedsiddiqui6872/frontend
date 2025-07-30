import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'es' | 'ru' | 'ar' | 'tr';
type PopupType = 'tableService' | 'waiter' | 'waterRefill' | 'napkins' | 'utensils' | 'condiments';

interface UIStore {
  // UI State
  showWelcome: boolean;
  showSearch: boolean;
  searchQuery: string;
  showPromo: boolean;
  darkMode: boolean;
  language: Language;
  activeCategory: string;
  showCart: boolean;
  showAI: boolean;
  showTableService: boolean;
  showOrderConfirmation: boolean;
  showFeedback: boolean;
  showCheckoutModal: boolean;
  showOrderHistory: boolean;
  showBillSplitModal: boolean;
  showThankYou: boolean;
  showNotifications: boolean;
  showLogoutConfirm: boolean;
  showProfileMenu: boolean;
  showLanguageMenu: boolean;
  showCreativePopup: PopupType | null;
  
  // Other UI state
  favorites: number[];
  currentTagline: string;
  callWaiterStatus: 'idle' | 'calling' | 'confirmed';
  paymentMethod: 'cash' | 'card' | '';
  splitCount: number;
  paymentCompleteTotal: number;
  
  // Actions
  setShowWelcome: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setShowPromo: (show: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setLanguage: (lang: Language) => void;
  setActiveCategory: (category: string) => void;
  setShowCart: (show: boolean) => void;
  setShowAI: (show: boolean) => void;
  setShowTableService: (show: boolean) => void;
  setShowOrderConfirmation: (show: boolean) => void;
  setShowFeedback: (show: boolean) => void;
  setShowCheckoutModal: (show: boolean) => void;
  setShowOrderHistory: (show: boolean) => void;
  setShowBillSplitModal: (show: boolean) => void;
  setShowThankYou: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  setShowProfileMenu: (show: boolean) => void;
  setShowLanguageMenu: (show: boolean) => void;
  setShowCreativePopup: (popup: PopupType | null) => void;
  toggleFavorite: (itemId: number) => void;
  setCurrentTagline: (tagline: string) => void;
  setCallWaiterStatus: (status: 'idle' | 'calling' | 'confirmed') => void;
  setPaymentMethod: (method: 'cash' | 'card' | '') => void;
  setSplitCount: (count: number) => void;
  setPaymentCompleteTotal: (total: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      showWelcome: false,
      showSearch: false,
      searchQuery: '',
      showPromo: true,
      darkMode: false,
      language: 'en',
      activeCategory: 'appetizers',
      showCart: false,
      showAI: false,
      showTableService: false,
      showOrderConfirmation: false,
      showFeedback: false,
      showCheckoutModal: false,
      showOrderHistory: false,
      showBillSplitModal: false,
      showThankYou: false,
      showNotifications: false,
      showLogoutConfirm: false,
      showProfileMenu: false,
      showLanguageMenu: false,
      showCreativePopup: null,
      favorites: [],
      currentTagline: "Where Every Bite Tells a Story",
      callWaiterStatus: 'idle',
      paymentMethod: '',
      splitCount: 2,
      paymentCompleteTotal: 0,
      
      // Actions
      setShowWelcome: (show) => set({ showWelcome: show }),
      setShowSearch: (show) => set({ showSearch: show }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setShowPromo: (show) => set({ showPromo: show }),
      setDarkMode: (dark) => set({ darkMode: dark }), // Just update state, no DOM manipulation
      setLanguage: (lang) => set({ language: lang }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      setShowCart: (show) => set({ showCart: show }),
      setShowAI: (show) => set({ showAI: show }),
      setShowTableService: (show) => set({ showTableService: show }),
      setShowOrderConfirmation: (show) => set({ showOrderConfirmation: show }),
      setShowFeedback: (show) => set({ showFeedback: show }),
      setShowCheckoutModal: (show) => set({ showCheckoutModal: show }),
      setShowOrderHistory: (show) => set({ showOrderHistory: show }),
      setShowBillSplitModal: (show) => set({ showBillSplitModal: show }),
      setShowThankYou: (show) => set({ showThankYou: show }),
      setShowNotifications: (show) => set({ showNotifications: show }),
      setShowLogoutConfirm: (show) => set({ showLogoutConfirm: show }),
      setShowProfileMenu: (show) => set({ showProfileMenu: show }),
      setShowLanguageMenu: (show) => set({ showLanguageMenu: show }),
      setShowCreativePopup: (popup) => set({ showCreativePopup: popup }),
      toggleFavorite: (itemId) => set((state) => ({
        favorites: state.favorites.includes(itemId)
          ? state.favorites.filter((id) => id !== itemId)
          : [...state.favorites, itemId],
      })),
      setCurrentTagline: (tagline) => set({ currentTagline: tagline }),
      setCallWaiterStatus: (status) => set({ callWaiterStatus: status }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setSplitCount: (count) => set({ splitCount: count }),
      setPaymentCompleteTotal: (total) => set({ paymentCompleteTotal: total }),
    }),
    {
      name: 'ui-preferences',
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language,
        favorites: state.favorites,
      }),
    }
  )
);