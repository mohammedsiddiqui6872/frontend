// Multi-tenant configuration
import { applyTenantTheme as applyEnhancedTheme } from './tenant-themes';

export interface TenantConfig {
  tenantId: string;
  subdomain: string;
  name: string;
  primaryColor: string;
  logo?: string;
  currency: string;
  apiUrl: string;
}

// Extract tenant from current domain
export function getCurrentTenant(): TenantConfig | null {
  console.log('[TENANT-CONFIG] Getting current tenant...');
  const hostname = window.location.hostname;
  console.log('[TENANT-CONFIG] Hostname:', hostname);
  
  const subdomain = hostname.split('.')[0];
  console.log('[TENANT-CONFIG] Extracted subdomain:', subdomain);
  console.log('[TENANT-CONFIG] Full hostname parts:', hostname.split('.'));
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[TENANT-CONFIG] Running in local development mode');
    // Use query parameter for local testing
    const urlParams = new URLSearchParams(window.location.search);
    const testSubdomain = urlParams.get('tenant') || 'mughlaimagic';
    console.log('[TENANT-CONFIG] Test subdomain:', testSubdomain);
    
    const localTenant = {
      tenantId: `rest_${testSubdomain}_001`,
      subdomain: testSubdomain,
      name: testSubdomain.charAt(0).toUpperCase() + testSubdomain.slice(1),
      primaryColor: '#8B4513',
      currency: 'AED',
      apiUrl: process.env['REACT_APP_API_URL'] || 'http://localhost:5000/api'
    };
    console.log('[TENANT-CONFIG] Local tenant config:', localTenant);
    return localTenant;
  }
  
  console.log('[TENANT-CONFIG] Running in production mode');
  // For production - extract from subdomain
  const tenantMap: Record<string, TenantConfig> = {
    'mughlaimagic': {
      tenantId: 'rest_mughlaimagic_001',
      subdomain: 'mughlaimagic',
      name: 'Mughlai Magic',
      primaryColor: '#8B4513',
      currency: 'AED',
      apiUrl: 'https://api.gritservices.ae/api'
    },
    'bellavista': {
      tenantId: 'rest_bellavista_002',
      subdomain: 'bellavista',
      name: 'Bella Vista',
      primaryColor: '#228B22',
      currency: 'AED',
      apiUrl: 'https://api.gritservices.ae/api'
    },
    'hardrockcafe': {
      tenantId: 'rest_hardrockcafe_003',
      subdomain: 'hardrockcafe',
      name: 'Hard Rock Cafe',
      primaryColor: '#FF0000',
      currency: 'AED',
      apiUrl: 'https://api.gritservices.ae/api'
    }
  };
  
  console.log('[TENANT-CONFIG] Available tenants:', Object.keys(tenantMap));
  const foundTenant = subdomain ? tenantMap[subdomain] || null : null;
  console.log('[TENANT-CONFIG] Found tenant:', foundTenant);
  
  if (!foundTenant && subdomain) {
    console.error('[TENANT-CONFIG] ❌ No tenant mapping found for subdomain:', subdomain);
  }
  
  return foundTenant;
}

// Apply tenant theme
export function applyTenantTheme(tenant: TenantConfig) {
  const root = document.documentElement;
  
  // Apply enhanced theme if available
  applyEnhancedTheme(tenant.subdomain);
  
  // Convert hex to RGB (fallback for tenants without enhanced themes)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16)
    } : null;
  };
  
  const rgb = hexToRgb(tenant.primaryColor);
  if (rgb) {
    root.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--primary-color-hex', tenant.primaryColor);
  }
  
  // Update document title
  document.title = `${tenant.name} - Order Online`;
  
  // Update favicon if logo provided
  if (tenant.logo) {
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = tenant.logo;
    }
  }
}

// Get tenant-specific API headers
export function getTenantHeaders(tenant: TenantConfig): Record<string, string> {
  return {
    'X-Tenant-Id': tenant.tenantId,
    'X-Tenant-Subdomain': tenant.subdomain
  };
}