import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { CartModal } from '../components/modals/CartModal';
import { useTranslation } from '../utils/i18n';
import { useCartStore } from '../stores/cartStore';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, getTotal } = useCartStore();

  const handlePlaceOrder = () => {
    // Place order logic
    navigate('/orders');
  };

  if (cart.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('cartEmpty')}</h2>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {t('browseMenu')}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('yourCart')}</h1>
        <CartModal t={t} onPlaceOrder={handlePlaceOrder} />
      </div>
    </MainLayout>
  );
};

export default CartPage;