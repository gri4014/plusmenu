import { Router } from 'express';
import { RestaurantParameterController } from '../../controllers/restaurant/RestaurantParameterController';
import { authenticateRestaurantStaff } from '../../middleware/auth';

const router = Router();
const controller = new RestaurantParameterController();

// Protect route with restaurant admin auth
router.use(authenticateRestaurantStaff);

// Get all active parameters (read-only access for restaurant admins)
router.get('/', controller.getParameters.bind(controller));

export default router;
