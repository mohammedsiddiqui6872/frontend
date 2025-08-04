type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    // Capture stack trace for errors
    if (level === 'error') {
      entry.stack = new Error().stack;
    }

    // Store in buffer for error reporting
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Only log to console in development
    if (this.isDevelopment) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '');
    }
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: any): void {
    this.log('error', message, error);
    
    // Send to error tracking service in production
    if (!this.isDevelopment && typeof window !== 'undefined') {
      this.reportError(message, error);
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Report error to tracking service
   */
  private reportError(message: string, error: any): void {
    // Implement error reporting to service like Sentry
    // For now, we'll store in sessionStorage for debugging
    try {
      const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
      errors.push({
        message,
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift();
      }
      
      sessionStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Performance logging
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel, LogEntry };