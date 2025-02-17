import api from './api';
import { Order, OrderStatus, OrderFilters } from '@/types/order';

const ordersService = {
  // Get orders with filters
  getOrders: async (filters?: OrderFilters) => {
    const response = await api.get('/api/restaurant/orders', { params: filters });
    return response.data;
  },

  // Get single order details
  getOrder: async (orderId: string) => {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const response = await api.patch(`/api/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Get order analytics
  getAnalytics: async (restaurantId: string, dateFrom?: Date, dateTo?: Date) => {
    const response = await api.get('/api/restaurant/orders/analytics', {
      params: { restaurant_id: restaurantId, date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  }
};

export default ordersService;
