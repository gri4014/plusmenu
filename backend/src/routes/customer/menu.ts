import { Router } from 'express';
import { customerMenuController } from '../../controllers/customer/CustomerMenuController';
import { authenticateCustomer } from '../../middleware/auth';

const router = Router();

// Apply customer authentication to all routes
router.use(authenticateCustomer);

// Get categories for a restaurant
router.get(
  '/:restaurantId/categories',
  customerMenuController.getCategories
);

// Get filtered menu items based on customer preferences
router.get(
  '/:restaurantId',
  customerMenuController.getFilteredMenu
);

export default router;
