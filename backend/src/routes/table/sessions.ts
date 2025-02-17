import { Router } from 'express';
import { tableSessionController } from '../../controllers/table/TableSessionController';
import { authenticateRestaurantStaff } from '../../middleware/auth';

const router = Router();

/**
 * Start a new table session
 * @route POST /api/tables/:tableId/sessions/start
 * @param {string} tableId - ID of the table
 * @param {string} x-device-id - Device ID header
 * @param {object} body - Session data (phone_number and preferences optional)
 */
router.post(
  '/:tableId/sessions/start',
  tableSessionController.startSession
);

/**
 * Update session status
 * @route PATCH /api/tables/sessions/:sessionId/status
 * @param {string} sessionId - ID of the session
 * @param {string} x-device-id - Device ID header
 * @param {object} body - Update data
 */
router.patch(
  '/sessions/:sessionId/status',
  tableSessionController.updateSessionStatus
);

/**
 * Close session (staff only)
 * @route POST /api/tables/sessions/:sessionId/close
 * @param {string} sessionId - ID of the session
 */
router.post(
  '/sessions/:sessionId/close',
  authenticateRestaurantStaff,
  tableSessionController.closeSession
);

/**
 * Get active session for table
 * @route GET /api/tables/:tableId/sessions/active
 * @param {string} tableId - ID of the table
 */
router.get(
  '/:tableId/sessions/active',
  tableSessionController.getActiveSession
);

/**
 * Get detailed session information
 * @route GET /api/tables/sessions/:sessionId/details
 * @param {string} sessionId - ID of the session
 * @param {string} x-device-id - Device ID header
 */
router.get(
  '/sessions/:sessionId/details',
  tableSessionController.getSessionDetails
);

export default router;
