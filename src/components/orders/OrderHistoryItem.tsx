import { Clock, CheckCircle, Package, Truck, Check, Receipt, XCircle, AlertCircle } from 'lucide-react';
import { OrderTracking } from '../../hooks/useOrders';

interface OrderHistoryItemProps {
  order: OrderTracking;
  onReorder: () => void;
  onViewDetails: () => void;
  t: any;
}

export const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({ 
  order, 
  onReorder, 
  onViewDetails, 
  t 
}) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-orange-100 text-orange-800',
      'ready': 'bg-purple-100 text-purple-800',
      'served': 'bg-green-100 text-green-800',
      'paid': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'confirmed':
        return <CheckCircle size={16} />;
      case 'preparing':
        return <Package size={16} />;
      case 'ready':
        return <Truck size={16} />;
      case 'served':
        return <Check size={16} />;
      case 'paid':
        return <Receipt size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold">Order #{order.orderNumber}</h4>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {t[order.status] || order.status}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleString()}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {t.total}: AED {order.total.toFixed(2)}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {t.viewReceipt}
          </button>
          {['paid', 'cancelled'].includes(order.status) && (
            <button
              onClick={onReorder}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {t.reorder}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};