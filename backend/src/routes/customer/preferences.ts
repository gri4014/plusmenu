import { Router } from 'express';
import { customerPreferencesController } from '../../controllers/customer/CustomerPreferencesController';
import { validateRequest } from '../../middleware/validation';
import { authenticateCustomer } from '../../middleware/auth';
import { customerPreferencesUpdateSchema } from '../../models/schemas/customer';

const router = Router();

// Validation schemas
const updatePreferencesValidation = {
  body: customerPreferencesUpdateSchema
};

// Routes
router.post(
  '/',
  authenticateCustomer,
  validateRequest(updatePreferencesValidation),
  customerPreferencesController.updatePreferences
);

router.get(
  '/',
  authenticateCustomer,
  customerPreferencesController.getPreferences
);

export default router;
