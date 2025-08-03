import { Star, Clock, Plus, Heart } from 'lucide-react';
import { MenuItem as MenuItemType } from '../../stores/cartStore';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { announce } from '../../utils/accessibility';
import { LazyImage } from '../common/LazyImage';

interface MenuItemProps {
  item: MenuItemType;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
  t: any;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  t,
}) => {
  const { lightTap, successTap } = useHapticFeedback();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    onToggleFavorite();
    announce(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleAddToCart = () => {
    successTap();
    onAddToCart();
    announce(`${item.name} added to cart`);
  };

  const discountedPrice = item.isSpecial ? item.price * (1 - (item.discount || 0) / 100) : item.price;

  return (
    <article 
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden 
                hover:shadow-xl transition-all duration-300 transform hover:scale-105 
                flex flex-col group h-full"
      role="listitem"
      aria-label={`${item.name}, ${discountedPrice} AED`}
    >
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <LazyImage
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          width={400}
          height={224}
          loading="lazy"
        />
        {item.isSpecial && (
          <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 
                         rounded-full text-sm font-bold animate-pulse shadow-lg"
                aria-label={`${item.discount}% discount`}>
            {item.discount}% OFF
          </span>
        )}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 transition-all duration-200 p-2"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Heart
            size={20}
            className={`transition-all duration-300 ${isFavorite
                ? 'fill-red-500 text-red-500 scale-110'
                : 'text-white drop-shadow-lg hover:text-red-500 hover:scale-110'
              }`}
          />
        </button>
        {item.recommended && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              Recommended
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex-1">{item.name}</h3>
          <div className="flex flex-col items-end ml-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                           bg-clip-text text-transparent">
              AED {discountedPrice.toFixed(2)}
            </span>
            {item.isSpecial && (
              <span className="text-sm text-gray-500 line-through">AED {item.price}</span>
            )}
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{item.description}</p>

        <div className="flex items-center gap-4 mb-3 text-sm" role="group" aria-label="Item details">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="font-medium">{item.rating}</span>
            <span className="text-gray-500">({item.reviews})</span>
            <span className="sr-only">{item.rating} out of 5 stars from {item.reviews} reviews</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock size={16} aria-hidden="true" />
            <span>{item.prepTime} {t.mins}</span>
            <span className="sr-only">Preparation time: {item.prepTime} minutes</span>
          </div>
          {item.calories && (
            <div className="text-gray-500">
              <span>{item.calories} {t.calories}</span>
            </div>
          )}
        </div>

        {item.dietary && item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Dietary information">
            {item.dietary.map((diet) => (
              <span 
                key={diet} 
                className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
                role="listitem"
              >
                {diet}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 
                     rounded-full hover:shadow-lg transition-all duration-300 flex items-center 
                     justify-center gap-2 font-semibold group/btn mt-auto"
          aria-label={`Add ${item.name} to cart`}
        >
          <Plus size={20} className="group-hover/btn:rotate-90 transition-transform duration-300" aria-hidden="true" />
          {t.addToCart}
        </button>
      </div>
    </article>
  );
};