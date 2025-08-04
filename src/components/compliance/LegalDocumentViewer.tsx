import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Globe, Check } from 'lucide-react';
import { useTranslation } from '../../utils/i18n';
import { sanitizeHTML } from '../../utils/security/sanitizer';
import { csrfTokenManager } from '../../utils/security/csrf';
import { logger } from '../../utils/logger';

interface LegalDocument {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  contentHtml: string;
  effectiveDate: string;
  requiresAcceptance: boolean;
}

interface LegalDocumentViewerProps {
  type: 'terms_of_service' | 'privacy_policy' | 'cookie_policy';
  tenantId: string;
  showAcceptance?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  type,
  tenantId,
  showAcceptance = false,
  onAccept,
  onDecline
}) => {
  const { t, language } = useTranslation();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDocument();
  }, [type, language, tenantId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/compliance/legal/${type}/${language}?tenantId=${tenantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      } else {
        // Fallback to English if translation not available
        const fallbackResponse = await fetch(`/api/compliance/legal/${type}/en?tenantId=${tenantId}`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setDocument(data);
        }
      }
    } catch (error) {
      logger.error('LegalDocumentViewer', 'Failed to fetch legal document', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!document) return;

    try {
      const response = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfTokenManager.getHeader()
        },
        body: JSON.stringify({
          tenantId,
          consentType: type,
          status: 'granted',
          version: document.version,
          legalDocumentId: document.id
        })
      });

      if (response.ok) {
        setAccepted(true);
        onAccept?.();
        logger.info('LegalDocumentViewer', 'Legal document accepted', { type, version: document.version });
      }
    } catch (error) {
      logger.error('LegalDocumentViewer', 'Failed to record consent', error);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">{t('legal.documentNotFound')}</p>
      </div>
    );
  }

  // Parse content into sections for better readability
  const sections = document.content.split('\n\n').map((section, index) => {
    const lines = section.trim().split('\n');
    const firstLine = lines[0] || '';
    const isHeading = lines.length > 0 && (firstLine.startsWith('#') || !!firstLine.match(/^\d+\./));
    const title = isHeading ? firstLine.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '') : null;
    const content = isHeading ? lines.slice(1).join('\n') : section;
    
    return { title, content, index };
  }).filter(s => s.content.trim());

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                {document.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {t('legal.effectiveDate')}: {new Date(document.effectiveDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {t('legal.version')}: {document.version}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {document.contentHtml ? (
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(document.contentHtml) }}
            />
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.index} className="border rounded-lg p-4">
                  {section.title && (
                    <button
                      onClick={() => toggleSection(section.index)}
                      className="w-full flex items-center justify-between text-left font-semibold text-lg mb-2 hover:text-purple-600"
                    >
                      {section.title}
                      <span className="text-gray-400">
                        {expandedSections.has(section.index) ? '−' : '+'}
                      </span>
                    </button>
                  )}
                  <div className={`text-gray-700 whitespace-pre-wrap ${
                    section.title && !expandedSections.has(section.index) ? 'line-clamp-3' : ''
                  }`}>
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acceptance */}
        {showAcceptance && document.requiresAcceptance && !accepted && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="mb-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {t('legal.acceptanceText', { documentType: document.title })}
                </span>
              </label>
            </div>
            
            <div className="flex gap-3">
              {onDecline && (
                <button
                  onClick={onDecline}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {t('legal.decline')}
                </button>
              )}
              <button
                onClick={handleAccept}
                disabled={!accepted}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('legal.accept')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};