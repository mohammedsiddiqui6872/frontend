export interface MenuItem {
  id: number;
  name: string;
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

export interface CartItem extends Omit<MenuItem, 'customizations'> {
  cartId: string;
  quantity: number;
  customizations: { [key: string]: string };
  specialRequests: string;
}

export interface OrderTracking {
  status: string;
  estimatedTime: number;
  steps: string[];
}

export interface OrderHistory {
  id: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string;
}

export interface ConversationMessage {
  type: 'user' | 'assistant';
  message: string;
}