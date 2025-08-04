import { secureSessionStorage } from './secureStorage';

class CSRFTokenManager {
  private tokenKey = 'csrf_token';
  private headerName = 'X-CSRF-Token';

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.setToken(token);
    return token;
  }

  /**
   * Get the current CSRF token or generate a new one
   */
  getToken(): string {
    let token = secureSessionStorage.getItem(this.tokenKey);
    if (!token) {
      token = this.generateToken();
    }
    return token;
  }

  /**
   * Set the CSRF token
   */
  setToken(token: string): void {
    secureSessionStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get the CSRF header for requests
   */
  getHeader(): { [key: string]: string } {
    return {
      [this.headerName]: this.getToken()
    };
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return token === storedToken;
  }

  /**
   * Add CSRF token to fetch options
   */
  addToFetchOptions(options: RequestInit = {}): RequestInit {
    const headers = new Headers(options.headers);
    headers.set(this.headerName, this.getToken());
    
    return {
      ...options,
      headers
    };
  }

  /**
   * Add CSRF meta tag to document
   */
  addMetaTag(): void {
    const existingMeta = document.querySelector('meta[name="csrf-token"]');
    if (existingMeta) {
      existingMeta.setAttribute('content', this.getToken());
    } else {
      const meta = document.createElement('meta');
      meta.name = 'csrf-token';
      meta.content = this.getToken();
      document.head.appendChild(meta);
    }
  }
}

export const csrfTokenManager = new CSRFTokenManager();

// Initialize CSRF token on load
if (typeof window !== 'undefined') {
  csrfTokenManager.getToken();
  csrfTokenManager.addMetaTag();
}