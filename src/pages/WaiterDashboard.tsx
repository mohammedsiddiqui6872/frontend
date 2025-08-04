import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { TableSelectionScreen } from '../components/waiter/TableSelectionScreen';
import { useTranslation } from '../utils/i18n';
import { useAuthStore } from '../stores/authStore';

const WaiterDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { employeeName, employeeId } = useAuthStore();

  const handleTableSelect = (tableNumber: string) => {
    // Handle table selection
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {t('welcome')}, {employeeName}
        </h1>
        <TableSelectionScreen
          t={t}
          onTableSelected={handleTableSelect}
        />
      </div>
    </MainLayout>
  );
};

export default WaiterDashboard;