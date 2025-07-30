import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiService } from '../services/api.service.multi-tenant';
import { socketService } from '../services/socket.service.multi-tenant';
import { useAuthStore } from '../stores/authStore';
import { useNotifications } from './useNotifications';

export interface OrderTracking {
  _id: string;
  orderId: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  estimatedTime: number;
  items: any[];
  total: number;
  progress: number;
  createdAt: string;
  tableNumber: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'online' | 'pending';
}

const getProgressForStatus = (status: string): number => {
  const progressMap: { [key: string]: number } = {
    'pending': 20,
    'confirmed': 40,
    'preparing': 60,
    'ready': 80,
    'served': 100,
    'paid': 100,
    'cancelled': 0
  };
  return progressMap[status] || 0;
};

export const useOrders = (tableNumber?: string) => {
  const { authToken, customerSessionId } = useAuthStore();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const ordersQuery = useQuery({
    queryKey: ['orders', tableNumber, customerSessionId],
    queryFn: async () => {
      if (!authToken || !tableNumber) throw new Error('Not authenticated');
      
      const orders = await apiService.fetchOrders(tableNumber, authToken, customerSessionId || undefined) as any[];
      
      // Add progress to orders
      return orders.map((order: OrderTracking) => ({
        ...order,
        progress: getProgressForStatus(order.status),
      }));
    },
    enabled: !!authToken && !!tableNumber,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Socket listeners
  useEffect(() => {
    if (!authToken || !tableNumber) return;

    const handleOrderStatusUpdate = (data: any) => {
      queryClient.setQueryData(['orders', tableNumber, customerSessionId], (old: OrderTracking[] | undefined) => {
        if (!old) return old;
        
        const updated = old.map(order => 
          order._id === data.orderId 
            ? { ...order, status: data.status, progress: getProgressForStatus(data.status) }
            : order
        );
        
        return updated;
      });

      addNotification({
        type: 'info',
        title: 'Order Update',
        message: `Order #${data.orderId.slice(-6)} is now ${data.status}`,
      });
    };

    const handleKitchenUpdate = (data: any) => {
      if (data.itemStatus) {
        queryClient.setQueryData(['orders', tableNumber, customerSessionId], (old: OrderTracking[] | undefined) => {
          if (!old) return old;
          
          return old.map(order => {
            if (order._id === data.orderId) {
              const updatedItems = order.items.map(item => 
                item.cartId === data.itemId 
                  ? { ...item, status: data.itemStatus.status }
                  : item
              );
              return { ...order, items: updatedItems };
            }
            return order;
          });
        });
      }
    };

    const handleOrderReady = (data: any) => {
      addNotification({
        type: 'success',
        title: 'Order Ready!',
        message: `Order #${data.orderId.slice(-6)} is ready for pickup`,
      });
    };

    socketService.onOrderStatusChange(handleOrderStatusUpdate);
    socketService.onKitchenUpdate(handleKitchenUpdate);
    socketService.onOrderReady(handleOrderReady);

    return () => {
      // Socket service handles cleanup internally
    };
  }, [authToken, tableNumber, customerSessionId, queryClient, addNotification]);

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!authToken) throw new Error('Not authenticated');
      return apiService.updateOrderStatus(orderId, 'cancelled');
    },
    onSuccess: (_, orderId) => {
      // Update local state
      queryClient.setQueryData(['orders', tableNumber, customerSessionId], (old: OrderTracking[] | undefined) => {
        if (!old) return old;
        return old.filter(o => o._id !== orderId);
      });
      
      addNotification({
        type: 'success',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled successfully',
      });
      
      // Emit cancellation event
      socketService.emitOrderCancelled({ orderId, tableNumber: tableNumber || '' });
    },
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to cancel order. Please try again.',
      });
    },
  });

  const activeOrders = ordersQuery.data?.filter((o: OrderTracking) => 
  ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(o.status) &&
  o.paymentStatus !== 'paid'
) || [];

const orderHistory = ordersQuery.data?.filter((o: OrderTracking) => 
  ['paid', 'cancelled'].includes(o.status) || o.paymentStatus === 'paid'
) || [];

  return {
    orders: ordersQuery.data || [],
    activeOrders,
    orderHistory,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    cancelOrder: cancelOrderMutation.mutate,
    isCancelling: cancelOrderMutation.isPending,
  };
};