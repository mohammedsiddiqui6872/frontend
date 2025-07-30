import React, { useState, useEffect } from 'react';
import { RestaurantOrderingSystem } from './components/RestaurantOrderingSystem';
import { LoginScreen } from './components/auth/LoginScreen';
import { TableSelectionScreen } from './components/waiter/TableSelectionScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import { translations } from './utils/translations';
import { getCurrentTenant } from './config/tenant.config';
import './index.css';
import './theme.css';

type Language = 'en' | 'es' | 'ru' | 'ar' | 'tr';

function AppRoot() {
  const { isAuthenticated, employeeName } = useAuthStore();
  const [language, setLanguage] = useState<Language>('en');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  
  const t = translations[language];
  
  // Get restaurant name from tenant config
  useEffect(() => {
    const tenant = getCurrentTenant();
    if (tenant) {
      setRestaurantName(tenant.name);
    }
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      // If user logs out, reset table selection
      if (prevState.isAuthenticated && !state.isAuthenticated) {
        setSelectedTable(null);
        sessionStorage.removeItem('selectedTable');
      }
    });

    return unsubscribe;
  }, []);

  const handleTableSelected = (tableNumber: string) => {
    setSelectedTable(tableNumber);
    // Store the selected table in session storage for the current session
    sessionStorage.setItem('selectedTable', tableNumber);
  };

  // Check for previously selected table in the current session
  useEffect(() => {
    if (isAuthenticated && !selectedTable) {
      const storedTable = sessionStorage.getItem('selectedTable');
      if (storedTable) {
        setSelectedTable(storedTable);
      }
    }
  }, [isAuthenticated, selectedTable]);

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginScreen t={t} language={language} setLanguage={setLanguage} restaurantName={restaurantName} />
      </ErrorBoundary>
    );
  }

  // If authenticated but no table selected, show table selection
  if (!selectedTable) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <TableSelectionScreen onTableSelected={handleTableSelected} t={t} />
        </div>
      </ErrorBoundary>
    );
  }

  // If authenticated and table selected, show the main ordering system
  return (
    <ErrorBoundary>
      {/* SVG Gradient Definition for Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="purple-pink-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#db2777', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="purple-pink-gradient-filter">
            <feColorMatrix 
              type="matrix" 
              values="0.5843 0 0.3569 0 0.2745
                      0.2627 0 0.8588 0 0.1529
                      0.9176 0 0.4667 0 0.2745
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
      
      {/* Pass the selected table as a prop */}
      <RestaurantOrderingSystem tableNumber={selectedTable} />
    </ErrorBoundary>
  );
}

export default AppRoot;