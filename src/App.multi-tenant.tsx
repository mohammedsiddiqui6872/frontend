import React, { useEffect, useState } from 'react';
import { getCurrentTenant, applyTenantTheme } from './config/tenant.config';
import { apiService } from './services/api.service.multi-tenant';
import { RestaurantOrderingSystem } from './components/RestaurantOrderingSystem';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const TenantErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Restaurant Not Found</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <p className="text-sm text-gray-500">
        Please check the URL and try again, or contact support if the issue persists.
      </p>
    </div>
  </div>
);

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading restaurant...</p>
    </div>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'tablet' | 'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    const initializeTenant = async () => {
      console.log('[APP] Starting app initialization...');
      console.log('[APP] Current URL:', window.location.href);
      console.log('[APP] Hostname:', window.location.hostname);
      console.log('[APP] Pathname:', window.location.pathname);
      console.log('[APP] Search params:', window.location.search);
      
      try {
        // Get current tenant
        console.log('[APP] Getting current tenant...');
        const tenant = getCurrentTenant();
        console.log('[APP] Tenant found:', tenant);
        
        if (!tenant) {
          console.error('[APP] No tenant found for current URL');
          setError('Unable to identify restaurant. Please check the URL.');
          setIsLoading(false);
          return;
        }

        // Apply tenant theme
        console.log('[APP] Applying tenant theme...');
        applyTenantTheme(tenant);
        setTenantName(tenant.name);
        
        // Get table number from URL params or localStorage (for tablets)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTable = urlParams.get('table');
        const storedTable = localStorage.getItem('tableNumber');
        console.log('[APP] URL table param:', urlTable);
        console.log('[APP] Stored table number:', storedTable);
        
        // For tablets, we store the table number permanently
        if (urlTable) {
          console.log('[APP] Using table from URL:', urlTable);
          setTableNumber(urlTable);
          // Store for tablet mode
          localStorage.setItem('tableNumber', urlTable);
        } else if (storedTable) {
          console.log('[APP] Using stored table:', storedTable);
          setTableNumber(storedTable);
        } else {
          // No table number found
          console.error('[APP] No table number found in URL or storage');
          setError('Please scan the QR code at your table or ask staff for assistance.');
          setIsLoading(false);
          return;
        }

        // Detect device type
        const userAgent = navigator.userAgent.toLowerCase();
        console.log('[APP] User agent:', userAgent);
        
        const isTablet = /ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(userAgent);
        const isMobile = /iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent);
        
        if (isTablet) {
          console.log('[APP] Device detected: TABLET');
          setDeviceType('tablet');
          // Lock orientation for tablets if possible
          if ('orientation' in window.screen && 'lock' in (window.screen as any).orientation) {
            (window.screen as any).orientation.lock('landscape').catch(() => {
              console.log('[APP] Orientation lock not supported');
            });
          }
        } else if (isMobile) {
          console.log('[APP] Device detected: MOBILE');
          setDeviceType('mobile');
        } else {
          console.log('[APP] Device detected: DESKTOP');
          setDeviceType('desktop');
        }
        
        console.log(`[APP] ✅ App initialized successfully - Restaurant: ${tenant.name} - Table: ${urlTable || storedTable}`);
        
        // Small delay to show loading state
        setTimeout(() => {
          console.log('[APP] Loading complete, showing main app');
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('[APP] ❌ Failed to initialize tenant:', err);
        setError('Failed to load restaurant configuration.');
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <TenantErrorScreen message={error} />;
  }

  return (
    <ErrorBoundary>
      <div className="App" data-device-type={deviceType}>
        <RestaurantOrderingSystem tableNumber={tableNumber} />
        
        {/* Tablet Mode Indicator */}
        {deviceType === 'tablet' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs opacity-50">
            Table {tableNumber}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;