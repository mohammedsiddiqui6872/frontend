import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cookie, Settings, X } from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { secureLocalStorage } from '../../utils/security/secureStorage';
import { csrfTokenManager } from '../../utils/security/csrf';
import { logger } from '../../utils/logger';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentProps {
  tenantId: string;
  onAccept?: (preferences: CookiePreferences) => void;
  onDecline?: () => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = memo(({ 
  tenantId, 
  onAccept, 
  onDecline 
}) => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Check if consent already given
    const existingConsent = secureLocalStorage.getItem('cookie_consent');
    if (!existingConsent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Apply existing preferences
      applyPreferences(existingConsent.preferences);
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Apply cookie preferences
    if (!prefs.analytics) {
      // Disable analytics cookies
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied'
        });
      }
    }

    if (!prefs.marketing) {
      // Disable marketing cookies
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied'
        });
      }
    }

    // Apply functional preferences
    if (!prefs.functional) {
      // Disable certain features that use functional cookies
      secureLocalStorage.removeItem('user_preferences');
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };

    await saveConsent(allAccepted, 'accept_all');
    applyPreferences(allAccepted);
    onAccept?.(allAccepted);
    setShowBanner(false);
  };

  const handleDeclineAll = async () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };

    await saveConsent(onlyNecessary, 'decline_all');
    applyPreferences(onlyNecessary);
    onDecline?.();
    setShowBanner(false);
  };

  const handleSavePreferences = async () => {
    await saveConsent(preferences, 'custom');
    applyPreferences(preferences);
    onAccept?.(preferences);
    setShowBanner(false);
    setShowDetails(false);
  };

  const saveConsent = async (prefs: CookiePreferences, action: string) => {
    try {
      // Save to local storage
      secureLocalStorage.setItem('cookie_consent', {
        preferences: prefs,
        timestamp: new Date().toISOString(),
        version: '1.0'
      });

      // Send to backend
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...csrfTokenManager.getHeader()
        },
        body: JSON.stringify({
          tenantId,
          consentType: 'cookie_consent',
          status: 'granted',
          version: '1.0',
          details: {
            preferences: prefs,
            action
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record consent');
      }

      logger.info('CookieConsent', 'Cookie consent recorded', { action, preferences: prefs });
    } catch (error) {
      logger.error('CookieConsent', 'Failed to save cookie consent', error);
    }
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white shadow-2xl border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Cookie className="w-8 h-8 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{t('cookies.title')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('cookies.description')}
                </p>
                
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-4 space-y-3"
                  >
                    <CookieCategory
                      name={t('cookies.necessary')}
                      description={t('cookies.necessaryDesc')}
                      checked={true}
                      disabled={true}
                      onChange={() => {}}
                    />
                    <CookieCategory
                      name={t('cookies.functional')}
                      description={t('cookies.functionalDesc')}
                      checked={preferences.functional}
                      onChange={(checked) => setPreferences({ ...preferences, functional: checked })}
                    />
                    <CookieCategory
                      name={t('cookies.analytics')}
                      description={t('cookies.analyticsDesc')}
                      checked={preferences.analytics}
                      onChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                    />
                    <CookieCategory
                      name={t('cookies.marketing')}
                      description={t('cookies.marketingDesc')}
                      checked={preferences.marketing}
                      onChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                    />
                  </motion.div>
                )}
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDeclineAll}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('cookies.declineAll')}
                  </button>
                  
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t('cookies.customize')}
                  </button>
                  
                  {showDetails ? (
                    <button
                      onClick={handleSavePreferences}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {t('cookies.savePreferences')}
                    </button>
                  ) : (
                    <button
                      onClick={handleAcceptAll}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {t('cookies.acceptAll')}
                    </button>
                  )}
                </div>
                
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <a 
                    href="/privacy-policy" 
                    target="_blank"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Shield className="w-4 h-4" />
                    {t('cookies.privacyPolicy')}
                  </a>
                  <a 
                    href="/cookie-policy" 
                    target="_blank"
                    className="text-purple-600 hover:underline"
                  >
                    {t('cookies.cookiePolicy')}
                  </a>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowBanner(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

CookieConsent.displayName = 'CookieConsent';

interface CookieCategoryProps {
  name: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const CookieCategory: React.FC<CookieCategoryProps> = ({
  name,
  description,
  checked,
  disabled,
  onChange
}) => {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};