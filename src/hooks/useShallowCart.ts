import { shallow } from 'zustand/shallow';
import { useCartStore, CartStore } from '../stores/cartStore';

/**
 * Custom hook for accessing cart store with shallow comparison
 * Prevents unnecessary re-renders when cart data hasn't actually changed
 */
export function useShallowCart<T>(selector: (state: CartStore) => T): T {
  return useCartStore(selector, shallow);
}

// Pre-defined selectors for common use cases
export const useCartItems = () => 
  useShallowCart(state => state.cart);

export const useCartActions = () => 
  useShallowCart(state => ({
    addToCart: state.addToCart,
    updateQuantity: state.updateQuantity,
    removeFromCart: state.removeFromCart,
    clearCart: state.clearCart,
  }));

export const useCartSummary = () =>
  useShallowCart(state => ({
    total: state.getTotal(),
    itemCount: state.getItemCount(),
  }));

export const useCartItem = (cartId: string) =>
  useShallowCart(state => 
    state.cart.find(item => item.cartId === cartId)
  );