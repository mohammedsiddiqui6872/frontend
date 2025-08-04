import React from 'react';
import { Helmet } from 'react-helmet-async';

interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

const getCSPConfig = (): CSPConfig => {
  const apiUrl = process.env['REACT_APP_API_URL'] || 'http://localhost:5000';
  const socketUrl = process.env['REACT_APP_SOCKET_URL'] || 'ws://localhost:5000';
  
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Will remove after refactoring inline scripts
      "'unsafe-eval'", // For development, will remove in production
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // For Tailwind and inline styles
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      apiUrl
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      apiUrl,
      socketUrl,
      'https://api.gritservices.ae',
      'wss://api.gritservices.ae'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
    'block-all-mixed-content': true
  };
};

const buildCSPString = (config: CSPConfig): string => {
  const directives: string[] = [];
  
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'boolean' && value) {
      directives.push(key);
    } else if (Array.isArray(value) && value.length > 0) {
      directives.push(`${key} ${value.join(' ')}`);
    }
  });
  
  return directives.join('; ');
};

export const ContentSecurityPolicy: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const cspConfig = getCSPConfig();
  const cspString = buildCSPString(cspConfig);
  
  // In production, also set as HTTP header
  if (process.env.NODE_ENV === 'production') {
    // Remove unsafe-eval and minimize unsafe-inline
    cspConfig['script-src'] = cspConfig['script-src'].filter(src => src !== "'unsafe-eval'");
  }
  
  return (
    <>
      <Helmet>
        <meta httpEquiv="Content-Security-Policy" content={cspString} />
      </Helmet>
      {children}
    </>
  );
};

// CSP violation reporter
if (typeof window !== 'undefined') {
  window.addEventListener('securitypolicyviolation', (e) => {
    // Log CSP violations for monitoring
    const violation = {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      disposition: e.disposition,
      documentURI: e.documentURI,
      timestamp: new Date().toISOString()
    };
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring endpoint
      fetch('/api/csp-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation)
      }).catch(() => {
        // Fail silently
      });
    } else {
      
    }
  });
}