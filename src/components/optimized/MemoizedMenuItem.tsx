import React, { memo, useCallback } from 'react';
import { LazyImage } from '../common/LazyImage';
import { useTranslation } from '../../utils/i18n';
import { useDebounce } from '../../utils/performance/optimization';

interface MenuItemProps {
  item: {
    _id: string;
    name: string;
    nameAr?: string;
    description: string;
    descriptionAr?: string;
    price: number;
    image?: string;
    category: string;
    isAvailable: boolean;
    preparationTime?: number;
    calories?: number;
    tags?: string[];
  };
  onAddToCart: (item: any) => void;
}

export const MemoizedMenuItem = memo<MenuItemProps>(({ item, onAddToCart }) => {
  const { t, language, formatCurrency } = useTranslation();
  
  // Debounce the add to cart action to prevent double clicks
  const debouncedAddToCart = useDebounce(
    useCallback(() => onAddToCart(item), [item, onAddToCart]),
    300
  );

  const itemName = language === 'ar' && item.nameAr ? item.nameAr : item.name;
  const itemDescription = language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <LazyImage
          src={item.image || '/placeholder-food.jpg'}
          alt={itemName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">{t('unavailable')}</span>
          </div>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-white bg-opacity-90 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{itemName}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{itemDescription}</p>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-purple-600">
              {formatCurrency(item.price)}
            </span>
            {item.preparationTime && (
              <span className="text-xs text-gray-500 ml-2">
                ~{item.preparationTime} {t('minutes')}
              </span>
            )}
          </div>
          
          <button
            onClick={debouncedAddToCart}
            disabled={!item.isAvailable}
            className={`px-4 py-2 rounded-full text-white font-medium transition-all ${
              item.isAvailable
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-md transform hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {t('addToCart')}
          </button>
        </div>
        
        {item.calories && (
          <div className="mt-2 text-xs text-gray-500">
            {item.calories} {t('calories')}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.item.isAvailable === nextProps.item.isAvailable &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.onAddToCart === nextProps.onAddToCart
  );
});

MemoizedMenuItem.displayName = 'MemoizedMenuItem';