/**
 * Debug Logger for Guest Frontend
 * TEMPORARY - Will be removed after debugging
 */

export class DebugLogger {
  private static startTime = Date.now();
  
  static logStartup() {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('🚀 DEBUG: Guest Frontend Starting...');
    
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);

    console.log('📍 Environment Info:');
    
    // Log URL info
    console.log(`🌐 URL: ${window.location.href}`);
    console.log(`🏠 Hostname: ${window.location.hostname}`);
    console.log(`🔗 Pathname: ${window.location.pathname}`);
    console.log(`❓ Search: ${window.location.search}`);
    
    // Log environment
    console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`🔌 API URL: ${process.env['REACT_APP_API_URL']}`);
    console.log(`🔌 Socket URL: ${process.env['REACT_APP_SOCKET_URL']}`);
    
    // Log browser storage
    console.log(`💾 LocalStorage Items: ${Object.keys(localStorage).length}`);
    console.log(`🍪 SessionStorage Items: ${Object.keys(sessionStorage).length}`);
    
    // Log cookies (if any)
    console.log(`🍪 Cookies: ${document.cookie || 'none'}`);
    console.log('-------------------------------------------');
    
    // Log service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`👷 Service Workers: ${registrations.length} registered`);
        registrations.forEach((reg, index) => {
          console.log(`  SW ${index + 1}: ${reg.scope} (${reg.active?.state || 'inactive'})`);
        });
      });
    } else {
      console.log('👷 Service Workers: Not supported');
    }
    console.log('-------------------------------------------');
  }
  
  static logPhase(phase: string, data?: any) {
    if (process.env.NODE_ENV !== 'development') return;
    const elapsed = Date.now() - this.startTime;
    console.log(`⏱️ [${elapsed}ms] ${phase}`, data || '');
  }
  
  static logError(context: string, error: any) {
    if (process.env.NODE_ENV !== 'development') return;
    console.error(`❌ ERROR in ${context}:`, error);
  }
  
  static logAPICall(method: string, url: string, data?: any) {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(`📤 API ${method} ${url}`, data || '');
  }
  
  static logAPIResponse(url: string, status: number, data?: any) {
    if (process.env.NODE_ENV !== 'development') return;
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`📥 API Response ${statusEmoji} ${status} ${url}`, data || '');
  }
}

// Auto-log startup when script loads
if (typeof window !== 'undefined') {
  DebugLogger.logStartup();
}