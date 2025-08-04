import CryptoJS from 'crypto-js';

interface StorageItem {
  value: string;
  expiry?: number;
  fingerprint?: string;
}

class SecureStorageService {
  private readonly prefix = 'grit_secure_';
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
  }

  /**
   * Generate a unique encryption key based on browser fingerprint
   */
  private generateEncryptionKey(): string {
    const fingerprint = this.getBrowserFingerprint();
    return CryptoJS.SHA256(fingerprint).toString();
  }

  /**
   * Get browser fingerprint for key generation
   */
  private getBrowserFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'default-fingerprint';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    
    const dataURL = canvas.toDataURL();
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return `${dataURL}-${userAgent}-${language}-${screenResolution}-${timezone}`;
  }

  /**
   * Encrypt and store data securely
   */
  setItem(key: string, value: any, expiryMinutes?: number): void {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(stringValue, this.encryptionKey).toString();
      
      const item: StorageItem = {
        value: encrypted,
        fingerprint: this.getBrowserFingerprint()
      };

      if (expiryMinutes) {
        item.expiry = new Date().getTime() + (expiryMinutes * 60 * 1000);
      }

      // Use sessionStorage for sensitive data like auth tokens
      if (key.includes('token') || key.includes('auth')) {
        sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
      } else {
        localStorage.setItem(this.prefix + key, JSON.stringify(item));
      }
    } catch (error) {
      console.error('SecureStorage: Error storing item', error);
    }
  }

  /**
   * Retrieve and decrypt data
   */
  getItem<T = any>(key: string): T | null {
    try {
      const storage = key.includes('token') || key.includes('auth') 
        ? sessionStorage 
        : localStorage;
      
      const itemStr = storage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item: StorageItem = JSON.parse(itemStr);

      // Check expiry
      if (item.expiry && new Date().getTime() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      // Verify fingerprint hasn't changed (prevents token theft)
      if (item.fingerprint && item.fingerprint !== this.getBrowserFingerprint()) {
        this.removeItem(key);
        return null;
      }

      const decrypted = CryptoJS.AES.decrypt(item.value, this.encryptionKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        this.removeItem(key);
        return null;
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('SecureStorage: Error retrieving item', error);
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    // Clear from both storages
    [sessionStorage, localStorage].forEach(storage => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => storage.removeItem(key));
    });
  }

  /**
   * Store auth token with automatic expiry
   */
  setAuthToken(token: string, rememberMe: boolean = false): void {
    // Token expires in 24 hours for session, 7 days for remember me
    const expiryMinutes = rememberMe ? 7 * 24 * 60 : 24 * 60;
    this.setItem('auth_token', token, expiryMinutes);
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return this.getItem<string>('auth_token');
  }

  /**
   * Remove auth token
   */
  removeAuthToken(): void {
    this.removeItem('auth_token');
  }

  /**
   * Store user data
   */
  setUserData(userData: any, rememberMe: boolean = false): void {
    const expiryMinutes = rememberMe ? 7 * 24 * 60 : 24 * 60;
    this.setItem('user_data', userData, expiryMinutes);
  }

  /**
   * Get user data
   */
  getUserData<T = any>(): T | null {
    return this.getItem<T>('user_data');
  }

  /**
   * Store tenant information
   */
  setTenantInfo(tenantInfo: any): void {
    // Tenant info expires in 1 hour
    this.setItem('tenant_info', tenantInfo, 60);
  }

  /**
   * Get tenant information
   */
  getTenantInfo<T = any>(): T | null {
    return this.getItem<T>('tenant_info');
  }
}

export default new SecureStorageService();