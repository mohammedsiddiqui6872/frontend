import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { announce } from '../utils/accessibility';
import { getCurrentTenant } from '../config/tenant.config';

export interface MenuItem {
  id: number;
  _id?: string; // MongoDB ObjectId
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  allergens: string[];
  dietary: string[];
  rating: number;
  reviews: number;
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isSpecial?: boolean;
  discount?: number;
  recommended?: boolean;
  customizations: {
    [key: string]: string[];
  };
}

export interface CartItem extends MenuItem {
  quantity: number;
  cartId: string;
  selectedCustomizations?: { [key: string]: string };
  specialRequests?: string;
  isUpdating?: boolean; // For optimistic updates
}

interface CartStore {
  cart: CartItem[];
  
  addToCart: (item: MenuItem, customizations?: { [key: string]: string }, specialRequests?: string) => void;
  updateQuantity: (cartId: string, change: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  getTotal: () => { subtotal: number; tax: number; total: number };
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (item, customizations = {}, specialRequests = '') => {
        const cartId = Date.now().toString();
        const cartItem: CartItem = {
          ...item,
          quantity: 1,
          cartId,
          selectedCustomizations: customizations,
          specialRequests,
          isUpdating: false,
        };
        
        // Optimistic update
        set((state) => ({ cart: [...state.cart, cartItem] }));
        announce(`${item.name} added to cart`);
      },
      
      updateQuantity: (cartId, change) => {
        // Optimistic update with loading state
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.cartId === cartId) {
              const newQuantity = item.quantity + change;
              if (newQuantity > 0) {
                announce(`${item.name} quantity updated to ${newQuantity}`);
                return { ...item, quantity: newQuantity, isUpdating: true };
              }
              return null;
            }
            return item;
          }).filter(Boolean) as CartItem[],
        }));
        
        // Simulate API call and remove loading state
        setTimeout(() => {
          set((state) => ({
            cart: state.cart.map((item) => 
              item.cartId === cartId ? { ...item, isUpdating: false } : item
            ),
          }));
        }, 300);
      },
      
      removeFromCart: (cartId) => {
        const item = get().cart.find(i => i.cartId === cartId);
        
        // Optimistic update
        set((state) => ({
          cart: state.cart.filter((item) => item.cartId !== cartId),
        }));
        
        if (item) {
          announce(`${item.name} removed from cart`);
        }
      },
      
      clearCart: () => {
        set({ cart: [] });
        announce('Cart cleared');
      },
      
      getTotal: () => {
        const cart = get().cart;
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = subtotal * 0.1;
        return {
          subtotal,
          tax,
          total: subtotal + tax,
        };
      },
      
      getItemCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: (() => {
        const tenant = getCurrentTenant();
        return tenant ? `cart-${tenant.tenantId}` : 'cart-default';
      })(),
    }
  )
);