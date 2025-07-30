import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { apiService } from '../services/api.service.multi-tenant';
import { socketService } from '../services/socket.service.multi-tenant';
import { useNotifications } from './useNotifications';

interface PlaceOrderParams {
  tableNumber: string;
  customerSessionId?: string;
}

export const usePlaceOrder = ({ tableNumber, customerSessionId }: PlaceOrderParams) => {
  const { authToken } = useAuthStore();
  const { cart, clearCart } = useCartStore();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!authToken) throw new Error('Not authenticated');
      if (cart.length === 0) throw new Error('Cart is empty');

      const orderData = {
        tableNumber,
        items: cart.map(item => ({
          menuItem: item._id || item.id.toString(),
          quantity: item.quantity,
          customizations: item.selectedCustomizations,
          specialRequests: item.specialRequests,
          name: item.name,
          price: item.price,
        })),
        customerSessionId,
      };

      return apiService.placeOrder(orderData, authToken);
    },
    onSuccess: (data: any) => {
      // Clear the cart
      clearCart();

      // Emit socket event for real-time updates
      socketService.emitNewOrder({
        ...data.order,
        tableNumber,
      });

      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['orders', tableNumber, customerSessionId] });

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Order Placed!',
        message: `Order #${data.order.orderNumber} has been sent to the kitchen`,
      });
    },
    onError: (error) => {
      console.error('Order placement error:', error);
      addNotification({
        type: 'error',
        title: 'Order Failed',
        message: error instanceof Error ? error.message : 'Failed to place order. Please try again.',
      });
    },
  });

  return {
    placeOrder: placeOrderMutation.mutate,
    isPlacing: placeOrderMutation.isPending,
    error: placeOrderMutation.error,
  };
};