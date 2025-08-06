import { loadStripe, Stripe } from '@stripe/stripe-js';
import api from './api';

class StripeService {
  private stripePromise: Promise<Stripe | null>;
  
  constructor() {
    // Initialize Stripe with publishable key
    this.stripePromise = loadStripe(
      process.env['REACT_APP_STRIPE_PUBLISHABLE_KEY'] || ''
    );
  }

  /**
   * Get Stripe instance
   */
  async getStripe() {
    return await this.stripePromise;
  }

  /**
   * Create payment intent for an order
   */
  async createPaymentIntent(orderId: string, amount: number, tableNumber?: string) {
    try {
      const response = await api.post('/stripe/intent', {
        orderId,
        amount: Math.round(amount * 100), // Convert to cents
        tableNumber,
        currency: 'aed'
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment with payment method
   */
  async confirmPayment(clientSecret: string, paymentElement: any) {
    const stripe = await this.getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await stripe.confirmPayment({
      elements: paymentElement,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required'
    });

    if (result.error) {
      throw result.error;
    }

    return result.paymentIntent;
  }

  /**
   * Process refund
   */
  async processRefund(paymentIntentId: string, amount?: number, reason?: string) {
    try {
      const response = await api.post('/stripe/refund', {
        paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate?: Date, endDate?: Date) {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      
      const response = await api.get('/stripe/analytics', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  }

  /**
   * Create connected account for restaurant
   */
  async createConnectedAccount(restaurantData: any) {
    try {
      const response = await api.post('/stripe/connect', restaurantData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating connected account:', error);
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(planId: string) {
    try {
      const response = await api.post('/stripe/subscription', { planId });
      return response.data.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      const response = await api.delete('/stripe/subscription');
      return response.data.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'AED'): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  /**
   * Validate card details
   */
  validateCard(cardNumber: string | undefined): boolean {
    if (!cardNumber) return false;
    // Luhn algorithm for card validation
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
}

export default new StripeService();