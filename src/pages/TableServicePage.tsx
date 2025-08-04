import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { TableServiceModal } from '../components/modals/TableServiceModal';
import { useTranslation } from '../utils/i18n';

const TableServicePage: React.FC = () => {
  const { t } = useTranslation();

  const handleServiceRequest = async (type: string) => {
    // Handle service request
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('tableService')}</h1>
        <TableServiceModal t={t} onServiceRequest={handleServiceRequest} />
      </div>
    </MainLayout>
  );
};

export default TableServicePage;