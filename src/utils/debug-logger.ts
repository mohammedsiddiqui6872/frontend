/**
 * Debug Logger for Guest Frontend
 * TEMPORARY - Will be removed after debugging
 */

export class DebugLogger {
  private static startTime = Date.now();
  
  static logStartup() {
    console.log('='.repeat(80));
    console.log('🚀 GRIT SERVICES GUEST FRONTEND - STARTUP DEBUG LOG');
    console.log('='.repeat(80));
    console.log(`[STARTUP] Time: ${new Date().toISOString()}`);
    console.log(`[STARTUP] User Agent: ${navigator.userAgent}`);
    console.log(`[STARTUP] Platform: ${navigator.platform}`);
    console.log(`[STARTUP] Language: ${navigator.language}`);
    console.log(`[STARTUP] Online: ${navigator.onLine}`);
    console.log('='.repeat(80));
    
    // Log URL info
    console.log('[URL] Full URL:', window.location.href);
    console.log('[URL] Protocol:', window.location.protocol);
    console.log('[URL] Hostname:', window.location.hostname);
    console.log('[URL] Port:', window.location.port || '(default)');
    console.log('[URL] Pathname:', window.location.pathname);
    console.log('[URL] Search:', window.location.search);
    console.log('[URL] Hash:', window.location.hash);
    console.log('='.repeat(80));
    
    // Log environment
    console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
    console.log('[ENV] REACT_APP_API_URL:', process.env['REACT_APP_API_URL'] || '(not set)');
    console.log('[ENV] Build timestamp:', process.env['REACT_APP_BUILD_TIME'] || '(not set)');
    console.log('='.repeat(80));
    
    // Log browser storage
    console.log('[STORAGE] LocalStorage items:', Object.keys(localStorage));
    console.log('[STORAGE] SessionStorage items:', Object.keys(sessionStorage));
    
    // Log cookies (if any)
    console.log('[COOKIES]:', document.cookie || '(none)');
    console.log('='.repeat(80));
    
    // Log service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('[SERVICE-WORKER] Registrations:', registrations.length);
        registrations.forEach((reg, index) => {
          console.log(`[SERVICE-WORKER] #${index + 1}:`, {
            scope: reg.scope,
            active: reg.active?.scriptURL,
            waiting: reg.waiting?.scriptURL,
            installing: reg.installing?.scriptURL
          });
        });
      });
    } else {
      console.log('[SERVICE-WORKER] Not supported');
    }
    console.log('='.repeat(80));
  }
  
  static logPhase(phase: string, data?: any) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[PHASE:${phase}] +${elapsed}ms`, data || '');
  }
  
  static logError(context: string, error: any) {
    console.error(`[ERROR:${context}]`, {
      message: error?.message,
      stack: error?.stack,
      response: error?.response,
      data: error?.response?.data
    });
  }
  
  static logAPICall(method: string, url: string, data?: any) {
    console.log(`[API] ${method} ${url}`, data ? { data } : '');
  }
  
  static logAPIResponse(url: string, status: number, data?: any) {
    const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
    console.log(`[API-RESPONSE] ${statusEmoji} ${status} ${url}`, data || '');
  }
}

// Auto-log startup when script loads
if (typeof window !== 'undefined') {
  DebugLogger.logStartup();
}