// Security Service for CSRF Protection and Encryption
import CryptoJS from 'crypto-js';

class SecurityService {
  private csrfToken: string | null = null;
  private encryptionKey: string;

  constructor() {
    // Use a persistent encryption key or generate new one
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.initializeCSRFToken();
  }

  // CSRF Token Management
  private initializeCSRFToken(): void {
    // Generate CSRF token on initialization
    this.csrfToken = this.generateCSRFToken();
    
    // Store in meta tag for easy access
    const meta = document.createElement('meta');
    meta.name = 'csrf-token';
    meta.content = this.csrfToken;
    document.head.appendChild(meta);
  }

  private generateCSRFToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public getCSRFToken(): string {
    if (!this.csrfToken) {
      this.initializeCSRFToken();
    }
    return this.csrfToken!;
  }

  // Encryption for localStorage
  private generateSessionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getOrCreateEncryptionKey(): string {
    // Use a combination of factors to derive a unique key per session
    // This avoids storing the key directly in sessionStorage
    const sessionId = this.getSessionIdentifier();
    const browserFingerprint = this.getBrowserFingerprint();
    
    // Derive key from session identifier and browser fingerprint
    // In production, consider using Web Crypto API's deriveKey
    const combinedSeed = `${sessionId}-${browserFingerprint}`;
    
    // Use the seed to generate a deterministic but unique key
    return CryptoJS.SHA256(combinedSeed).toString();
  }
  
  private getSessionIdentifier(): string {
    const STORAGE_KEY = 'session_id_v1';
    let sessionId = sessionStorage.getItem(STORAGE_KEY);
    
    if (!sessionId) {
      sessionId = this.generateSessionKey();
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  }
  
  private getBrowserFingerprint(): string {
    // Simple browser fingerprinting for key derivation
    // This is not for tracking, just for encryption key uniqueness
    const factors = [
      navigator.userAgent,
      navigator.language,
      window.screen.width + 'x' + window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown'
    ];
    
    return CryptoJS.SHA256(factors.join('|')).toString().substring(0, 16);
  }

  public encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }

  public decrypt(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Check if decryption resulted in empty string (wrong key)
      if (!decryptedString) {
        console.warn('Decryption resulted in empty string - data may be from different session');
        return null;
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Secure Storage wrapper
  public secureStorage = {
    setItem: (key: string, value: any): void => {
      const encrypted = this.encrypt(value);
      localStorage.setItem(`secure_${key}`, encrypted);
    },
    
    getItem: (key: string): any => {
      try {
        const encrypted = localStorage.getItem(`secure_${key}`);
        if (!encrypted) return null;
        return this.decrypt(encrypted);
      } catch (error) {
        console.warn('Failed to decrypt stored data, clearing corrupted data:', error);
        localStorage.removeItem(`secure_${key}`);
        return null;
      }
    },
    
    removeItem: (key: string): void => {
      localStorage.removeItem(`secure_${key}`);
    },
    
    clear: (): void => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // XSS Protection - Properly escape HTML entities
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    const htmlEntities: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
  }
  
  // Additional method for sanitizing HTML content while preserving safe tags
  public sanitizeHTML(html: string, allowedTags: string[] = []): string {
    if (typeof html !== 'string') return '';
    
    // First, escape all HTML
    const escaped = this.sanitizeInput(html);
    
    // If no tags are allowed, return escaped version
    if (allowedTags.length === 0) return escaped;
    
    // For allowed tags, selectively unescape them (not recommended for user input)
    // This is a simplified version - for production use DOMPurify library
    console.warn('sanitizeHTML with allowed tags should use DOMPurify library for production');
    return escaped;
  }

  // Content Security Policy helper
  public getCSPHeaders(): Record<string, string> {
    // Generate nonce for inline scripts/styles
    const nonce = this.generateNonce();
    
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' wss: https://api.gritservices.ae https://gritservices-backend.onrender.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
  
  // Generate nonce for CSP
  private generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const securityService = new SecurityService();