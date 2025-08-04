import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Shield } from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { secureSessionStorage } from '../../utils/security/secureStorage';
import { logger } from '../../utils/logger';

interface AgeVerificationProps {
  minimumAge?: number;
  onVerified: (age: number) => void;
  onFailed: () => void;
  tenantId: string;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({
  minimumAge = 18,
  onVerified,
  onFailed,
  tenantId
}) => {
  const { t } = useTranslation();
  const [birthDate, setBirthDate] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    // Check if already verified
    const verified = secureSessionStorage.getItem('age_verified');
    if (verified && verified.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
      onVerified(verified.age);
    }
  }, []);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate input
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (!day || !month || !year) {
      setError(t('ageVerification.incomplete'));
      return;
    }
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
      setError(t('ageVerification.invalidDate'));
      return;
    }
    
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) {
      setError(t('ageVerification.invalidYear'));
      return;
    }
    
    // Create date and calculate age
    const birthDateObj = new Date(yearNum, monthNum - 1, dayNum);
    const age = calculateAge(birthDateObj);
    
    // Log verification attempt
    logger.info('AgeVerification', 'Age verification attempt', {
      age,
      minimumAge,
      tenantId,
      attemptCount: attemptCount + 1
    });
    
    if (age >= minimumAge) {
      // Store verification
      secureSessionStorage.setItem('age_verified', {
        age,
        timestamp: Date.now(),
        birthDate: birthDateObj.toISOString()
      });
      
      // Record consent
      try {
        await fetch('/api/compliance/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          },
          body: JSON.stringify({
            tenantId,
            consentType: 'age_verification',
            status: 'granted',
            version: '1.0',
            metadata: {
              age,
              minimumAge,
              verifiedAt: new Date().toISOString()
            }
          })
        });
      } catch (error) {
        logger.error('AgeVerification', 'Failed to record age verification consent', error);
      }
      
      onVerified(age);
    } else {
      setAttemptCount(attemptCount + 1);
      
      if (attemptCount >= 2) {
        // Too many failed attempts
        secureSessionStorage.setItem('age_verification_failed', {
          timestamp: Date.now(),
          attempts: attemptCount + 1
        });
        onFailed();
      } else {
        setError(t('ageVerification.tooYoung', { minimumAge }));
      }
    }
  };

  const months = [
    { value: '1', label: t('months.january') },
    { value: '2', label: t('months.february') },
    { value: '3', label: t('months.march') },
    { value: '4', label: t('months.april') },
    { value: '5', label: t('months.may') },
    { value: '6', label: t('months.june') },
    { value: '7', label: t('months.july') },
    { value: '8', label: t('months.august') },
    { value: '9', label: t('months.september') },
    { value: '10', label: t('months.october') },
    { value: '11', label: t('months.november') },
    { value: '12', label: t('months.december') }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('ageVerification.title')}</h2>
          <p className="text-gray-600">
            {t('ageVerification.subtitle', { minimumAge })}
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ageVerification.day')}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="DD"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ageVerification.month')}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t('ageVerification.selectMonth')}</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('ageVerification.year')}
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="YYYY"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p>{t('ageVerification.privacy')}</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {t('ageVerification.verify')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onFailed}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('ageVerification.exit')}
          </button>
        </div>
      </div>
    </div>
  );
};