import { ApiServiceError } from './api.service';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  showDetails?: boolean;
}

class ErrorHandlerService {
  private errorQueue: Error[] = [];
  private maxQueueSize = 10;

  // Convert technical errors to user-friendly messages
  public getUserFriendlyError(error: Error | unknown, context?: ErrorContext): UserFriendlyError {
    // API Errors
    if (error instanceof ApiServiceError) {
      return this.handleApiError(error);
    }

    // Network Errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        actions: [
          {
            label: 'Retry',
            action: () => window.location.reload(),
          },
        ],
      };
    }

    // Rate Limit Errors
    if (error instanceof Error && error.message.includes('Rate limit')) {
      const match = error.message.match(/(\d+) seconds/);
      const seconds = match ? match[1] : '60';
      return {
        title: 'Too Many Requests',
        message: `Please wait ${seconds} seconds before trying again.`,
        showDetails: false,
      };
    }

    // Validation Errors
    if (error instanceof Error && error.message.includes('validation')) {
      return {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        showDetails: true,
      };
    }

    // Default Error
    return {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      actions: [
        {
          label: 'Go Back',
          action: () => window.history.back(),
        },
        {
          label: 'Refresh',
          action: () => window.location.reload(),
        },
      ],
      showDetails: process.env.NODE_ENV === 'development',
    };
  }

  private handleApiError(error: ApiServiceError): UserFriendlyError {
    const statusHandlers: Record<number, UserFriendlyError> = {
      400: {
        title: 'Invalid Request',
        message: error.message || 'The request contains invalid data. Please check and try again.',
      },
      401: {
        title: 'Authentication Required',
        message: 'Please log in to continue.',
        actions: [
          {
            label: 'Log In',
            action: () => {
              // Clear auth and redirect to login
              localStorage.removeItem('auth-storage');
              window.location.href = '/';
            },
          },
        ],
      },
      403: {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
      },
      404: {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
      },
      409: {
        title: 'Conflict',
        message: error.message || 'This action conflicts with the current state. Please refresh and try again.',
      },
      422: {
        title: 'Invalid Data',
        message: error.message || 'The provided data is invalid. Please check and try again.',
      },
      429: {
        title: 'Too Many Requests',
        message: 'You have made too many requests. Please wait a moment and try again.',
      },
      500: {
        title: 'Server Error',
        message: 'The server encountered an error. Our team has been notified.',
        actions: [
          {
            label: 'Try Again',
            action: () => window.location.reload(),
          },
        ],
      },
      502: {
        title: 'Server Unavailable',
        message: 'The server is temporarily unavailable. Please try again in a few moments.',
      },
      503: {
        title: 'Service Maintenance',
        message: 'The service is currently under maintenance. Please try again later.',
      },
    };

    return statusHandlers[error.statusCode] || {
      title: 'Request Failed',
      message: error.message || 'The request could not be completed. Please try again.',
      showDetails: true,
    };
  }

  // Log errors for monitoring
  public logError(error: Error | unknown, context?: ErrorContext): void {

    // Add to queue
    if (error instanceof Error) {
      this.errorQueue.push(error);
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue.shift();
      }
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error, context);
    }
  }

  private sendToMonitoring(error: Error | unknown, context?: ErrorContext): void {
    // Integration with error monitoring service (e.g., Sentry, LogRocket)
    try {
      // Example: Sentry integration
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          extra: context,
        });
      }

      // Example: Custom error tracking
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : { message: String(error) },
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch (e) {
      // Don't let error reporting cause additional errors
    }
  }

  // Get recent errors for debugging
  public getRecentErrors(): Error[] {
    return [...this.errorQueue];
  }

  // Clear error history
  public clearErrors(): void {
    this.errorQueue = [];
  }
}

export const errorHandler = new ErrorHandlerService();

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: Error | unknown, context?: ErrorContext) => {
    const userError = errorHandler.getUserFriendlyError(error, context);
    errorHandler.logError(error, context);
    return userError;
  };

  return { handleError };
}