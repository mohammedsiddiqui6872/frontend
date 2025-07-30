import { X, History, Loader } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useOrders, OrderTracking } from '../../hooks/useOrders';
import { useCartStore } from '../../stores/cartStore';
import { OrderHistoryItem } from '../orders/OrderHistoryItem';

interface OrderHistoryModalProps {
  t: any;
  onViewOrderDetails: (order: any) => void;
}

export const OrderHistoryModal = ({ t, onViewOrderDetails }: OrderHistoryModalProps) => {
  const { showOrderHistory, setShowOrderHistory } = useUIStore();
  const { activeOrders, orderHistory, isLoading } = useOrders();
  const { addToCart } = useCartStore();

  if (!showOrderHistory) return null;

  const reorderItems = (order: any) => {
    order.items.forEach((item: any) => {
      const cartId = Date.now().toString() + Math.random();
      addToCart({
        ...item,
        cartId
      });
    });
    
    setShowOrderHistory(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{t.orderHistory}</h2>
          <button
            onClick={() => setShowOrderHistory(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader size={48} className="animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-purple-600">{t.activeOrders}</h3>
                  <div className="space-y-4">
                    {activeOrders.map((order: OrderTracking) => (
                      <OrderHistoryItem
                        key={order._id}
                        order={order}
                        onReorder={() => reorderItems(order)}
                        onViewDetails={() => onViewOrderDetails(order)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Order History Section */}
              {orderHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-600">{t.orderHistory}</h3>
                  <div className="space-y-4">
                    {orderHistory.map((order: OrderTracking) => (
                      <OrderHistoryItem
                        key={order._id}
                        order={order}
                        onReorder={() => reorderItems(order)}
                        onViewDetails={() => onViewOrderDetails(order)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {activeOrders.length === 0 && orderHistory.length === 0 && (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};