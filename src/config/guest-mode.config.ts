/**
 * Guest Mode Configuration
 * 
 * This configuration handles guest access to the restaurant ordering system
 * without requiring authentication. Perfect for tablets and QR code access.
 */

import { getCurrentTenant } from './tenant.config';

export interface GuestConfig {
  tableNumber: string;
  deviceType: 'tablet' | 'mobile' | 'desktop';
  sessionId: string;
  tenantId: string;
}

/**
 * Generate a guest session ID for tracking orders
 */
export function generateGuestSessionId(tableNumber: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const sessionId = `guest-${tableNumber}-${timestamp}-${random}`;
  console.log('[GUEST-CONFIG] Generated session ID:', sessionId);
  return sessionId;
}

/**
 * Initialize guest session
 */
export function initializeGuestSession(tableNumber: string): GuestConfig {
  console.log('[GUEST-CONFIG] Initializing guest session for table:', tableNumber);
  
  const sessionId = generateGuestSessionId(tableNumber);
  const deviceType = detectDeviceType();
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  
  // Get the proper tenant configuration
  const tenant = getCurrentTenant();
  const tenantId = tenant?.tenantId || `rest_${subdomain}_001`;
  
  console.log('[GUEST-CONFIG] Device type detected:', deviceType);
  console.log('[GUEST-CONFIG] Hostname:', hostname);
  console.log('[GUEST-CONFIG] Subdomain:', subdomain);
  console.log('[GUEST-CONFIG] TenantId:', tenantId);
  
  const config: GuestConfig = {
    tableNumber,
    deviceType,
    sessionId,
    tenantId
  };
  
  // Store in session storage
  sessionStorage.setItem('guestConfig', JSON.stringify(config));
  console.log('[GUEST-CONFIG] Guest config stored:', config);
  
  return config;
}

/**
 * Get current guest session
 */
export function getGuestSession(): GuestConfig | null {
  const stored = sessionStorage.getItem('guestConfig');
  const config = stored ? JSON.parse(stored) : null;
  console.log('[GUEST-CONFIG] Retrieved guest session:', config);
  return config;
}

/**
 * Detect device type
 */
function detectDeviceType(): 'tablet' | 'mobile' | 'desktop' {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(userAgent);
  const isMobile = /iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

/**
 * Tablet mode specific configurations
 */
export const tabletModeConfig = {
  // Prevent accidental navigation
  disableBackButton: true,
  // Keep screen always on
  preventScreenTimeout: true,
  // Disable pull-to-refresh
  disablePullToRefresh: true,
  // Lock orientation
  lockOrientation: 'landscape',
  // Hide browser UI
  fullscreen: true,
  // Periodic session refresh
  sessionRefreshInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * QR code mode specific configurations
 */
export const qrModeConfig = {
  // Session timeout for QR users
  sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
  // Allow saving favorite items
  enableFavorites: true,
  // Show estimated wait times
  showWaitTimes: true,
};