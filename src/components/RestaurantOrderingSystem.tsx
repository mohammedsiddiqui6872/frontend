import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Utensils, UtensilsCrossed, Cake, Coffee, Pizza, Wine, Beer, Drumstick, Fish, Carrot, Apple, Soup } from 'lucide-react';

import { useAuthStore } from '../stores/authStore';
import { useCartStore, MenuItem } from '../stores/cartStore';
import { useUIStore } from '../stores/uiStore';
import { useGuestStore } from '../stores/guestStore';
import { useGuestMenu } from '../hooks/useGuestMenu';
import { useOrders } from '../hooks/useOrders';
import { useNotifications } from '../hooks/useNotifications';
import { useGuestPlaceOrder } from '../hooks/useGuestPlaceOrder';
import { guestSocketService } from '../services/guest-socket.service';
import { guestApiService } from '../services/guest-api.service';
import { initializeGuestSession, getGuestSession } from '../config/guest-mode.config';

// LoginScreen removed - guests don't need to login
import { Header } from './Header';
import { CategorySidebar } from './menu/CategorySidebar';
import { MenuGrid } from './menu/MenuGrid';
import { MenuUniverse } from './menu/MenuUniverse';
import { OrderTrackingBar } from './orders/OrderTrackingBar';
import { CartModal } from './modals/CartModal';
import { CustomizationModal } from './modals/CustomizationModal';
import { CheckoutModal } from './modals/CheckoutModal';
import { FeedbackModal } from './modals/FeedbackModal';
import { OrderHistoryModal } from './modals/OrderHistoryModal';
import { FlavorJourneyModal } from './modals/FlavorJourneyModal';
import { AIAssistantModal } from './modals/AIAssistantModal';
import { TableServiceModal } from './modals/TableServiceModal';
import { NotificationToast } from './common/NotificationToast';
import { CreativePopup } from './common/CreativePopup';
import { WelcomeScreen } from './common/WelcomeScreen';
import { ThankYouScreen } from './common/ThankYouScreen';
import { CustomerDetailForm, CustomerDetails } from './common/CustomerDetailForm';

import { translations } from '../utils/translations';
import { OrderTracking } from '../hooks/useOrders';
import { getCurrentTenant } from '../config/tenant.config';

// Create query client outside of component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const taglines = [
  "Where Every Bite Tells a Story",
  "Crafted with Love, Served with Pride", 
  "Your Table, Your Experience, Our Passion",
  "Savor the Moment, Taste the Magic",
  "From Our Kitchen to Your Heart"
];

// Define Category interface
interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  image?: string;
}

// Icon mapping for dynamic categories
const iconMap: { [key: string]: any } = {
  'utensils': Utensils,
  'utensils-crossed': UtensilsCrossed,
  'cake': Cake,
  'coffee': Coffee,
  'pizza': Pizza,
  'glass': Wine,
  'wine': Wine,
  'wine-glass': Wine,
  'beer': Beer,
  'drumstick': Drumstick,
  'fish': Fish,
  'carrot': Carrot,
  'apple': Apple,
  'soup': Soup,
  'sandwich': UtensilsCrossed,
  'hamburger': UtensilsCrossed,
  'salad': Utensils,
  'bread-slice': Cake,
};

// Props interface
interface RestaurantOrderingSystemInnerProps {
  tableNumber: string;
}

// Inner component that uses React Query hooks
const RestaurantOrderingSystemInner: React.FC<RestaurantOrderingSystemInnerProps> = ({ tableNumber }) => {
  // Initialize guest session
  console.log('[RESTAURANT-ORDERING] Initializing with table:', tableNumber);
  const { guestSession: storedGuestSession, setGuestSession: setStoredGuestSession, clearGuestSession: clearStoredGuestSession } = useGuestStore();
  const [guestSession] = useState(() => {
    console.log('[RESTAURANT-ORDERING] Checking for stored guest session...');
    // Check if we have a stored session for the same table
    if (storedGuestSession && storedGuestSession.tableNumber === tableNumber) {
      console.log('[RESTAURANT-ORDERING] Using stored guest session:', storedGuestSession);
      return storedGuestSession;
    }
    console.log('[RESTAURANT-ORDERING] Creating new guest session...');
    const session = initializeGuestSession(tableNumber);
    console.log('[RESTAURANT-ORDERING] Guest session created:', session);
    return session;
  });
  const isGuest = true; // Always guest mode for frontend
  const { logout } = useAuthStore(); // Keep for compatibility
  const { addToCart, clearCart } = useCartStore();
  const { 
    language, darkMode, setDarkMode, activeCategory, setActiveCategory, searchQuery,
    showWelcome, setShowWelcome, showCart, setShowCart, showOrderConfirmation, setShowOrderConfirmation,
    showCheckoutModal, setShowCheckoutModal, showFeedback, setShowFeedback,
    showThankYou, setShowThankYou, showCreativePopup, setShowCreativePopup,
    callWaiterStatus, setCallWaiterStatus, setPaymentCompleteTotal,
    showOrderHistory, setShowOrderHistory, showLogoutConfirm, setShowLogoutConfirm
  } = useUIStore();
  
  // State declarations first
  const [showCustomization, setShowCustomization] = useState<any | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderTracking | null>(null);
  const [sendingServiceRequest, setSendingServiceRequest] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [showLogoutPassword, setShowLogoutPassword] = useState(false);
  const [menuMode, setMenuMode] = useState<'classic' | 'universe'>('classic');
  
  // Dynamic categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Customer detail form state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerSession, setCustomerSession] = useState<any>(null);
  const [isSubmittingCustomerDetails, setIsSubmittingCustomerDetails] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [restaurantName, setRestaurantName] = useState<string>('');

  const t = translations[language];

  // These hooks can now safely use React Query
  const { data: menuData, isLoading, error, refetch } = useGuestMenu();
  const { activeOrders, cancelOrder, isCancelling, refetch: refetchOrders } = useOrders(tableNumber);
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { placeOrder, isPlacing } = useGuestPlaceOrder({ 
    tableNumber, 
    customerSessionId: customerSession?._id || customerSession?.sessionId
  });

  // API URL from environment or default

  // Get restaurant name from tenant config
  useEffect(() => {
    const tenant = getCurrentTenant();
    if (tenant) {
      setRestaurantName(tenant.name);
    }
  }, []);

  // Initialize dark mode from persisted state on mount
  useEffect(() => {
    // Get persisted state from localStorage
    const persistedState = localStorage.getItem('ui-preferences');
    if (persistedState) {
      try {
        const parsed = JSON.parse(persistedState);
        if (parsed.state && typeof parsed.state.darkMode === 'boolean') {
          // This will trigger the dark mode effect below
          if (parsed.state.darkMode !== darkMode) {
            setDarkMode(parsed.state.darkMode);
          }
        }
      } catch (error) {
        console.error('Error parsing persisted UI state:', error);
      }
    }
  }, []); // Only run once on mount

  // Fetch categories from API with caching
  const fetchCategories = async () => {
    console.log('[RESTAURANT-ORDERING] Fetching categories...');
    
    // Check cache first
    const cacheKey = `categories-${guestSession?.tenantId}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          console.log('[RESTAURANT-ORDERING] Using cached categories');
          setCategories(data);
          setCategoriesLoading(false);
          if (data.length > 0 && !activeCategory) {
            setActiveCategory(data[0].slug);
          }
          return;
        }
      } catch (e) {
        console.error('[RESTAURANT-ORDERING] Cache parse error:', e);
      }
    }
    
    try {
      setCategoriesLoading(true);
      const data = await guestApiService.getCategories();
      console.log('[RESTAURANT-ORDERING] Categories received:', data);
      
      if (data && Array.isArray(data)) {
        setCategories(data);
        console.log('[RESTAURANT-ORDERING] Set categories:', data.length, 'items');
        
        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        
        // Set initial category if not set
        if (data.length > 0 && !activeCategory) {
          console.log('[RESTAURANT-ORDERING] Setting initial category:', data[0].slug);
          setActiveCategory(data[0].slug);
        }
      } else {
        console.error('[RESTAURANT-ORDERING] Invalid categories data:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('[RESTAURANT-ORDERING] ❌ Error fetching categories:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load categories',
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (tableNumber && guestSession) {
      guestSocketService.connect(guestSession.sessionId, tableNumber);
      
      // Socket event handlers
      guestSocketService.onTableStatusUpdate((data) => {
        console.log('Table status update:', data);
      });
      
      guestSocketService.onMenuChanged(() => {
        console.log('Menu changed, refreshing...');
        refetch();
        fetchCategories(); // Also refresh categories
      });
      
      return () => {
        guestSocketService.disconnect();
      };
    }
    // Return undefined when condition is not met
    return undefined;
  }, [tableNumber, guestSession, refetch]);

  // Initialize socket connection when we have auth and table
  useEffect(() => {
    if (tableNumber && guestSession) {
      guestSocketService.connect(guestSession.sessionId, tableNumber);
      
      return () => {
        guestSocketService.disconnect();
      };
    }
    // Return undefined when condition is not met
    return undefined;
  }, [tableNumber, guestSession]);

  // Handle guest session state
  useEffect(() => {
    // Validate tenant first
    const isValidTenant = useGuestStore.getState().validateTenant();
    
    // Check if we have a stored guest session
    if (storedGuestSession && storedGuestSession.tableNumber === tableNumber && storedGuestSession.isActive && isValidTenant) {
      console.log('Found stored guest session, restoring...');
      setCustomerSession(storedGuestSession as any);
      setShowWelcome(false);
      setShowCustomerForm(false);
      setIsInitialized(true);
      setIsCheckingSession(false);
      // Restore customer name to auth store
      if (storedGuestSession.customerName) {
        useAuthStore.getState().setCustomerName(storedGuestSession.customerName);
      }
      if (storedGuestSession.sessionId) {
        useAuthStore.getState().setCustomerSession(storedGuestSession.sessionId);
      }
      fetchCategories();
      return;
    }
    
    // Only run once when guest session is ready
    if (tableNumber && guestSession && !isInitialized) {
      setIsCheckingSession(true);
      console.log('Checking for active session on table:', tableNumber);
      
      // Check backend for active customer session
      const checkActiveSession = async () => {
        try {
          console.log('Fetching active session for table:', tableNumber);
          const data = await guestApiService.getActiveCustomerSession(tableNumber) as any;
          console.log('Response data:', data);
          
          if (data && data.activeSession) {
              console.log('Found active customer session:', data.activeSession.customerName);
              
              // Show confirmation dialog
              const shouldResume = window.confirm(
                `Customer session in progress for ${data.activeSession.customerName}.\n` +
                `Started: ${new Date(data.activeSession.loginTime).toLocaleTimeString()}\n\n` +
                `Would you like to resume this session?`
              );
              
              if (shouldResume) {
                setCustomerSession(data.activeSession);
                setShowWelcome(false);
                setShowCustomerForm(false);
                // Update customer name and session in auth store
                if (data.activeSession.customerName) {
                  useAuthStore.getState().setCustomerName(data.activeSession.customerName);
                }
                if (data.activeSession._id) {
                  useAuthStore.getState().setCustomerSession(data.activeSession._id);
                }
              } else {
                // User chose not to resume, show welcome screen
                setShowWelcome(true);
                setShowCustomerForm(true);
                useAuthStore.getState().clearCustomerSession();
              }
            } else {
              console.log('No active session found, showing welcome screen');
              // No active session, show normal flow
              useAuthStore.getState().clearCustomerSession();
              setShowWelcome(true);
              setShowCustomerForm(true);
            }
        } catch (error) {
          console.error('Error checking customer session:', error);
          // On error, show normal flow
          setShowWelcome(true);
          setShowCustomerForm(true);
        } finally {
          setIsCheckingSession(false);
          setIsInitialized(true);
        }
      };
      
      checkActiveSession();
      fetchCategories(); // Fetch categories when authenticated
    }
  }, [tableNumber, guestSession, isInitialized, storedGuestSession]);
  
  // Handle customer form reset when welcome screen is shown
  useEffect(() => {
    if (showWelcome) {
      setShowCustomerForm(true);
      setCustomerSession(null);
      // Clear customer session from auth store when showing welcome
      useAuthStore.getState().clearCustomerSession();
      // Clear the reset flag
      if ((window as any).resetCustomerForm) {
        delete (window as any).resetCustomerForm;
      }
    }
  }, [showWelcome]);

  // Body overflow control
  useEffect(() => {
    if (showWelcome) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showWelcome]);

  // Dark mode effect - handles DOM manipulation
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // RTL for Arabic
  useEffect(() => {
    if (language === 'ar') {
      document.body.dir = 'rtl';
    } else {
      document.body.dir = 'ltr';
    }
  }, [language]);

  // Get filtered menu items
  const filteredItems = useMemo(() => {
    if (!menuData) return [];
    
    if (!searchQuery) {
      return menuData[activeCategory] || [];
    }
    
    // Properly type the flattened array
    const allItems: MenuItem[] = Object.values(menuData).flat() as MenuItem[];
    return allItems.filter((item: MenuItem) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuData, activeCategory, searchQuery]);

  // Get current category name
  const currentCategory = useMemo(() => {
    return categories.find(c => c.slug === activeCategory);
  }, [categories, activeCategory]);

  // Handle place order
  const handlePlaceOrder = () => {
    if (!customerSession) {
      addNotification({
        type: 'error',
        title: 'Customer Details Required',
        message: 'Please provide customer details before placing an order',
      });
      return;
    }
    
    placeOrder();
    setShowCart(false);
  };

  // Handle service requests
  const sendServiceRequest = async (type: string, message: string, silent: boolean = false): Promise<boolean> => {
    setSendingServiceRequest(true);
    
    try {
      const requestData = {
        tableNumber,
        type,
        message,
        urgent: type === 'call-waiter' || type === 'emergency'
      };

      const sent = guestSocketService.emitCustomerRequest(requestData);
      
      if (sent) {
        if (!silent) {
          addNotification({
            type: 'success',
            title: 'Request Sent',
            message: message,
          });
        }
        return true;
      } else {
        // Fallback to API
        await guestApiService.callWaiter(requestData as any);
        if (!silent) {
          addNotification({
            type: 'success',
            title: 'Request Sent',
            message: message,
          });
        }
        return true;
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Request Failed',
        message: 'Failed to send request. Please try again.',
      });
      return false;
    } finally {
      setSendingServiceRequest(false);
    }
  };


  // Handle table service request
  const handleTableServiceRequest = async (request: { type: string; details?: string }) => {
    const message = request.details 
      ? `${request.type}: ${request.details}`
      : request.type;
    
    await sendServiceRequest(request.type, message);
  };

  // Handle customer details submission
  const handleCustomerDetailsSubmit = async (details: CustomerDetails) => {
    setIsSubmittingCustomerDetails(true);
    
    try {
      const data = await guestApiService.createCustomerSession({
        tableNumber,
        customerName: details.name,
        customerPhone: details.phone
      }) as any;
      
      if (!data || !data.session) {
        throw new Error('Failed to create customer session');
      }
      
      // Ensure the session has isActive flag
      const sessionWithActive = { ...data.session, isActive: true };
      setCustomerSession(sessionWithActive);
      setShowCustomerForm(false);
      
      // Store the guest session persistently
      setStoredGuestSession({
        sessionId: data.session._id || data.session.sessionId,
        customerName: details.name,
        customerPhone: details.phone,
        tableNumber: tableNumber,
        tenantId: data.session.tenantId,
        isActive: true,
        startTime: new Date(data.session.startTime || Date.now())
      });
      
      // Update auth store with customer name and session ID
      useAuthStore.getState().setCustomerName(details.name);
      if (data.session._id) {
        useAuthStore.getState().setCustomerSession(data.session._id);
      }
      
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: `Hello ${details.name}, enjoy your dining experience!`
      });
    } catch (error) {
      console.error('Error submitting customer details:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save customer details. Please try again.'
      });
    } finally {
      setIsSubmittingCustomerDetails(false);
    }
  };

  const handleQuickServiceRequest = async (serviceType: string) => {
    if (sendingServiceRequest) return;
    
    setSendingServiceRequest(true);
    
    const serviceMessages: { [key: string]: string } = {
      'waterRefill': 'Water refill requested',
      'napkins': 'Extra napkins requested',
      'utensils': 'New utensils requested',
      'condiments': 'Condiments requested'
    };
    
    setShowCreativePopup(serviceType as any);
    
    try {
      await sendServiceRequest(serviceType, serviceMessages[serviceType] || 'Service requested', true);
    } finally {
      setTimeout(() => {
        setSendingServiceRequest(false);
      }, 1000);
    }
  };

  const callWaiter = async () => {
    if ((window as any).callingWaiter) return;
    
    (window as any).callingWaiter = true;
    setShowCreativePopup('waiter');
    setCallWaiterStatus('calling');
    
    try {
      const success = await sendServiceRequest('call-waiter', 'Customer is calling for assistance', true);
      
      if (success) {
        setTimeout(() => {
          setCallWaiterStatus('confirmed');
          setTimeout(() => setCallWaiterStatus('idle'), 3000);
        }, 1500);
      } else {
        setCallWaiterStatus('idle');
      }
    } finally {
      setTimeout(() => {
        (window as any).callingWaiter = false;
      }, 2000);
    }
  };
   
  // Place order function removed - using hook version

  // Handle checkout
  const handleCheckout = async (method: 'cash' | 'card') => {
    const servedOrders = activeOrders.filter((order: OrderTracking) => order.status === 'served');
    if (servedOrders.length === 0) {
      alert('No orders ready for payment. Please wait for your orders to be served.');
      return;
    }

    const totalAmount = servedOrders.reduce((sum: number, order: OrderTracking) => sum + order.total, 0);
    
    try {
      const lastOrderId = servedOrders[servedOrders.length - 1]?._id;
      if (!lastOrderId) {
        throw new Error('No valid order ID found');
      }
      
      await guestApiService.processPayment({
        orderId: lastOrderId,
        method: method,
        amount: totalAmount,
        tip: 0
      });

      setPaymentCompleteTotal(totalAmount);
      useCartStore.getState().clearCart();
      
      // Checkout customer session
      if (customerSession?._id) {
        await guestApiService.checkoutCustomerSession(customerSession._id);
      }
      
      setShowCheckoutModal(false);
      setShowThankYou(true);
      
      setTimeout(() => {
        setShowThankYou(false);
        setShowFeedback(true);
      }, 5000);
    } catch (error) {
      console.error('Checkout error:', error);
      addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: 'Failed to process payment. Please try again.',
      });
    }
  };

  // Handle feedback submit
  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      await guestApiService.submitFeedback({
        tableNumber,
        ...feedbackData,
        orderId: activeOrders[activeOrders.length - 1]?._id
      });
      
      // Close customer session
      if (customerSession?._id) {
        await guestApiService.closeCustomerSession(customerSession._id);
      }
      
      addNotification({
        type: 'success',
        title: 'Thank You!',
        message: t.thankYouFeedback
      });
      setShowFeedback(false);
      
      // Clear customer session from auth store
      useAuthStore.getState().clearCustomerSession();
      
      // Reset to welcome screen
      setTimeout(() => {
        window.location.reload(); // This will reset everything and go back to welcome screen
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to submit feedback. Please try again.'
      });
    }
  };

  const handleRequestBill = async () => {
    if ((window as any).requestingBill) return;
    
    (window as any).requestingBill = true;
    
    try {
      await sendServiceRequest('bill', 'Bill requested', true);
      
      const servedOrders = activeOrders.filter((order: OrderTracking) => order.status === 'served');
      if (servedOrders.length > 0) {
        setShowCheckoutModal(true);
      } else {
        alert('No orders ready for payment. Please wait for your orders to be served.');
      }
    } finally {
      setTimeout(() => {
        (window as any).requestingBill = false;
      }, 1000);
    }
  };

  // Guest mode doesn't need logout functionality
  const handleLogout = async () => {
    // For guest mode, we don't have logout
    // This function is kept for compatibility but does nothing
    console.log('Logout not available in guest mode');
  };

  // Format categories for CategorySidebar
  const formattedCategories = useMemo(() => {
    return categories.map(category => ({
      id: category.slug,
      name: language === 'ar' ? category.nameAr : category.name,
      icon: iconMap[category.icon] || Utensils, // Default to Utensils if icon not found
      image: category.image
    }));
  }, [categories, language]);

  // Guest frontend doesn't require authentication
  // Table number is passed from App.tsx based on QR code or tablet config

  // Show loading state while checking for active session  
  if (isCheckingSession && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking for active session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <WelcomeScreen t={t} />
      
      {/* Customer Detail Form - Shows after welcome screen */}
      {showCustomerForm && !showWelcome && (
        <CustomerDetailForm 
          t={t} 
          onSubmit={handleCustomerDetailsSubmit}
          isSubmitting={isSubmittingCustomerDetails}
        />
      )}
      
      {/* Only show main content after customer details are submitted */}
      {!showWelcome && !showCustomerForm && (
        <>
          <FeedbackModal t={t} customerSession={customerSession} />
          <ThankYouScreen t={t} />
          
          {/* Notifications */}
          <div className="notification-container">
            {notifications.map(notification => (
              <NotificationToast
                key={notification.id}
                notification={notification}
                onClose={() => removeNotification(notification.id)}
              />
            ))}
          </div>
          
          <Header 
            t={t} 
            taglines={taglines}
            onCallWaiter={callWaiter}
            onRequestBill={handleRequestBill}
            tableNumber={tableNumber}
          />
          
          {/* Main Content */}
          <div style={{ paddingTop: useUIStore.getState().showPromo ? '140px' : '100px' }}>
            <OrderTrackingBar 
              orders={activeOrders}
              onCancelOrder={cancelOrder}
              isCancelling={isCancelling}
              t={t}
            />
            
            <div className="flex flex-1">
              <CategorySidebar
                categories={formattedCategories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
              
              <main className="flex-1 overflow-y-auto p-6">
                <div className="container mx-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-4xl font-bold text-center flex-1">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {searchQuery ? 'Search Results' : (language === 'ar' ? currentCategory?.nameAr : currentCategory?.name)}
                      </span>
                    </h2>
                    
                    {/* Menu Mode Toggle */}
                    <button
                      onClick={() => setMenuMode(menuMode === 'classic' ? 'universe' : 'classic')}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all ml-4"
                    >
                      <span className="text-xl">
                        {menuMode === 'classic' ? '🌌' : '📋'}
                      </span>
                      <span className="text-sm font-medium">
                        {menuMode === 'classic' ? 'Universe Mode' : 'Classic Mode'}
                      </span>
                    </button>
                  </div>

                  {categoriesLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : menuMode === 'universe' ? (
                    <MenuUniverse
                      categories={categories}
                      menuItems={filteredItems}
                      onItemSelect={(item) => setShowCustomization(item)}
                      userMood={customerSession?.mood || 'relaxed'}
                    />
                  ) : (
                    <MenuGrid
                      items={filteredItems}
                      isLoading={isLoading}
                      error={error?.message}
                      onRefetch={refetch}
                      onAddToCart={(item) => setShowCustomization(item)}
                      t={t}
                    />
                  )}
                </div>
              </main>
            </div>
          </div>

          {/* Modals */}
          <CartModal t={t} onPlaceOrder={handlePlaceOrder} />
          <CustomizationModal
            item={showCustomization}
            onClose={() => setShowCustomization(null)}
            onAddToCart={(item, customizations, specialRequests) => {
              addToCart(item, customizations, specialRequests);
              addNotification({
                type: 'success',
                title: 'Added to Cart',
                message: `${item.name} has been added to your cart`,
              });
            }}
            t={t}
          />
          <CheckoutModal t={t} onProcessPayment={handleCheckout} />
          <OrderHistoryModal t={t} onViewOrderDetails={setSelectedOrderDetails} />
          <FlavorJourneyModal 
            t={t} 
            customerName={customerSession?.customerName || 'Guest'} 
            menuItems={filteredItems}
          />
          <AIAssistantModal t={t} />
          <TableServiceModal t={t} onServiceRequest={(type) => handleTableServiceRequest({ type })} />
          
          {/* Order Confirmation Modal */}
          {showOrderConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={40} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t.confirmOrder}</h2>
                  <p className="text-gray-600">Please review your order before confirming</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{t.itemsInCart}: {useCartStore.getState().cart.length}</p>
                    <p className="font-semibold text-lg">{t.total}: AED {useCartStore.getState().getTotal().total.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOrderConfirmation(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => {
                      placeOrder();
                      setShowOrderConfirmation(false);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300"
                  >
                    {t.confirmOrder}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {selectedOrderDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Order #{selectedOrderDetails.orderNumber}</h2>
                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Order Date</p>
                    <p className="font-medium">{new Date(selectedOrderDetails.createdAt).toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold">Items</h3>
                    {selectedOrderDetails.items.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.quantity}x {item.name}</p>
                            {item.selectedCustomizations && Object.entries(item.selectedCustomizations).map(([key, value]) => (
                              <p key={key} className="text-sm text-gray-600">{key}: {String(value)}</p>
                            ))}
                          </div>
                          <p className="font-medium">AED {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-purple-600">AED {selectedOrderDetails.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <LogOut size={48} />
                  <h2 className="text-2xl font-bold mb-2">Confirm Logout</h2>
                  <p className="text-gray-600">Please enter your password to logout</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showLogoutPassword ? "text" : "password"}
                      value={logoutPassword}
                      onChange={(e) => setLogoutPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLogoutPassword(!showLogoutPassword)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showLogoutPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      setLogoutPassword('');
                      setShowLogoutPassword(false);
                    }}
                    className="flex-1 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    {t.logout}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Creative Popups */}
          {showCreativePopup && (
            <CreativePopup
              type={showCreativePopup}
              onClose={() => setShowCreativePopup(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

// Props interface for main component
interface RestaurantOrderingSystemProps {
  tableNumber: string;
}

// Main component that provides QueryClient
export const RestaurantOrderingSystem: React.FC<RestaurantOrderingSystemProps> = ({ tableNumber }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <RestaurantOrderingSystemInner tableNumber={tableNumber} />
    </QueryClientProvider>
  );
};

// Fixed SVG components with proper typing
interface SVGProps {
  size: number;
  className?: string;
}

const Check = ({ size, className }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const X = ({ size, className }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LogOut = ({ size, className }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Eye = ({ size, className }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOff = ({ size, className }: SVGProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);