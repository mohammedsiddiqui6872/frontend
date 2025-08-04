import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SkeletonLoaders } from '../components/common/SkeletonLoaders/index';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../pages/HomePage'));
const MenuPage = lazy(() => import('../pages/MenuPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const TableServicePage = lazy(() => import('../pages/TableServicePage'));
const WaiterDashboard = lazy(() => import('../pages/WaiterDashboard'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <SkeletonLoaders />
  </div>
);

interface AppRouterProps {
  children?: React.ReactNode;
}

export const AppRouter: React.FC<AppRouterProps> = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menu/:category" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/table-service" element={<TableServicePage />} />
            
            {/* Waiter Routes */}
            <Route path="/waiter/dashboard" element={<WaiterDashboard />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
};