import { z } from 'zod';
import { baseEntitySchema, orderStatusSchema, tableOrderStatusSchema, waiterCallStatusSchema } from './common';

/**
 * Schema for order item details
 */
export const orderItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive().multipleOf(0.01),
  special_requests: z.string().max(500).optional(),
  parameters: z.record(z.string(), z.unknown()).optional()
});

/**
 * Base schema for orders
 */
const orderBase = {
  table_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  customer_phone: z.string(),
  items: z.array(orderItemSchema),
  status: orderStatusSchema
};

/**
 * Main order schema
 */
export const orderSchema = z.object({
  ...baseEntitySchema.shape,
  ...orderBase
});

/**
 * Schema for table orders
 */
export const tableOrderSchema = z.object({
  ...baseEntitySchema.shape,
  table_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  individual_orders: z.array(z.string().uuid()),
  total_amount: z.number().positive().multipleOf(0.01),
  status: tableOrderStatusSchema,
  completed_at: z.date().optional()
});

/**
 * Schema for waiter calls
 */
export const waiterCallSchema = z.object({
  ...baseEntitySchema.shape,
  table_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  status: waiterCallStatusSchema,
  completed_at: z.date().optional()
});

/**
 * Schema for creating orders
 */
export const createOrderSchema = z.object({
  table_id: z.string().uuid(),
  customer_phone: z.string(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    special_requests: z.string().max(500).optional(),
    parameters: z.record(z.string(), z.unknown()).optional()
  }))
}).refine(
  data => data.items.length > 0,
  {
    message: "Order must contain at least one item"
  }
);

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: orderStatusSchema
});

/**
 * Schema for order summary
 */
export const orderSummarySchema = z.object({
  order_id: z.string().uuid(),
  table_number: z.number().int().positive(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive().multipleOf(0.01),
    special_requests: z.string().optional()
  })),
  total_amount: z.number().positive().multipleOf(0.01),
  status: orderStatusSchema,
  created_at: z.date()
});

/**
 * Schema for order filters
 */
export const orderFiltersSchema = z.object({
  restaurant_id: z.string().uuid().optional(),
  table_id: z.string().uuid().optional(),
  customer_phone: z.string().optional(),
  status: orderStatusSchema.optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional()
}).refine(
  data => !(data.date_from && data.date_to) || data.date_from <= data.date_to,
  {
    message: "date_to must be after date_from"
  }
);

/**
 * Schema for table order with details
 */
export const tableOrderWithDetailsSchema = tableOrderSchema.extend({
  orders: z.array(z.object({
    id: z.string().uuid(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive().multipleOf(0.01)
    })),
    customer_phone: z.string(),
    status: orderStatusSchema
  }))
});

/**
 * Schema for waiter call filters
 */
export const waiterCallFiltersSchema = z.object({
  restaurant_id: z.string().uuid().optional(),
  table_id: z.string().uuid().optional(),
  status: waiterCallStatusSchema.optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional()
}).refine(
  data => !(data.date_from && data.date_to) || data.date_from <= data.date_to,
  {
    message: "date_to must be after date_from"
  }
);

/**
 * Schema for order statistics
 */
/**
 * Schema for adding items to an existing order
 */
export const addOrderItemsSchema = z.object({
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    special_requests: z.string().max(500).optional(),
    parameters: z.record(z.string(), z.unknown()).optional()
  }))
}).refine(
  data => data.items.length > 0,
  {
    message: "Must add at least one item"
  }
);

export const orderStatisticsSchema = z.object({
  total_orders: z.number().int().nonnegative(),
  total_amount: z.number().nonnegative().multipleOf(0.01),
  average_order_value: z.number().nonnegative().multipleOf(0.01),
  orders_by_status: z.record(orderStatusSchema, z.number().int().nonnegative()),
  popular_items: z.array(z.object({
    item_id: z.string().uuid(),
    name: z.string(),
    total_ordered: z.number().int().nonnegative(),
    total_revenue: z.number().nonnegative().multipleOf(0.01)
  })),
  peak_hours: z.array(z.object({
    hour: z.number().int().min(0).max(23),
    order_count: z.number().int().nonnegative()
  }))
});
