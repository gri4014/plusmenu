import { Router } from 'express';
import { z } from 'zod';
import OrderController from '../../controllers/order/OrderController';
import { validateRequest } from '../../middleware/validation';
import { createOrderSchema, updateOrderStatusSchema, orderItemSchema, orderFiltersSchema } from '../../models/schemas/order';
import { authenticateRestaurantStaff } from '../../middleware/auth';

const router = Router();

// Validation schemas
const orderIdSchema = z.object({
  orderId: z.string().uuid()
});

const updateStatusSchema = z.object({
  status: updateOrderStatusSchema.shape.status
});

const addItemsSchema = z.object({
  items: z.array(orderItemSchema)
});

/**
 * @route GET /api/restaurant/orders
 * @desc Get filtered orders for restaurant
 * @access Private (Restaurant Staff)
 */
router.get(
  '/restaurant/orders',
  authenticateRestaurantStaff,
  validateRequest({ query: orderFiltersSchema }),
  OrderController.getOrders
);

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Public
 */
router.post(
  '/',
  validateRequest({ body: createOrderSchema }),
  OrderController.createOrder
);

/**
 * @route GET /api/orders/:orderId
 * @desc Get order by ID
 * @access Public
 */
router.get(
  '/:orderId',
  validateRequest({ params: orderIdSchema }),
  OrderController.getOrder
);

/**
 * @route PATCH /api/orders/:orderId/status
 * @desc Update order status
 * @access Private (Restaurant Staff)
 */
router.patch(
  '/:orderId/status',
  authenticateRestaurantStaff,
  validateRequest({
    params: orderIdSchema,
    body: updateStatusSchema
  }),
  OrderController.updateOrderStatus
);

/**
 * @route POST /api/orders/:orderId/items
 * @desc Add items to existing order
 * @access Public
 */
router.post(
  '/:orderId/items',
  validateRequest({
    params: orderIdSchema,
    body: addItemsSchema
  }),
  OrderController.addItemsToOrder
);

export default router;
