import { Coffee, AlertCircle } from 'lucide-react';
import { MenuItem } from './MenuItem';
import { MenuItem as MenuItemType } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { MenuItemSkeleton } from '../common/SkeletonLoaders';

interface MenuGridProps {
  items: MenuItemType[];
  isLoading: boolean;
  error?: string | null;
  onRefetch?: () => void;
  onAddToCart: (item: MenuItemType) => void;
  t: any;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  isLoading,
  error,
  onRefetch,
  onAddToCart,
  t,
}) => {
  const { favorites, toggleFavorite } = useUIStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <MenuItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-800 font-semibold mb-2">Unable to load menu</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          {onRefetch && (
            <button
              onClick={onRefetch}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              aria-label="Retry loading menu items"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Coffee size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No menu items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list">
      {items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          isFavorite={favorites.includes(item.id)}
          onToggleFavorite={() => toggleFavorite(item.id)}
          onAddToCart={() => onAddToCart(item)}
          t={t}
        />
      ))}
    </div>
  );
};