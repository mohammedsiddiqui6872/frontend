import { Clock, CheckCircle, Package, Truck, Check, Loader } from 'lucide-react';
import { OrderTracking } from '../../hooks/useOrders';

interface OrderTrackingBarProps {
  orders: OrderTracking[];
  onCancelOrder: (orderId: string) => void;
  isCancelling?: boolean;
  t: any;
}

export const OrderTrackingBar: React.FC<OrderTrackingBarProps> = ({
  orders,
  onCancelOrder,
  isCancelling,
  t,
}) => {
  const activeProgressOrders = orders.filter(order => 
    !['served', 'cancelled', 'paid'].includes(order.status)
  );

  if (activeProgressOrders.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
      {activeProgressOrders.map((order) => (
        <div key={order._id} className="container mx-auto p-4 border-b border-white/20 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {order.status === 'pending' && <Clock size={20} className="animate-pulse" />}
              {order.status === 'confirmed' && <CheckCircle size={20} />}
              {order.status === 'preparing' && <Package size={20} className="animate-bounce" />}
              {order.status === 'ready' && <Truck size={20} className="animate-pulse" />}
              <h3 className="text-lg font-semibold">
                Order #{order.orderNumber} - {t.orderStatus}: {t[order.status] || order.status}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{t.estimatedTime}: {order.estimatedTime} {t.mins}</span>
              {['pending', 'confirmed'].includes(order.status) && (
                <button
                  onClick={() => onCancelOrder(order._id)}
                  disabled={isCancelling}
                  className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    t.cancelOrder
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${order.progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={order.progress >= 20 ? 'font-bold' : 'opacity-50'}>
              <Clock size={16} className="inline mr-1" />
              {t.pending}
            </span>
            <span className={order.progress >= 40 ? 'font-bold' : 'opacity-50'}>
              <CheckCircle size={16} className="inline mr-1" />
              {t.confirmed}
            </span>
            <span className={order.progress >= 60 ? 'font-bold' : 'opacity-50'}>
              <Package size={16} className="inline mr-1" />
              {t.preparing}
            </span>
            <span className={order.progress >= 80 ? 'font-bold' : 'opacity-50'}>
              <Truck size={16} className="inline mr-1" />
              {t.ready}
            </span>
            <span className={order.progress >= 100 ? 'font-bold' : 'opacity-50'}>
              <Check size={16} className="inline mr-1" />
              {t.served}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};