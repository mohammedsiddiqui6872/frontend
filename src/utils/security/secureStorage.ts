import CryptoJS from 'crypto-js';

class SecureStorage {
  private encryptionKey: string;
  private storage: Storage;

  constructor(storage: Storage = sessionStorage) {
    // Generate a unique key per session
    this.encryptionKey = this.getOrCreateSessionKey();
    this.storage = storage;
  }

  private getOrCreateSessionKey(): string {
    let key = sessionStorage.getItem('__session_key__');
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256/8).toString();
      sessionStorage.setItem('__session_key__', key);
    }
    return key;
  }

  /**
   * Encrypt and store data
   */
  setItem(key: string, value: any): void {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      this.storage.setItem(key, encrypted);
    } catch (error) {
      
    }
  }

  /**
   * Retrieve and decrypt data
   */
  getItem(key: string): any {
    try {
      const encrypted = this.storage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    const sessionKey = sessionStorage.getItem('__session_key__');
    this.storage.clear();
    if (sessionKey && this.storage === sessionStorage) {
      sessionStorage.setItem('__session_key__', sessionKey);
    }
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key !== '__session_key__') {
        keys.push(key);
      }
    }
    return keys;
  }
}

// Export singleton instances
export const secureSessionStorage = new SecureStorage(sessionStorage);
export const secureLocalStorage = new SecureStorage(localStorage);

// Export the class for custom instances
export default SecureStorage;