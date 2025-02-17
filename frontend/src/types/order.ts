export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'В ожидании',
  preparing: 'Готовится',
  ready: 'Готово',
  completed: 'Выполнено',
  cancelled: 'Отменено'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#fbbf24', // Amber
  preparing: '#3b82f6', // Blue
  ready: '#10b981', // Green
  completed: '#6b7280', // Gray
  cancelled: '#ef4444' // Red
};

export interface OrderItem {
  id: string;
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  special_requests?: string;
}

export interface Order {
  id: string;
  table_id: string;
  restaurant_id: string;
  customer_phone: string;
  items: OrderItem[];
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderFilters {
  restaurant_id?: string;
  table_id?: string;
  status?: OrderStatus;
  date_from?: Date;
  date_to?: Date;
}

export interface OrderAnalytics {
  total_orders: number;
  total_amount: number;
  average_order_value: number;
  orders_by_status: Record<OrderStatus, number>;
  popular_items: Array<{
    item_id: string;
    name: string;
    total_ordered: number;
    total_revenue: number;
  }>;
  peak_hours: Array<{
    hour: number;
    order_count: number;
  }>;
}
