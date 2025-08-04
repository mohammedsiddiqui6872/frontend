// Centralized logging utility that removes logs in production
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableInProduction: boolean;
  logLevel: LogLevel;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.config = {
      enableInProduction: false,
      logLevel: 'info',
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && !this.config.enableInProduction) {
      return false;
    }
    
    return this.logLevels[level] >= this.logLevels[this.config.logLevel];
  }

  private formatMessage(level: LogLevel, component: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}`;
  }

  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', component, message), data || '');
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', component, message), data || '');
    }
  }

  warn(component: string, message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', component, message), data || '');
    }
  }

  error(component: string, message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', component, message), error || '');
      
      // In production, you might want to send errors to a monitoring service
      if (!this.isDevelopment && error) {
        this.sendToErrorMonitoring(component, message, error);
      }
    }
  }

  // Group related logs
  group(component: string, groupName: string, fn: () => void): void {
    if (this.isDevelopment) {
      console.group(`[${component}] ${groupName}`);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }

  // Performance timing
  time(component: string, label: string): void {
    if (this.shouldLog('debug')) {
      console.time(`[${component}] ${label}`);
    }
  }

  timeEnd(component: string, label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(`[${component}] ${label}`);
    }
  }

  private sendToErrorMonitoring(component: string, message: string, error: any): void {
    // Placeholder for error monitoring service integration
    // In production, integrate with services like Sentry, LogRocket, etc.
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { component },
    //     extra: { message }
    //   });
    // }
  }
}

// Create singleton instance
export const logger = new Logger({
  enableInProduction: false, // Set to true only for debugging production issues
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
});

// Export for testing
export { Logger };