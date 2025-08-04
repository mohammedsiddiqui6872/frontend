import React, { memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { CategorySidebar } from '../components/menu/CategorySidebar';
import { VirtualizedMenuGrid } from '../components/optimized/VirtualizedMenuGrid';
import { useTranslation } from '../utils/i18n';
import { useGuestMenu } from '../hooks/useGuestMenu';
import { useAppStore, useUIState, useAppActions } from '../stores/appStore';
import { SkeletonLoaders } from '../components/common/SkeletonLoaders/index';

const MenuPage: React.FC = memo(() => {
  const { category } = useParams();
  const { t } = useTranslation();
  const { data: menuData, isLoading, error } = useGuestMenu();
  const { selectedCategory, searchQuery } = useUIState();
  const { setSelectedCategory, toggleModal } = useAppActions();

  // Categories data would come from API
  const categories = useMemo(() => {
    // Default icon components
    const DefaultIcon = () => <span>📋</span>;
    
    return [
      { id: 'all', name: 'All Items', icon: DefaultIcon },
      { id: 'appetizers', name: 'Appetizers', icon: DefaultIcon },
      { id: 'main-courses', name: 'Main Courses', icon: DefaultIcon },
      { id: 'desserts', name: 'Desserts', icon: DefaultIcon },
      { id: 'beverages', name: 'Beverages', icon: DefaultIcon }
    ];
  }, []);

  // Filter menu items
  const filteredItems = useMemo(() => {
    if (!menuData) return [];
    
    const currentCategory = category || selectedCategory || 'all';
    
    if (searchQuery) {
      const allItems = Object.values(menuData).flat();
      return allItems.filter((item: any) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (currentCategory === 'all') {
      return Object.values(menuData).flat();
    }
    
    return menuData[currentCategory] || [];
  }, [menuData, category, selectedCategory, searchQuery]);

  const handleAddToCart = (item: any) => {
    toggleModal('showCustomization' as any, true);
    // Store selected item in app state for customization modal
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex">
          <CategorySidebar
            categories={categories}
            activeCategory={selectedCategory || 'all'}
            onCategoryChange={setSelectedCategory}
          />
          <main className="flex-1 p-6">
            <SkeletonLoaders />
          </main>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t('errorLoadingMenu')}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        <CategorySidebar
          categories={categories}
          activeCategory={selectedCategory || 'all'}
          onCategoryChange={setSelectedCategory}
        />
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <h2 className="text-3xl font-bold mb-6">
              {searchQuery ? t('searchResults') : t(selectedCategory || 'allItems')}
            </h2>
            <div className="h-[calc(100%-100px)]">
              <VirtualizedMenuGrid
                items={filteredItems}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
});

MenuPage.displayName = 'MenuPage';

export default MenuPage;