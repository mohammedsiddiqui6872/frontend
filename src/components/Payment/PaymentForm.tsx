import React, { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import stripeService from '../../services/stripeService';
// import { useCartStore } from '../../store/cartStore'; // Commented out - not used
import { Loader2, CreditCard, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(
  process.env['REACT_APP_STRIPE_PUBLISHABLE_KEY'] || ''
);

interface PaymentFormProps {
  orderId: string;
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onCancel: () => void;
  tableNumber?: string;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  orderId,
  amount,
  onSuccess,
  onCancel,
  tableNumber
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (paymentMethod === 'cash') {
      // Handle cash payment
      onSuccess({ type: 'cash', amount });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?orderId=${orderId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        toast.error(result.error.message || 'Payment failed');
      } else if (result.paymentIntent) {
        toast.success('Payment successful!');
        onSuccess(result.paymentIntent);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <CreditCard size={20} />
            <span>Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition ${
              paymentMethod === 'cash'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span>💵</span>
            <span>Cash</span>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <>
          <div className="border border-gray-200 rounded-lg p-4">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card'],
              }}
            />
          </div>

          {/* Security Badge */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock size={16} />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Amount Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Total Amount</span>
          <span className="text-xl font-bold text-gray-900">
            AED {amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Pay {paymentMethod === 'cash' ? 'with Cash' : 'Now'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        const result = await stripeService.createPaymentIntent(
          props.orderId,
          props.amount,
          props.tableNumber
        );
        setClientSecret(result.clientSecret);
      } catch (error) {
        console.error('Failed to create payment intent:', error);
        toast.error('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [props.orderId, props.amount, props.tableNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to initialize payment. Please try again.</p>
        <button
          onClick={props.onCancel}
          className="mt-4 px-4 py-2 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3B82F6',
        colorBackground: '#ffffff',
        colorText: '#1F2937',
        colorDanger: '#EF4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentForm;