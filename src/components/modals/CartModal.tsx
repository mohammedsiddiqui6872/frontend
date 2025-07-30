import { useEffect, useRef } from 'react';
import { X, ShoppingCart, Plus, Minus, Loader } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { trapFocus } from '../../utils/accessibility';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { CartItemSkeleton } from '../common/SkeletonLoaders';

interface CartModalProps {
  t: any;
  onPlaceOrder: () => void;
}

export const CartModal = ({ t, onPlaceOrder }: CartModalProps) => {
  const { cart, updateQuantity, removeFromCart, getTotal } = useCartStore();
  const { showCart, setShowCart } = useUIStore();
  const { lightTap, mediumTap, errorTap } = useHapticFeedback();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (showCart) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Set up focus trap
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        
        // Announce modal opening to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'Shopping cart opened';
        document.body.appendChild(announcement);
        
        const timeoutId = setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        }, 1000);
        
        return () => {
          clearTimeout(timeoutId);
          cleanup();
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        };
      }
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
    
    return undefined;
  }, [showCart]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showCart) return;
      
      if (e.key === 'Escape') {
        setShowCart(false);
        lightTap();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCart, setShowCart, lightTap]);

  if (!showCart) return null;

  const totals = getTotal();

  const handleUpdateQuantity = (cartId: string, change: number) => {
    lightTap();
    updateQuantity(cartId, change);
  };

  const handleRemoveItem = (cartId: string, itemName: string) => {
    errorTap();
    removeFromCart(cartId);
    
    // Announce removal to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `${itemName} removed from cart`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const handlePlaceOrder = () => {
    mediumTap();
    onPlaceOrder();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      <div 
        ref={modalRef}
        id="cart-modal"
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        role="document"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="cart-title" className="text-2xl font-bold dark:text-white">
            {t.yourCart}
          </h2>
          <button
            onClick={() => {
              lightTap();
              setShowCart(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close shopping cart"
          >
            <X size={24} className="dark:text-gray-300" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p role="status">{t.emptyCart}</p>
          </div>
        ) : (
          <>
            <div 
              className="space-y-4 mb-6" 
              role="list"
              aria-label="Cart items"
            >
              {cart.map((item, index) => (
                <div 
                  key={item.cartId} 
                  className={`border dark:border-gray-700 rounded-xl p-4 transition-all ${
                    item.isUpdating ? 'opacity-70' : ''
                  }`}
                  role="listitem"
                  aria-label={`Item ${index + 1} of ${cart.length}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold dark:text-white">
                        {item.name}
                        {item.isUpdating && (
                          <Loader size={16} className="inline ml-2 animate-spin" />
                        )}
                      </h4>
                      {item.selectedCustomizations && Object.entries(item.selectedCustomizations).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-600 dark:text-gray-400">
                          {key}: {value}
                        </p>
                      ))}
                      {item.specialRequests && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          Note: {item.specialRequests}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.cartId, item.name)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                      aria-label={`Remove ${item.name} from cart`}
                      disabled={item.isUpdating}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3" role="group" aria-label="Quantity controls">
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, -1)}
                        className="w-8 h-8 rounded-full border dark:border-gray-600 hover:bg-gray-100 
                                 dark:hover:bg-gray-700 flex items-center justify-center transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={item.quantity <= 1 || item.isUpdating}
                      >
                        <Minus size={16} className="dark:text-gray-300" />
                      </button>
                      <span 
                        className="font-medium dark:text-white min-w-[2rem] text-center"
                        role="status"
                        aria-live="polite"
                        aria-label={`Quantity: ${item.quantity}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.cartId, 1)}
                        className="w-8 h-8 rounded-full border dark:border-gray-600 hover:bg-gray-100 
                                 dark:hover:bg-gray-700 flex items-center justify-center transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={item.isUpdating}
                      >
                        <Plus size={16} className="dark:text-gray-300" />
                      </button>
                    </div>
                    <span 
                      className="font-semibold dark:text-white"
                      aria-label={`Item total: ${(item.price * item.quantity).toFixed(2)} AED`}
                    >
                      AED {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div 
              className="border-t dark:border-gray-700 pt-4 space-y-2"
              role="region"
              aria-label="Order summary"
            >
              <div className="flex justify-between">
                <span className="dark:text-gray-300">{t.subtotal}:</span>
                <span className="dark:text-white" aria-label={`Subtotal: ${totals.subtotal.toFixed(2)} AED`}>
                  AED {totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-gray-300">{t.tax}:</span>
                <span className="dark:text-white" aria-label={`Tax: ${totals.tax.toFixed(2)} AED`}>
                  AED {totals.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="dark:text-white">{t.total}:</span>
                <span 
                  className="text-purple-600 dark:text-purple-400"
                  aria-label={`Total amount: ${totals.total.toFixed(2)} AED`}
                  role="status"
                  aria-live="polite"
                >
                  AED {totals.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                         rounded-full hover:shadow-lg transition-all duration-300 font-semibold
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Place order for ${totals.total.toFixed(2)} AED`}
                disabled={cart.some(item => item.isUpdating)}
              >
                {t.placeOrder}
              </button>
              
              <button
                onClick={() => {
                  lightTap();
                  setShowCart(false);
                }}
                className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 
                         dark:hover:text-gray-200 transition-colors"
              >
                {t.continueShopping || 'Continue Shopping'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};