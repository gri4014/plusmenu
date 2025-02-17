import { BaseEntity, OrderStatus, TableOrderStatus, WaiterCallStatus } from './common';
/**
 * Interface for order item details
 */
export interface IOrderItem {
  item_id: string;
  quantity: number;
  price: number;
  special_requests?: string;
  parameters?: Record<string, any>;
}

/**
 * Interface for individual orders
 */
export interface IOrder extends BaseEntity {
  table_id: string;
  restaurant_id: string;
  customer_phone: string;
  items: IOrderItem[];
  status: OrderStatus;
}

/**
 * Interface for table orders (group of individual orders)
 */
export interface ITableOrder extends BaseEntity {
  table_id: string;
  restaurant_id: string;
  individual_orders: string[]; // Array of order UUIDs
  total_amount: number;
  status: TableOrderStatus;
  completed_at?: Date;
}

/**
 * Interface for waiter calls
 */
export interface IWaiterCall extends BaseEntity {
  table_id: string;
  restaurant_id: string;
  status: WaiterCallStatus;
  completed_at?: Date;
}

/**
 * Interface for creating a new order
 */
export interface ICreateOrder {
  table_id: string;
  customer_phone: string;
  items: Array<{
    item_id: string;
    quantity: number;
    special_requests?: string;
    parameters?: Record<string, any>;
  }>;
}

/**
 * Interface for order status update
 */
export interface IUpdateOrderStatus {
  order_id: string;
  status: OrderStatus;
}

/**
 * Interface for order summary
 */
export interface IOrderSummary {
  order_id: string;
  table_number: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    special_requests?: string;
  }>;
  total_amount: number;
  status: OrderStatus;
  created_at: Date;
}

/**
 * Interface for order filters
 */
export interface IOrderFilters {
  restaurant_id?: string;
  table_id?: string;
  customer_phone?: string;
  status?: OrderStatus;
  date_from?: Date;
  date_to?: Date;
}

/**
 * Interface for table order with details
 */
export interface ITableOrderWithDetails extends ITableOrder {
  orders: Array<{
    id: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    customer_phone: string;
    status: OrderStatus;
  }>;
}

/**
 * Interface for waiter call filters
 */
export interface IWaiterCallFilters {
  restaurant_id?: string;
  table_id?: string;
  status?: WaiterCallStatus;
  date_from?: Date;
  date_to?: Date;
}

/**
 * Interface for order statistics
 */
/**
 * Interface for table session orders response
 */
export interface ITableSessionOrders {
  orders: Array<{
    id: string;
    customer_phone: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      special_requests?: string;
      status: OrderStatus;
    }>;
    total_amount: number;
    status: OrderStatus;
    created_at: Date;
  }>;
  total_table_amount: number;
}

export interface IOrderStatistics {
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
