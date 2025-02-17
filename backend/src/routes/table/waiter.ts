import express from 'express';
import { body } from 'express-validator';
import { TableWaiterController } from '../../controllers/table/TableWaiterController';
import { validateExpressRequest } from '../../middleware/expressValidation';
import { WaiterCallStatus } from '../../models/interfaces/waiter';

const router = express.Router();
const controller = new TableWaiterController();

// Call waiter for a table
router.post('/:tableId/call-waiter', controller.callWaiter.bind(controller));

// Update waiter call status
router.patch(
  '/waiter-calls/:callId/status',
  [
    body('status')
      .isIn(['active', 'acknowledged', 'completed'] as WaiterCallStatus[])
      .withMessage('Status must be one of: active, acknowledged, completed'),
    validateExpressRequest
  ],
  controller.updateCallStatus.bind(controller)
);

export default router;
