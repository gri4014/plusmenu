import { Router } from 'express';
import { RestaurantController } from '../../controllers/developer/RestaurantController';
import { verifyAuth, verifyDeveloper } from '../../middleware/auth';
import { ResourceType, ActionType } from '../../types/rbac';
import { verifyPermission } from '../../middleware/auth';

const router = Router();
const restaurantController = new RestaurantController();

// Apply auth middleware to all routes
router.use(verifyAuth);
router.use(verifyDeveloper);

// Create restaurant
router.post(
  '/',
  verifyPermission(ResourceType.RESTAURANT, ActionType.CREATE),
  restaurantController.create.bind(restaurantController)
);

// Get all restaurants
router.get(
  '/',
  verifyPermission(ResourceType.RESTAURANT, ActionType.READ),
  restaurantController.list.bind(restaurantController)
);

// Get specific restaurant
router.get(
  '/:id',
  verifyPermission(ResourceType.RESTAURANT, ActionType.READ),
  restaurantController.getById.bind(restaurantController)
);

// Update restaurant
router.patch(
  '/:id',
  verifyPermission(ResourceType.RESTAURANT, ActionType.UPDATE),
  restaurantController.update.bind(restaurantController)
);

// Delete restaurant
router.delete(
  '/:id',
  verifyPermission(ResourceType.RESTAURANT, ActionType.DELETE),
  restaurantController.delete.bind(restaurantController)
);

export default router;
