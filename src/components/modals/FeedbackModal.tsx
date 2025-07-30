import { useState, useEffect } from 'react';
import { Heart, MessageSquare, X, CheckCircle, Sparkles } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { apiService } from '../../services/api.service';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useOrders } from '../../hooks/useOrders';
import '../../styles/feedback-modal.css';

interface FeedbackModalProps {
  t: any;
  onSubmit?: (feedbackData: any) => Promise<void>;
  customerSession?: any;
  tableNumber?: string;
}

interface EmojiRating {
  emoji: string;
  label: string;
  value: number;
}

const emojiRatings: EmojiRating[] = [
  { emoji: '😞', label: 'Terrible', value: 1 },
  { emoji: '😕', label: 'Poor', value: 2 },
  { emoji: '😐', label: 'Average', value: 3 },
  { emoji: '😊', label: 'Good', value: 4 },
  { emoji: '🤩', label: 'Excellent', value: 5 },
];

export const FeedbackModal = ({ t, customerSession, tableNumber }: FeedbackModalProps) => {
  const { 
    showFeedback, 
    setShowFeedback, 
    setShowWelcome, 
    setShowThankYou,
    setActiveCategory,
    setSearchQuery,
    setShowCart,
    setShowOrderHistory,
    setCallWaiterStatus,
    setPaymentCompleteTotal
  } = useUIStore();
  
  const { authToken, setCustomerName } = useAuthStore();
  const { clearCart } = useCartStore();
  const { activeOrders, refetch: refetchOrders } = useOrders();
  
  const [feedbackData, setFeedbackData] = useState({
    rating: 3, // Default to average
    foodQuality: 3,
    serviceQuality: 3,
    ambience: 3,
    cleanliness: 3,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (showFeedback) {
      setAnimateIn(true);
    }
  }, [showFeedback]);

  if (!showFeedback) return null;

  const resetAllStates = () => {
    // Clear UI states
    setShowFeedback(false);
    setShowThankYou(false);
    setShowCart(false);
    setShowOrderHistory(false);
    setActiveCategory('appetizers');
    setSearchQuery('');
    setCallWaiterStatus('idle');
    setPaymentCompleteTotal(0);
    
    // Clear customer data
    setCustomerName('');
    
    // Clear cart if any items remain
    clearCart();
    
    // Reset feedback data
    setFeedbackData({
      rating: 3,
      foodQuality: 3,
      serviceQuality: 3,
      ambience: 3,
      cleanliness: 3,
      comment: ''
    });
    
    // Reset any other modal states
    (window as any).resetCustomerForm = true;
  };

  const endCustomerSession = async () => {
    if (!customerSession?._id || !authToken) return;
    
    try {
      // Use the close endpoint which sets isActive to false
      await fetch(`${process.env['REACT_APP_API_URL'] || 'https://restaurant-backend-2wea.onrender.com/api'}/customer-sessions/${customerSession._id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Clear from localStorage
      localStorage.removeItem('customer-session');
    } catch (error) {
      console.error('Error ending customer session:', error);
    }
  };

  const submitFeedback = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate overall rating as average of all ratings
      const overallRating = Math.round(
        (feedbackData.foodQuality + feedbackData.serviceQuality + 
         feedbackData.ambience + feedbackData.cleanliness) / 4
      );

      await apiService.submitFeedback({
        tableNumber,
        customerName: customerSession?.customerName || 'Guest',
        rating: overallRating, // Use calculated overall rating
        overallRating: overallRating,
        foodQuality: feedbackData.foodQuality,
        serviceQuality: feedbackData.serviceQuality,
        ambience: feedbackData.ambience,
        cleanliness: feedbackData.cleanliness,
        comments: feedbackData.comment,
        orderId: activeOrders[activeOrders.length - 1]?._id
      }, authToken!);

      await endCustomerSession();
      
      // Show success animation
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowFeedback(false);
        setShowThankYou(true);
        
        setTimeout(() => {
          resetAllStates();
          setShowWelcome(true);
          refetchOrders();
        }, 3000);
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await endCustomerSession();
    resetAllStates();
    setShowWelcome(true);
    refetchOrders();
    // Clear localStorage 
    localStorage.removeItem('customer-session');
  };


  const categoryIcons = {
    foodQuality: '🍽️',
    serviceQuality: '👨‍🍳',
    ambience: '🎵',
    cleanliness: '✨'
  };

  const quickPhrases = [
    '🎉 Amazing!',
    '😋 Delicious',
    '👏 Great service',
    '🌟 Will return',
    '💖 Loved it',
    '👍 Friendly staff'
  ];

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className={`transform transition-all duration-500 ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 success-check-icon" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your opinion helps us serve you better
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 feedback-backdrop">
      <div className={`transform transition-all duration-500 feedback-modal-enter ${animateIn ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-2">
                <Heart className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold mb-1">How was your experience?</h2>
              <p className="text-white/90 text-sm">Your feedback helps us improve</p>
            </div>
          </div>

          <div className="p-6">
            {/* Category Ratings - Compact Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: 'foodQuality' as const, label: 'Food Quality' },
                { key: 'serviceQuality' as const, label: 'Service' },
                { key: 'ambience' as const, label: 'Ambience' },
                { key: 'cleanliness' as const, label: 'Cleanliness' }
              ].map(({ key, label }) => (
                <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{categoryIcons[key]}</span>
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                      {label}
                    </h4>
                  </div>
                  <div className="flex justify-between gap-1">
                    {emojiRatings.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFeedbackData({ ...feedbackData, [key]: item.value })}
                        className={`transition-all duration-200 ${
                          feedbackData[key] === item.value 
                            ? 'scale-110 transform' 
                            : 'hover:scale-105 opacity-60 hover:opacity-100'
                        }`}
                        disabled={isSubmitting}
                      >
                        <div className={`text-2xl ${
                          feedbackData[key] === item.value 
                            ? 'drop-shadow-md' 
                            : ''
                        }`}>
                          {item.emoji}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comments Section - Compact */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                  Comments
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
              </div>
              
              {/* Quick Phrases */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickPhrases.map((phrase, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFeedbackData({ 
                      ...feedbackData, 
                      comment: feedbackData.comment ? `${feedbackData.comment} ${phrase}` : phrase 
                    })}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30
                             text-xs rounded-full transition-all duration-200 hover:scale-105 
                             text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                    disabled={isSubmitting}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl resize-none 
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all duration-300
                         placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                rows={2}
                placeholder="Tell us more about your experience..."
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                         rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 
                         font-medium disabled:opacity-50 text-sm"
              >
                Skip
              </button>
              <button
                onClick={submitFeedback}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl 
                         hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50
                         disabled:cursor-not-allowed relative overflow-hidden group text-sm"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};