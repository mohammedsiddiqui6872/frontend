import React, { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { ContentSecurityPolicy } from '../../utils/security/csp';
import { useTranslation } from '../../utils/i18n';
import { Header } from '../Header';
import { NotificationContainer } from '../common/NotificationContainer';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = memo(({ children }) => {
  const { isRTL, t } = useTranslation();
  
  // Default props for Header when used in layout
  const taglines = [
    t('header.tagline1') || 'Welcome to our restaurant',
    t('header.tagline2') || 'Enjoy our delicious food',
    t('header.tagline3') || 'Fast and fresh delivery'
  ];
  
  const handleCallWaiter = () => {
    // Default implementation - can be overridden by context
    if (process.env.NODE_ENV === 'development') {
      console.log('Call waiter requested');
    }
  };
  
  const handleRequestBill = () => {
    // Default implementation - can be overridden by context
    if (process.env.NODE_ENV === 'development') {
      console.log('Bill requested');
    }
  };

  return (
    <ContentSecurityPolicy>
      <div className={`min-h-screen bg-gray-100 ${isRTL() ? 'rtl' : 'ltr'}`}>
        <Header 
          t={t}
          taglines={taglines}
          onCallWaiter={handleCallWaiter}
          onRequestBill={handleRequestBill}
        />
        <main className="container mx-auto px-4 py-8">
          {children || <Outlet />}
        </main>
        <NotificationContainer />
      </div>
    </ContentSecurityPolicy>
  );
});

MainLayout.displayName = 'MainLayout';