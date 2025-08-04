import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../stores/cartStore';
import { guestApiService } from '../services/guest-api.service';
import { guestSocketService } from '../services/guest-socket.service';
import { useNotifications } from './useNotifications';
import { useGuestStore } from '../stores/guestStore';

interface PlaceOrderParams {
  tableNumber: string;
  customerSessionId?: string;
}

export const useGuestPlaceOrder = ({ tableNumber, customerSessionId }: PlaceOrderParams) => {
  const { cart, clearCart } = useCartStore();
  const { addNotification } = useNotifications();
  const { guestSession } = useGuestStore();
  const queryClient = useQueryClient();

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error('Cart is empty');
      if (!guestSession) throw new Error('No guest session found');

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
        customerName: guestSession.customerName,
        customerPhone: guestSession.customerPhone,
        customerSessionId: customerSessionId || guestSession.sessionId,
      };

      return guestApiService.createOrder(orderData);
    },
    onSuccess: (data: any) => {
      // Clear the cart
      clearCart();

      // Emit socket event for real-time updates
      guestSocketService.emitNewOrder({
        ...data.order,
        tableNumber,
      });

      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['orders', tableNumber] });

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Order Placed!',
        message: `Order #${data.order?.orderNumber || 'New'} has been sent to the kitchen`,
      });
    },
    onError: (error: any) => {
      console.error('Order placement error:', error);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        errorMessage = 'Table not found. Please contact staff.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid order data.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your connection.';
      }
      
      addNotification({
        type: 'error',
        title: 'Order Failed',
        message: errorMessage,
      });
    },
  });

  return {
    placeOrder: placeOrderMutation.mutate,
    isPlacing: placeOrderMutation.isPending,
    error: placeOrderMutation.error,
  };
};