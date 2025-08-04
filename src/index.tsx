import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.multi-tenant';
import { DebugLogger } from './utils/debug-logger';

// Log phase: React initialization
DebugLogger.logPhase('REACT_INIT');

// Global error handler for debugging
window.addEventListener('error', (event) => {
  DebugLogger.logError('WINDOW_ERROR', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  DebugLogger.logError('UNHANDLED_PROMISE_REJECTION', {
    reason: event.reason,
    promise: event.promise
  });
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

DebugLogger.logPhase('ROOT_CREATED');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

DebugLogger.logPhase('APP_RENDERED');

// Unregister any existing service workers first to clear cache issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach(registration => {
      if (registration.active?.scriptURL.includes('service-worker.js')) {
        registration.unregister();
      }
    });
  });
}

// Register service worker for PWA functionality (only in production)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker-simple.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update prompt
                if (window.confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
  
  // Handle offline/online events
  window.addEventListener('online', async () => {
    console.log('Back online!');
    // Sync any offline data
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-orders');
      }
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('Gone offline!');
  });
}