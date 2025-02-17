import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validation';
import { authenticateCustomer } from '../../middleware/auth';
import { customerOrderController } from '../../controllers/customer/CustomerOrderController';
import { createOrderSchema, addOrderItemsSchema } from '../../models/schemas/order';

const router = Router();

// Validation schemas
const orderIdSchema = z.object({
  orderId: z.string().uuid()
});

const tableIdSchema = z.object({
  tableId: z.string().uuid()
});

/**
 * @route POST /api/customer/orders
 * @desc Create a new order
 * @access Private (Customer)
 */
/**
 * @route GET /api/customer/orders/table/:tableId
 * @desc Get all orders for a table's current session
 * @access Private (Customer)
 */
router.get(
  '/table/:tableId',
  authenticateCustomer,
  validateRequest({ params: tableIdSchema }),
  customerOrderController.getTableOrders.bind(customerOrderController)
);

router.post(
  '/',
  authenticateCustomer,
  validateRequest({ body: createOrderSchema }),
  customerOrderController.createOrder.bind(customerOrderController)
);

/**
 * @route GET /api/customer/orders/:orderId
 * @desc Get customer's order by ID
 * @access Private (Customer)
 */
router.get(
  '/:orderId',
  authenticateCustomer,
  validateRequest({ params: orderIdSchema }),
  customerOrderController.getOrder.bind(customerOrderController)
);

/**
 * @route POST /api/customer/orders/:orderId/items
 * @desc Add items to an existing order
 * @access Private (Customer)
 */
router.post(
  '/:orderId/items',
  authenticateCustomer,
  validateRequest({
    params: orderIdSchema,
    body: addOrderItemsSchema
  }),
  customerOrderController.addItemsToOrder.bind(customerOrderController)
);

export default router;
