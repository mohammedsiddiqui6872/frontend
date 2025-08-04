import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, EyeOff, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { csrfTokenManager } from '../../utils/security/csrf';
import { logger } from '../../utils/logger';

interface ConsentRecord {
  id: string;
  type: string;
  status: 'granted' | 'denied' | 'withdrawn';
  grantedAt: string;
  expiryDate?: string;
}

interface PrivacyDashboardProps {
  userId?: string;
  customerSessionId?: string;
}

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ 
  userId, 
  customerSessionId 
}) => {
  const { t } = useTranslation();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchConsents();
  }, [userId, customerSessionId]);

  const fetchConsents = async () => {
    try {
      const identifier = userId || customerSessionId;
      if (!identifier) return;

      const response = await fetch(`/api/compliance/consent/user/${identifier}`, {
        headers: {
          'X-Tenant-ID': sessionStorage.getItem('tenantId') || '',
          ...csrfTokenManager.getHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConsents(data);
      }
    } catch (error) {
      logger.error('PrivacyDashboard', 'Failed to fetch consents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'zip') => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/compliance/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfTokenManager.getHeader()
        },
        body: JSON.stringify({ userId, format })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_data_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        logger.info('PrivacyDashboard', 'Data exported successfully', { format });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      logger.error('PrivacyDashboard', 'Failed to export data', error);
      alert(t('privacy.exportError'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm(t('privacy.deleteConfirm'))) return;

    const reason = prompt(t('privacy.deleteReason'));
    if (!reason) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/compliance/gdpr/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...csrfTokenManager.getHeader()
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert(t('privacy.deleteSuccess'));
        // Logout user after deletion
        window.location.href = '/logout';
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
      logger.error('PrivacyDashboard', 'Failed to delete data', error);
      alert(t('privacy.deleteError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWithdrawConsent = async (consentId: string) => {
    try {
      const response = await fetch('/api/compliance/consent/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfTokenManager.getHeader()
        },
        body: JSON.stringify({ 
          consentId, 
          reason: 'User requested withdrawal' 
        })
      });

      if (response.ok) {
        fetchConsents(); // Refresh list
        logger.info('PrivacyDashboard', 'Consent withdrawn', { consentId });
      }
    } catch (error) {
      logger.error('PrivacyDashboard', 'Failed to withdraw consent', error);
    }
  };

  const getConsentIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'denied':
      case 'withdrawn':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" />
            {t('privacy.title')}
          </h2>
        </div>

        {/* Your Data Section */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('privacy.yourData')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleExportData('json')}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-blue-600" />
              <span>{t('privacy.exportJson')}</span>
            </button>
            
            <button
              onClick={() => handleExportData('csv')}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText className="w-5 h-5 text-green-600" />
              <span>{t('privacy.exportCsv')}</span>
            </button>
            
            <button
              onClick={() => handleExportData('zip')}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-purple-600" />
              <span>{t('privacy.exportZip')}</span>
            </button>
          </div>
        </section>

        {/* Consent Management */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('privacy.consentManagement')}</h3>
          <div className="space-y-3">
            {consents.length === 0 ? (
              <p className="text-gray-500">{t('privacy.noConsents')}</p>
            ) : (
              consents.map((consent) => (
                <div key={consent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getConsentIcon(consent.status)}
                    <div>
                      <p className="font-medium">{t(`consent.${consent.type}`)}</p>
                      <p className="text-sm text-gray-600">
                        {t('privacy.grantedOn')}: {new Date(consent.grantedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {consent.status === 'granted' && (
                    <button
                      onClick={() => handleWithdrawConsent(consent.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      {t('privacy.withdraw')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Data Visibility */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('privacy.dataVisibility')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-600" />
                <span>{t('privacy.profileVisibility')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <EyeOff className="w-5 h-5 text-gray-600" />
                <span>{t('privacy.hideFromAnalytics')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('privacy.dataRetention')}</h3>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">{t('privacy.retentionPolicy')}</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• {t('privacy.orderData')}: 2 years</li>
                  <li>• {t('privacy.profileData')}: Until account deletion</li>
                  <li>• {t('privacy.analyticsData')}: 1 year</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Delete Account */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-red-600">{t('privacy.dangerZone')}</h3>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-700 mb-4">{t('privacy.deleteWarning')}</p>
            <button
              onClick={handleDeleteData}
              disabled={deleteLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('privacy.deleteAccount')}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};