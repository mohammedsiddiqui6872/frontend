import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Receipt, Home, Loader2 } from 'lucide-react';
import api from '../../services/api';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const paymentIntentId = searchParams.get('payment_intent');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!paymentIntentId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch payment details from backend
        const response = await api.get(`/stripe/${paymentIntentId}`);
        setPaymentDetails(response.data.data);
      } catch (error) {
        console.error('Error fetching payment details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentIntentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="text-green-600" size={48} />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Your payment has been processed successfully
        </p>

        {/* Payment Details */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-medium">#{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium">
                AED {(paymentDetails.amount / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">
                {paymentDetails.paymentMethod || 'Card'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono text-xs">
                {paymentIntentId?.slice(0, 20)}...
              </span>
            </div>
          </div>
        )}

        {/* Thank You Message */}
        <div className="text-center mb-6">
          <p className="text-gray-700">
            Thank you for your payment! Your order is being prepared.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            A receipt has been sent to your email
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Receipt size={20} />
            <span>View Order Details</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            For any issues with your payment, please contact our support team
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;