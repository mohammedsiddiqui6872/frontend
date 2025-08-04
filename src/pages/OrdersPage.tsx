import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { OrderTrackingBar } from '../components/orders/OrderTrackingBar';
import { useTranslation } from '../utils/i18n';
import { useOrders } from '../hooks/useOrders';
import { useAppStore } from '../stores/appStore';

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const tableNumber = useAppStore(state => state.table.number) || '1';
  const { activeOrders, cancelOrder, isCancelling } = useOrders(tableNumber);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('yourOrders')}</h1>
        
        {activeOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{t('noActiveOrders')}</p>
          </div>
        ) : (
          <OrderTrackingBar
            orders={activeOrders}
            onCancelOrder={cancelOrder}
            isCancelling={isCancelling}
            t={t}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default OrdersPage;