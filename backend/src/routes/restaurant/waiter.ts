import { Router } from 'express';
import { RestaurantWaiterController } from '../../controllers/restaurant/RestaurantWaiterController';
import { authenticateRestaurantStaff } from '../../middleware/auth';

const router = Router();
const controller = new RestaurantWaiterController();

/**
 * GET /api/restaurant/waiter-calls
 * Get all waiter calls for a restaurant
 * @query {string} status - Optional filter by status (active, acknowledged, completed)
 */
router.get(
  '/waiter-calls',
  authenticateRestaurantStaff,
  controller.getWaiterCalls.bind(controller)
);

export default router;
