import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getCurrentTenant, applyTenantTheme } from './config/tenant.config';
import { apiService } from './services/api.service.multi-tenant';
import { RestaurantOrderingSystem } from './components/RestaurantOrderingSystem';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logger } from './utils/logger';
import { securityService } from './services/security.service';
import { SkipLinks } from './components/common/SkipLinks';
import './App.css';

const TenantErrorScreen = React.memo<{ message: string }>(({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Restaurant Not Found</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <p className="text-sm text-gray-500">
        Please check the URL and try again, or contact support if the issue persists.
      </p>
    </div>
  </div>
));

const LoadingScreen = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading restaurant...</p>
    </div>
  </div>
));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'tablet' | 'mobile' | 'desktop'>('mobile');
  
  // Memoize device detection logic
  const detectDeviceType = useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    const isTablet = /ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(userAgent);
    const isMobile = /iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent);
    
    if (isTablet) return 'tablet';
    if (isMobile) return 'mobile';
    return 'desktop';
  }, []);

  useEffect(() => {
    const initializeTenant = async () => {
      logger.debug('APP', 'Starting app initialization...', {
        url: window.location.href,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        search: window.location.search
      });
      
      try {
        // Get current tenant
        logger.debug('APP', 'Getting current tenant...');
        const tenant = getCurrentTenant();
        logger.debug('APP', 'Tenant found', tenant);
        
        if (!tenant) {
          logger.error('APP', 'No tenant found for current URL');
          setError('Unable to identify restaurant. Please check the URL.');
          setIsLoading(false);
          return;
        }

        // Apply tenant theme
        logger.debug('APP', 'Applying tenant theme...');
        applyTenantTheme(tenant);
        setTenantName(tenant.name);
        
        // Get table number from URL params or secure storage (for tablets)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTable = urlParams.get('table');
        const storedTableData = securityService.secureStorage.getItem('tableInfo');
        
        // Validate stored table data belongs to current tenant
        const storedTable = (storedTableData?.tenantId === tenant.tenantId) 
          ? storedTableData.tableNumber 
          : null;
          
        logger.debug('APP', 'Table parameters', { urlTable, storedTable });
        
        // For tablets, we store the table number permanently
        if (urlTable) {
          logger.debug('APP', 'Using table from URL', { table: urlTable });
          setTableNumber(urlTable);
          // Store for tablet mode with tenant context
          securityService.secureStorage.setItem('tableInfo', {
            tableNumber: urlTable,
            tenantId: tenant.tenantId,
            timestamp: Date.now()
          });
        } else if (storedTable) {
          logger.debug('APP', 'Using stored table', { table: storedTable });
          setTableNumber(storedTable);
        } else {
          // No table number found
          logger.error('APP', 'No table number found in URL or storage');
          setError('Please scan the QR code at your table or ask staff for assistance.');
          setIsLoading(false);
          return;
        }

        // Use memoized device type
        const detectedDevice = detectDeviceType;
        logger.info('APP', `Device detected: ${detectedDevice.toUpperCase()}`);
        setDeviceType(detectedDevice);
        
        // Lock orientation for tablets if possible
        if (detectedDevice === 'tablet' && 'orientation' in window.screen && 'lock' in (window.screen as any).orientation) {
          (window.screen as any).orientation.lock('landscape').catch(() => {
            logger.debug('APP', 'Orientation lock not supported');
          });
        }
        
        logger.info('APP', 'App initialized successfully', {
          restaurant: tenant.name,
          table: urlTable || storedTable
        });
        
        // Small delay to show loading state
        setTimeout(() => {
          logger.debug('APP', 'Loading complete, showing main app');
          setIsLoading(false);
        }, 500);
      } catch (err) {
        logger.error('APP', 'Failed to initialize tenant', err);
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
      <SkipLinks />
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