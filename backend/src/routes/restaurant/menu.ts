import { Router } from 'express';
import { MenuItemController } from '../../controllers/restaurant/MenuItemController';
import { authenticateRestaurantStaff } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { handleMenuItemImageUpload } from '../../middleware/imageUpload';
import { createMenuItemSchema, updateMenuItemSchema } from '../../models/schemas/menu';

const router = Router();
const menuItemController = new MenuItemController();

// Apply restaurant admin authentication to all routes
router.use(authenticateRestaurantStaff);

// Menu item routes
router.post(
  '/items',
  handleMenuItemImageUpload,
  validateRequest({ body: createMenuItemSchema }),
  menuItemController.createMenuItem
);

router.get('/items', menuItemController.getMenuItems);

router.get('/items/with-categories', menuItemController.getMenuItemsWithCategories);

router.patch(
  '/items/:itemId',
  handleMenuItemImageUpload,
  validateRequest({ body: updateMenuItemSchema }),
  menuItemController.updateMenuItem
);

router.delete('/items/:itemId', menuItemController.deleteMenuItem);

export default router;
