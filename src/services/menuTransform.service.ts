/**
 * Menu Transform Service
 * Enterprise-grade service for transforming menu data between backend and frontend formats
 */

import { MenuItem } from '../stores/cartStore';

interface BackendMenuItem {
  _id: string;
  id: number;
  name: string;
  nameAr?: string;
  category: string;
  price: number;
  description: string;
  descriptionAr?: string;
  image: string;
  images?: string[];
  available: boolean;
  inStock: boolean;
  stockQuantity: number;
  allergens: string[];
  dietary: string[];
  prepTime: number;
  rating: number;
  reviews: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isSpecial?: boolean;
  discount?: number;
  recommended?: boolean;
  customizations?: Record<string, string[]>;
  [key: string]: any;
}

interface MenuResponse {
  [category: string]: BackendMenuItem[];
}

class MenuTransformService {
  /**
   * Transform backend menu response to frontend format
   * Ensures all items have proper MongoDB _id field
   */
  transformMenuResponse(menuData: MenuResponse): Record<string, MenuItem[]> {
    const transformedData: Record<string, MenuItem[]> = {};

    for (const [category, items] of Object.entries(menuData)) {
      transformedData[category] = items.map(item => this.transformMenuItem(item));
    }

    return transformedData;
  }

  /**
   * Transform a single menu item from backend to frontend format
   */
  private transformMenuItem(backendItem: BackendMenuItem): MenuItem {
    // Ensure we have a valid _id
    if (!backendItem._id) {
      
      throw new Error(`Menu item ${backendItem.name} is missing MongoDB _id`);
    }

    // Transform to frontend MenuItem format
    const menuItem: MenuItem = {
      // Use numeric id for display/UI purposes
      id: backendItem.id || this.generateNumericId(backendItem._id),
      // Preserve MongoDB _id for API calls
      _id: backendItem._id,
      name: backendItem.name,
      category: backendItem.category,
      price: backendItem.price,
      image: backendItem.image || backendItem.images?.[0] || '/placeholder.jpg',
      description: backendItem.description,
      allergens: backendItem.allergens || [],
      dietary: backendItem.dietary || [],
      rating: backendItem.rating || 0,
      reviews: backendItem.reviews || 0,
      prepTime: backendItem.prepTime || 15,
      calories: backendItem.calories || 0,
      protein: backendItem.protein || 0,
      carbs: backendItem.carbs || 0,
      fat: backendItem.fat || 0,
      isSpecial: backendItem.isSpecial || false,
      discount: backendItem.discount || 0,
      recommended: backendItem.recommended || false,
      customizations: this.transformCustomizations(backendItem.customizations),
    };

    return menuItem;
  }

  /**
   * Transform customizations from backend format
   */
  private transformCustomizations(customizations?: any): { [key: string]: string[] } {
    if (!customizations) return {};

    // Handle Map or plain object
    if (customizations instanceof Map) {
      const result: { [key: string]: string[] } = {};
      customizations.forEach((value, key) => {
        result[key] = Array.isArray(value) ? value : [value];
      });
      return result;
    }

    // Handle plain object
    const result: { [key: string]: string[] } = {};
    for (const [key, value] of Object.entries(customizations)) {
      result[key] = Array.isArray(value) ? value as string[] : [String(value)];
    }
    return result;
  }

  /**
   * Generate a numeric ID from MongoDB ObjectId
   * Used for backward compatibility with UI components
   */
  private generateNumericId(objectId: string): number {
    // Simple hash function to convert ObjectId to number
    let hash = 0;
    for (let i = 0; i < objectId.length; i++) {
      const char = objectId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Validate menu item before adding to cart
   */
  validateMenuItem(item: MenuItem): { valid: boolean; error?: string } {
    if (!item._id) {
      return { valid: false, error: 'Menu item is missing ID' };
    }

    if (!item.name || !item.price || item.price <= 0) {
      return { valid: false, error: 'Menu item has invalid data' };
    }

    return { valid: true };
  }

  /**
   * Prepare order items for API submission
   */
  prepareOrderItems(cartItems: MenuItem[]): any[] {
    return cartItems.map(item => {
      const validation = this.validateMenuItem(item);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return {
        menuItem: item._id!, // MongoDB ObjectId as string
        quantity: (item as any).quantity || 1,
        price: item.price,
        name: item.name,
        customizations: (item as any).selectedCustomizations || {},
        specialRequests: (item as any).specialRequests || ''
      };
    });
  }
}

export const menuTransformService = new MenuTransformService();
export type { BackendMenuItem, MenuResponse };