import { CheckCircle2, Gem } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface ThankYouScreenProps {
  t: any;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ t }) => {
  const { showThankYou, paymentCompleteTotal } = useUIStore();

  if (!showThankYou) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.thankYou}
          </h2>
          <p className="text-gray-600 text-lg mb-6">{t.paymentProcessed}</p>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">{t.totalAmountPaid}</p>
          <p className="text-4xl font-bold text-purple-600">
            AED {paymentCompleteTotal.toFixed(2)}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Gem size={20} className="text-purple-600" />
          <p className="text-sm">{t.thankYouDining} {t.restaurant}</p>
          <Gem size={20} className="text-purple-600" />
        </div>
        
        <div className="mt-6">
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Please wait while we prepare your feedback form...</p>
        </div>
      </div>
    </div>
  );
};