import { useState } from 'react';
import { X, DollarSign, CreditCard, Receipt, Loader, Plus, Minus } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useOrders, OrderTracking } from '../../hooks/useOrders';

interface CheckoutModalProps {
  t: any;
  onProcessPayment: (method: 'cash' | 'card') => Promise<void>;
}

export const CheckoutModal = ({ t, onProcessPayment }: CheckoutModalProps) => {
  const { showCheckoutModal, setShowCheckoutModal, showBillSplitModal, setShowBillSplitModal, 
          splitCount, setSplitCount } = useUIStore();
  const { activeOrders } = useOrders();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | ''>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  if (!showCheckoutModal) return null;

  const servedOrders = activeOrders.filter((order: OrderTracking) => order.status === 'served');
  const totalAmount = servedOrders.reduce((sum: number, order: OrderTracking) => sum + order.total, 0);

  const handleCheckout = async () => {
    if (!paymentMethod) {
      alert(t.selectPaymentMethod);
      return;
    }

    setProcessingPayment(true);
    try {
      await onProcessPayment(paymentMethod);
      setShowCheckoutModal(false);
      setPaymentMethod('');
    } catch (error) {
      
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t.checkout}</h2>
            <button
              onClick={() => {
                setShowCheckoutModal(false);
                setPaymentMethod('');
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">{t.billTotal}</span>
                <span className="text-2xl font-bold text-purple-600">
                  AED {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{servedOrders.length} served orders</span>
                <button
                  onClick={() => setShowBillSplitModal(true)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {t.splitBill}
                </button>
              </div>
            </div>
            
            <h3 className="font-semibold mb-3">{t.paymentMethod}</h3>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:border-purple-600 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
                  className="mr-3"
                />
                <DollarSign size={24} className="mr-3 text-green-600" />
                <span className="font-medium">{t.cash}</span>
              </label>
              
              <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:border-purple-600 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                  className="mr-3"
                />
                <CreditCard size={24} className="mr-3 text-blue-600" />
                <span className="font-medium">{t.card}</span>
              </label>
            </div>
          </div>
          
          {paymentMethod && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                {t.waitressWillBring} {paymentMethod === 'cash' ? t.physicalBill : t.physicalBill + ' ' + t.andCardMachine}.
              </p>
            </div>
          )}
          
          <button
            onClick={handleCheckout}
            disabled={!paymentMethod || processingPayment}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                     hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold
                     flex items-center justify-center gap-2"
          >
            {processingPayment ? (
              <>
                <Loader size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Receipt size={20} />
                {t.confirmPayment}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bill Split Modal */}
      {showBillSplitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t.splitBill}</h2>
              <button
                onClick={() => setShowBillSplitModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Total Bill</p>
                <p className="text-2xl font-bold text-purple-600">
                  AED {totalAmount.toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split between how many people?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                    className="w-10 h-10 rounded-full border hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{splitCount}</span>
                  <button
                    onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                    className="w-10 h-10 rounded-full border hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Amount per person</p>
                <p className="text-xl font-bold">
                  AED {(totalAmount / splitCount).toFixed(2)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowBillSplitModal(false);
                alert(`Bill split into ${splitCount} parts. Each person pays AED ${(totalAmount / splitCount).toFixed(2)}`);
              }}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full 
                       hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Confirm Split
            </button>
          </div>
        </div>
      )}
    </>
  );
};