import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';
import { MainLayout } from '../components/layout/MainLayout';
import { WelcomeScreen } from '../components/common/WelcomeScreen';
import { useAppStore, useUIState, useAppActions } from '../stores/appStore';
import { prefetchComponent } from '../utils/performance/optimization';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showWelcome } = useUIState();
  const { toggleModal } = useAppActions();

  useEffect(() => {
    // Prefetch menu page for better performance
    prefetchComponent(() => import('./MenuPage'));
  }, []);

  const handleGetStarted = () => {
    toggleModal('welcome' as any, false);
    navigate('/menu');
  };

  if (showWelcome) {
    return <WelcomeScreen t={t} />;
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
          <button
            onClick={() => navigate('/menu')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {t('viewMenu')}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;