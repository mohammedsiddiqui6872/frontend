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
    const STORAGE_KEY = 'enc_key_v1';
    
    // Try to get existing key from sessionStorage (persists across page reloads in same tab)
    let key = sessionStorage.getItem(STORAGE_KEY);
    
    if (!key) {
      // If no key exists, generate new one
      key = this.generateSessionKey();
      sessionStorage.setItem(STORAGE_KEY, key);
    }
    
    return key;
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

  // XSS Protection
  public sanitizeInput(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Content Security Policy helper
  public getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' wss: https://api.gritservices.ae",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    };
  }
}

export const securityService = new SecurityService();