import { logger } from '../logger';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // First Contentful Paint & Largest Contentful Paint
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = Math.round(entry.startTime);
          }
          if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.lcp = Math.round(entry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      this.observers.set('paint', paintObserver);
    } catch (e) {
      logger.debug('Monitoring', 'Paint observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            this.metrics.fid = Math.round((entry as any).processingStart - entry.startTime);
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      logger.debug('Monitoring', 'FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      let clsEntries: any[] = [];
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += (entry as any).value;
              sessionEntries.push(entry);
            } else {
              sessionValue = (entry as any).value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              clsEntries = sessionEntries;
              this.metrics.cls = Math.round(clsValue * 1000) / 1000;
            }
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      logger.debug('Monitoring', 'CLS observer not supported');
    }

    // Time to First Byte
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.metrics.ttfb = Math.round(navigationEntry.responseStart - navigationEntry.fetchStart);
      }
    } catch (e) {
      logger.debug('Monitoring', 'TTFB calculation failed');
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Report metrics to analytics
   */
  reportMetrics(): void {
    const metrics = this.getMetrics();
    
    // Log metrics in development
    logger.debug('Monitoring', 'Performance Metrics', metrics);

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics
      if ('gtag' in window) {
        (window as any).gtag('event', 'performance', {
          event_category: 'Web Vitals',
          event_label: 'Page Load',
          value: Math.round(metrics.lcp || 0),
          fcp: metrics.fcp,
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          ttfb: metrics.ttfb
        });
      }
    }
  }

  /**
   * Measure custom performance marks
   */
  mark(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if ('performance' in window && 'measure' in performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        
        const entries = performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const duration = lastEntry?.duration || 0;
          logger.debug('Monitoring', `Performance measure ${name}: ${duration}ms`);
          return duration;
        }
      } catch (e) {
        logger.debug('Monitoring', 'Performance measure failed', e);
      }
    }
    return null;
  }

  /**
   * Clean up observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Report metrics when page is about to be unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    performanceMonitor.reportMetrics();
  }, { capture: true });

  // Also report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 0);
  });
}