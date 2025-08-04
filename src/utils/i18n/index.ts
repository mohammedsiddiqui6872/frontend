import { secureLocalStorage } from '../security/secureStorage';

export type Language = 'en' | 'ar' | 'hi' | 'ur' | 'fr' | 'es' | 'zh';

interface TranslationSet {
  [key: string]: string | TranslationSet;
}

interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  locale: string;
}

export const languages: Record<Language, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', locale: 'en-US' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', locale: 'ar-AE' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', locale: 'hi-IN' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', locale: 'ur-PK' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', locale: 'fr-FR' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', locale: 'es-ES' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', locale: 'zh-CN' }
};

class I18nManager {
  private currentLanguage: Language = 'en';
  private translations: Map<Language, TranslationSet> = new Map();
  private fallbackLanguage: Language = 'en';
  private listeners: Set<(lang: Language) => void> = new Set();

  constructor() {
    this.loadStoredLanguage();
    this.loadTranslations();
  }

  private loadStoredLanguage(): void {
    const stored = secureLocalStorage.getItem('preferred_language');
    if (stored && stored in languages) {
      this.currentLanguage = stored as Language;
    } else {
      // Detect from browser
      const browserLang = navigator.language.toLowerCase();
      const detectedLang = Object.values(languages).find(
        lang => browserLang.startsWith(lang.code)
      );
      if (detectedLang) {
        this.currentLanguage = detectedLang.code;
      }
    }
  }

  private async loadTranslations(): Promise<void> {
    // In production, these would be loaded from API or static files
    // For now, importing the existing translations
    const { translations } = await import('../translations');
    
    // Convert existing format to our new structure
    Object.entries(translations).forEach(([lang, trans]) => {
      this.translations.set(lang as Language, trans);
    });
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get language config
   */
  getLanguageConfig(): LanguageConfig {
    return languages[this.currentLanguage];
  }

  /**
   * Set language
   */
  setLanguage(language: Language): void {
    if (language in languages) {
      this.currentLanguage = language;
      secureLocalStorage.setItem('preferred_language', language);
      
      // Update document direction
      document.documentElement.dir = languages[language].direction;
      document.documentElement.lang = language;
      
      // Notify listeners
      this.listeners.forEach(listener => listener(language));
    }
  }

  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value: any = this.translations.get(this.currentLanguage);
    
    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = this.getFallbackTranslation(key);
        break;
      }
    }
    
    // If not found in current language, try fallback
    if (!value || typeof value !== 'string') {
      value = this.getFallbackTranslation(key);
    }
    
    // Replace parameters
    if (params && typeof value === 'string') {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, String(val));
      });
    }
    
    return value || key;
  }

  private getFallbackTranslation(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations.get(this.fallbackLanguage);
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  /**
   * Format number according to locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getLanguageConfig();
    return new Intl.NumberFormat(config.locale, options).format(num);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency = 'AED'): string {
    const config = this.getLanguageConfig();
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const config = this.getLanguageConfig();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(config.locale, options).format(dateObj);
  }

  /**
   * Subscribe to language changes
   */
  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): LanguageConfig[] {
    return Object.values(languages);
  }

  /**
   * Check if RTL
   */
  isRTL(): boolean {
    return languages[this.currentLanguage].direction === 'rtl';
  }
}

// Export singleton instance
export const i18n = new I18nManager();

// Export hook for React components
import { useState, useEffect } from 'react';

export function useTranslation() {
  const [language, setLanguage] = useState(i18n.getLanguage());
  
  useEffect(() => {
    const unsubscribe = i18n.subscribe((lang) => {
      setLanguage(lang);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    t: i18n.t.bind(i18n),
    language,
    setLanguage: i18n.setLanguage.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    isRTL: i18n.isRTL.bind(i18n),
    languages: i18n.getAvailableLanguages()
  };
}